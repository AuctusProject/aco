pragma solidity ^0.6.6;

interface IController {
    function balanceOf(address vault) external view returns(uint256);
    function actualAmount(address vault, uint256 amount) external view returns(uint256);
    function earn(uint256 amount) external;
    function withdraw(uint256 amount) external returns(uint256);
    function sendFee(uint256 amount) external;
}