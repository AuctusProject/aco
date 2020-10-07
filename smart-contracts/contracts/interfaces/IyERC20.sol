pragma solidity ^0.6.6;


interface IyERC20 {
  function deposit(uint) external;
  function withdraw(uint) external;
  function getPricePerFullShare() external view returns (uint);
}