pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import './Ownable.sol';
import '../libs/Address.sol';
import '../libs/SafeMath.sol';
import '../libs/ACOAssetHelper.sol';
import '../interfaces/IACOAssetConverterHelper.sol';
import '../interfaces/IUniswapV2Router02.sol';
import '../interfaces/AggregatorV3Interface.sol';
import '../interfaces/IWETH.sol';

/**
 * @title ACOAssetConverterHelper
 * @dev A contract to swap assets on Uniswap with a Chainlink oracle protection.
 */
contract ACOAssetConverterHelper is Ownable, IACOAssetConverterHelper {
    using Address for address;
    using SafeMath for uint256;
    	
    /**
     * @dev The percentage precision. (100000 = 100%)
     */
    uint256 public constant PERCENTAGE_PRECISION = 100000;
    
    /**
     * @dev Struct to store the pair data.
     */
    struct PairData {
        /**
         * @dev True if the pair was initialized.
         */
        bool initialized;
        
        /**
         * @dev Address of the Oracle aggregator.
         */
        address aggregator;
        
        /**
         * @dev Oracle aggregator precision. (8 decimals = 100000000)
         */
        uint256 aggregatorPrecision;
        
        /**
         * @dev The tolerance percentage for the price on the Oracle.
         */
        uint256 tolerancePercentage;
        
        /**
         * @dev Addresses of Uniswap middle route for a swap.
         */
        address[] uniswapMiddleRoute;
    }
    
	/**
     * @dev Emitted when the Oracle aggregator data has been changed.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
     * @param previousAggregator Address of the previous Oracle aggregator.
     * @param newAggregator Address of the new Oracle aggregator.
     */
    event SetAggregator(address indexed baseAsset, address indexed quoteAsset, address previousAggregator, address newAggregator);
    
    /**
     * @dev Emitted when the addresses of Uniswap middle route for a swap has been changed.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
     * @param previousUniswapMiddleRoute Previous addresses of Uniswap middle route for a swap.
     * @param newUniswapMiddleRoute New addresses of Uniswap middle route for a swap.
     */
    event SetUniswapMiddleRoute(address indexed baseAsset, address indexed quoteAsset, address[] previousUniswapMiddleRoute, address[] newUniswapMiddleRoute);
    
	/**
     * @dev Emitted when the tolerance percentage for the pair price on the Oracle has been changed.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
     * @param oldTolerancePercentage Value of the previous tolerance percentage for the price on the Oracle.
     * @param newTolerancePercentage Value of the new tolerance percentage for the price on the Oracle.
     */
	event SetPairTolerancePercentage(address indexed baseAsset, address indexed quoteAsset, uint256 oldTolerancePercentage, uint256 newTolerancePercentage);
    
	/**
	 * @dev Address of the Uniswap V2 router.
	 */
    IUniswapV2Router02 public immutable uniswapRouter;
    
    /**
	 * @dev Address of the WETH.
	 */
    address public immutable WETH;

	/**
     * @dev The Oracle aggregators data. (baseAsset => quoteAsset => PairData)
     */
    mapping(address => mapping(address => PairData)) internal pairs; 
	
	/**
     * @dev The asset precision. (6 decimals = 1000000)
     */
    mapping(address => uint256) public assetPrecision;
    
    constructor(address _uniswapRouter) public {
		super.init();
		
		uniswapRouter = IUniswapV2Router02(_uniswapRouter);
		WETH = IUniswapV2Router02(_uniswapRouter).WETH();
    }
    
    receive() external payable {
        require(msg.sender != tx.origin, "ACOAssetConverterHelper:: Only contracts can send ether");
    }
    
	/**
     * @dev Function to set the tolerance percentage for the pair price on the Oracle.
	 * Only can be called by the admin.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
     * @param tolerancePercentage Value of the tolerance percentage for the price on the Oracle.
     */
    function setPairTolerancePercentage(address baseAsset, address quoteAsset, uint256 tolerancePercentage) onlyOwner public override {
        require(tolerancePercentage <= PERCENTAGE_PRECISION, "ACOAssetConverterHelper:: Invalid tolerance percentage");
        (bool reversed, PairData storage data) = _getPair(baseAsset, quoteAsset, false);
        if (data.initialized) {
			if (reversed) {
				emit SetPairTolerancePercentage(quoteAsset, baseAsset, data.tolerancePercentage, tolerancePercentage);
			} else {
				emit SetPairTolerancePercentage(baseAsset, quoteAsset, data.tolerancePercentage, tolerancePercentage);
			}
            data.tolerancePercentage = tolerancePercentage;
        } else {
			emit SetPairTolerancePercentage(baseAsset, quoteAsset, 0, tolerancePercentage);
            _createPair(baseAsset, quoteAsset, address(0), 0, tolerancePercentage, new address[](0));
        }
    }
    
	/**
     * @dev Function to set the the Oracle aggregator data.
	 * Only can be called by the admin.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
	 * @param aggregator Address of the Oracle aggregator.
     */
    function setAggregator(address baseAsset, address quoteAsset, address aggregator) onlyOwner public override {
        require(aggregator.isContract(), "ACOAssetConverterHelper:: Invalid aggregator");
        uint256 aggregatorPrecision = (10 ** uint256(AggregatorV3Interface(aggregator).decimals()));
        (bool reversed, PairData storage data) = _getPair(baseAsset, quoteAsset, false);
        if (data.initialized) {
			if (reversed) {
				emit SetAggregator(quoteAsset, baseAsset, data.aggregator, aggregator);
			} else {
				emit SetAggregator(baseAsset, quoteAsset, data.aggregator, aggregator);
			}
            data.aggregator = aggregator;
            data.aggregatorPrecision = aggregatorPrecision;
        } else {
			emit SetAggregator(baseAsset, quoteAsset, address(0), aggregator);
            _createPair(baseAsset, quoteAsset, aggregator, aggregatorPrecision, 0, new address[](0));
        }
    }
    
    /**
     * @dev Function to set the addresses of Uniswap middle route for a swap.
	 * Only can be called by the admin.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
	 * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
     */
    function setUniswapMiddleRoute(address baseAsset, address quoteAsset, address[] memory uniswapMiddleRoute) onlyOwner public override {
        _validateUniswapMiddleRoute(baseAsset, quoteAsset, uniswapMiddleRoute);
        (bool reversed, PairData storage data) = _getPair(baseAsset, quoteAsset, false);
        if (data.initialized) {
            if (reversed) {
                address[] memory route = new address[](uniswapMiddleRoute.length);
                uint256 index = 0;
                for (uint256 i = uniswapMiddleRoute.length; i > 0; --i) {
                    route[index] = uniswapMiddleRoute[i-1];
                    ++index;
                }
				emit SetUniswapMiddleRoute(quoteAsset, baseAsset, data.uniswapMiddleRoute, route);
                delete data.uniswapMiddleRoute;
                data.uniswapMiddleRoute = route;
            } else {
				emit SetUniswapMiddleRoute(baseAsset, quoteAsset, data.uniswapMiddleRoute, uniswapMiddleRoute);
                delete data.uniswapMiddleRoute;
                data.uniswapMiddleRoute = uniswapMiddleRoute;
            }
        } else {
			emit SetUniswapMiddleRoute(baseAsset, quoteAsset, new address[](0), uniswapMiddleRoute);
            _createPair(baseAsset, quoteAsset, address(0), 0, 0, uniswapMiddleRoute);
        }
    }
    
    /**
     * @dev Function to withdraw a stuck asset on the contract.
	 * Only can be called by the admin.
     * @param asset Address of the asset.
     * @param destination Address of the destination.
     */
    function withdrawStuckAsset(address asset, address destination) onlyOwner public override {
        uint256 amount = ACOAssetHelper._getAssetBalanceOf(asset, address(this));
        if (amount > 0) {
            ACOAssetHelper._transferAsset(asset, destination, amount);
        }
    }
    
    /**
     * @dev Function to check if the contract has an aggregator.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
	 * @return True if an aggregator is set.
     */
    function hasAggregator(address baseAsset, address quoteAsset) public override view returns(bool) {
        (,PairData storage data) = _getPair(baseAsset, quoteAsset, false);
        return (data.aggregator != address(0));
    }
    
    /**
     * @dev Function to get the pair data
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
	 * @return Aggregator, aggregator precision, tolerance percentage, Uniswap middle route length.
     */
    function getPairData(address baseAsset, address quoteAsset) public override view returns(address, uint256, uint256, uint256) {
        (,PairData storage data) = _getPair(baseAsset, quoteAsset, false);
        return (data.aggregator, data.aggregatorPrecision, data.tolerancePercentage, data.uniswapMiddleRoute.length);
    }
    
    /**
     * @dev Function to get an Uniswap middle route token by array index.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
     * @param index Th array index.
	 * @return The Uniswap middle route token.
     */
    function getUniswapMiddleRouteByIndex(address baseAsset, address quoteAsset, uint256 index) public override view returns(address) {
        (bool reversed, PairData memory data) = _getPair(baseAsset, quoteAsset, false);
        if (reversed) {
            if (index >= data.uniswapMiddleRoute.length) {
                return address(0);
            } else {
                return data.uniswapMiddleRoute[(data.uniswapMiddleRoute.length - index - 1)];    
            }
        } else {
            return data.uniswapMiddleRoute[index];
        }
    }
    
	/**
     * @dev Function to get the price on the Oracle aggregator.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
	 * @return The price with the quote asset precision.
     */
    function getPrice(address baseAsset, address quoteAsset) public override view returns(uint256) {
        (uint256 price,) = _getAggregatorPriceAndTolerance(baseAsset, quoteAsset);  
        return price;
    }
    
	/**
     * @dev Function to get a price with tolerance.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
     * @param isMinimumPrice True if is the minimum price, otherwise is the maximum price.
	 * @return The price with a tolerance percentage and on quote asset precision.
     */
    function getPriceWithTolerance(address baseAsset, address quoteAsset, bool isMinimumPrice) public override view returns(uint256) {
        (uint256 price, uint256 tolerancePercentage) = _getAggregatorPriceAndTolerance(baseAsset, quoteAsset);
        return _getPriceWithTolerance(price, tolerancePercentage, isMinimumPrice);
    }
    
    /**
     * @dev Function to swap assets with the exact amount of asset to be sold.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToSold Amount to be sold.
	 * @return The amount of the asset purchased.
     */
    function swapExactAmountOut(address assetToSold, address assetToBuy, uint256 amountToSold) public payable override returns(uint256) {
        (bool reversed, PairData storage data) = _getPair(assetToSold, assetToBuy, true);
        return _swapExactAmountOut(assetToSold, assetToBuy, amountToSold, data.tolerancePercentage, reversed, data);
    }
    
    /**
     * @dev Function to swap assets with the exact amount of asset to be sold and specifying a tolerance percentage on Oracle.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToSold Amount to be sold.
     * @param tolerancePercentage Value of the tolerance percentage. (100% = 100000)
	 * @return The amount of the asset purchased.
     */
    function swapExactAmountOutWithSpecificTolerance(address assetToSold, address assetToBuy, uint256 amountToSold, uint256 tolerancePercentage) public payable override returns(uint256) {
        require(tolerancePercentage <= PERCENTAGE_PRECISION, "ACOAssetConverterHelper:: Invalid tolerance percentage");
        (bool reversed, PairData storage data) = _getPair(assetToSold, assetToBuy, true);
        return _swapExactAmountOut(assetToSold, assetToBuy, amountToSold, tolerancePercentage, reversed, data);
    }
    
    /**
     * @dev Function to swap assets with the exact amount of asset to be sold.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToSold Amount to be sold.
     * @param minAmountToReceive The minimum amount to receive.
	 * @return The amount of the asset purchased.
     */
    function swapExactAmountOutWithMinAmountToReceive(address assetToSold, address assetToBuy, uint256 amountToSold, uint256 minAmountToReceive) public payable override returns(uint256) {
        (bool reversed, PairData storage data) = _getPair(assetToSold, assetToBuy, false);
        _setAsset(assetToSold);
        return _swapExactAmountOutWithMinAmountToReceive(assetToSold, assetToBuy, amountToSold, minAmountToReceive, reversed, data.uniswapMiddleRoute);
    }
    
    /**
     * @dev Function to swap assets with the exact amount of asset to be purchased.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToBuy Amount to be purchased.
	 * @return The amount of the asset sold.
     */
    function swapExactAmountIn(address assetToSold, address assetToBuy, uint256 amountToBuy) public payable override returns(uint256) {
        (bool reversed, PairData storage data) = _getPair(assetToSold, assetToBuy, true);
        return _swapExactAmountIn(assetToSold, assetToBuy, amountToBuy, data.tolerancePercentage, reversed, data);
    }
    
    /**
     * @dev Function to swap assets with the exact amount of asset to be purchased and specifying a tolerance percentage on Oracle.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToBuy Amount to be purchased.
     * @param tolerancePercentage Value of the tolerance percentage. (100% = 100000)
	 * @return The amount of the asset sold.
     */
    function swapExactAmountInWithSpecificTolerance(address assetToSold, address assetToBuy, uint256 amountToBuy, uint256 tolerancePercentage) public payable override returns(uint256) {
        require(tolerancePercentage <= PERCENTAGE_PRECISION, "ACOAssetConverterHelper:: Invalid tolerance percentage");
        (bool reversed, PairData storage data) = _getPair(assetToSold, assetToBuy, true);
        return _swapExactAmountIn(assetToSold, assetToBuy, amountToBuy, tolerancePercentage, reversed, data);
    }
    
    /**
     * @dev Function to swap assets with the exact amount of asset to be purchased.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToBuy Amount to be purchased.
     * @param maxAmountToSold The maximum amount to be sold.
	 * @return The amount of the asset sold.
     */
    function swapExactAmountInWithMaxAmountToSold(address assetToSold, address assetToBuy, uint256 amountToBuy, uint256 maxAmountToSold) public payable override returns(uint256) {
        (bool reversed, PairData storage data) = _getPair(assetToSold, assetToBuy, false);
        _setAsset(assetToSold);
        return _swapExactAmountInWithMaxAmountToSold(assetToSold, assetToBuy, amountToBuy, maxAmountToSold, reversed, data.uniswapMiddleRoute);
    }
    
    /**
     * @dev Internal function to swap assets with the exact amount of asset to be purchased.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amount Amount to be purchased.
     * @param tolerancePercentage Value of the tolerance percentage. (100% = 100000)
     * @param reversed If the pairs are reversed.
     * @param data The pair data.
	 * @return The amount of the asset sold.
     */
    function _swapExactAmountIn(
        address assetToSold, 
        address assetToBuy, 
        uint256 amount, 
        uint256 tolerancePercentage,
        bool reversed,
        PairData storage data
    ) internal returns(uint256) {
        uint256 price = _getPriceWithTolerance(_getAggregatorPriceValue(assetToBuy, reversed, data), tolerancePercentage, false);
        uint256 maxAmountToSold = price.mul(amount).div(assetPrecision[assetToBuy]);
        
        return _swapExactAmountInWithMaxAmountToSold(assetToSold, assetToBuy, amount, maxAmountToSold, reversed, data.uniswapMiddleRoute);
    }
    
    /**
     * @dev Internal function to swap assets with the exact amount of asset to be purchased.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToBuy Amount to be purchased.
     * @param maxAmountToSold The maximum amount to be sold.
     * @param reversed If the pairs are reversed.
     * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
	 * @return The amount of the asset sold.
     */
    function _swapExactAmountInWithMaxAmountToSold(
        address assetToSold, 
        address assetToBuy, 
        uint256 amountToBuy, 
        uint256 maxAmountToSold,
        bool reversed,
        address[] storage uniswapMiddleRoute
    ) internal returns(uint256) {
        uint256 previousAmount = ACOAssetHelper._getAssetBalanceOf(assetToSold, address(this));
        
        ACOAssetHelper._receiveAsset(assetToSold, maxAmountToSold);

        _swapAssetsExactAmountIn(assetToSold, assetToBuy, amountToBuy, maxAmountToSold, reversed, uniswapMiddleRoute);
        
        uint256 afterAmount = ACOAssetHelper._getAssetBalanceOf(assetToSold, address(this));
        uint256 remaining = afterAmount.sub(previousAmount);
        if (remaining > 0) {
            ACOAssetHelper._transferAsset(assetToSold, msg.sender, remaining);
        }
        ACOAssetHelper._transferAsset(assetToBuy, msg.sender, amountToBuy);
        return maxAmountToSold.sub(remaining);
    }
    
    /**
     * @dev Internal function to swap assets with the exact amount of asset to be sold.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amount Amount to be sold.
     * @param tolerancePercentage Value of the tolerance percentage. (100% = 100000)
     * @param reversed If the pairs are reversed.
     * @param data The pair data.
	 * @return The amount of the asset purchased.
     */
    function _swapExactAmountOut(
        address assetToSold, 
        address assetToBuy, 
        uint256 amount, 
        uint256 tolerancePercentage,
        bool reversed,
        PairData storage data
    ) internal returns(uint256) {
        uint256 price = _getPriceWithTolerance(_getAggregatorPriceValue(assetToBuy, reversed, data), tolerancePercentage, true);
        uint256 minAmountToReceive = price.mul(amount).div(assetPrecision[assetToSold]);
        
        return _swapExactAmountOutWithMinAmountToReceive(assetToSold, assetToBuy, amount, minAmountToReceive, reversed, data.uniswapMiddleRoute);
    }
    
    /**
     * @dev Internal function to swap assets with the exact amount of asset to be sold.
     * @param assetToSold Address of the asset to be sold.
     * @param assetToBuy Address of the asset to be purchased.
     * @param amountToSold Amount to be sold.
     * @param minAmountToReceive The minimum amount to receive.
     * @param reversed If the pairs are reversed.
     * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
	 * @return The amount of the asset purchased.
     */
    function _swapExactAmountOutWithMinAmountToReceive(
        address assetToSold, 
        address assetToBuy, 
        uint256 amountToSold, 
        uint256 minAmountToReceive,
        bool reversed,
        address[] storage uniswapMiddleRoute
    ) internal returns(uint256) {
        ACOAssetHelper._receiveAsset(assetToSold, amountToSold);
        
        uint256 previousAmount = ACOAssetHelper._getAssetBalanceOf(assetToBuy, address(this));
        
        _swapAssetsExactAmountOut(assetToSold, assetToBuy, amountToSold, minAmountToReceive, reversed, uniswapMiddleRoute);
        
        uint256 afterAmount = ACOAssetHelper._getAssetBalanceOf(assetToBuy, address(this));
        uint256 purchased = afterAmount.sub(previousAmount);
        ACOAssetHelper._transferAsset(assetToBuy, msg.sender, purchased);
        return purchased;
    }
    
    /**
     * @dev Internal function to validate the addresses on the Uniswap middle route.
     * @param asset0 Address of a pair asset.
     * @param asset1 Address of another pair asset.
	 * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
     */
    function _validateUniswapMiddleRoute(address asset0, address asset1, address[] memory uniswapMiddleRoute) internal pure {
        for (uint256 i = 0; i < uniswapMiddleRoute.length; ++i) {
            address asset = uniswapMiddleRoute[i];
            require(asset0 != asset && asset1 != asset, "ACOAssetConverterHelper:: Invalid middle route");
            for (uint256 j = i+1; j < uniswapMiddleRoute.length; ++j) {
                require(asset != uniswapMiddleRoute[j], "ACOAssetConverterHelper:: Invalid middle route");
            }
        }
    }
    
    /**
     * @dev Function to get a price with tolerance.
     * @param price Oracle price value.
     * @param tolerancePercentage Value of the tolerance percentage.
     * @param isMinimumPrice True if is the minimum price, otherwise is the maximum price.
	 * @return The price with a tolerance percentage.
     */
    function _getPriceWithTolerance(uint256 price, uint256 tolerancePercentage, bool isMinimumPrice) internal pure returns(uint256) {
        if (isMinimumPrice) {
            return price.mul(PERCENTAGE_PRECISION.sub(tolerancePercentage)).div(PERCENTAGE_PRECISION);
        } else {
            return price.mul(PERCENTAGE_PRECISION.add(tolerancePercentage)).div(PERCENTAGE_PRECISION);    
        }
    }
    
	/**
     * @dev Internal function to get the pair data.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
     * @param validateAggregatorExistence True if an exception should be thrown and the pair aggregator does not exist.
	 * @return If the assets are reversed and the pair data.
     */
    function _getPair(address baseAsset, address quoteAsset, bool validateAggregatorExistence) internal view returns(bool, PairData storage) {
        PairData storage data = pairs[baseAsset][quoteAsset];
        if (data.initialized) {
			require(!validateAggregatorExistence || data.aggregator != address(0), "ACOAssetConverterHelper:: No aggregator");
            return (false, data);
        } else {
			PairData storage data2 = pairs[quoteAsset][baseAsset];
			require(!validateAggregatorExistence || data2.aggregator != address(0), "ACOAssetConverterHelper:: No aggregator");
			return (data2.initialized, data2);
		}
    }
    
    /**
     * @dev Internal function to get the price on the Oracle aggregator.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
	 * @return The price with the quote asset precision and the oracle tolerance percentage.
     */
    function _getAggregatorPriceAndTolerance(address baseAsset, address quoteAsset) internal view returns(uint256, uint256) {
        (bool reversed, PairData storage data) = _getPair(baseAsset, quoteAsset, true);
        uint256 price = _getAggregatorPriceValue(quoteAsset, reversed, data);
        return (price, data.tolerancePercentage);
    }
    
    /**
     * @dev Internal function to get the price value on the Oracle aggregator.
     * @param quoteAsset Address of the quote asset.
     * @param reversed Assets are reversed on the aggregator.
     * @param data Pair data.
	 * @return The price with the quote asset precision.
     */
    function _getAggregatorPriceValue(address quoteAsset, bool reversed, PairData storage data) internal view returns(uint256) {
        (,int256 answer,,,) = AggregatorV3Interface(data.aggregator).latestRoundData();
        
        uint256 _aggregatorPrecision = data.aggregatorPrecision;
        uint256 _assetPrecision = assetPrecision[quoteAsset];
        
        if (reversed) {
            return _aggregatorPrecision.mul(_assetPrecision).div(uint256(answer));
        } else if (_aggregatorPrecision > _assetPrecision) {
            return uint256(answer).div(_aggregatorPrecision.div(_assetPrecision));
        } else {
            return uint256(answer).mul(_assetPrecision).div(_aggregatorPrecision);
        }
    }
	
	/**
     * @dev Internal function to create a pair data.
     * @param baseAsset Address of the base asset.
     * @param quoteAsset Address of the quote asset.
	 * @param aggregator Address of the Oracle aggregator.
	 * @param aggregatorPrecision Value of the aggregator precision.
     * @param tolerancePercentage Value of the tolerance percentage.
     * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
     */
	function _createPair(
	    address baseAsset,
	    address quoteAsset,
	    address aggregator, 
	    uint256 aggregatorPrecision,
	    uint256 tolerancePercentage, 
	    address[] memory uniswapMiddleRoute
    ) internal {
        require(baseAsset != quoteAsset, "ACOAssetConverterHelper:: Invalid assets");
        require(ACOAssetHelper._isEther(baseAsset) || baseAsset.isContract(), "ACOAssetConverterHelper:: Invalid base asset");
        require(ACOAssetHelper._isEther(quoteAsset) || quoteAsset.isContract(), "ACOAssetConverterHelper:: Invalid quote asset");
        
        _setAsset(baseAsset);
        _setAsset(quoteAsset);
        
        pairs[baseAsset][quoteAsset] = PairData(true, aggregator, aggregatorPrecision, tolerancePercentage, uniswapMiddleRoute);
    }
	
	/**
     * @dev Internal function to set the asset precision and authorize the Uniswap V2 router. (6 decimals = 1000000)
     * @param asset Address of the asset.
     */
    function _setAsset(address asset) internal {
        if (assetPrecision[asset] == 0) {
            uint256 decimals = ACOAssetHelper._getAssetDecimals(asset);
            assetPrecision[asset] = (10 ** decimals);
            if (!ACOAssetHelper._isEther(asset)) {
                ACOAssetHelper._callApproveERC20(asset, address(uniswapRouter), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
            }
        }
    }
    
	/**
     * @dev Internal function to get Uniswap V2 router path.
     * @param assetOut Address of the asset to be sold.
	 * @param assetIn Address of the asset to be purchased.
     * @param reversed If the pairs are reversed.
     * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
     * @return The Uniswap V2 router path.
     */
	function _getUniswapRouterPath(address assetOut, address assetIn, bool reversed, address[] storage uniswapMiddleRoute) internal view returns(address[] memory) {
        address[] memory path = new address[](2 + uniswapMiddleRoute.length);
        address end;
        if (ACOAssetHelper._isEther(assetOut)) {
            path[0] = WETH;
            end = assetIn;
        } else if (ACOAssetHelper._isEther(assetIn)) {
            path[0] = assetOut;
            end = WETH;
        } else {
            path[0] = assetOut;
            end = assetIn;
        }
        uint256 index = 1;
        uint256 i = (uniswapMiddleRoute.length > 0 && reversed ? (uniswapMiddleRoute.length - 1) : 0);
        while (i < uniswapMiddleRoute.length && i >= 0) {
            path[index] = uniswapMiddleRoute[i];
            if (reversed) {
                --i;
            } else {
                ++i;
            }
            ++index;
        }
        path[index] = end;
        return path;
	}
	
    /**
     * @dev Internal function to swap assets on the Uniswap V2 with an exact amount of an asset to be sold.
     * @param assetOut Address of the asset to be sold.
	 * @param assetIn Address of the asset to be purchased.
     * @param amountOut The exact amount to be sold.
     * @param minAmountIn Minimum amount to be received.
     * @param reversed If the pairs are reversed.
     * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
     */
    function _swapAssetsExactAmountOut(
        address assetOut, 
        address assetIn, 
        uint256 amountOut, 
        uint256 minAmountIn,
        bool reversed,
        address[] storage uniswapMiddleRoute
    ) internal {
        address[] memory path = _getUniswapRouterPath(assetOut, assetIn, reversed, uniswapMiddleRoute);
        if (ACOAssetHelper._isEther(assetOut)) {
            uniswapRouter.swapExactETHForTokens{value: amountOut}(minAmountIn, path, address(this), block.timestamp);
        } else if (ACOAssetHelper._isEther(assetIn)) {
            uniswapRouter.swapExactTokensForETH(amountOut, minAmountIn, path, address(this), block.timestamp);
        } else {
            uniswapRouter.swapExactTokensForTokens(amountOut, minAmountIn, path, address(this), block.timestamp);
        }
    }
    
    /**
     * @dev Internal function to swap assets on the Uniswap V2 with an exact amount of an asset to be purchased.
     * @param assetOut Address of the asset to be sold.
	 * @param assetIn Address of the asset to be purchased.
     * @param amountIn The exact amount to be purchased.
     * @param maxAmountOut Maximum amount to be paid.
     * @param reversed If the pairs are reversed.
     * @param uniswapMiddleRoute Addresses of Uniswap middle route for a swap.
     */
    function _swapAssetsExactAmountIn(
        address assetOut, 
        address assetIn, 
        uint256 amountIn, 
        uint256 maxAmountOut, 
        bool reversed,
        address[] storage uniswapMiddleRoute
    ) internal {
        address[] memory path = _getUniswapRouterPath(assetOut, assetIn, reversed, uniswapMiddleRoute);
        if (ACOAssetHelper._isEther(assetOut)) {
            uniswapRouter.swapETHForExactTokens{value: maxAmountOut}(amountIn, path, address(this), block.timestamp);
        } else if (ACOAssetHelper._isEther(assetIn)) {
            uniswapRouter.swapTokensForExactETH(amountIn, maxAmountOut, path, address(this), block.timestamp);
        } else {
            uniswapRouter.swapTokensForExactTokens(amountIn, maxAmountOut, path, address(this), block.timestamp);
        }
    }
}