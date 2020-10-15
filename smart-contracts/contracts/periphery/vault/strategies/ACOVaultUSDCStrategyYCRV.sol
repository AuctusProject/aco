pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../../interfaces/ICurveFi4.sol';
import './ACOVaultUSDCStrategyCurveBase.sol';

/**
 * @title ACOVaultUSDCStrategyYCRV
 * @dev The contract is to set the strategy for an ACO Vault.
 * This strategy is to farm CRV and use it to buy ACO options.
 */
contract ACOVaultUSDCStrategyYCRV is ACOVaultUSDCStrategyCurveBase {
    IERC20 public immutable yusdc;

    constructor(VaultUSDCStrategyCurveBaseInitData memory initData) ACOVaultUSDCStrategyCurveBase(initData) public {
        ICurveFi4 _curve = ICurveFi4(initData.curve);
        yusdc = IERC20(_curve.coins(USDC_COIN_INDEX));
        token = _curve.underlying_coins(USDC_COIN_INDEX);
        IERC20(token).approve(initData.controller, MAX_UINT);
    }

    function getName() external pure returns (string memory) {
        return "ACOVaultUSDCStrategyYCRV";
    }

    function deposit(uint256 amount) external override {
        if (amount > 0) {
            ACOAssetHelper._setAssetInfinityApprove(token, address(this), address(yusdc), amount);
            IyERC20(address(yusdc)).deposit(amount);
        }
        uint256 _yusdcBalance = yusdc.balanceOf(address(this));
        if (_yusdcBalance > 0) {
            ACOAssetHelper._setAssetInfinityApprove(address(yusdc), address(this), address(curve), _yusdcBalance);
            ICurveFi4 _curve = ICurveFi4(address(curve));
            _curve.add_liquidity([0,_yusdcBalance,0,0],0);
        }
        _depositOnGauge();
    }
    
    function _withdrawUnderlying(uint256 _amount) internal override returns (uint) {
        ACOAssetHelper._setAssetInfinityApprove(address(crvPoolToken), address(this), address(curve), _amount);
        ICurveFi4 _curve = ICurveFi4(address(curve));
        _curve.remove_liquidity(_amount, [uint256(0),0,0,0]);
    
        _exchangeCurveCoinToUSDC(0);
        _exchangeCurveCoinToUSDC(2);
        _exchangeCurveCoinToUSDC(3);
        
        IERC20 usdc = IERC20(token);
        uint256 _before = usdc.balanceOf(address(this));
        IyERC20(address(yusdc)).withdraw(yusdc.balanceOf(address(this)));
        uint256 _after = usdc.balanceOf(address(this));
        
        return _after.sub(_before);
    }
}