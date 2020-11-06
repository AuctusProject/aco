pragma solidity ^0.6.6;

interface ICurveFiBase {
  function get_virtual_price() external view returns (uint);
  function coins(uint256 arg0) external view returns (address);
  function exchange(int128 from, int128 to, uint256 _from_amount, uint256 _min_to_amount) external;
}