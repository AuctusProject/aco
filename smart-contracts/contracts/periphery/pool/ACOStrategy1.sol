pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../util/Ownable.sol';
import '../../libs/Address.sol';
import '../../libs/SafeMath.sol';
import '../../libs/BlackScholes.sol';
import '../../interfaces/IACOStrategy.sol';
import '../../interfaces/AggregatorV3Interface.sol';


contract ACOStrategy1 is Ownable, IACOStrategy {
    using Address for address;
    using SafeMath for uint256;

    event SetOrderSizeFactors(uint256 oldOrderSizePenaltyFactor, uint256 oldOrderSizeDampingFactor, uint256 newOrderSizePenaltyFactor, uint256 newOrderSizeDampingFactor);
    event SetUnderlyingPriceAdjustPercentage(uint256 oldUnderlyinPriceAdjustPercentage, uint256 newUnderlyingPriceAdjustPercentage);
	event SetMinOptionPricePercentage(uint256 oldMinOptionPricePercentage, uint256 newMinOptionPricePercentage);
	event SetTolerancePercentageToOraclePrice(uint256 oldTolerancePercentageToOraclePrice, uint256 newTolerancePercentageToOraclePrice);
    event SetAggregator(address indexed underlying, address indexed strikeAsset, address previousAggregator, address newAggregator);
    
    uint256 internal constant PERCENTAGE_PRECISION = 100000;
    
    struct AggregatorData {
        address aggregator;
        uint256 precision;
    }
    
    uint256 public underlyingPriceAdjustPercentage;
	uint256 public minOptionPricePercentage;
    uint256 public orderSizePenaltyFactor;
    uint256 public orderSizeDampingFactor;
    uint256 public tolerancePercentageToOraclePrice;
    mapping(address => mapping(address => AggregatorData)) public aggregators; 
    mapping(address => uint256) public assetPrecision;
    
    uint256 internal orderSizeDivFactor;
    
    constructor(
        uint256 _underlyingPriceAdjustPercentage,
		uint256 _minOptionPricePercentage,
		uint256 _tolerancePercentageToOraclePrice,
        uint256 _orderSizePenaltyFactor,
        uint256 _orderSizeDampingFactor
    ) public {
        _setUnderlyingPriceAdjustPercentage(_underlyingPriceAdjustPercentage);
		_setMinOptionPricePercentage(_minOptionPricePercentage);
		_setTolerancePercentageToOraclePrice(_tolerancePercentageToOraclePrice);
        _setOrderSizeFactors(_orderSizePenaltyFactor, _orderSizeDampingFactor);
    }
    
    function setUnderlyingPriceAdjustPercentage(uint256 _underlyingPriceAdjustPercentage) onlyOwner public {
        _setUnderlyingPriceAdjustPercentage(_underlyingPriceAdjustPercentage);
    }
	
	function setMinOptionPricePercentage(uint256 _minOptionPricePercentage) onlyOwner public {
        _setMinOptionPricePercentage(_minOptionPricePercentage);
    }
    
    function setTolerancePercentageToOraclePrice(uint256 _tolerancePercentageToOraclePrice) onlyOwner public {
        _setTolerancePercentageToOraclePrice(_tolerancePercentageToOraclePrice);
    }
    
    function setOrderSizeFactors(uint256 _orderSizePenaltyFactor, uint256 _orderSizeDampingFactor) onlyOwner public {
        _setOrderSizeFactors(_orderSizePenaltyFactor, _orderSizeDampingFactor);
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
        aggregators[underlying][strikeAsset] = AggregatorData(aggregator, (10 ** aggregatorDecimals));
    }
    
    function getUnderlyingPrice(address underlying, address strikeAsset) external override view returns(uint256) {
        return _getAggregatorPrice(underlying, strikeAsset);   
    }
    
    function getAcceptableUnderlyingPriceToSwapAssets(address underlying, address strikeAsset, bool isBuying) external override view returns(uint256) {
        uint256 underlyingPrice = _getAggregatorPrice(underlying, strikeAsset);
        if (isBuying) {
            return underlyingPrice.mul(PERCENTAGE_PRECISION.sub(tolerancePercentageToOraclePrice)).div(PERCENTAGE_PRECISION);
        } else {
            return underlyingPrice.mul(PERCENTAGE_PRECISION.add(tolerancePercentageToOraclePrice)).div(PERCENTAGE_PRECISION);    
        }
    }
    
    function checkExercise(CheckExercise calldata) external override view returns(bool, uint256) {
        require(false, "ACOStrategy1:: Strategy only for sell");
        return (false, 0);
    }
    
    function quote(OptionQuote calldata quoteData) external override view returns(uint256, uint256, uint256) {
		require(!quoteData.isSellingQuote, "ACOStrategy1:: Strategy only for sell");
        require(quoteData.expiryTime > block.timestamp, "ACOStrategy1:: Expired");
        uint256 underlyingPrice = _getAggregatorPrice(quoteData.underlying, quoteData.strikeAsset);
        uint256 volatility = _getVolatility(quoteData);
        uint256 price = _getOptionPrice(underlyingPrice, volatility, quoteData);
        return (price, underlyingPrice, volatility);
    }
    
    function _getVolatility(OptionQuote memory quoteData) internal view returns(uint256) {
        uint256 orderSizeAdjust = _getOrderSizeAdjust(quoteData);
        return quoteData.baseVolatility.mul(orderSizeAdjust.add(PERCENTAGE_PRECISION)).div(PERCENTAGE_PRECISION);
    }
    
    function _getOptionPrice(
        uint256 underlyingPrice,
        uint256 volatility,
        OptionQuote memory quoteData
    ) internal view returns(uint256) {
        uint256 underlyingPriceForQuote = _getUnderlyingPriceForQuote(underlyingPrice, quoteData);
        uint256 price = BlackScholes.getOptionPrice(
            quoteData.isCallOption,
            quoteData.strikePrice, 
            underlyingPriceForQuote,
            assetPrecision[quoteData.strikeAsset],
            quoteData.expiryTime - block.timestamp, 
            volatility,
            0, 
            0,
            PERCENTAGE_PRECISION
        );
        return _getValidPriceForQuote(price, underlyingPrice, quoteData);
    }
    
    function _getOrderSizeAdjust(OptionQuote memory quoteData) internal view returns(uint256) {
        uint256 orderSizePercentage = quoteData.collateralOrderAmount.mul(PERCENTAGE_PRECISION).div(quoteData.collateralAvailable);
		require(orderSizePercentage <= PERCENTAGE_PRECISION, "ACOStrategy1:: No liquidity");
        return (orderSizePercentage ** orderSizeDampingFactor).mul(orderSizePenaltyFactor).div(orderSizeDivFactor);
    }
    
    function _getUnderlyingPriceForQuote(uint256 underlyingPrice, OptionQuote memory quoteData) internal view returns(uint256) {
		if (quoteData.isCallOption) {
			return underlyingPrice.mul(PERCENTAGE_PRECISION.add(underlyingPriceAdjustPercentage)).div(PERCENTAGE_PRECISION);
		} else {
			return underlyingPrice.mul(PERCENTAGE_PRECISION.sub(underlyingPriceAdjustPercentage)).div(PERCENTAGE_PRECISION);
		}
    }
    
    function _getValidPriceForQuote(uint256 price, uint256 underlyingPrice, OptionQuote memory quoteData) internal view returns(uint256) {
		uint256 basePrice = quoteData.isCallOption ? underlyingPrice : quoteData.strikePrice;
		uint256 minPrice = basePrice.mul(minOptionPricePercentage).div(PERCENTAGE_PRECISION);
		if (minPrice > price) {
			return (minPrice == 0 ? 1 : minPrice);
		}
		return price;
    }
    
    function _getAggregatorPrice(address underlying, address strikeAsset) internal view returns(uint256) {
        AggregatorData storage data = aggregators[underlying][strikeAsset];
        address _aggregator = data.aggregator;
        require(_aggregator != address(0), "ACOStrategy1:: No aggregator");
        
        (,int256 answer,,,) = AggregatorV3Interface(_aggregator).latestRoundData();
        
        uint256 _aggregatorPrecision = data.precision;
        uint256 _assetPrecision = assetPrecision[strikeAsset];
        
        if (_aggregatorPrecision > _assetPrecision) {
            return uint256(answer).div(_aggregatorPrecision.div(_assetPrecision));
        } else {
            return uint256(answer).mul(_assetPrecision).div(_aggregatorPrecision);
        }
    }
    
    function _setAssetPrecision(address asset) internal {
        if (assetPrecision[asset] == 0) {
            uint256 decimals = _getAssetDecimals(asset);
            assetPrecision[asset] = (10 ** decimals);
        }
    }
    
    function _setUnderlyingPriceAdjustPercentage(uint256 _underlyingPriceAdjustPercentage) internal {
        require(_underlyingPriceAdjustPercentage <= PERCENTAGE_PRECISION, "ACOStrategy1:: Invalid underlying price adjust");
        emit SetUnderlyingPriceAdjustPercentage(underlyingPriceAdjustPercentage, _underlyingPriceAdjustPercentage);
        underlyingPriceAdjustPercentage = _underlyingPriceAdjustPercentage;
    }
    
	function _setMinOptionPricePercentage(uint256 _minOptionPricePercentage) internal {
		require(_minOptionPricePercentage > 0 && _minOptionPricePercentage < PERCENTAGE_PRECISION, "ACOStrategy1:: Invalid min option price percentage");
        emit SetMinOptionPricePercentage(minOptionPricePercentage, _minOptionPricePercentage);
        minOptionPricePercentage = _minOptionPricePercentage;
	}
	
	function _setTolerancePercentageToOraclePrice(uint256 _tolerancePercentageToOraclePrice) internal {
		require(_tolerancePercentageToOraclePrice <= PERCENTAGE_PRECISION, "ACOStrategy1:: Invalid tolerance percentage");
        emit SetTolerancePercentageToOraclePrice(tolerancePercentageToOraclePrice, _tolerancePercentageToOraclePrice);
        tolerancePercentageToOraclePrice = _tolerancePercentageToOraclePrice;
	}
	
    function _setOrderSizeFactors(uint256 _orderSizePenaltyFactor, uint256 _orderSizeDampingFactor) internal {
        require(_orderSizePenaltyFactor <= 1000000, "ACOStrategy1:: Invalid penalty factor");
        require(_orderSizeDampingFactor > 0 && _orderSizeDampingFactor <= 10, "ACOStrategy1:: Invalid damping factor");
        emit SetOrderSizeFactors(orderSizePenaltyFactor, orderSizeDampingFactor, _orderSizePenaltyFactor, _orderSizeDampingFactor);
        orderSizePenaltyFactor = _orderSizePenaltyFactor;
        orderSizeDampingFactor = _orderSizeDampingFactor;
        orderSizeDivFactor = (PERCENTAGE_PRECISION ** (_orderSizeDampingFactor - 1));
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