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
    uint256 internal constant MAX_UINT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    
    struct ACOTokenData {
        uint256 amountSold;
        uint256 amountPurchased;
        bool redeemed;
    }
    
    event SetStrategy(address indexed strategy, address indexed newStrategy);
    event SetBaseVolatility(uint256 indexed baseVolatility, uint256 indexed newBaseVolatility);
    event CollateralDeposited(address indexed account, uint256 amount);
    event Redeem(address indexed account, uint256 underlyingAmount, uint256 strikeAssetAmount);
    event RestoreCollateral(uint256 amountOut, uint256 collateralIn);
    event ACORedeem(address indexed acoToken, uint256 collateralIn);
    event ACOExercise(address indexed acoToken, uint256 collateralIn);
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
    IUniswapV2Router02 public uniswapRouter;
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
        require(isStarted() && notFinished(), "ACOPool:: Pool is not open");
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
        
        super.init();
        
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
        
        address _uniswapRouter = IACOFlashExercise(initData.acoFlashExercise).uniswapRouter();
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        
        _setStrategy(initData.strategy);
        _setBaseVolatility(initData.baseVolatility);
        
        _setAssetsPrecision(initData.underlying, initData.strikeAsset);
        
        _approveAssetsOnRouter(initData.isCall, initData.canBuy, _uniswapRouter, initData.underlying, initData.strikeAsset);
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
    
    function isStarted() public view returns(bool) {
        return block.timestamp >= poolStart;
    }
    
    function notFinished() public view returns(bool) {
        return block.timestamp < maxExpiration;
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

    function deposit(uint256 collateralAmount, address to) public override payable returns(uint256) {
        require(!isStarted(), "ACOPool:: Pool already started");
        require(collateralAmount > 0, "ACOPool:: Invalid collateral amount");
        require(to != address(0) && to != address(this), "ACOPool:: Invalid to");
        
        (uint256 normalizedAmount, uint256 amount) = _getNormalizedDepositAmount(collateralAmount);
        
        _receiveAsset(collateral(), amount);
        
        collateralDeposited = collateralDeposited.add(amount);
        _mintAction(to, normalizedAmount);
        
        emit CollateralDeposited(msg.sender, amount);
        
        return normalizedAmount;
    }
    
    function redeem() public override returns(uint256, uint256) {
        return _redeem(msg.sender);
    }
    
    function redeemFrom(address account) public override returns(uint256, uint256) {
        return _redeem(account);
    }
    
    function redeemACOTokens() public override {
        for (uint256 i = 0; i < acoTokens.length; ++i) {
            address acoToken = acoTokens[i];
            if (!acoTokensData[acoToken].redeemed) {
                uint256 expiryTime = IACOToken(acoToken).expiryTime();
                if (expiryTime <= block.timestamp) {
                    uint256 collateralIn = IACOToken(acoToken).redeem();
                    acoTokensData[acoToken].redeemed = true;
                    emit ACORedeem(acoToken, collateralIn);
                }
            }
        }
    }
    
    function swap(bool isBuying, address acoToken, uint256 tokenAmount, uint256 restriction, address to, uint256 deadline) open public override returns(uint256) {
        require(block.timestamp <= deadline, "ACOPool:: Swap deadline");
        require(to != address(0) && to != acoToken && to != address(this), "ACOPool:: Invalid destination");
        (uint256 price, uint256 underlyingPrice, uint256 volatility, uint256 collateralAmount) = _internalQuote(isBuying, acoToken, tokenAmount);
        uint256 amount;
        if (isBuying) {
            amount = _internalSelling(to, acoToken, collateralAmount, tokenAmount, restriction, price);
        } else {
            amount = _internalBuying(to, acoToken, tokenAmount, restriction, price);
        }
        emit Swap(isBuying, msg.sender, acoToken, tokenAmount, price, underlyingPrice, volatility);
        return amount;
    }
    
    function exerciseACOToken(address acoToken) public override {
        (uint256 strikePrice, uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
        uint256 exercisableAmount = _getExercisableAmount(acoToken);
        require(exercisableAmount > 0, "ACOPool:: Exercise is not available");
        
        address _strikeAsset = strikeAsset;
        address _underlying = underlying;
        bool _isCall = isCall;
        
        uint256 collateralAmount;
        address _collateral;
        if (_isCall) {
            _collateral = _underlying;
            collateralAmount = exercisableAmount;
        } else {
            _collateral = _strikeAsset;
            collateralAmount = IACOToken(acoToken).getCollateralAmount(exercisableAmount);
            
        }
        uint256 collateralAvailable = _getAssetBalanceOf(_collateral, address(this));
        
        ACOTokenData storage data = acoTokensData[acoToken];
        (bool canExercise, uint256 minIntrinsicValue) = strategy.checkExercise(IACOStrategy.CheckExercise(
            _underlying,
            _strikeAsset,
            _isCall,
            strikePrice, 
            expiryTime,
            collateralAmount,
            collateralAvailable,
            data.amountPurchased,
            data.amountSold
        ));
        require(canExercise, "ACOPool:: Exercise is not authorized");
        
        if (IACOToken(acoToken).allowance(address(this), address(acoFlashExercise)) < exercisableAmount) {
            _callApproveERC20(acoToken, address(acoFlashExercise), MAX_UINT);    
        }
        acoFlashExercise.flashExercise(acoToken, exercisableAmount, minIntrinsicValue, block.timestamp);
        
        uint256 collateralIn = _getAssetBalanceOf(_collateral, address(this)).sub(collateralAvailable);
        emit ACOExercise(acoToken, collateralIn);
    }
    
    function restoreCollateral() public override {
        address _strikeAsset = strikeAsset;
        address _underlying = underlying;
        bool _isCall = isCall;
        
        uint256 underlyingBalance = _getAssetBalanceOf(_underlying, address(this));
        uint256 strikeAssetBalance = _getAssetBalanceOf(_strikeAsset, address(this));
        
        uint256 balanceOut;
        address assetIn;
        address assetOut;
        if (_isCall) {
             balanceOut = strikeAssetBalance;
             assetIn = _underlying;
             assetOut = _strikeAsset;
        } else {
            balanceOut = underlyingBalance;
             assetIn = _strikeAsset;
             assetOut = _underlying;
        }
        require(balanceOut > 0, "ACOPool:: No balance");
        
        uint256 acceptablePrice = strategy.getAcceptableUnderlyingPriceToSwapAssets(_underlying, _strikeAsset, false);
        
        uint256 minToReceive;
        if (_isCall) {
            minToReceive = balanceOut.mul(underlyingPrecision).div(acceptablePrice);
        } else {
            minToReceive = balanceOut.mul(acceptablePrice).div(underlyingPrecision);
        }
        _swapAssetsExactAmountOut(assetOut, assetIn, minToReceive, balanceOut);
        
        uint256 collateralIn;
        if (_isCall) {
            collateralIn = _getAssetBalanceOf(_underlying, address(this)).sub(underlyingBalance);
        } else {
            collateralIn = _getAssetBalanceOf(_strikeAsset, address(this)).sub(strikeAssetBalance);
        }
        emit RestoreCollateral(balanceOut, collateralIn);
    }
    
    function _internalQuote(bool isPoolSelling, address acoToken, uint256 tokenAmount) internal view returns(uint256, uint256, uint256, uint256) {
        require(isPoolSelling || canBuy, "ACOPool:: The pool only sell");
        require(tokenAmount > 0, "ACOPool:: Invalid token amount");
        (uint256 strikePrice, uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
        require(expiryTime > block.timestamp, "ACOPool:: ACO token expired");
        
        (uint256 collateralAmount, uint256 collateralAvailable) = _getWeightData(isPoolSelling, acoToken, tokenAmount);
        (uint256 price, uint256 underlyingPrice, uint256 volatility) = _strategyQuote(acoToken, isPoolSelling, strikePrice, expiryTime, collateralAmount, collateralAvailable);
        return (price, underlyingPrice, volatility, collateralAmount);
    }
    
    function _getWeightData(bool isPoolSelling, address acoToken, uint256 tokenAmount) internal view returns(uint256, uint256) {
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
        require(!isPoolSelling || collateralAmount <= collateralAvailable, "ACOPool:: Insufficient liquidity");
        
        return (collateralAmount, collateralAvailable);
    }
    
    function _strategyQuote(
        address acoToken,
        bool isPoolSelling,
        uint256 strikePrice,
        uint256 expiryTime,
        uint256 collateralAmount,
        uint256 collateralAvailable
    ) internal view returns(uint256, uint256, uint256) {
        ACOTokenData storage data = acoTokensData[acoToken];
        return strategy.quote(IACOStrategy.OptionQuote(
            isPoolSelling, 
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
        address to,
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
                address _collateral = collateral();
                if (_isEther(_collateral)) {
                    tokenAmount = tokenAmount.add(IACOToken(acoToken).mintPayable{value: collateralAmount}());
                } else {
                    if (acoTokenData.amountSold == 0) {
                        _callApproveERC20(_collateral, acoToken, MAX_UINT);    
                    }
                    tokenAmount = tokenAmount.add(IACOToken(acoToken).mint(collateralAmount));
                }
            }
        }
        
        acoTokenData.amountSold = tokenAmount.add(acoTokenData.amountSold);
        strikeAssetEarnedSelling = price.add(strikeAssetEarnedSelling); 
        
        _callTransferERC20(acoToken, to, tokenAmount);
        
        return tokenAmount;
    }
    
    function _internalBuying(
        address to,
        address acoToken, 
        uint256 tokenAmount, 
        uint256 minToReceive,
        uint256 price
    ) internal returns(uint256) {
        require(price >= minToReceive, "ACOPool:: Swap restriction");
        
        if (isCall) {
            _getStrikeAssetAmount(price);
        }
        
        _callTransferFromERC20(acoToken, msg.sender, address(this), tokenAmount);
        
        ACOTokenData storage acoTokenData = acoTokensData[acoToken];
        acoTokenData.amountPurchased = tokenAmount.add(acoTokenData.amountPurchased);
        strikeAssetSpentBuying = price.add(strikeAssetSpentBuying);
        
        _transferAsset(strikeAsset, to, price);
        
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
    
    function _getStrikeAssetAmount(uint256 strikeAssetAmount) internal {
        address _strikeAsset = strikeAsset;
        uint256 balance = _getAssetBalanceOf(_strikeAsset, address(this));
        if (balance < strikeAssetAmount) {
            uint256 amountToPurchase = strikeAssetAmount.sub(balance);
            address _underlying = underlying;
            uint256 acceptablePrice = strategy.getAcceptableUnderlyingPriceToSwapAssets(_underlying, _strikeAsset, true);
            uint256 maxPayment = amountToPurchase.mul(underlyingPrecision).div(acceptablePrice);
            _swapAssetsExactAmountIn(_underlying, _strikeAsset, amountToPurchase, maxPayment);
        }
    }
    
    function _redeem(address account) internal returns(uint256, uint256) {
        uint256 share = balanceOf(account);
        require(share > 0, "ACOPool:: Account with no share");
        require(!notFinished(), "ACOPool:: Pool is not finished");
        
        redeemACOTokens();
        
        uint256 _totalSupply = totalSupply();
        uint256 underlyingBalance = share.mul(_getAssetBalanceOf(underlying, address(this))).div(_totalSupply);
        uint256 strikeAssetBalance = share.mul(_getAssetBalanceOf(strikeAsset, address(this))).div(_totalSupply);
        
        _callBurn(account, share);
        
        if (underlyingBalance > 0) {
            _transferAsset(underlying, msg.sender, underlyingBalance);
        }
        if (strikeAssetBalance > 0) {
            _transferAsset(strikeAsset, msg.sender, strikeAssetBalance);
        }
        
        emit Redeem(msg.sender, underlyingBalance, strikeAssetBalance);
        
        return (underlyingBalance, strikeAssetBalance);
    }
    
    function _callBurn(address account, uint256 tokenAmount) internal {
        if (account == msg.sender) {
            super._burnAction(account, tokenAmount);
        } else {
            super._burnFrom(account, tokenAmount);
        }
    }
    
    function _swapAssetsExactAmountOut(address assetOut, address assetIn, uint256 minAmountIn, uint256 amountOut) internal {
        address[] memory path = new address[](2);
        if (_isEther(assetOut)) {
            path[0] = acoFlashExercise.weth();
            path[1] = assetIn;
            uniswapRouter.swapExactETHForTokens{value: amountOut}(minAmountIn, path, address(this), block.timestamp);
        } else if (_isEther(assetIn)) {
            path[0] = assetOut;
            path[1] = acoFlashExercise.weth();
            uniswapRouter.swapExactTokensForETH(amountOut, minAmountIn, path, address(this), block.timestamp);
        } else {
            path[0] = assetOut;
            path[1] = assetIn;
            uniswapRouter.swapExactTokensForTokens(amountOut, minAmountIn, path, address(this), block.timestamp);
        }
    }
    
    function _swapAssetsExactAmountIn(address assetOut, address assetIn, uint256 amountIn, uint256 maxAmountOut) internal {
        address[] memory path = new address[](2);
        if (_isEther(assetOut)) {
            path[0] = acoFlashExercise.weth();
            path[1] = assetIn;
            uniswapRouter.swapETHForExactTokens{value: maxAmountOut}(amountIn, path, address(this), block.timestamp);
        } else if (_isEther(assetIn)) {
            path[0] = assetOut;
            path[1] = acoFlashExercise.weth();
            uniswapRouter.swapTokensForExactETH(amountIn, maxAmountOut, path, address(this), block.timestamp);
        } else {
            path[0] = assetOut;
            path[1] = assetIn;
            uniswapRouter.swapTokensForExactTokens(amountIn, maxAmountOut, path, address(this), block.timestamp);
        }
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
    
    function _approveAssetsOnRouter(
        bool _isCall, 
        bool _canBuy, 
        address _uniswapRouter,
        address _underlying,
        address _strikeAsset
    ) internal {
        if (_isCall) {
            if (!_isEther(_strikeAsset)) {
                _callApproveERC20(_strikeAsset, _uniswapRouter, MAX_UINT);
            }
            if (_canBuy && !_isEther(_underlying)) {
                _callApproveERC20(_underlying, _uniswapRouter, MAX_UINT);
            }
        } else if (!_isEther(_underlying)) {
            _callApproveERC20(_underlying, _uniswapRouter, MAX_UINT);
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