pragma solidity ^0.6.6;

interface IACOPoolFactory {
    function factoryAdmin() external view returns(address);
    function acoPoolImplementation() external view returns(address);
    function acoFactory() external view returns(address);
    function acoFlashExercise() external view returns(address);
	function assetConverterHelper() external view returns(address);
    function chiToken() external view returns(address);
    function acoPoolFee() external view returns(uint256);
    function acoPoolFeeDestination() external view returns(address);
    function poolAdminPermission(address account) external view returns(bool);
    function strategyPermitted(address strategy) external view returns(bool);
    function acoPoolData(address acoPool) external view returns(uint256 poolStart, address underlying, address strikeAsset, bool isCall, uint256 minStrikePrice, uint256 maxStrikePrice, uint256 minExpiration, uint256 maxExpiration, bool canBuy);
    function setFactoryAdmin(address newFactoryAdmin) external;
    function setAcoPoolImplementation(address newAcoPoolImplementation) external;
    function setAcoFactory(address newAcoFactory) external;
    function setAcoFlashExercise(address newAcoFlashExercise) external;
    function setChiToken(address newChiToken) external;
    function setAcoPoolFee(uint256 newAcoPoolFee) external;
    function setAcoPoolFeeDestination(address newAcoPoolFeeDestination) external;
    function setAcoPoolPermission(address poolAdmin, bool newPermission) external;
    function setAcoPoolStrategyPermission(address strategy, bool newPermission) external;
    function setAcoPoolStrategy(address strategy, address[] calldata acoPools) external;
    function setAcoPoolBaseVolatility(uint256[] calldata baseVolatilities, address[] calldata acoPools) external;
}