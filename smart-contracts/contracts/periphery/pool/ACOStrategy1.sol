pragma solidity ^0.6.6;

import '../../util/Ownable.sol';
import '../../libs/Address.sol';
import '../../libs/BlackScholes.sol';
import '../../interfaces/IACOStrategy.sol';
import '../../interfaces/AggregatorV3Interface.sol';

contract ACOStrategy1 is Ownable, IACOStrategy {
    using Address for address;

    event SetPurchaseLimitPercentage(uint256 indexed previousPurchaseLimitPercentage, uint256 indexed newPurchaseLimitPercentage);
    event SetAggregator(address indexed underlying, address indexed strikeAsset, address previousAggregator, address newAggregator);
    
    uint256 internal constant PERCENTAGE_PRECISION = 100000;
    
    struct AggregatorData {
        address aggregator;
        int256 precision;
    }
    
    uint256 purchaseLimitPercentage;
    mapping(address => mapping(address => AggregatorData)) public aggregators; 
    mapping(address => int256) public assetPrecision;
    
    constructor(uint256 _purchaseLimitPercentage) public {
        _setPurchaseLimitPercentage(_purchaseLimitPercentage);
    }
    
    function setPurchaseLimitPercentage(uint256 _purchaseLimitPercentage) onlyOwner public {
        _setPurchaseLimitPercentage(_purchaseLimitPercentage);
    }
    
    function setAgreggator(address underlying, address strikeAsset, address aggregator) onlyOwner public {
        require(underlying != strikeAsset, "ACOStrategy1:: Invalid assets");
        require(underlying == address(0) || underlying.isContract(), "ACOStrategy1:: Invalid underlying");
        require(strikeAsset == address(0) || strikeAsset.isContract(), "ACOStrategy1:: Invalid strike asset");
        require(aggregator.isContract(), "ACOStrategy1:: Invalid aggregator");
        
        _setAssetPrecision(underlying);
        _setAssetPrecision(strikeAsset);
        
        uint256 aggregatorDecimals = uint256(AggregatorV3Interface(aggregator).decimals());
        emit SetAggregator(underlying, strikeAsset, aggregators[underlying][strikeAsset].aggregator, aggregator);
        aggregators[underlying][strikeAsset] = AggregatorData(aggregator, int256(10 ** aggregatorDecimals));
    }
    
    function getUnderlyingPrice(address underlying, address strikeAsset) public override view returns(uint256) {
        (int256 price,,) = _getAggregatorPrice(underlying, strikeAsset);
        return uint256(price);    
    }
    

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
    ) public override view returns(uint256, uint256) {
        return _quote(
            isSellingQuote, 
            underlying, 
            strikeAsset,
            isCall,
            _getUintArgumentsToQuote(
                strikePrice, 
                expiryTime, 
                baseVolatility,
                collateralAmount,
                collateralAvailable,
                totalCollateral,
                amountPurchased,
                amountSold
            )
        );
    }
    
    function _quote(
        bool isSellingQuote,
        address underlying,
        address strikeAsset,
        bool isCall, 
        uint256[] memory uintArguments
    ) internal view returns(uint256, uint256) {
        require(uintArguments[1] > block.timestamp, "ACOStrategy1:: Expired");
        (int256 underlyingPrice, uint80 lastRoundId, uint256 priceTime) = _getAggregatorPrice(underlying, strikeAsset);
        uint256 currentVolatilityAdjust = _getCurrentVolatilityAdjust(isSellingQuote, underlyingPrice, lastRoundId, priceTime);
        uint256 orderSizeAdjust = _getOrderSizeAdjust(isSellingQuote, uintArguments[3], uintArguments[4], uintArguments[5], uintArguments[6], uintArguments[7]);
        uint256 volatility = uintArguments[2] * currentVolatilityAdjust * orderSizeAdjust / PERCENTAGE_PRECISION / PERCENTAGE_PRECISION;
        return (_getOptionPrice(strikeAsset, isCall, uintArguments[0], volatility, uint256(underlyingPrice), uintArguments[1]), volatility);
    }
    
    function _getUintArgumentsToQuote(
        uint256 strikePrice, 
        uint256 expiryTime, 
        uint256 baseVolatility,
        uint256 collateralAmount,
        uint256 collateralAvailable,
        uint256 totalCollateral,
        uint256 amountPurchased,
        uint256 amountSold
    ) internal pure returns(uint256[] memory) {
        uint256[] memory uintArguments = new uint256[](8);
        uintArguments[0] = strikePrice;
        uintArguments[1] = expiryTime;
        uintArguments[2] = baseVolatility;
        uintArguments[3] = collateralAmount;
        uintArguments[4] = collateralAvailable;
        uintArguments[5] = totalCollateral;
        uintArguments[6] = amountPurchased;
        uintArguments[7] = amountSold;
        return uintArguments;
    }
    
    function _getOptionPrice(
        address strikeAsset,
        bool isCall, 
        uint256 strikePrice,
        uint256 volatility,
        uint256 underlyingPrice,
        uint256 expiryTime
    ) internal view returns(uint256) {
        return BlackScholes.getOptionPrice(
                isCall,
                strikePrice, 
                underlyingPrice,
                uint256(assetPrecision[strikeAsset]),
                expiryTime - block.timestamp, 
                volatility,
                0, 
                0,
                PERCENTAGE_PRECISION
            );
    }
    
    function _getCurrentVolatilityAdjust(
        bool isSellingQuote, 
        int256 underlyingPrice,
        uint80 lastRoundId,
        uint256 priceTime
    ) internal view returns(uint256) {
        //TODO
    }
    
    function _getOrderSizeAdjust(
        bool isSellingQuote, 
        uint256 collateralAmount,
        uint256 collateralAvailable,
        uint256 totalCollateral,
        uint256 amountPurchased,
        uint256 amountSold
    ) internal view returns(uint256) {
        //TODO
    }
    
    function _getAggregatorPrice(address underlying, address strikeAsset) internal view returns(int256, uint80, uint256) {
        AggregatorData storage data = aggregators[underlying][strikeAsset];
        require(data.aggregator != address(0), "ACOStrategy1:: No aggregator");
        (uint80 roundId, int256 answer, uint256 time,,) = AggregatorV3Interface(data.aggregator).latestRoundData();
        if (data.precision > assetPrecision[strikeAsset]) {
            return (answer / (data.precision / assetPrecision[strikeAsset]), roundId, time);
        } else {
            return (answer * (assetPrecision[strikeAsset] / data.precision), roundId, time);
        }
    }
    
    function _setAssetPrecision(address asset) internal {
        if (assetPrecision[asset] == 0) {
            uint256 decimals = _getAssetDecimals(asset);
            assetPrecision[asset] = int256(10 ** decimals);
        }
    }
    
    function _setPurchaseLimitPercentage(uint256 _purchaseLimitPercentage) internal {
        require(_purchaseLimitPercentage <= PERCENTAGE_PRECISION, "ACOStrategy1:: Invalid purchase limit");
        emit SetPurchaseLimitPercentage(purchaseLimitPercentage, _purchaseLimitPercentage);
        purchaseLimitPercentage = _purchaseLimitPercentage;
    }
    
    function _getAssetDecimals(address asset) internal view returns(uint256) {
        if (asset == address(0)) {
            return uint256(18);
        } else {
            (bool success, bytes memory returndata) = asset.staticcall(abi.encodeWithSelector(0x313ce567));
            require(success, "ACOStrategy1::_getAssetDecimals");
            return abi.decode(returndata, (uint256));
        }
    }
}