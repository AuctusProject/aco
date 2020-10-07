pragma solidity ^0.6.6;

interface IControlled {
    function token() external view returns(address);
    function withdrawStuckToken(address _token, address destination) external;
}