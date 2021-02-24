pragma solidity ^0.6.6;

interface IACOFactory {
	function init(address _factoryAdmin, address _acoTokenImplementation, uint256 _acoFee, address _acoFeeDestination) external;
    function acoFee() external view returns(uint256);
    function factoryAdmin() external view returns(address);
    function acoTokenImplementation() external view returns(address);
    function acoFeeDestination() external view returns(address);
    function acoTokenData(address acoToken) external view returns(address, address, bool, uint256, uint256);
    function creators(address acoToken) external view returns(address);
    function createAcoToken(address underlying, address strikeAsset, bool isCall, uint256 strikePrice, uint256 expiryTime, uint256 maxExercisedAccounts) external returns(address);
    function newAcoToken(address underlying, address strikeAsset, bool isCall, uint256 strikePrice, uint256 expiryTime) external returns(address);
    function getAcoToken(address underlying, address strikeAsset, bool isCall, uint256 strikePrice, uint256 expiryTime) external view returns(address);
    function setFactoryAdmin(address newFactoryAdmin) external;
    function setAcoTokenImplementation(address newAcoTokenImplementation) external;
    function setAcoFee(uint256 newAcoFee) external;
    function setAcoFeeDestination(address newAcoFeeDestination) external;
}