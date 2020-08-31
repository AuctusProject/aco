pragma solidity ^0.6.6;

import '../../util/Ownable.sol';
import '../../util/ACOHelper.sol';
import '../../libs/SafeMath.sol';
import '../../libs/Address.sol';
import '../../libs/ACONameFormatter.sol';
import '../../interfaces/IACOFactory.sol';
import '../../interfaces/IACOStrategy.sol';
import '../../interfaces/IACOToken.sol';
import '../../interfaces/IACOFlashExercise.sol';
import '../../interfaces/IUniswapV2Router02.sol';

contract ACOPool is Ownable, ACOHelper {
    using Address for address;
    using SafeMath for uint256;
    
    struct ACOTokenData {
        uint256 amountSold;
        uint256 amountPurchased;
        bool redeemed;
    }
    
    event SetStrategy(address indexed strategy, address indexed newStrategy);
    event SetBaseVolatility(uint256 indexed baseVolatility, uint256 indexed newBaseVolatility);
    event CollateralDeposited(address indexed account, uint256 amount);
    event Redeem(address indexed account, uint256 underlyingAmount, uint256 strikeAssetAmount);
    event Swap(
        bool indexed isPoolSelling, 
        address indexed account, 
        address indexed acoToken, 
        uint256 tokenAmount, 
        uint256 price, 
        uint256 volatility
    );
    
    uint256 public poolStart;
    IACOFlashExercise public acoFlashExercise;
    IACOFactory public acoFactory;
    address public underlying;
    address public strikeAsset;
    uint256 public minStrikePrice;
    uint256 public maxStrikePrice;
    uint256 public minExpiration;
    uint256 public maxExpiration;
    bool public isCall;
    bool public canBuy;
    uint256 public tolerancePercentageToOraclePrice;
    uint256 public minimumTimeInMinutesToExerciseAnyProfit;
    uint256 public minimumProfitToExerciseAnyTime;
    
    IACOStrategy public strategy;
    uint256 public baseVolatility;
    
    uint256 collateralDeposited;
    int256 tradeProfit;
    
    address[] public acoTokens;
    mapping(address => ACOTokenData) public acoTokensData;
    
    mapping(address => uint256) public deposits;
    
    modifier open() {
        require(_isStarted() && _notFinished(), "ACOPool:: Pool is not open");
        _;
    }
    
    function init(
        uint256 _poolStart,
        address _acoFlashExercise,
        address _acoFactory,
        address _underlying, 
        address _strikeAsset, 
        uint256 _minStrikePrice, 
        uint256 _maxStrikePrice,
        uint256 _minExpiration,
        uint256 _maxExpiration, 
        bool _isCall, 
        bool _canBuy,
        uint256 _tolerancePercentageToOraclePrice,
        uint256 _minimumTimeInMinutesToExerciseAnyProfit,
        uint256 _minimumProfitToExerciseAnyTime
    ) public {
        require(_underlying == address(0) && _strikeAsset == address(0) && _minExpiration == 0, "ACOPool::init: Already initialized");
        
        require(_poolStart > block.timestamp, "ACOPool:: Invalid pool start");
        require(_minExpiration > block.timestamp, "ACOPool:: Invalid expiration");
        require(_minStrikePrice <= _maxStrikePrice, "ACOPool:: Invalid strike price range");
        require(_maxStrikePrice > 0, "ACOPool:: Invalid strike price");
        require(_minExpiration <= _maxExpiration, "ACOPool:: Invalid expiration range");
        require(_underlying != _strikeAsset, "ACOPool:: Same assets");
        require(_isEther(_underlying) || _underlying.isContract(), "ACOPool:: Invalid underlying");
        require(_isEther(_strikeAsset) || _strikeAsset.isContract(), "ACOPool:: Invalid strike asset");
        require(_tolerancePercentageToOraclePrice <= PERCENTAGE_PRECISION, "ACOPool:: Invalid tolerance percentage");
        
        poolStart = _poolStart;
        acoFlashExercise = IACOFlashExercise(_acoFlashExercise);
        acoFactory = IACOFactory(_acoFactory);
        underlying = _underlying;
        strikeAsset = _strikeAsset;
        minStrikePrice = _minStrikePrice;
        maxStrikePrice = _maxStrikePrice;
        minExpiration = _minExpiration;
        maxExpiration = _maxExpiration;
        isCall = _isCall;
        canBuy = _canBuy;
        tolerancePercentageToOraclePrice = _tolerancePercentageToOraclePrice;
        minimumTimeInMinutesToExerciseAnyProfit = _minimumTimeInMinutesToExerciseAnyProfit;
        minimumProfitToExerciseAnyTime = _minimumProfitToExerciseAnyTime;
    }
    
    function name() public view returns(string memory) {
        return _name();
    }
    
    function numberOfACOTokensNegotiated() public view returns(uint256) {
        return acoTokens.length;
    }
    
    function collateral() public view returns(address) {
        if (isCall) {
            return underlying;
        } else {
            return strikeAsset;
        }
    }
    
    function quote(bool isBuying, address acoToken, uint256 tokenAmount) open public view returns(uint256, uint256) {
        (uint256 price, uint256 volatility,) = _internalQuote(isBuying, acoToken, tokenAmount);
        return (price, volatility);
    }
    
    function getEstimatedReturnOnExercise(address acoToken) public view returns(uint256) {
        uint256 exercisableAmount = _getExercisableAmount(acoToken);
        if (exercisableAmount > 0) {
            return acoFlashExercise.getEstimatedReturn(acoToken, exercisableAmount);
        }
        return 0;
    }
    
    function setStrategy(address newStrategy) onlyOwner public {
        require(newStrategy.isContract(), "ACOPool:: Invalid strategy");
        emit SetStrategy(address(strategy), newStrategy);
        strategy = IACOStrategy(newStrategy);
    }
    
    function setBaseVolatility(uint256 newBaseVolatility) onlyOwner public {
        require(newBaseVolatility > 0, "ACOPool:: Invalid base volatility");
        emit SetBaseVolatility(baseVolatility, newBaseVolatility);
        baseVolatility = newBaseVolatility;
    }
    
    function deposit(uint256 collateralAmount) public payable {
        require(!_isStarted(), "ACOPool:: Pool already started");
        
        _receiveAsset(collateral(), collateralAmount);
        
        deposits[msg.sender] = deposits[msg.sender].add(collateralAmount);
        collateralDeposited = collateralDeposited.add(collateralAmount);
        
        emit CollateralDeposited(msg.sender, collateralAmount);
    }
    
    function redeem() public returns(uint256, uint256) {
        require(deposits[msg.sender] > 0, "ACOPool:: No data");
        require(!_notFinished(), "ACOPool:: Pool is not expired yet");
        
        redeemACOTokens();
        
        uint256 underlyingBalance = _getAssetBalanceOf(underlying, address(this)).mul(deposits[msg.sender]).div(collateralDeposited);
        uint256 strikeAssetBalance = _getAssetBalanceOf(strikeAsset, address(this)).mul(deposits[msg.sender]).div(collateralDeposited);
        
        delete deposits[msg.sender];
        if (underlyingBalance > 0) {
            _transferAsset(underlying, msg.sender, underlyingBalance);
        }
        if (strikeAssetBalance > 0) {
            _transferAsset(strikeAsset, msg.sender, strikeAssetBalance);
        }
        
        emit Redeem(msg.sender, underlyingBalance, strikeAssetBalance);
        
        return (underlyingBalance, strikeAssetBalance);
    }
    
    function redeemACOTokens() public {
        for (uint256 i = 0; i < acoTokens.length; ++i) {
            if (!acoTokensData[acoTokens[i]].redeemed) {
                (,uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoTokens[i]);
                if (expiryTime <= block.timestamp) {
                    IACOToken(acoTokens[i]).redeem();
                    acoTokensData[acoTokens[i]].redeemed = true;
                }
            }
        }
    }
    
    function swap(bool isBuying, address acoToken, uint256 tokenAmount, uint256 restriction) open public returns(uint256) {
        (uint256 price, uint256 volatility, uint256 collateralAmount) = _internalQuote(isBuying, acoToken, tokenAmount);
        uint256 amount;
        if (isBuying) {
            amount = _internalSelling(acoToken, collateralAmount, restriction, price);
        } else {
            amount = _internalBuying(acoToken, tokenAmount, restriction, price);
        }
        emit Swap(isBuying, msg.sender, acoToken, tokenAmount, price, volatility);
        return amount;
    }
    
    function exerciseACOToken(address acoToken) public {
        (uint256 strikePrice, uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
        uint256 exercisableAmount = _getExercisableAmount(acoToken);
        require(exercisableAmount > 0, "ACOPool:: Exercise is not available");
        
        uint256 acceptablePrice = _getAcceptablePrice(strategy.getUnderlyingPrice(underlying, strikeAsset), isCall);
        require((isCall && acceptablePrice > strikePrice) || (!isCall && acceptablePrice < strikePrice), "ACOPool:: Not profitable");
            
        uint256 minCollateral;
        if (block.timestamp > expiryTime && block.timestamp.sub(expiryTime) <= minimumTimeInMinutesToExerciseAnyProfit.mul(60)) {
            minCollateral = 1;
        } else if (isCall) {
            minCollateral = exercisableAmount.add(exercisableAmount.mul(minimumProfitToExerciseAnyTime).div(PERCENTAGE_PRECISION));
        } else {
            uint256 collateralAmount = IACOToken(acoToken).getCollateralAmount(exercisableAmount);
            minCollateral = collateralAmount.mul(PERCENTAGE_PRECISION.add(minimumProfitToExerciseAnyTime)).div(PERCENTAGE_PRECISION);
        }
        
        if (IACOToken(acoToken).allowance(address(this), address(acoFlashExercise)) < exercisableAmount) {
            _callApproveERC20(acoToken, address(acoFlashExercise), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);    
        }
        acoFlashExercise.flashExercise(acoToken, exercisableAmount, minCollateral, block.timestamp);
    }
    
    function _internalQuote(bool isBuying, address acoToken, uint256 tokenAmount) public view returns(uint256, uint256, uint256) {
        require(!isBuying || canBuy, "ACOPool:: The pool only sell");
        require(tokenAmount > 0, "ACOPool:: Invalid token amount");
        (uint256 strikePrice, uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
        require(expiryTime < block.timestamp, "ACOPool:: ACO token expired");
        
        (uint256 collateralAmount, uint256 collateralAvailable) = _getWeightData(acoToken, tokenAmount);
        (uint256 price, uint256 volatility) = _strategyQuote(acoToken, isBuying, strikePrice, expiryTime, collateralAmount, collateralAvailable);
        require(price > 0, "ACOPool:: Price is not defined");
        return (price, volatility, collateralAmount);
    }
    
    function _getWeightData(address acoToken, uint256 tokenAmount) internal view returns(uint256, uint256) {
        uint256 collateralAmount;
        uint256 collateralAvailable;
        if (isCall) {
            collateralAvailable = _getAssetBalanceOf(underlying, address(this));
            collateralAmount = tokenAmount; 
        } else {
            collateralAvailable = _getAssetBalanceOf(strikeAsset, address(this));
            collateralAmount = IACOToken(acoToken).getCollateralAmount(tokenAmount);
            require(collateralAmount > 0, "ACOPool:: Token amount is too small");
        }
        require(collateralAmount <= collateralAvailable, "ACOPool:: Insufficient liquidity");
        
        return (collateralAmount, collateralAvailable);
    }
    
    function _strategyQuote(
        address acoToken,
        bool isBuying,
        uint256 strikePrice,
        uint256 expiryTime,
        uint256 collateralAmount,
        uint256 collateralAvailable
    ) internal view returns(uint256, uint256) {
        ACOTokenData storage data = acoTokensData[acoToken];
        return strategy.quote(isBuying, 
            underlying, 
            strikeAsset, 
            isCall, 
            strikePrice, 
            expiryTime, 
            baseVolatility, 
            collateralAmount, 
            collateralAvailable,
            collateralDeposited,
            data.amountPurchased,
            data.amountSold
        );
    }
    
    function _internalSelling(
        address acoToken, 
        uint256 collateralAmount, 
        uint256 maxPayment,
        uint256 price
    ) internal returns(uint256) {
        require(price <= maxPayment, "ACOPool:: Swap restriction");
        
        _callTransferFromERC20(strikeAsset, msg.sender, address(this), price);
        
        uint256 tokenAmount = IACOToken(acoToken).getTokenAmount(collateralAmount);
        uint256 acoBalance = IACOToken(acoToken).balanceOf(address(this));

        ACOTokenData storage acoTokenData = acoTokensData[acoToken];
        if (tokenAmount > acoBalance) {
            if (acoBalance > 0) {
                collateralAmount = IACOToken(acoToken).getCollateralAmount(tokenAmount.sub(acoBalance));
                tokenAmount = acoBalance.add(IACOToken(acoToken).getTokenAmount(collateralAmount));
            }
            if (collateralAmount > 0) {
                if (isCall) {
                    IACOToken(acoToken).mintPayable{value: collateralAmount}();
                } else {
                    if (acoTokenData.amountSold == 0) {
                        _callApproveERC20(strikeAsset, acoToken, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);    
                    }
                    IACOToken(acoToken).mint(collateralAmount);
                }
            }
        }
        
        acoTokenData.amountSold = acoTokenData.amountSold.add(tokenAmount);
        tradeProfit += int256(price); 
        
        _callTransferERC20(acoToken, msg.sender, tokenAmount);
        
        return tokenAmount;
    }
    
    function _internalBuying(
        address acoToken, 
        uint256 tokenAmount, 
        uint256 minToReceive,
        uint256 price
    ) internal returns(uint256) {
        require(price >= minToReceive, "ACOPool:: Swap restriction");
        
        if (isCall) {
            _buyStrikeAsset(price);
        }
        
        _callTransferFromERC20(acoToken, msg.sender, address(this), tokenAmount);
        
        ACOTokenData storage acoTokenData = acoTokensData[acoToken];
        acoTokenData.amountPurchased = acoTokenData.amountPurchased.add(tokenAmount);
        tradeProfit -= int256(price); 
        
        _transferAsset(strikeAsset, msg.sender, price);
        
        return price;
    }
    
    function _getUniswapAsset(address asset) internal view returns(address) {
        if (_isEther(asset)) {
            return acoFlashExercise.weth();
        } else {
            return asset;
        }
    }
    
    function _buyStrikeAsset(uint256 strikeAssetAmount) internal {
        uint256 acceptablePrice = _getAcceptablePrice(strategy.getUnderlyingPrice(underlying, strikeAsset), false);
        uint256 maxPayment = strikeAssetAmount.mul(10 ** uint256(_getAssetDecimals(underlying))).div(acceptablePrice);
        IUniswapV2Router02 router = IUniswapV2Router02(acoFlashExercise.uniswapRouter());
        address[] memory path = new address[](2);
        path[0] = _getUniswapAsset(underlying);
        path[1] = _getUniswapAsset(strikeAsset);
        router.swapTokensForExactTokens(strikeAssetAmount, maxPayment, path, address(this), block.timestamp);
    }
    
    function _getAcceptablePrice(uint256 underlyingPrice, bool isMaximumAcceptable) internal view returns(uint256) {
        if (isMaximumAcceptable) {
            return underlyingPrice.mul(PERCENTAGE_PRECISION.add(tolerancePercentageToOraclePrice)).div(PERCENTAGE_PRECISION);
        } else {
            return underlyingPrice.mul(PERCENTAGE_PRECISION.sub(tolerancePercentageToOraclePrice)).div(PERCENTAGE_PRECISION);
        }
    }
    
    function _getExercisableAmount(address acoToken) internal view returns(uint256) {
        uint256 balance = IACOToken(acoToken).balanceOf(address(this));
        if (balance > 0) {
            uint256 collaterized = IACOToken(acoToken).currentCollateralizedTokens(address(this));
            if (balance > collaterized) {
                return balance.sub(collaterized);
            }
        }
        return 0;
    }
    
    function _isStarted() internal view returns(bool) {
        return block.timestamp >= poolStart && baseVolatility > 0 && address(strategy) != address(0);
    }
    
    function _notFinished() internal view returns(bool) {
        return block.timestamp < maxExpiration;
    }
    
    function _getValidACOTokenStrikePriceAndExpiration(address acoToken) internal view returns(uint256, uint256) {
        (address _underlying, address _strikeAsset, bool _isCall, uint256 _strikePrice, uint256 _expiryTime) = acoFactory.acoTokenData(acoToken);
        require(
            underlying == _underlying && 
            strikeAsset == _strikeAsset && 
            isCall == _isCall && 
            _strikePrice >= minStrikePrice &&
            _strikePrice <= maxStrikePrice &&
            _expiryTime >= minExpiration &&
            _expiryTime <= maxExpiration,
            "ACOPool::Invalid ACO Token"
        );
        return (_strikePrice, _expiryTime);
    }
     
    function _name() internal view returns(string memory) {
        uint8 strikeDecimals = _getAssetDecimals(strikeAsset);
        string memory strikePriceFormatted;
        if (minStrikePrice != maxStrikePrice) {
            strikePriceFormatted = string(abi.encodePacked(ACONameFormatter.formatNumber(minStrikePrice, strikeDecimals), "-", ACONameFormatter.formatNumber(maxStrikePrice, strikeDecimals)));
        } else {
            strikePriceFormatted = ACONameFormatter.formatNumber(minStrikePrice, strikeDecimals);
        }
        string memory dateFormatted;
        if (minExpiration != maxExpiration) {
            dateFormatted = string(abi.encodePacked(ACONameFormatter.formatTime(minExpiration), "-", ACONameFormatter.formatTime(maxExpiration)));
        } else {
            dateFormatted = ACONameFormatter.formatTime(minExpiration);
        }
        return string(abi.encodePacked(
            "ACO POOL ",
            _getAssetSymbol(underlying),
            "-",
            _getAssetSymbol(strikeAsset),
            "-",
            ACONameFormatter.formatType(isCall),
            (canBuy ? "" : "-SELL"),
            "-",
            strikePriceFormatted,
            "-",
            dateFormatted
        ));
    }
}