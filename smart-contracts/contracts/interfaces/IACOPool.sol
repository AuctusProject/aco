pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import './IERC20.sol';

interface IACOPool is IERC20 {
    struct InitData {
        uint256 poolStart;
        address acoFlashExercise;
        address acoFactory;
        address underlying;
        address strikeAsset;
        uint256 minStrikePrice; 
        uint256 maxStrikePrice;
        uint256 minExpiration;
        uint256 maxExpiration;
        bool isCall; 
        bool canBuy;
        address strategy;
        uint256 baseVolatility;    
    }
    
	function init(InitData calldata initData) external;
    function numberOfACOTokensNegotiated() external view returns(uint256);
    function collateral() external view returns(address);
    function setStrategy(address strategy) external;
    function setBaseVolatility(uint256 baeVolatility) external;
    function getEstimatedReturnOnExercise(address acoToken) external view returns(uint256);
    function quote(bool isBuying, address acoToken, uint256 tokenAmount) external view returns(uint256 price, uint256 underlyingPrice, uint256 volatility);
    function swap(bool isBuying, address acoToken, uint256 tokenAmount, uint256 restriction, address to, uint256 deadline) external returns(uint256);
    function exerciseACOToken(address acoToken) external;
    function redeemACOTokens() external;
    function deposit(uint256 collateralAmount, address to) external payable returns(uint256 acoPoolTokenAmount);
    function redeem() external returns(uint256 underlyingReceived, uint256 strikeAssetReceived);
    function redeemFrom(address account) external returns(uint256 underlyingReceived, uint256 strikeAssetReceived);
    function restoreCollateral() external;
}