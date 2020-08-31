pragma solidity ^0.6.6;

interface IACOPool {
	function init(
	    uint256 _poolStart,
        address _acoFlashExercise,
        address _acoFactory,
        address _underlying, 
        address _strikeAsset, 
        uint256 _minStrikePrice, 
        uint256 _maxStrikePrice,
        uint256 _minExpiration,
        uint256 _maxExpiration, 
        bool _isCall, 
        bool _canBuy,
        uint256 _tolerancePercentageToBuyStrikeAsset,
        uint256 _minimumTimeInMinutesToExerciseAnyProfit,
        uint256 _minimumProfitToExerciseAnyTime) external;
    function name() external view returns(string memory);
    function numberOfACOTokensNegotiated() external view returns(uint256);
    function collateral() external view returns(address);
    function setStrategy(address strategy) external;
    function setBaseVolatility(uint256 baeVolatility) external;
    function getEstimatedReturnOnExercise(address acoToken) external view returns(uint256);
    function quote(bool isBuying, address acoToken, uint256 tokenAmount) external view returns(uint256, uint256);
    function swap(bool isBuying, address acoToken, uint256 tokenAmount, uint256 restriction) external returns(uint256);
    function exerciseACOToken(address acoToken) external;
    function redeemACOTokens() external;
}