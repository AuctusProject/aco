pragma solidity ^0.6.6;

interface IACOAssetConverterHelper {
    function setPairTolerancePercentage(address baseAsset, address quoteAsset, uint256 tolerancePercentage) external;
    function setAggregator(address baseAsset, address quoteAsset, address aggregator) external;
    function setUniswapMiddleRoute(address baseAsset, address quoteAsset, address[] calldata uniswapMiddleRoute) external;
    function withdrawStuckAsset(address asset, address destination) external;
    function hasAggregator(address baseAsset, address quoteAsset) external view returns(bool);
    function getPairData(address baseAsset, address quoteAsset) external view returns(address, uint256, uint256, uint256);
    function getUniswapMiddleRouteByIndex(address baseAsset, address quoteAsset, uint256 index) external view returns(address);
    function getPrice(address baseAsset, address quoteAsset) external view returns(uint256);
    function getPriceWithTolerance(address baseAsset, address quoteAsset, bool isMinimumPrice) external view returns(uint256);
    function getExpectedAmountOutToSwapExactAmountIn(address assetToSold, address assetToBuy, uint256 amountToBuy) external view returns(uint256);
    function getExpectedAmountOutToSwapExactAmountInWithSpecificTolerance(address assetToSold, address assetToBuy, uint256 amountToBuy, uint256 tolerancePercentage) external view returns(uint256);
    function swapExactAmountOut(address assetToSold, address assetToBuy, uint256 amountToSold) external payable returns(uint256);
    function swapExactAmountOutWithSpecificTolerance(address assetToSold, address assetToBuy, uint256 amountToSold, uint256 tolerancePercentage) external payable returns(uint256);
    function swapExactAmountOutWithMinAmountToReceive(address assetToSold, address assetToBuy, uint256 amountToSold, uint256 minAmountToReceive) external payable returns(uint256);
    function swapExactAmountIn(address assetToSold, address assetToBuy, uint256 amountToBuy) external payable returns(uint256);
    function swapExactAmountInWithSpecificTolerance(address assetToSold, address assetToBuy, uint256 amountToBuy, uint256 tolerancePercentage) external payable returns(uint256);
    function swapExactAmountInWithMaxAmountToSold(address assetToSold, address assetToBuy, uint256 amountToBuy, uint256 maxAmountToSold) external payable returns(uint256);
}