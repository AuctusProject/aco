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
    
    IGauge public immutable gauge;
    IMintr public immutable mintr;
    ICurveFiBase public immutable curve;
    IERC20 public immutable crv;
    IERC20 public immutable crvPoolToken;
    address public override token;

    IController public controller;
    IACOAssetConverterHelper public assetConverter;
    uint256 public gasSubsidyFee;    

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
    
    function withdrawStuckToken(address _token, address destination) external override {
        require(msg.sender == address(controller), "ACOVaultUSDCStrategyCurveBase:: Invalid sender");
        require(token != address(_token), "ACOVaultUSDCStrategyCurveBase:: Invalid token");
        require(address(crv) != address(_token), "ACOVaultUSDCStrategyCurveBase:: Invalid token");
        require(address(crvPoolToken) != address(_token), "ACOVaultUSDCStrategyCurveBase:: Invalid token");
        uint256 _balance = ACOAssetHelper._getAssetBalanceOf(_token, address(this));
        if (_balance > 0) {
            ACOAssetHelper._transferAsset(_token, destination, _balance);
        }
    }
    
    function withdraw(uint _amount) external override returns (uint256 amount) {
        require(msg.sender == address(controller), "ACOVaultUSDCStrategyCurveBase:: Invalid sender");
        amount = _withdrawSome(_amount);
    }
    
    function withdrawAll() external override {
        require(msg.sender == address(controller), "ACOVaultUSDCStrategyCurveBase:: Invalid sender");
        _withdrawAll();
    }

    function harvest() onlyOwner external {
        mintr.mint(address(gauge));
        uint256 _crvBalance = crv.balanceOf(address(this));
        if (_crvBalance > 0) {    
            ACOAssetHelper._setAssetInfinityApprove(address(crv), address(this), address(assetConverter), _crvBalance);
            IERC20 usdc = IERC20(token);
            uint256 _before = usdc.balanceOf(address(this));
            assetConverter.swapExactAmountOut(address(usdc), address(crv), _crvBalance);
            uint256 _after = usdc.balanceOf(address(this));

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
        address coinAddress = curve.coins(coinIndex);
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

    function _withdrawUnderlying(uint256 _amount) internal virtual returns (uint);

    function _withdrawSome(uint256 amount) internal returns (uint) {
        uint _amount = amount.mul(1e18).div(curve.get_virtual_price());
        
        uint _before = crvPoolToken.balanceOf(address(this));
        gauge.withdraw(_amount);
        uint _after = crvPoolToken.balanceOf(address(this));

        return _withdrawUnderlying(_after.sub(_before));
    }
    
    function balanceOfWant() public view returns (uint) {
        return IERC20(token).balanceOf(address(this));
    }
    
    function balanceOfGauge() public view returns (uint) {
        return gauge.balanceOf(address(this));
    }
    
    function balanceOf() external view override returns (uint) {
        return balanceOfGauge().mul(curve.get_virtual_price()).div(1e18);
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
}