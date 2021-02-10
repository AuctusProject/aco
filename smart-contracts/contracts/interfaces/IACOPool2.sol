pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import './IERC20.sol';

interface IACOPool2 is IERC20 {

    struct InitData {
        address acoFactory;
        address chiToken;
        address lendingPool;
        address underlying;
        address strikeAsset;
        bool isCall; 
        uint256 tolerancePriceBelow;
        uint256 tolerancePriceAbove; 
        uint256 minExpiration;
        uint256 maxExpiration;
        uint256 baseVolatility;  
        address admin;
        address strategy;  
        PoolProtocolConfig config;
    }

	struct AcoData {
        bool open;
        uint256 valueSold;
        uint256 collateralLocked;
        uint256 collateralRedeemed;
        uint256 index;
		uint256 openIndex;
    }
    
    struct PoolProtocolConfig {
        uint16 lendingPoolReferral;
        uint256 withdrawOpenPositionPenalty;
        uint256 underlyingPriceAdjustPercentage;
        uint256 fee;
        uint256 maximumOpenAco;
        address feeDestination;
        address assetConverter;
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
	function getDepositShares(uint256 collateralAmount) external view returns(uint256 shares);
	function getWithdrawNoLockedData(uint256 shares) external view returns(
		uint256 underlyingWithdrawn, 
		uint256 strikeAssetWithdrawn, 
		bool isPossible
	);
	function getWithdrawWithLocked(uint256 shares) external view returns(
		uint256 underlyingWithdrawn, 
		uint256 strikeAssetWithdrawn, 
		address[] memory acos, 
		uint256[] memory acosAmount
	);
	function getGeneralData() external view returns(
        uint256 underlyingBalance,
		uint256 strikeAssetBalance,
		uint256 collateralLocked,
        uint256 collateralOnOpenPosition,
        uint256 collateralLockedRedeemable,
        uint256 poolSupply
    );
	function setLendingPoolReferral(uint16 newLendingPoolReferral) external;
	function setPoolDataForAcoPermission(uint256 newTolerancePriceBelow, uint256 newTolerancePriceAbove, uint256 newMinExpiration, uint256 newMaxExpiration) external;
	function setPoolAdmin(uint256 newAdmin) external;
	function setProtocolConfig(PoolProtocolConfig calldata newConfig) external;
	function setFeeData(address newFeeDestination, uint256 newFee) external;
	function setAssetConverter(address newAssetConverter) external;
    function setTolerancePriceBelow(uint256 newTolerancePriceBelow) external;
    function setTolerancePriceAbove(uint256 newTolerancePriceAbove) external;
    function setMinExpiration(uint256 newMinExpiration) external;
    function setMaxExpiration(uint256 newMaxExpiration) external;
    function setFee(uint256 newFee) external;
    function setFeeDestination(address newFeeDestination) external;
	function setWithdrawOpenPositionPenalty(uint256 newWithdrawOpenPositionPenalty) external;
	function setUnderlyingPriceAdjustPercentage(uint256 newUnderlyingPriceAdjustPercentage) external;
	function setMaximumOpenAco(uint256 newMaximumOpenAco) external;
	function setStrategy(address newStrategy) external;
	function setBaseVolatility(uint256 newBaseVolatility) external;
	function setValidAcoCreator(address newAcoCreator, bool newPermission) external;
    function withdrawStuckToken(address token, address destination) external;
    function deposit(uint256 collateralAmount, uint256 minShares, address to, bool isLendingToken) external payable returns(uint256 acoPoolTokenAmount);
	function depositWithGasToken(uint256 collateralAmount, uint256 minShares, address to, bool isLendingToken) external payable returns(uint256 acoPoolTokenAmount);
	function withdrawNoLocked(uint256 shares, uint256 minCollateral, address account, bool withdrawLendingToken) external returns (
		uint256 underlyingWithdrawn,
		uint256 strikeAssetWithdrawn
	);
	function withdrawNoLockedWithGasToken(uint256 shares, uint256 minCollateral, address account, bool withdrawLendingToken) external returns (
		uint256 underlyingWithdrawn,
		uint256 strikeAssetWithdrawn
	);
    function withdrawWithLocked(uint256 shares, address account, bool withdrawLendingToken) external returns (
		uint256 underlyingWithdrawn,
		uint256 strikeAssetWithdrawn,
		address[] memory acos,
		uint256[] memory acosAmount
	);
	function withdrawWithLockedWithGasToken(uint256 shares, address account, bool withdrawLendingToken) external returns (
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
    function lendCollateral() external;
}