pragma solidity ^0.6.6;

interface IACOAssetConverterHelper {
    function setPairTolerancePercentage(address baseAsset, address quoteAsset, uint256 tolerancePercentage) external;
    function setAgreggator(address baseAsset, address quoteAsset, address aggregator) external;
    function setUniswapMiddleRoute(address baseAsset, address quoteAsset, address[] calldata uniswapMiddleRoute) external;
    function withdrawStuckAsset(address asset, address destination) external;
    function hasAggregator(address baseAsset, address quoteAsset) external view returns(bool);
    function getPrice(address baseAsset, address quoteAsset) external view returns(uint256);
    function getTolerancePercentage(address baseAsset, address quoteAsset) external view returns(uint256);
    function getPriceWithTolerance(address baseAsset, address quoteAsset, bool isMinimumPrice) external view returns(uint256);
    function swapExactAmountOut(address assetToSold, address assetToBuy, uint256 amountToSold) external payable returns(uint256);
    function swapExactAmountOutWithSpecificTolerance(address assetToSold, address assetToBuy, uint256 amountToSold, uint256 tolerancePercentage) external payable returns(uint256);
    function swapExactAmountOutWithMinAmountToReceive(address assetToSold, address assetToBuy, uint256 amountToSold, uint256 minAmountToReceive) external payable returns(uint256);
    function swapExactAmountIn(address assetToSold, address assetToBuy, uint256 amountToBuy) external payable returns(uint256);
    function swapExactAmountInWithSpecificTolerance(address assetToSold, address assetToBuy, uint256 amountToBuy, uint256 tolerancePercentage) external payable returns(uint256);
    function swapExactAmountInWithMaxAmountToSold(address assetToSold, address assetToBuy, uint256 amountToBuy, uint256 maxAmountToSold) external payable returns(uint256);
}