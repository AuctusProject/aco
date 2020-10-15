pragma solidity ^0.6.6;

import './ICurveFiBase.sol';

interface ICurveFi4 is ICurveFiBase {
  function add_liquidity(uint256[4] calldata amounts, uint256 min_mint_amount) external;
  function remove_liquidity(uint256 _amount, uint256[4] calldata amounts) external;  
  function underlying_coins(int128 arg0) external view returns (address);
}