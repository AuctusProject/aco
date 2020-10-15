pragma solidity ^0.6.6;

import './ICurveFiBase.sol';

interface ICurveFi3 is ICurveFiBase {
  function add_liquidity(uint256[3] calldata amounts, uint256 min_mint_amount) external;
  function remove_liquidity(uint256 _amount, uint256[3] calldata amounts) external;
}