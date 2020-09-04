pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../util/Ownable.sol';
import '../../util/ACOHelper.sol';
import '../../libs/SafeMath.sol';
import '../../libs/Address.sol';
import '../../libs/ACONameFormatter.sol';
import '../../core/ERC20.sol';
import '../../interfaces/IACOPool.sol';
import '../../interfaces/IACOFactory.sol';
import '../../interfaces/IACOStrategy.sol';
import '../../interfaces/IACOToken.sol';
import '../../interfaces/IACOFlashExercise.sol';
import '../../interfaces/IUniswapV2Router02.sol';


contract ACOPool is Ownable, ACOHelper, ERC20, IACOPool {
    using Address for address;
    using SafeMath for uint256;
    
    uint256 internal constant POOL_PRECISION = 1000000000000000000;
    
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
        uint256 underlyingPrice,
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
    
    IACOStrategy public strategy;
    uint256 public baseVolatility;
    
    uint256 public collateralDeposited;
    uint256 public strikeAssetSpentBuying;
    uint256 public strikeAssetEarnedSelling;
    
    address[] public acoTokens;
    mapping(address => ACOTokenData) public acoTokensData;
    
    uint256 internal underlyingPrecision;
    uint256 internal strikeAssetPrecision;
    
    modifier open() {
        require(_isStarted() && _notFinished(), "ACOPool:: Pool is not open");
        _;
    }
    
    function init(InitData calldata initData) external override {
        require(underlying == address(0) && strikeAsset == address(0) && minExpiration == 0, "ACOPool::init: Already initialized");
        
        require(initData.acoFactory.isContract(), "ACOPool:: ACO Factory");
        require(initData.acoFlashExercise.isContract(), "ACOPool:: ACO flash exercise");
        require(initData.poolStart > block.timestamp, "ACOPool:: Invalid pool start");
        require(initData.minExpiration > block.timestamp, "ACOPool:: Invalid expiration");
        require(initData.minStrikePrice <= initData.maxStrikePrice, "ACOPool:: Invalid strike price range");
        require(initData.minStrikePrice > 0, "ACOPool:: Invalid strike price");
        require(initData.minExpiration <= initData.maxExpiration, "ACOPool:: Invalid expiration range");
        require(initData.underlying != initData.strikeAsset, "ACOPool:: Same assets");
        require(_isEther(initData.underlying) || initData.underlying.isContract(), "ACOPool:: Invalid underlying");
        require(_isEther(initData.strikeAsset) || initData.strikeAsset.isContract(), "ACOPool:: Invalid strike asset");
        
        poolStart = initData.poolStart;
        acoFlashExercise = IACOFlashExercise(initData.acoFlashExercise);
        acoFactory = IACOFactory(initData.acoFactory);
        underlying = initData.underlying;
        strikeAsset = initData.strikeAsset;
        minStrikePrice = initData.minStrikePrice;
        maxStrikePrice = initData.maxStrikePrice;
        minExpiration = initData.minExpiration;
        maxExpiration = initData.maxExpiration;
        isCall = initData.isCall;
        canBuy = initData.canBuy;
        
        _setStrategy(initData.strategy);
        _setBaseVolatility(initData.baseVolatility);
        
        _setAssetsPrecision(initData.underlying, initData.strikeAsset);
    }
    
    function name() public view override returns(string memory) {
        return _name();
    }
    
    function symbol() public view override returns(string memory) {
        return _name();
    }
    
    function decimals() public view override returns(uint8) {
        return 18;
    }
    
    function numberOfACOTokensNegotiated() public override view returns(uint256) {
        return acoTokens.length;
    }
    
    function collateral() public override view returns(address) {
        if (isCall) {
            return underlying;
        } else {
            return strikeAsset;
        }
    }
    
    function quote(bool isBuying, address acoToken, uint256 tokenAmount) open public override view returns(uint256, uint256, uint256) {
        (uint256 price, uint256 underlyingPrice, uint256 volatility,) = _internalQuote(isBuying, acoToken, tokenAmount);
        return (price, underlyingPrice, volatility);
    }
    
    function getEstimatedReturnOnExercise(address acoToken) open public override view returns(uint256) {
        uint256 exercisableAmount = _getExercisableAmount(acoToken);
        if (exercisableAmount > 0) {
            return acoFlashExercise.getEstimatedReturn(acoToken, exercisableAmount);
        }
        return 0;
    }
    
    function setStrategy(address newStrategy) onlyOwner external override {
        _setStrategy(newStrategy);
    }
    
    function setBaseVolatility(uint256 newBaseVolatility) onlyOwner external override {
        _setBaseVolatility(newBaseVolatility);
    }

    function deposit(uint256 collateralAmount) public payable {
        require(!_isStarted(), "ACOPool:: Pool already started");
        require(collateralAmount > 0, "ACOPool:: Invalid collateral amount");
        
        (uint256 normalizedAmount, uint256 amount) = _getNormalizedDepositAmount(collateralAmount);
        
        _receiveAsset(collateral(), amount);
        
        collateralDeposited = collateralDeposited.add(amount);
        _mintAction(msg.sender, normalizedAmount);
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    function redeem() public returns(uint256, uint256) {
        uint256 share = balanceOf(msg.sender);
        require(share > 0, "ACOPool:: No data");
        require(!_notFinished(), "ACOPool:: Pool is not finished");
        
        redeemACOTokens();
        
        uint256 _totalSupply = totalSupply();
        uint256 underlyingBalance = _getAssetBalanceOf(underlying, address(this)).mul(share).div(_totalSupply);
        uint256 strikeAssetBalance = _getAssetBalanceOf(strikeAsset, address(this)).mul(share).div(_totalSupply);
        
        _burnAction(msg.sender, share);
        
        if (underlyingBalance > 0) {
            _transferAsset(underlying, msg.sender, underlyingBalance);
        }
        if (strikeAssetBalance > 0) {
            _transferAsset(strikeAsset, msg.sender, strikeAssetBalance);
        }
        
        emit Redeem(msg.sender, underlyingBalance, strikeAssetBalance);
        
        return (underlyingBalance, strikeAssetBalance);
    }
    
    function redeemACOTokens() public override {
        for (uint256 i = 0; i < acoTokens.length; ++i) {
            if (!acoTokensData[acoTokens[i]].redeemed) {
                uint256 expiryTime = IACOToken(acoTokens[i]).expiryTime();
                if (expiryTime <= block.timestamp) {
                    IACOToken(acoTokens[i]).redeem();
                    acoTokensData[acoTokens[i]].redeemed = true;
                }
            }
        }
    }
    
    function swap(bool isBuying, address acoToken, uint256 tokenAmount, uint256 restriction) open public override returns(uint256) {
        (uint256 price, uint256 underlyingPrice, uint256 volatility, uint256 collateralAmount) = _internalQuote(isBuying, acoToken, tokenAmount);
        uint256 amount;
        if (isBuying) {
            amount = _internalSelling(acoToken, collateralAmount, tokenAmount, restriction, price);
        } else {
            amount = _internalBuying(acoToken, tokenAmount, restriction, price);
        }
        emit Swap(isBuying, msg.sender, acoToken, tokenAmount, price, underlyingPrice, volatility);
        return amount;
    }
    
    function exerciseACOToken(address acoToken) public override {
        (uint256 strikePrice, uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
        uint256 exercisableAmount = _getExercisableAmount(acoToken);
        require(exercisableAmount > 0, "ACOPool:: Exercise is not available");
        
        uint256 collateralAmount = isCall ? exercisableAmount : IACOToken(acoToken).getCollateralAmount(exercisableAmount);
        
        ACOTokenData storage data = acoTokensData[acoToken];
        (bool canExercise, uint256 minIntrinsicValue) = strategy.checkExercise(IACOStrategy.CheckExercise(
            underlying,
            strikeAsset,
            isCall,
            strikePrice, 
            expiryTime,
            collateralAmount,
            _getAssetBalanceOf(collateral(), address(this)),
            data.amountPurchased,
            data.amountSold
        ));
        require(canExercise, "ACOPool:: Exercise is not authorized");
        
        if (IACOToken(acoToken).allowance(address(this), address(acoFlashExercise)) < exercisableAmount) {
            _callApproveERC20(acoToken, address(acoFlashExercise), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);    
        }
        acoFlashExercise.flashExercise(acoToken, exercisableAmount, minIntrinsicValue, block.timestamp);
    }
    
    function _internalQuote(bool isBuying, address acoToken, uint256 tokenAmount) internal view returns(uint256, uint256, uint256, uint256) {
        require(!isBuying || canBuy, "ACOPool:: The pool only sell");
        require(tokenAmount > 0, "ACOPool:: Invalid token amount");
        (uint256 strikePrice, uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
        require(expiryTime < block.timestamp, "ACOPool:: ACO token expired");
        
        (uint256 collateralAmount, uint256 collateralAvailable) = _getWeightData(acoToken, tokenAmount);
        (uint256 price, uint256 underlyingPrice, uint256 volatility) = _strategyQuote(acoToken, isBuying, strikePrice, expiryTime, collateralAmount, collateralAvailable);
        return (price, underlyingPrice, volatility, collateralAmount);
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
    ) internal view returns(uint256, uint256, uint256) {
        ACOTokenData storage data = acoTokensData[acoToken];
        return strategy.quote(IACOStrategy.OptionQuote(
            isBuying, 
            underlying, 
            strikeAsset, 
            isCall, 
            strikePrice, 
            expiryTime, 
            baseVolatility, 
            collateralAmount, 
            collateralAvailable,
            collateralDeposited,
            strikeAssetEarnedSelling,
            strikeAssetSpentBuying,
            data.amountPurchased,
            data.amountSold
        ));
    }
    
    function _internalSelling(
        address acoToken, 
        uint256 collateralAmount, 
        uint256 tokenAmount,
        uint256 maxPayment,
        uint256 price
    ) internal returns(uint256) {
        require(price <= maxPayment, "ACOPool:: Swap restriction");
        
        _callTransferFromERC20(strikeAsset, msg.sender, address(this), price);
        
        uint256 acoBalance = IACOToken(acoToken).balanceOf(address(this));

        ACOTokenData storage acoTokenData = acoTokensData[acoToken];
        if (tokenAmount > acoBalance) {
            tokenAmount = acoBalance;
            if (acoBalance > 0) {
                collateralAmount = IACOToken(acoToken).getCollateralAmount(tokenAmount.sub(acoBalance));
            }
            if (collateralAmount > 0) {
                if (isCall) {
                    tokenAmount = tokenAmount.add(IACOToken(acoToken).mintPayable{value: collateralAmount}());
                } else {
                    if (acoTokenData.amountSold == 0) {
                        _callApproveERC20(strikeAsset, acoToken, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);    
                    }
                    tokenAmount = tokenAmount.add(IACOToken(acoToken).mint(collateralAmount));
                }
            }
        }
        
        acoTokenData.amountSold = tokenAmount.add(acoTokenData.amountSold);
        strikeAssetEarnedSelling = price.add(strikeAssetEarnedSelling); 
        
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
        acoTokenData.amountPurchased = tokenAmount.add(acoTokenData.amountPurchased);
        strikeAssetSpentBuying = price.add(strikeAssetSpentBuying);
        
        _transferAsset(strikeAsset, msg.sender, price);
        
        return price;
    }
    
    function _getNormalizedDepositAmount(uint256 collateralAmount) internal view returns(uint256, uint256) {
        uint256 basePrecision = isCall ? underlyingPrecision : strikeAssetPrecision;
        uint256 normalizedAmount;
        if (basePrecision > POOL_PRECISION) {
            uint256 adjust = basePrecision.div(POOL_PRECISION);
            normalizedAmount = collateralAmount.div(adjust);
            collateralAmount = normalizedAmount.mul(adjust);
        } else if (basePrecision < POOL_PRECISION) {
            normalizedAmount = collateralAmount.mul(POOL_PRECISION.div(basePrecision));
        } else {
            normalizedAmount = collateralAmount;
        }
        require(normalizedAmount > 0, "ACOPool:: Invalid collateral amount");
        return (normalizedAmount, collateralAmount);
    }
    
    function _getUniswapAsset(address asset) internal view returns(address) {
        if (_isEther(asset)) {
            return acoFlashExercise.weth();
        } else {
            return asset;
        }
    }
    
    function _buyStrikeAsset(uint256 strikeAssetAmount) internal {
        uint256 acceptablePrice = strategy.getAcceptableUnderlyingPriceToBuyStrikeAsset(underlying, strikeAsset);
        uint256 maxPayment = strikeAssetAmount.mul(underlyingPrecision).div(acceptablePrice);
        IUniswapV2Router02 router = IUniswapV2Router02(acoFlashExercise.uniswapRouter());
        address[] memory path = new address[](2);
        path[0] = _getUniswapAsset(underlying);
        path[1] = _getUniswapAsset(strikeAsset);
        router.swapTokensForExactTokens(strikeAssetAmount, maxPayment, path, address(this), block.timestamp);
    }
    
    function _setStrategy(address newStrategy) internal {
        require(newStrategy.isContract(), "ACOPool:: Invalid strategy");
        emit SetStrategy(address(strategy), newStrategy);
        strategy = IACOStrategy(newStrategy);
    }
    
    function _setBaseVolatility(uint256 newBaseVolatility) internal {
        require(newBaseVolatility > 0, "ACOPool:: Invalid base volatility");
        emit SetBaseVolatility(baseVolatility, newBaseVolatility);
        baseVolatility = newBaseVolatility;
    }
    
    function _setAssetsPrecision(address _underlying, address _strikeAsset) internal {
        underlyingPrecision = 10 ** uint256(_getAssetDecimals(_underlying));
        strikeAssetPrecision = 10 ** uint256(_getAssetDecimals(_strikeAsset));
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
        return block.timestamp >= poolStart;
    }
    
    function _notFinished() internal view returns(bool) {
        return block.timestamp < maxExpiration;
    }
    
    function _getValidACOTokenStrikePriceAndExpiration(address acoToken) internal view returns(uint256, uint256) {
        (address _underlying, address _strikeAsset, bool _isCall, uint256 _strikePrice, uint256 _expiryTime) = acoFactory.acoTokenData(acoToken);
        require(
            _underlying == underlying && 
            _strikeAsset == strikeAsset && 
            _isCall == isCall && 
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