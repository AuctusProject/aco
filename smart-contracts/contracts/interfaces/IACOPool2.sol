pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import './IERC20.sol';

interface IACOPool2 is IERC20 {

    struct InitData {
        address acoFactory;
        address chiToken;
        address underlying;
        address strikeAsset;
        bool isCall; 
		address assetConverter;
        uint256 fee;
        address feeDestination;
        uint256 withdrawOpenPositionPenalty;
        uint256 underlyingPriceAdjustPercentage;
        uint256 tolerancePriceBelow;
        uint256 tolerancePriceAbove; 
        uint256 minExpiration;
        uint256 maxExpiration;
        address strategy;
        uint256 baseVolatility;    
    }

	struct AcoData {
        bool open;
        uint256 valueSold;
        uint256 collateralLocked;
        uint256 collateralRedeemed;
        uint256 index;
		uint256 openIndex;
    }
    
	function init(InitData calldata initData) external;
	function numberOfAcoTokensNegotiated() external view returns(uint256);
    function numberOfOpenAcoTokens() external view returns(uint256);
    function collateral() external view returns(address);
	function canSwap(address acoToken) external view returns(bool);
	function quote(address acoToken, uint256 tokenAmount) external view returns(
		uint256 swapPrice, 
		uint256 protocolFee, 
		uint256 underlyingPrice, 
		uint256 volatility
	);
	function getWithdrawNoLockedData(address account, uint256 shares) external view returns(
		uint256 underlyingWithdrawn, 
		uint256 strikeAssetWithdrawn, 
		bool isPossible
	);
	function getWithdrawWithLocked(address account, uint256 shares) external view returns(
		uint256 underlyingWithdrawn, 
		uint256 strikeAssetWithdrawn, 
		address[] memory acos, 
		uint256[] memory acosAmount
	);
	function setAssetConverter(address newAssetConverter) external;
    function setTolerancePriceBelow(uint256 newTolerancePriceBelow) external;
    function setTolerancePriceAbove(uint256 newTolerancePriceAbove) external;
    function setMinExpiration(uint256 newMinExpiration) external;
    function setMaxExpiration(uint256 newMaxExpiration) external;
    function setFee(uint256 newFee) external;
    function setFeeDestination(address newFeeDestination) external;
	function setWithdrawOpenPositionPenalty(uint256 newWithdrawOpenPositionPenalty) external;
	function setUnderlyingPriceAdjustPercentage(uint256 newUnderlyingPriceAdjustPercentage) external;
	function setStrategy(address newStrategy) external;
	function setBaseVolatility(uint256 newBaseVolatility) external;
	function setValidAcoCreator(address newAcoCreator, bool newPermission) external;
    function withdrawStuckToken(address token, address destination) external;
    function deposit(uint256 collateralAmount, address to) external payable returns(uint256 acoPoolTokenAmount);
	function depositWithGasToken(uint256 collateralAmount, address to) external payable returns(uint256 acoPoolTokenAmount);
	function withdrawNoLocked(address account, uint256 shares) external returns (
		uint256 underlyingWithdrawn,
		uint256 strikeAssetWithdrawn
	);
	function withdrawNoLockedWithGasToken(address account, uint256 shares) external returns (
		uint256 underlyingWithdrawn,
		uint256 strikeAssetWithdrawn
	);
    function withdrawWithLocked(address account, uint256 shares) external returns (
		uint256 underlyingWithdrawn,
		uint256 strikeAssetWithdrawn,
		address[] memory acos,
		uint256[] memory acosAmount
	);
	function withdrawWithLockedWithGasToken(address account, uint256 shares) external returns (
		uint256 underlyingWithdrawn,
		uint256 strikeAssetWithdrawn,
		address[] memory acos,
		uint256[] memory acosAmount
	);
    function swap(address acoToken, uint256 tokenAmount, uint256 restriction, address to, uint256 deadline) external;
    function swapWithGasToken(address acoToken, uint256 tokenAmount, uint256 restriction, address to, uint256 deadline) external;
    function redeemACOTokens() external;
	function redeemACOToken(address acoToken) external;
    function restoreCollateral() external;
}