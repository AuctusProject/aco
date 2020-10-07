pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../util/Ownable.sol';
import '../../libs/Address.sol';
import '../../libs/SafeMath.sol';
import '../../libs/ACOAssetHelper.sol';
import '../../interfaces/IACOVaultStrategy.sol';
import '../../interfaces/IGauge.sol';
import '../../interfaces/IMintr.sol';
import '../../interfaces/ICurveFi.sol';
import '../../interfaces/IyERC20.sol';
import '../../interfaces/IERC20.sol';
import '../../interfaces/IController.sol';
import '../../interfaces/IACOAssetConverterHelper.sol';

/**
 * @title ACOVaultStrategy1
 * @dev The contract is to set the strategy for an ACO Vault.
 * This strategy is to farm CRV and use it to buy ACO options.
 */
contract ACOVaultUSDCStrategy1 is Ownable, IACOVaultStrategy {
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
    ICurveFi public immutable curve;
    IERC20 public immutable crv;
    IERC20 public immutable ycrv;
    IERC20 public immutable yusdc;    
    IERC20 public immutable usdc;
    

    IController public controller;
    IACOAssetConverterHelper public assetConverter;
    uint256 public gasSubsidyFee;    

    constructor(VaultStrategyInitData memory initData) public {
        super.init();
        
        gauge = IGauge(initData.gauge);
        mintr = IMintr(initData.mintr);
        ICurveFi _curve = ICurveFi(initData.curve);
        curve = _curve;
        crv = IERC20(initData.crv);
        ycrv = IERC20(initData.ycrv);        
        yusdc = IERC20(_curve.coins(USDC_COIN_INDEX));
        IERC20 _usdc = IERC20(_curve.underlying_coins(USDC_COIN_INDEX));
        usdc = _usdc;

        _setController(initData.controller);
        _setAssetConverter(initData.assetConverter);
        _setGasSubsidyFee(initData.gasSubsidyFee);
        _usdc.approve(initData.controller, MAX_UINT);
    }

    function getName() external pure returns (string memory) {
        return "ACOVaultUSDCStrategy1";
    }

    function setGasSubsidyFee(uint256 newGasSubsidyFee) onlyOwner external {
        _setGasSubsidyFee(newGasSubsidyFee);
    }

    function setController(address newController) onlyOwner external {
        _setController(newController);
        usdc.approve(newController, MAX_UINT);
    }

    function setAssetConverter(address newAssetConverter) onlyOwner external {
        _setAssetConverter(newAssetConverter);
    }

    function deposit() external {
        uint256 _usdcBalance = usdc.balanceOf(address(this));
        if (_usdcBalance > 0) {
            ACOAssetHelper._setAssetInfinityApprove(address(usdc), address(this), address(yusdc), _usdcBalance);
            IyERC20(address(yusdc)).deposit(_usdcBalance);
        }
        uint256 _yusdcBalance = yusdc.balanceOf(address(this));
        if (_yusdcBalance > 0) {
            ACOAssetHelper._setAssetInfinityApprove(address(yusdc), address(this), address(curve), _yusdcBalance);
            curve.add_liquidity([0,_yusdcBalance,0,0],0);
        }
        uint256 _ycrvBalance = ycrv.balanceOf(address(this));
        if (_ycrvBalance > 0) {
            ACOAssetHelper._setAssetInfinityApprove(address(ycrv), address(this), address(gauge), _ycrvBalance);
            gauge.deposit(_ycrvBalance);
        }
    }
    
    function withdraw(IERC20 _asset) external returns (uint256 balance) {
        require(msg.sender == address(controller), "ACOVaultStrategy1:: Invalid sender");
        require(address(usdc) != address(_asset), "ACOVaultStrategy1:: Invalid asset");
        require(address(crv) != address(_asset), "ACOVaultStrategy1:: Invalid asset");
        require(address(yusdc) != address(_asset), "ACOVaultStrategy1:: Invalid asset");
        require(address(ycrv) != address(_asset), "ACOVaultStrategy1:: Invalid asset");

        balance = _asset.balanceOf(address(this));
        ACOAssetHelper._callTransferERC20(address(_asset), address(controller), balance);
    }
    
    function withdraw(uint _amount) external returns (uint256 amount) {
        require(msg.sender == address(controller), "ACOVaultStrategy1:: Invalid sender");
        amount = _withdrawSome(_amount);
    }
    
    function withdrawAll() external {
        require(msg.sender == address(controller), "ACOVaultStrategy1:: Invalid sender");
        _withdrawAll();
    }

    function harvest() onlyOwner external {
        mintr.mint(address(gauge));
        uint256 _crvBalance = crv.balanceOf(address(this));
        if (_crvBalance > 0) {    
            ACOAssetHelper._setAssetInfinityApprove(address(crv), address(this), address(assetConverter), _crvBalance);

            uint256 _before = usdc.balanceOf(address(this));
            assetConverter.swapExactAmountOut(address(usdc), address(crv), _crvBalance);
            uint256 _after = usdc.balanceOf(address(this));

            _collectGasSubsidyFee(_after.sub(_before));
        }
    }

    function _collectGasSubsidyFee(uint256 amount) internal {
        if (amount > 0) {
            uint256 _fee = amount.mul(gasSubsidyFee).div(MAX_GAS_SUBSIDY_FEE);
            controller.sendFee(_fee);
        }
    }
    
    function _withdrawUnderlying(uint256 _amount) internal returns (uint) {
        ACOAssetHelper._setAssetInfinityApprove(address(ycrv), address(this), address(curve), _amount);
        curve.remove_liquidity(_amount, [uint256(0),0,0,0]);
    
        _exchangeCurveCoinToYUSDC(0);
        _exchangeCurveCoinToYUSDC(2);
        _exchangeCurveCoinToYUSDC(3);
        
        uint256 _before = usdc.balanceOf(address(this));
        IyERC20(address(yusdc)).withdraw(yusdc.balanceOf(address(this)));
        uint256 _after = usdc.balanceOf(address(this));
        
        return _after.sub(_before);
    }

    function _exchangeCurveCoinToYUSDC(int128 coinIndex) internal {
        address coinAddress = curve.coins(coinIndex);
        uint256 _balance = IERC20(coinAddress).balanceOf(address(this));
        if (_balance > 0) {
            ACOAssetHelper._setAssetInfinityApprove(coinAddress, address(this), address(curve), _balance);
            curve.exchange(coinIndex, USDC_COIN_INDEX, _balance, 0);
        }
    }
    
    function _withdrawAll() internal {
        gauge.withdraw(gauge.balanceOf(address(this)));
        _withdrawUnderlying(ycrv.balanceOf(address(this)));
    }

    function _withdrawSome(uint256 amount) internal returns (uint) {
        uint _amount = amount.mul(1e18).div(curve.get_virtual_price());
        
        uint _before = ycrv.balanceOf(address(this));
        gauge.withdraw(_amount);
        uint _after = ycrv.balanceOf(address(this));

        return _withdrawUnderlying(_after.sub(_before));
    }
    
    function balanceOfUSDC() public view returns (uint) {
        return usdc.balanceOf(address(this));
    }
    
    function balanceOfVault() public view returns (uint) {
        return ycrv.balanceOf(address(this));
    }
    
    function balanceOfYCRVinyUSDC() public view returns (uint) {
        return balanceOfVault().mul(curve.get_virtual_price()).div(1e18);
    }
    
    function balanceOf() public view returns (uint) {
        return balanceOfUSDC().add(balanceOfYCRVinyUSDC());
    }

    function _setController(address newController) internal {
        require(newController.isContract(), "ACOVaultStrategy1:: Invalid controller");
        emit SetController(address(controller), newController);
        controller = IController(newController);
    }
    
    function _setAssetConverter(address newAssetConverter) internal {
        require(newAssetConverter.isContract(), "ACOVaultStrategy1:: Invalid asset converter");
        emit SetAssetConverter(address(assetConverter), newAssetConverter);
        assetConverter = IACOAssetConverterHelper(newAssetConverter);
    }

    function _setGasSubsidyFee(uint256 newGasSubsidyFee) internal {
        require(newGasSubsidyFee < MAX_GAS_SUBSIDY_FEE, "ACOVaultStrategy1:: Invalid gas subsidy fee");
        emit SetGasSubsidyFee(gasSubsidyFee, newGasSubsidyFee);
        gasSubsidyFee = newGasSubsidyFee;
    }
}