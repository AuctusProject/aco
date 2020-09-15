pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../util/Ownable.sol';
import '../../libs/Address.sol';
import '../../libs/SafeMath.sol';
import '../../libs/BlackScholes.sol';
import '../../interfaces/IACOStrategy.sol';
import '../../interfaces/AggregatorV3Interface.sol';

/**
 * @title ACOStrategy1
 * @dev The contract is to set the strategy for an ACO Pool.
 * This strategy is only to selling ACO tokens.
 */
contract ACOStrategy1 is Ownable, IACOStrategy {
    using Address for address;
    using SafeMath for uint256;

    /**
     * @dev Emitted when the order size factors has been changed.
     * orderSizePenaltyFactor * order size percentage ^ orderSizeDampingFactor
     * @param oldOrderSizePenaltyFactor Value of the previous order size penalty factor.
     * @param oldOrderSizeDampingFactor Value of the previous order size damping factor.
     * @param newOrderSizePenaltyFactor Value of the new order size penalty factor.
     * @param newOrderSizeDampingFactor Value of the new order size damping factor.
     */
    event SetOrderSizeFactors(uint256 oldOrderSizePenaltyFactor, uint256 oldOrderSizeDampingFactor, uint256 newOrderSizePenaltyFactor, uint256 newOrderSizeDampingFactor);
    
    /**
     * @dev Emitted when the underlying price percentage adjust has been changed.
     * @param oldUnderlyinPriceAdjustPercentage Value of the previous percentage adjust on the underlying price to calculate the option price.
     * @param newUnderlyingPriceAdjustPercentage Value of the new percentage adjust on the underlying price to calculate the option price.
     */
    event SetUnderlyingPriceAdjustPercentage(uint256 oldUnderlyinPriceAdjustPercentage, uint256 newUnderlyingPriceAdjustPercentage);
    
    /**
     * @dev Emitted when the minimum percentage for the option price calculation has been changed.
     * @param oldMinOptionPricePercentage Value of the previous minimum percentage for the option price calculation.
     * @param newMinOptionPricePercentage Value of the new minimum percentage for the option price calculation.
     */
	event SetMinOptionPricePercentage(uint256 oldMinOptionPricePercentage, uint256 newMinOptionPricePercentage);
	
	/**
     * @dev Emitted when the tolerance percentage for the underlying price on the Oracle has been changed.
     * @param oldTolerancePercentageToOraclePrice Value of the previous tolerance percentage for the underlying price on the Oracle.
     * @param newTolerancePercentageToOraclePrice Value of the new tolerance percentage for the underlying price on the Oracle.
     */
	event SetTolerancePercentageToOraclePrice(uint256 oldTolerancePercentageToOraclePrice, uint256 newTolerancePercentageToOraclePrice);
	
	/**
     * @dev Emitted when the Oracle aggregator data has been changed.
     * @param underlying Address of the underlying asset.
     * @param strikeAsset Address of the strike asset.
     * @param previousAggregator Address of the previous Oracle aggregator.
     * @param newAggregator Address of the new Oracle aggregator.
     */
    event SetAggregator(address indexed underlying, address indexed strikeAsset, address previousAggregator, address newAggregator);
    
    /**
     * @dev The percentage precision. (100000 = 100%)
     */
    uint256 internal constant PERCENTAGE_PRECISION = 100000;
    
    /**
     * @dev Struct to store the Oracle aggregator data.
     */
    struct AggregatorData {
        /**
         * @dev Address of the Oracle aggregator.
         */
        address aggregator;
        
        /**
         * @dev Oracle aggregator precision. (8 decimals = 100000000)
         */
        uint256 precision;
    }
    
    /**
     * @dev The percentage adjust on the underlying price to calculate the option price.
     */
    uint256 public underlyingPriceAdjustPercentage;
	
	/**
     * @dev The minimum percentage for the option price calculation.
     */
	uint256 public minOptionPricePercentage;
	
	/**
     * @dev The order size penalty factor.
     */
    uint256 public orderSizePenaltyFactor;
	
	/**
     * @dev The order size damping factor.
     */
    uint256 public orderSizeDampingFactor;
	
	/**
     * @dev The tolerance percentage for the underlying price on the Oracle.
     */
    uint256 public tolerancePercentageToOraclePrice;
	
	/**
     * @dev The Oracle aggregators data. (underlying => strikeAsset => AggregatorData)
     */
    mapping(address => mapping(address => AggregatorData)) public aggregators; 
	
	/**
     * @dev The asset precision. (6 decimals = 1000000)
     */
    mapping(address => uint256) public assetPrecision;
    
	/**
     * @dev The order size divider factor used on the calculation.
     */
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
    
	/**
     * @dev Function to set the percentage adjust on the underlying price to calculate the option price.
	 * Only can be called by the admin.
     * @param _underlyingPriceAdjustPercentage Value of the new percentage adjust on the underlying price to calculate the option price.
     */
    function setUnderlyingPriceAdjustPercentage(uint256 _underlyingPriceAdjustPercentage) onlyOwner public {
        _setUnderlyingPriceAdjustPercentage(_underlyingPriceAdjustPercentage);
    }
	
	/**
     * @dev Function to set the minimum percentage for the option price calculation.
	 * Only can be called by the admin.
     * @param _minOptionPricePercentage Value of the new  minimum percentage for the option price calculation.
     */
	function setMinOptionPricePercentage(uint256 _minOptionPricePercentage) onlyOwner public {
        _setMinOptionPricePercentage(_minOptionPricePercentage);
    }
    
	/**
     * @dev Function to set the tolerance percentage for the underlying price on the Oracle.
	 * Only can be called by the admin.
     * @param _tolerancePercentageToOraclePrice Value of the tolerance percentage for the underlying price on the Oracle.
     */
    function setTolerancePercentageToOraclePrice(uint256 _tolerancePercentageToOraclePrice) onlyOwner public {
        _setTolerancePercentageToOraclePrice(_tolerancePercentageToOraclePrice);
    }
    
	/**
     * @dev Function to set the the order size factors.
     * orderSizePenaltyFactor * order size percentage ^ orderSizeDampingFactor
	 * Only can be called by the admin.
     * @param _orderSizePenaltyFactor Value of the new order size penalty factor.
     * @param _orderSizeDampingFactor Value of the new order size damping factor.
     */
    function setOrderSizeFactors(uint256 _orderSizePenaltyFactor, uint256 _orderSizeDampingFactor) onlyOwner public {
        _setOrderSizeFactors(_orderSizePenaltyFactor, _orderSizeDampingFactor);
    }
    
	/**
     * @dev Function to set the the Oracle aggregator data.
	 * Only can be called by the admin.
     * @param underlying Address of the underlying.
     * @param strikeAsset Address of the strike asset.
	 * @param aggregator Address of the Oracle aggregator.
     */
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
    
	/**
     * @dev Function to get the underlying price on the Oracle aggregator.
     * @param underlying Address of the underlying.
     * @param strikeAsset Address of the strike asset.
	 * @return The underlying price with the strike asset precision.
     */
    function getUnderlyingPrice(address underlying, address strikeAsset) external override view returns(uint256) {
        return _getAggregatorPrice(underlying, strikeAsset);   
    }
    
	/**
     * @dev Function to get an acceptable underlying price to swap the related assets.
	 * Reading the underlying price on the Oracle aggregator, the value read is adjusted to a maximum acceptable price slippage.
     * @param underlying Address of the underlying.
     * @param strikeAsset Address of the strike asset.
     * @param isBuying True if is buying, otherwise is selling.
	 * @return The acceptable underlying price to swap the related assets.
     */
    function getAcceptableUnderlyingPriceToSwapAssets(address underlying, address strikeAsset, bool isBuying) external override view returns(uint256) {
        uint256 underlyingPrice = _getAggregatorPrice(underlying, strikeAsset);
        if (isBuying) {
            return underlyingPrice.mul(PERCENTAGE_PRECISION.sub(tolerancePercentageToOraclePrice)).div(PERCENTAGE_PRECISION);
        } else {
            return underlyingPrice.mul(PERCENTAGE_PRECISION.add(tolerancePercentageToOraclePrice)).div(PERCENTAGE_PRECISION);    
        }
    }
    
	/**
     * @dev Function to check the exercise data.
	 * This strategy only sells, so the exercise is not available.
	 * @return Whether the exercise is possible and the minimum intrinsic value to be exercise.
     */
    function checkExercise(CheckExercise calldata) external override view returns(bool, uint256) {
        require(false, "ACOStrategy1:: Strategy only for sell");
        return (false, 0);
    }
    
	/**
     * @dev Function to quote an option price.
     * @param quoteData The quote data.
	 * @return The option price per token in strike asset.
     */
    function quote(OptionQuote calldata quoteData) external override view returns(uint256, uint256, uint256) {
		require(quoteData.isSellingQuote, "ACOStrategy1:: Strategy only for sell");
        require(quoteData.expiryTime > block.timestamp, "ACOStrategy1:: Expired");
        uint256 underlyingPrice = _getAggregatorPrice(quoteData.underlying, quoteData.strikeAsset);
        uint256 volatility = _getVolatility(quoteData);
        uint256 price = _getOptionPrice(underlyingPrice, volatility, quoteData);
        require(price > 0, "ACOPool:: Invalid price");
        return (price, underlyingPrice, volatility);
    }
    
	/**
     * @dev Internal function to get a volatility adjusted by the order size.
     * @param quoteData The quote data.
	 * @return The volatility to be used on option price calculation.
     */
    function _getVolatility(OptionQuote memory quoteData) internal view returns(uint256) {
        uint256 orderSizeAdjust = _getOrderSizeAdjust(quoteData);
        return quoteData.baseVolatility.mul(orderSizeAdjust.add(PERCENTAGE_PRECISION)).div(PERCENTAGE_PRECISION);
    }
    
	/**
     * @dev Internal function to get the option price through the Black-Scholes method.
	 * @param underlyingPrice The current underlying price.
	 * @param volatility The volatility percentage to be used on the calculation.
     * @param quoteData The quote data.
	 * @return The option price per token in strike asset.
     */
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
    
	/**
     * @dev Internal function to get the order size adjustment percentage on the volatility.
     * orderSizePenaltyFactor * order size percentage ^ orderSizeDampingFactor
     * @param quoteData The quote data.
	 * @return The order size adjustment percentage on the volatility.
     */
    function _getOrderSizeAdjust(OptionQuote memory quoteData) internal view returns(uint256) {
        uint256 orderSizePercentage = quoteData.collateralOrderAmount.mul(PERCENTAGE_PRECISION).div(quoteData.collateralAvailable);
		require(orderSizePercentage <= PERCENTAGE_PRECISION, "ACOStrategy1:: No liquidity");
        return (orderSizePercentage ** orderSizeDampingFactor).mul(orderSizePenaltyFactor).div(orderSizeDivFactor);
    }
    
	/**
     * @dev Internal function to get a underlying price for a quote.
     * @param underlyingPrice The current underlying price.
     * @param quoteData The quote data.
	 * @return The underlying price for a quote.
     */
    function _getUnderlyingPriceForQuote(uint256 underlyingPrice, OptionQuote memory quoteData) internal view returns(uint256) {
		if (quoteData.isCallOption) {
			return underlyingPrice.mul(PERCENTAGE_PRECISION.add(underlyingPriceAdjustPercentage)).div(PERCENTAGE_PRECISION);
		} else {
			return underlyingPrice.mul(PERCENTAGE_PRECISION.sub(underlyingPriceAdjustPercentage)).div(PERCENTAGE_PRECISION);
		}
    }
    
	/**
     * @dev Internal function to get a valid option price on a quote.
	 * The minimum option price restriction is applied.
     * @param price Calculated option price.
     * @param underlyingPrice The current underlying price.
     * @param quoteData The quote data.
	 * @return The valid option price considering the minimum price allowed.
     */
    function _getValidPriceForQuote(uint256 price, uint256 underlyingPrice, OptionQuote memory quoteData) internal view returns(uint256) {
		uint256 basePrice = quoteData.isCallOption ? underlyingPrice : quoteData.strikePrice;
		uint256 minPrice = basePrice.mul(minOptionPricePercentage).div(PERCENTAGE_PRECISION);
		if (minPrice > price) {
			return minPrice;
		}
		return price;
    }
    
	/**
     * @dev Internal function to get the underlying price on the Oracle aggregator.
     * @param underlying Address of the underlying.
     * @param strikeAsset Address of the strike asset.
	 * @return The underlying price with the strike asset precision.
     */
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
    
	/**
     * @dev Internal function to set the asset precision. (6 decimals = 1000000)
     * @param asset Address of the asset.
     */
    function _setAssetPrecision(address asset) internal {
        if (assetPrecision[asset] == 0) {
            uint256 decimals = _getAssetDecimals(asset);
            assetPrecision[asset] = (10 ** decimals);
        }
    }
    
	/**
     * @dev Internal function to set the percentage adjust on the underlying price to calculate the option price.
     * @param _underlyingPriceAdjustPercentage Value of the new percentage adjust on the underlying price to calculate the option price.
     */
    function _setUnderlyingPriceAdjustPercentage(uint256 _underlyingPriceAdjustPercentage) internal {
        require(_underlyingPriceAdjustPercentage <= PERCENTAGE_PRECISION, "ACOStrategy1:: Invalid underlying price adjust");
        emit SetUnderlyingPriceAdjustPercentage(underlyingPriceAdjustPercentage, _underlyingPriceAdjustPercentage);
        underlyingPriceAdjustPercentage = _underlyingPriceAdjustPercentage;
    }
    
	/**
     * @dev Internal function to set the minimum percentage for the option price calculation.
     * @param _minOptionPricePercentage Value of the new  minimum percentage for the option price calculation.
     */
	function _setMinOptionPricePercentage(uint256 _minOptionPricePercentage) internal {
		require(_minOptionPricePercentage > 0 && _minOptionPricePercentage < PERCENTAGE_PRECISION, "ACOStrategy1:: Invalid min option price percentage");
        emit SetMinOptionPricePercentage(minOptionPricePercentage, _minOptionPricePercentage);
        minOptionPricePercentage = _minOptionPricePercentage;
	}
	
	/**
     * @dev Internal function to set the tolerance percentage for the underlying price on the Oracle.
     * @param _tolerancePercentageToOraclePrice Value of the tolerance percentage for the underlying price on the Oracle.
     */
	function _setTolerancePercentageToOraclePrice(uint256 _tolerancePercentageToOraclePrice) internal {
		require(_tolerancePercentageToOraclePrice <= PERCENTAGE_PRECISION, "ACOStrategy1:: Invalid tolerance percentage");
        emit SetTolerancePercentageToOraclePrice(tolerancePercentageToOraclePrice, _tolerancePercentageToOraclePrice);
        tolerancePercentageToOraclePrice = _tolerancePercentageToOraclePrice;
	}
	
	/**
     * @dev Internal function to set the the order size factors.
     * @param _orderSizePenaltyFactor Value of the new order size penalty factor.
     * @param _orderSizeDampingFactor Value of the new order size damping factor.
     */
    function _setOrderSizeFactors(uint256 _orderSizePenaltyFactor, uint256 _orderSizeDampingFactor) internal {
        require(_orderSizePenaltyFactor <= 1000000, "ACOStrategy1:: Invalid penalty factor");
        require(_orderSizeDampingFactor > 0 && _orderSizeDampingFactor <= 10, "ACOStrategy1:: Invalid damping factor");
        emit SetOrderSizeFactors(orderSizePenaltyFactor, orderSizeDampingFactor, _orderSizePenaltyFactor, _orderSizeDampingFactor);
        orderSizePenaltyFactor = _orderSizePenaltyFactor;
        orderSizeDampingFactor = _orderSizeDampingFactor;
        orderSizeDivFactor = (PERCENTAGE_PRECISION ** (_orderSizeDampingFactor - 1));
    }
    
	/**
     * @dev Internal function to the asset decimals.
     * @param asset Address of the asset.
     * @return The asset decimals.
     */
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