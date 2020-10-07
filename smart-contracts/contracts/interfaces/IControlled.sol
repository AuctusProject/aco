pragma solidity ^0.6.6;

interface IControlled {
    function withdrawStuckToken(address token, address destination) external;
}