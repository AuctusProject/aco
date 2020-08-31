pragma solidity ^0.6.6;

interface IACOStrategy {
    function quote(
        bool isSellingQuote,
        address underlying,
        address strikeAsset,
        bool isCall, 
        uint256 strikePrice, 
        uint256 expiryTime, 
        uint256 baseVolatility,
        uint256 collateralAmount,
        uint256 collateralAvailable,
        uint256 totalCollateral,
        uint256 amountPurchased,
        uint256 amountSold
    ) external view returns(uint256, uint256);
    function getUnderlyingPrice(address underlying, address strikeAsset) external view returns(uint256);
}