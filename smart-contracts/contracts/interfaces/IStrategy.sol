pragma solidity ^0.6.6;

import './IControlled.sol';

interface IStrategy is IControlled {
    function want() external view returns(address);
    function balanceOf() external view returns(uint256);
    function actualBalanceFor(uint256 amount) external view returns(uint256);
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external returns(uint256);
    function withdrawAll() external;
}