pragma solidity ^0.6.6;

interface IACOPoolFactory2 {
    function factoryAdmin() external view returns(address);
    function acoPoolImplementation() external view returns(address);
    function acoFactory() external view returns(address);
	function assetConverterHelper() external view returns(address);
    function chiToken() external view returns(address);
    function acoPoolFee() external view returns(uint256);
    function acoPoolFeeDestination() external view returns(address);
	function acoPoolUnderlyingPriceAdjustPercentage() external view returns(uint256);
	function acoPoolWithdrawOpenPositionPenalty() external view returns(uint256);
    function poolAdminPermission(address account) external view returns(bool);
    function strategyPermitted(address strategy) external view returns(bool);
    function acoPoolBasicData(address acoPool) external view returns(address underlying, address strikeAsset, bool isCall);
}