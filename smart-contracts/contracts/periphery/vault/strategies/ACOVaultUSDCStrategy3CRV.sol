pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../../interfaces/ICurveFi3.sol';
import './ACOVaultUSDCStrategyCurveBase.sol';

/**
 * @title ACOVaultUSDCStrategy3CRV
 * @dev The contract is to set the strategy for an ACO Vault.
 * This strategy is to farm CRV and use it to buy ACO options.
 */
contract ACOVaultUSDCStrategy3CRV is ACOVaultUSDCStrategyCurveBase {
    constructor(VaultUSDCStrategyCurveBaseInitData memory initData) ACOVaultUSDCStrategyCurveBase(initData) public {
        ICurveFi3 _curve = ICurveFi3(initData.curve);
        token = _curve.coins(USDC_COIN_INDEX);
        IERC20(token).approve(initData.controller, MAX_UINT);
    }

    function getName() external pure returns (string memory) {
        return "ACOVaultUSDCStrategy3CRV";
    }

    function deposit(uint256 amount) onlyController external override {
        if (amount > 0) {
            ACOAssetHelper._setAssetInfinityApprove(token, address(this), address(curve), amount);
            ICurveFi3 _curve = ICurveFi3(address(curve));
            _curve.add_liquidity([0,amount,0],0);
        }
        _depositOnGauge();
    }
    
    function _withdrawUnderlying(uint256 _amount) internal override returns (uint) {
        IERC20 usdc = IERC20(token);
        uint256 _before = usdc.balanceOf(address(this));
        
        ACOAssetHelper._setAssetInfinityApprove(address(crvPoolToken), address(this), address(curve), _amount);
        ICurveFi3 _curve = ICurveFi3(address(curve));
        _curve.remove_liquidity(_amount, [uint256(0),0,0]);
    
        _exchangeCurveCoinToUSDC(0);
        _exchangeCurveCoinToUSDC(2);
        
        uint256 _after = usdc.balanceOf(address(this));
        
        return _after.sub(_before);
    }
}