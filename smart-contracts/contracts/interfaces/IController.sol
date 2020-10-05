pragma solidity ^0.6.6;

interface IController {
    function balanceOf(address token) external view returns(uint256);
    function actualBalance(address token, uint256 amount) external view returns(uint256);
    function earn(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount) external;
}