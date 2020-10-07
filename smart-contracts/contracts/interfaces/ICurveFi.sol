pragma solidity ^0.6.6;

interface ICurveFi {
  function get_virtual_price() external view returns (uint);
  function coins(int128 arg0) external view returns (address);
  function underlying_coins(int128 arg0) external view returns (address);
  function add_liquidity(uint256[4] calldata amounts, uint256 min_mint_amount) external;
  function remove_liquidity(uint256 _amount, uint256[4] calldata amounts) external;
  function exchange(int128 from, int128 to, uint256 _from_amount, uint256 _min_to_amount) external;
}