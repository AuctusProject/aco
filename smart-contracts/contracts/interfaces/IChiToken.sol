pragma solidity ^0.6.6;

import './IERC20.sol';

interface IChiToken is IERC20 {
    function mint(uint256 value) external;
    function computeAddress2(uint256 salt) external view returns(address);
    function free(uint256 value) external returns(uint256);
    function freeUpTo(uint256 value) external returns(uint256);
    function freeFrom(address from, uint256 value) external returns(uint256);
    function freeFromUpTo(address from, uint256 value) external returns(uint256);
}