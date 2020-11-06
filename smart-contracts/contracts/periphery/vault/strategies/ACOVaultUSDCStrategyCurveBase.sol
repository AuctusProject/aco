pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../../util/Ownable.sol';
import '../../../libs/Address.sol';
import '../../../libs/SafeMath.sol';
import '../../../libs/ACOAssetHelper.sol';
import '../../../interfaces/IACOVaultUSDCStrategyCurveBase.sol';
import '../../../interfaces/IStrategy.sol';
import '../../../interfaces/IGauge.sol';
import '../../../interfaces/IMintr.sol';
import '../../../interfaces/ICurveFiBase.sol';
import '../../../interfaces/IyERC20.sol';
import '../../../interfaces/IERC20.sol';
import '../../../interfaces/IController.sol';
import '../../../interfaces/IACOAssetConverterHelper.sol';

/**
 * @title ACOVaultUSDCStrategyCurveBase
 * @dev The contract is to set the strategy for an ACO Vault.
 * This strategy is to farm CRV and use it to buy ACO options.
 */
abstract contract ACOVaultUSDCStrategyCurveBase is Ownable, IACOVaultUSDCStrategyCurveBase, IStrategy {
    using Address for address;
    using SafeMath for uint256;

    uint256 internal constant MAX_UINT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    int128 internal constant USDC_COIN_INDEX = 1;
    uint256 internal constant MAX_GAS_SUBSIDY_FEE = 100000;
    
    event SetController(address indexed oldController, address indexed newController);
    event SetAssetConverter(address indexed oldAssetConverter, address indexed newAssetConverter);
    event SetWithdrawalFee(uint256 indexed oldWithdrawalFee, uint256 indexed newWithdrawalFee);
    event SetGasSubsidyFee(uint256 indexed oldGasSubsidyFee, uint256 indexed newGasSubsidyFee);
    event SetOperator(address indexed operator, bool indexed previousPermission, bool indexed newPermission);
    
    IGauge public immutable gauge;
    IMintr public immutable mintr;
    ICurveFiBase public immutable curve;
    IERC20 public immutable crv;
    IERC20 public immutable crvPoolToken;
    address public override token;

    IController public controller;
    IACOAssetConverterHelper public assetConverter;
    uint256 public gasSubsidyFee; 

    mapping(address => bool) public operators;

    /**
     * @dev Throws if called by any address other than the controller.
     */
    modifier onlyController() {
        require(msg.sender == address(controller), "ACOVaultUSDCStrategyCurveBase:: caller is not the controller");
        _;
    }

    constructor(VaultUSDCStrategyCurveBaseInitData memory initData) public {
        super.init();
        
        gauge = IGauge(initData.gauge);
        mintr = IMintr(initData.mintr);
        curve = ICurveFiBase(initData.curve);
        crv = IERC20(initData.crv);        
        crvPoolToken = IERC20(initData.crvPoolToken);
                
        _setController(initData.controller);
        _setAssetConverter(initData.assetConverter);
        _setGasSubsidyFee(initData.gasSubsidyFee);
        _setOperator(msg.sender, true);
    }    

    function setGasSubsidyFee(uint256 newGasSubsidyFee) onlyOwner external {
        _setGasSubsidyFee(newGasSubsidyFee);
    }

    function setController(address newController) onlyOwner external {
        _setController(newController);
        IERC20(token).approve(newController, MAX_UINT);
    }

    function setAssetConverter(address newAssetConverter) onlyOwner external {
        _setAssetConverter(newAssetConverter);
    } 

    function setOperator(address operator, bool permission) onlyOwner external {
        _setOperator(operator, permission);
    }   
    
    function withdrawStuckToken(address _token, address destination) onlyController external override {
        require(token != address(_token), "ACOVaultUSDCStrategyCurveBase:: Invalid token");
        require(address(crv) != address(_token), "ACOVaultUSDCStrategyCurveBase:: Invalid token");
        require(address(crvPoolToken) != address(_token), "ACOVaultUSDCStrategyCurveBase:: Invalid token");
        uint256 _balance = ACOAssetHelper._getAssetBalanceOf(_token, address(this));
        if (_balance > 0) {
            ACOAssetHelper._transferAsset(_token, destination, _balance);
        }
    }
    
    function withdraw(uint256 _amount) onlyController external override returns (uint256) {
        return _withdrawSome(_amount);
    }
    
    function withdrawAll() onlyController external override {
        _withdrawAll();
    }

    function harvest() external {
        require(operators[msg.sender], "ACOVaultUSDCStrategyCurveBase:: Invalid sender");
        mintr.mint(address(gauge));
        uint256 _crvBalance = crv.balanceOf(address(this));
        if (_crvBalance > 0) {    
            ACOAssetHelper._setAssetInfinityApprove(address(crv), address(this), address(assetConverter), _crvBalance);
            IERC20 _token = IERC20(token);
            uint256 _before = _token.balanceOf(address(this));
            assetConverter.swapExactAmountOutWithMinAmountToReceive(address(crv), address(_token), _crvBalance, 1);
            uint256 _after = _token.balanceOf(address(this));

            _collectGasSubsidyFee(_after.sub(_before));
        }
    }

    function _depositOnGauge() internal {
        uint256 _crvPoolTokenBalance = crvPoolToken.balanceOf(address(this));
        if (_crvPoolTokenBalance > 0) {
            ACOAssetHelper._setAssetInfinityApprove(address(crvPoolToken), address(this), address(gauge), _crvPoolTokenBalance);
            gauge.deposit(_crvPoolTokenBalance);
        }
    }

    function _collectGasSubsidyFee(uint256 amount) internal {
        if (amount > 0) {
            uint256 _fee = amount.mul(gasSubsidyFee).div(MAX_GAS_SUBSIDY_FEE);
            controller.sendFee(_fee);
        }
    }

    function _exchangeCurveCoinToUSDC(int128 coinIndex) internal {
        address coinAddress = curve.coins(uint256(coinIndex));
        uint256 _balance = IERC20(coinAddress).balanceOf(address(this));
        if (_balance > 0) {
            ACOAssetHelper._setAssetInfinityApprove(coinAddress, address(this), address(curve), _balance);
            curve.exchange(coinIndex, USDC_COIN_INDEX, _balance, 0);
        }
    }
    
    function _withdrawAll() internal {
        gauge.withdraw(gauge.balanceOf(address(this)));
        _withdrawUnderlying(crvPoolToken.balanceOf(address(this)));
    }

    function _withdrawUnderlying(uint256 _amount) internal virtual returns (uint256);
    function _normalizedWithdrawAmount(uint256 _amount) internal pure virtual returns(uint256);

    function _withdrawSome(uint256 amount) internal returns (uint256) {
        uint256 _amount = amount.mul(1e18).div(curve.get_virtual_price());
        _amount = _normalizedWithdrawAmount(_amount);
        
        uint256 _before = crvPoolToken.balanceOf(address(this));
        gauge.withdraw(_amount);
        uint256 _after = crvPoolToken.balanceOf(address(this));

        return _withdrawUnderlying(_after.sub(_before));
    }
    
    function balanceOfWant() public view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    function balanceOfGauge() public view returns (uint256) {
        return gauge.balanceOf(address(this));
    }

    function _normalizedBalanceOf(uint256 bal) internal pure virtual returns(uint256);
    
    function balanceOf() external view override returns (uint256) {
        uint256 bal = balanceOfGauge().mul(curve.get_virtual_price()).div(1e18);
        return _normalizedBalanceOf(bal);
    }
    
    function actualBalanceFor(uint256 amount) external view override returns(uint256) {
        return amount.mul(curve.get_virtual_price()).div(1e18);
    }

    function _setController(address newController) internal {
        require(newController.isContract(), "ACOVaultUSDCStrategyCurveBase:: Invalid controller");
        emit SetController(address(controller), newController);
        controller = IController(newController);
    }
    
    function _setAssetConverter(address newAssetConverter) internal {
        require(newAssetConverter.isContract(), "ACOVaultUSDCStrategyCurveBase:: Invalid asset converter");
        emit SetAssetConverter(address(assetConverter), newAssetConverter);
        assetConverter = IACOAssetConverterHelper(newAssetConverter);
    }

    function _setGasSubsidyFee(uint256 newGasSubsidyFee) internal {
        require(newGasSubsidyFee < MAX_GAS_SUBSIDY_FEE, "ACOVaultUSDCStrategyCurveBase:: Invalid gas subsidy fee");
        emit SetGasSubsidyFee(gasSubsidyFee, newGasSubsidyFee);
        gasSubsidyFee = newGasSubsidyFee;
    }
    
    function _setOperator(address operator, bool newPermission) internal {
        emit SetOperator(operator, operators[operator], newPermission);
        operators[operator] = newPermission;
    }
}