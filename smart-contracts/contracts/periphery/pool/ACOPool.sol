pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../util/Ownable.sol';
import '../../libs/SafeMath.sol';
import '../../libs/Address.sol';
import '../../libs/ACONameFormatter.sol';
import '../../libs/ACOHelper.sol';
import '../../libs/ACOERC20Helper.sol';
import '../../core/ERC20.sol';
import '../../interfaces/IACOPool.sol';
import '../../interfaces/IACOFactory.sol';
import '../../interfaces/IACOStrategy.sol';
import '../../interfaces/IACOToken.sol';
import '../../interfaces/IACOFlashExercise.sol';
import '../../interfaces/IUniswapV2Router02.sol';
import '../../interfaces/IChiToken.sol';

/**
 * @title ACOPool
 * @dev A pool contract to trade ACO tokens.
 */
contract ACOPool is Ownable, ERC20, IACOPool {
    using Address for address;
    using SafeMath for uint256;
    
    uint256 internal constant POOL_PRECISION = 1000000000000000000; // 18 decimals
    uint256 internal constant MAX_UINT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    
	/**
     * @dev Struct to store an ACO token trade data.
     */
    struct ACOTokenData {
		/**
         * @dev Amount of tokens sold by the pool.
         */
        uint256 amountSold;
		
		/**
         * @dev Amount of tokens purchased by the pool.
         */
        uint256 amountPurchased;
		
		/**
         * @dev Index of the ACO token on the stored array.
         */
        uint256 index;
    }
    
	/**
     * @dev Emitted when the strategy address has been changed.
     * @param oldStrategy Address of the previous strategy.
     * @param newStrategy Address of the new strategy.
     */
    event SetStrategy(address indexed oldStrategy, address indexed newStrategy);
	
	/**
     * @dev Emitted when the base volatility has been changed.
     * @param oldBaseVolatility Value of the previous base volatility.
     * @param newBaseVolatility Value of the new base volatility.
     */
    event SetBaseVolatility(uint256 indexed oldBaseVolatility, uint256 indexed newBaseVolatility);
	
	/**
     * @dev Emitted when a collateral has been deposited on the pool.
     * @param account Address of the account.
     * @param amount Amount deposited.
     */
    event CollateralDeposited(address indexed account, uint256 amount);
	
	/**
     * @dev Emitted when the collateral and premium have been redeemed on the pool.
     * @param account Address of the account.
     * @param underlyingAmount Amount of underlying asset redeemed.
     * @param strikeAssetAmount Amount of strike asset redeemed.
     */
    event Redeem(address indexed account, uint256 underlyingAmount, uint256 strikeAssetAmount);
	
	/**
     * @dev Emitted when the collateral has been restored on the pool.
     * @param amountOut Amount of the premium sold.
     * @param collateralIn Amount of collateral restored.
     */
    event RestoreCollateral(uint256 amountOut, uint256 collateralIn);
	
	/**
     * @dev Emitted when an ACO token has been redeemed.
     * @param acoToken Address of the ACO token.
     * @param collateralIn Amount of collateral redeemed.
     * @param amountSold Total amount of ACO token sold by the pool.
     * @param amountPurchased Total amount of ACO token purchased by the pool.
     */
    event ACORedeem(address indexed acoToken, uint256 collateralIn, uint256 amountSold, uint256 amountPurchased);
	
	/**
     * @dev Emitted when an ACO token has been exercised.
     * @param acoToken Address of the ACO token.
	 * @param tokenAmount Amount of ACO tokens exercised.
     * @param collateralIn Amount of collateral received.
     */
    event ACOExercise(address indexed acoToken, uint256 tokenAmount, uint256 collateralIn);
	
	/**
     * @dev Emitted when an ACO token has been bought or sold by the pool.
     * @param isPoolSelling True whether the pool is selling an ACO token, otherwise the pool is buying.
     * @param account Address of the account that is doing the swap.
     * @param acoToken Address of the ACO token.
	 * @param tokenAmount Amount of tokens bought or sold.
     * @param price Value of the premium paid in strike asset.
     * @param protocolFee Value of the protocol fee paid in strike asset.
     * @param underlyingPrice The underlying price in strike asset.
     */
    event Swap(
        bool indexed isPoolSelling, 
        address indexed account, 
        address indexed acoToken, 
        uint256 tokenAmount, 
        uint256 price, 
        uint256 protocolFee,
        uint256 underlyingPrice
    );
    
	/**
	 * @dev UNIX timestamp that the pool can start to trade ACO tokens.
	 */
    uint256 public poolStart;
	
	/**
	 * @dev The protocol fee percentage. (100000 = 100%)
	 */
    uint256 public fee;
	
	/**
	 * @dev Address of the ACO flash exercise contract.
	 */
    IACOFlashExercise public acoFlashExercise;
	
	/**
	 * @dev Address of the ACO factory contract.
	 */
    IACOFactory public acoFactory;
	
	/**
	 * @dev Address of the Uniswap V2 router.
	 */
    IUniswapV2Router02 public uniswapRouter;
	
	/**
	 * @dev Address of the Chi gas token.
	 */
    IChiToken public chiToken;
	
	/**
	 * @dev Address of the protocol fee destination.
	 */
    address public feeDestination;
    
	/**
	 * @dev Address of the underlying asset accepts by the pool.
	 */
    address public underlying;
	
	/**
	 * @dev Address of the strike asset accepts by the pool.
	 */
    address public strikeAsset;
	
	/**
	 * @dev Value of the minimum strike price on ACO token that the pool accept to trade.
	 */
    uint256 public minStrikePrice;
	
	/**
	 * @dev Value of the maximum strike price on ACO token that the pool accept to trade.
	 */
    uint256 public maxStrikePrice;
	
	/**
	 * @dev Value of the minimum UNIX expiration on ACO token that the pool accept to trade.
	 */
    uint256 public minExpiration;
	
	/**
	 * @dev Value of the maximum UNIX expiration on ACO token that the pool accept to trade.
	 */
    uint256 public maxExpiration;
	
	/**
	 * @dev True whether the pool accepts CALL options, otherwise the pool accepts only PUT options. 
	 */
    bool public isCall;
	
	/**
	 * @dev True whether the pool can also buy ACO tokens, otherwise the pool only sells ACO tokens. 
	 */
    bool public canBuy;
    
	/**
	 * @dev Address of the strategy. 
	 */
    IACOStrategy public strategy;
	
	/**
	 * @dev Percentage value for the base volatility. (100000 = 100%) 
	 */
    uint256 public baseVolatility;
    
	/**
	 * @dev Total amount of collateral deposited.  
	 */
    uint256 public collateralDeposited;
	
	/**
	 * @dev Total amount in strike asset spent buying ACO tokens.  
	 */
    uint256 public strikeAssetSpentBuying;
	
	/**
	 * @dev Total amount in strike asset earned selling ACO tokens.  
	 */
    uint256 public strikeAssetEarnedSelling;
    
	/**
	 * @dev Array of ACO tokens currently negotiated.  
	 */
    address[] public acoTokens;
	
	/**
	 * @dev Mapping for ACO tokens data currently negotiated.  
	 */
    mapping(address => ACOTokenData) public acoTokensData;
    
	/**
	 * @dev Underlying asset precision. (18 decimals = 1000000000000000000)
	 */
    uint256 internal underlyingPrecision;
	
	/**
	 * @dev Strike asset precision. (6 decimals = 1000000)
	 */
    uint256 internal strikeAssetPrecision;
    
	/**
     * @dev Modifier to check if the pool is open to trade.
     */
    modifier open() {
        require(isStarted() && notFinished(), "ACOPool:: Pool is not open");
        _;
    }
    
	/**
     * @dev Modifier to apply the Chi gas token and save gas.
     */
    modifier discountCHI {
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        chiToken.freeFromUpTo(msg.sender, (gasSpent + 14154) / 41947);
    }
	
    /**
     * @dev Function to initialize the contract.
     * It should be called by the ACO pool factory when creating the pool.
     * It must be called only once. The first `require` is to guarantee that behavior.
     * @param initData The initialize data.
     */
    function init(InitData calldata initData) external override {
        require(underlying == address(0) && strikeAsset == address(0) && minExpiration == 0, "ACOPool::init: Already initialized");
        
        require(initData.acoFactory.isContract(), "ACOPool:: Invalid ACO Factory");
        require(initData.acoFlashExercise.isContract(), "ACOPool:: Invalid ACO flash exercise");
        require(initData.chiToken.isContract(), "ACOPool:: Invalid Chi Token");
        require(initData.fee <= 500, "ACOPool:: The maximum fee allowed is 0.5%");
        require(initData.poolStart > block.timestamp, "ACOPool:: Invalid pool start");
        require(initData.minExpiration > block.timestamp, "ACOPool:: Invalid expiration");
        require(initData.minStrikePrice <= initData.maxStrikePrice, "ACOPool:: Invalid strike price range");
        require(initData.minStrikePrice > 0, "ACOPool:: Invalid strike price");
        require(initData.minExpiration <= initData.maxExpiration, "ACOPool:: Invalid expiration range");
        require(initData.underlying != initData.strikeAsset, "ACOPool:: Same assets");
        require(ACOERC20Helper._isEther(initData.underlying) || initData.underlying.isContract(), "ACOPool:: Invalid underlying");
        require(ACOERC20Helper._isEther(initData.strikeAsset) || initData.strikeAsset.isContract(), "ACOPool:: Invalid strike asset");
        
        super.init();
        
        poolStart = initData.poolStart;
        acoFlashExercise = IACOFlashExercise(initData.acoFlashExercise);
        acoFactory = IACOFactory(initData.acoFactory);
        chiToken = IChiToken(initData.chiToken);
        fee = initData.fee;
        feeDestination = initData.feeDestination;
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
    
    /**
     * @dev Function to guarantee that the contract will not receive ether directly.
     */
    receive() external payable {
        revert();
    }
    
    /**
     * @dev Function to get the token name.
     */
    function name() public view override returns(string memory) {
        return _name();
    }
    
    /**
     * @dev Function to get the token symbol, that it is equal to the name.
     */
    function symbol() public view override returns(string memory) {
        return _name();
    }
    
	/**
     * @dev Function to get the token decimals.
     */
    function decimals() public view override returns(uint8) {
        return 18;
    }
    
	/**
     * @dev Function to get whether the pool already started trade ACO tokens.
     */
    function isStarted() public view returns(bool) {
        return block.timestamp >= poolStart;
    }
    
	/**
     * @dev Function to get whether the pool is not finished.
     */
    function notFinished() public view returns(bool) {
        return block.timestamp < maxExpiration;
    }
    
	/**
     * @dev Function to get the number of ACO tokens currently negotiated.
     */
    function numberOfACOTokensCurrentlyNegotiated() public override view returns(uint256) {
        return acoTokens.length;
    }
    
	/**
     * @dev Function to get the pool collateral asset.
     */
    function collateral() public override view returns(address) {
        if (isCall) {
            return underlying;
        } else {
            return strikeAsset;
        }
    }
    
    /**
     * @dev Function to quote an ACO token swap.
     * @param isBuying True whether it is quoting to buy an ACO token, otherwise it is quoting to sell an ACO token.
     * @param acoToken Address of the ACO token.
     * @param tokenAmount Amount of ACO tokens to swap.
     * @return The swap price, the protocol fee charged on the swap, and the underlying price in strike asset.
     */
    function quote(bool isBuying, address acoToken, uint256 tokenAmount) open public override view returns(uint256, uint256, uint256) {
        (uint256 swapPrice, uint256 protocolFee, uint256 underlyingPrice,) = _internalQuote(isBuying, acoToken, tokenAmount);
        return (swapPrice, protocolFee, underlyingPrice);
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
        
        ACOHelper._receiveAsset(collateral(), amount);
        
        collateralDeposited = collateralDeposited.add(amount);
        _mintAction(to, normalizedAmount);
        
        emit CollateralDeposited(msg.sender, amount);
        
        return normalizedAmount;
    }
    
    function swap(
        bool isBuying, 
        address acoToken, 
        uint256 tokenAmount, 
        uint256 restriction, 
        address to, 
        uint256 deadline
    ) open public override returns(uint256) {
        return _swap(isBuying, acoToken, tokenAmount, restriction, to, deadline);
    }
    
    function swapWithGasToken(
        bool isBuying, 
        address acoToken, 
        uint256 tokenAmount, 
        uint256 restriction, 
        address to, 
        uint256 deadline
    ) open discountCHI public override returns(uint256) {
        return _swap(isBuying, acoToken, tokenAmount, restriction, to, deadline);
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
			uint256 expiryTime = IACOToken(acoToken).expiryTime();
            _redeemACOToken(acoToken, expiryTime);
        }
    }
	
	function redeemACOToken(address acoToken) public override {
        (,uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
		_redeemACOToken(acoToken, expiryTime);
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
        uint256 collateralAvailable = _getPoolBalanceOf(_collateral);
        
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
        require(canExercise, "ACOPool:: Exercise is not possible");
        
        if (IACOToken(acoToken).allowance(address(this), address(acoFlashExercise)) < exercisableAmount) {
            _setAuthorizedSpender(acoToken, address(acoFlashExercise));    
        }
        acoFlashExercise.flashExercise(acoToken, exercisableAmount, minIntrinsicValue, block.timestamp);
        
        uint256 collateralIn = _getPoolBalanceOf(_collateral).sub(collateralAvailable);
        emit ACOExercise(acoToken, exercisableAmount, collateralIn);
    }
    
    function restoreCollateral() public override {
        address _strikeAsset = strikeAsset;
        address _underlying = underlying;
        bool _isCall = isCall;
        
        uint256 underlyingBalance = _getPoolBalanceOf(_underlying);
        uint256 strikeAssetBalance = _getPoolBalanceOf(_strikeAsset);
        
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
            collateralIn = _getPoolBalanceOf(_underlying).sub(underlyingBalance);
        } else {
            collateralIn = _getPoolBalanceOf(_strikeAsset).sub(strikeAssetBalance);
        }
        emit RestoreCollateral(balanceOut, collateralIn);
    }
    
    function _swap(bool isPoolSelling, address acoToken, uint256 tokenAmount, uint256 restriction, address to, uint256 deadline) internal returns(uint256) {
        require(block.timestamp <= deadline, "ACOPool:: Swap deadline");
        require(to != address(0) && to != acoToken && to != address(this), "ACOPool:: Invalid destination");
        
        (uint256 swapPrice, uint256 protocolFee, uint256 underlyingPrice, uint256 collateralAmount) = _internalQuote(isPoolSelling, acoToken, tokenAmount);
        
        uint256 amount;
        if (isPoolSelling) {
            amount = _internalSelling(to, acoToken, collateralAmount, tokenAmount, restriction, swapPrice, protocolFee);
        } else {
            amount = _internalBuying(to, acoToken, tokenAmount, restriction, swapPrice, protocolFee);
        }
        
        if (protocolFee > 0) {
            ACOHelper._transferAsset(strikeAsset, feeDestination, protocolFee);
        }
        
        emit Swap(isPoolSelling, msg.sender, acoToken, tokenAmount, swapPrice, protocolFee, underlyingPrice);
        
        return amount;
    }
    
    function _internalQuote(bool isPoolSelling, address acoToken, uint256 tokenAmount) internal view returns(uint256, uint256, uint256, uint256) {
        require(isPoolSelling || canBuy, "ACOPool:: The pool only sell");
        require(tokenAmount > 0, "ACOPool:: Invalid token amount");
        (uint256 strikePrice, uint256 expiryTime) = _getValidACOTokenStrikePriceAndExpiration(acoToken);
        require(expiryTime > block.timestamp, "ACOPool:: ACO token expired");
        
        (uint256 collateralAmount, uint256 collateralAvailable) = _getSizeData(isPoolSelling, acoToken, tokenAmount);
        (uint256 price, uint256 underlyingPrice,) = _strategyQuote(acoToken, isPoolSelling, strikePrice, expiryTime, collateralAmount, collateralAvailable);
        
        price = price.mul(tokenAmount).div(underlyingPrecision);
        
        uint256 protocolFee = 0;
        if (fee > 0) {
            protocolFee = price.mul(fee).div(100000);
            if (isPoolSelling) {
                price = price.add(protocolFee);
            } else {
                price = price.sub(protocolFee);
            }
        }
        require(price > 0, "ACOPool:: Invalid quote");
        return (price, protocolFee, underlyingPrice, collateralAmount);
    }
    
    function _getSizeData(bool isPoolSelling, address acoToken, uint256 tokenAmount) internal view returns(uint256, uint256) {
        uint256 collateralAmount;
        uint256 collateralAvailable;
        if (isCall) {
            collateralAvailable = _getPoolBalanceOf(underlying);
            collateralAmount = tokenAmount; 
        } else {
            collateralAvailable = _getPoolBalanceOf(strikeAsset);
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
        uint256 swapPrice,
        uint256 protocolFee
    ) internal returns(uint256) {
        require(swapPrice <= maxPayment, "ACOPool:: Swap restriction");
        
        ACOERC20Helper._callTransferFromERC20(strikeAsset, msg.sender, address(this), swapPrice);
        
        uint256 acoBalance = _getPoolBalanceOf(acoToken);

        ACOTokenData storage acoTokenData = acoTokensData[acoToken];
        uint256 _amountSold = acoTokenData.amountSold;
        if (_amountSold == 0 && acoTokenData.amountPurchased == 0) {
			acoTokenData.index = acoTokens.length;
            acoTokens.push(acoToken);    
        }
        if (tokenAmount > acoBalance) {
            tokenAmount = acoBalance;
            if (acoBalance > 0) {
                collateralAmount = IACOToken(acoToken).getCollateralAmount(tokenAmount.sub(acoBalance));
            }
            if (collateralAmount > 0) {
                address _collateral = collateral();
                if (ACOERC20Helper._isEther(_collateral)) {
                    tokenAmount = tokenAmount.add(IACOToken(acoToken).mintPayable{value: collateralAmount}());
                } else {
                    if (_amountSold == 0) {
                        _setAuthorizedSpender(_collateral, acoToken);    
                    }
                    tokenAmount = tokenAmount.add(IACOToken(acoToken).mint(collateralAmount));
                }
            }
        }
        
        acoTokenData.amountSold = tokenAmount.add(_amountSold);
        strikeAssetEarnedSelling = swapPrice.sub(protocolFee).add(strikeAssetEarnedSelling); 
        
        ACOERC20Helper._callTransferERC20(acoToken, to, tokenAmount);
        
        return tokenAmount;
    }
    
    function _internalBuying(
        address to,
        address acoToken, 
        uint256 tokenAmount, 
        uint256 minToReceive,
        uint256 swapPrice,
        uint256 protocolFee
    ) internal returns(uint256) {
        require(swapPrice >= minToReceive, "ACOPool:: Swap restriction");
        
        uint256 requiredStrikeAsset = swapPrice.add(protocolFee);
        if (isCall) {
            _getStrikeAssetAmount(requiredStrikeAsset);
        }
        
        ACOERC20Helper._callTransferFromERC20(acoToken, msg.sender, address(this), tokenAmount);
        
        ACOTokenData storage acoTokenData = acoTokensData[acoToken];
        uint256 _amountPurchased = acoTokenData.amountPurchased;
        if (_amountPurchased == 0 && acoTokenData.amountSold == 0) {
			acoTokenData.index = acoTokens.length;
            acoTokens.push(acoToken);    
        }
        acoTokenData.amountPurchased = tokenAmount.add(_amountPurchased);
        strikeAssetSpentBuying = requiredStrikeAsset.add(strikeAssetSpentBuying);
        
        ACOHelper._transferAsset(strikeAsset, to, swapPrice);
        
        return swapPrice;
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
        uint256 balance = _getPoolBalanceOf(_strikeAsset);
        if (balance < strikeAssetAmount) {
            uint256 amountToPurchase = strikeAssetAmount.sub(balance);
            address _underlying = underlying;
            uint256 acceptablePrice = strategy.getAcceptableUnderlyingPriceToSwapAssets(_underlying, _strikeAsset, true);
            uint256 maxPayment = amountToPurchase.mul(underlyingPrecision).div(acceptablePrice);
            _swapAssetsExactAmountIn(_underlying, _strikeAsset, amountToPurchase, maxPayment);
        }
    }
	
	function _redeemACOToken(address acoToken, uint256 expiryTime) internal {
		if (expiryTime <= block.timestamp) {
				
			uint256 collateralIn = IACOToken(acoToken).redeem();
			
			ACOTokenData storage data = acoTokensData[acoToken];
			uint256 lastIndex = acoTokens.length - 1;
			if (lastIndex != data.index) {
				address last = acoTokens[lastIndex];
				acoTokensData[last].index = data.index;
				acoTokens[data.index] = last;
			}
			
			emit ACORedeem(acoToken, collateralIn, data.amountSold, data.amountPurchased);
			
			acoTokens.pop();
			delete acoTokensData[acoToken];
		}
    }
    
    function _redeem(address account) internal returns(uint256, uint256) {
        uint256 share = balanceOf(account);
        require(share > 0, "ACOPool:: Account with no share");
        require(!notFinished(), "ACOPool:: Pool is not finished");
        
        redeemACOTokens();
        
        uint256 _totalSupply = totalSupply();
        uint256 underlyingBalance = share.mul(_getPoolBalanceOf(underlying)).div(_totalSupply);
        uint256 strikeAssetBalance = share.mul(_getPoolBalanceOf(strikeAsset)).div(_totalSupply);
        
        _callBurn(account, share);
        
        if (underlyingBalance > 0) {
            ACOHelper._transferAsset(underlying, msg.sender, underlyingBalance);
        }
        if (strikeAssetBalance > 0) {
            ACOHelper._transferAsset(strikeAsset, msg.sender, strikeAssetBalance);
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
        if (ACOERC20Helper._isEther(assetOut)) {
            path[0] = acoFlashExercise.weth();
            path[1] = assetIn;
            uniswapRouter.swapExactETHForTokens{value: amountOut}(minAmountIn, path, address(this), block.timestamp);
        } else if (ACOERC20Helper._isEther(assetIn)) {
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
        if (ACOERC20Helper._isEther(assetOut)) {
            path[0] = acoFlashExercise.weth();
            path[1] = assetIn;
            uniswapRouter.swapETHForExactTokens{value: maxAmountOut}(amountIn, path, address(this), block.timestamp);
        } else if (ACOERC20Helper._isEther(assetIn)) {
            path[0] = assetOut;
            path[1] = acoFlashExercise.weth();
            uniswapRouter.swapTokensForExactETH(amountIn, maxAmountOut, path, address(this), block.timestamp);
        } else {
            path[0] = assetOut;
            path[1] = assetIn;
            uniswapRouter.swapTokensForExactTokens(amountIn, maxAmountOut, path, address(this), block.timestamp);
        }
    }
    
    /**
     * @dev Internal function to set the strategy address.
     * @param newStrategy Address of the new strategy.
     */
    function _setStrategy(address newStrategy) internal {
        require(newStrategy.isContract(), "ACOPool:: Invalid strategy");
        emit SetStrategy(address(strategy), newStrategy);
        strategy = IACOStrategy(newStrategy);
    }
    
    /**
     * @dev Internal function to set the base volatility percentage.
     * 100000 = 100%
     * @param newBaseVolatility Value of the new base volatility.
     */
    function _setBaseVolatility(uint256 newBaseVolatility) internal {
        require(newBaseVolatility > 0, "ACOPool:: Invalid base volatility");
        emit SetBaseVolatility(baseVolatility, newBaseVolatility);
        baseVolatility = newBaseVolatility;
    }
    
    /**
     * @dev Internal function to set the pool assets precisions.
     * @param _underlying Address of the underlying asset.
     * @param _strikeAsset Address of the strike asset.
     */
    function _setAssetsPrecision(address _underlying, address _strikeAsset) internal {
        underlyingPrecision = 10 ** uint256(ACOERC20Helper._getAssetDecimals(_underlying));
        strikeAssetPrecision = 10 ** uint256(ACOERC20Helper._getAssetDecimals(_strikeAsset));
    }
    
    /**
     * @dev Internal function to infinite authorize the pool assets on the Uniswap V2 router.
     * @param _isCall True whether it is a CALL option, otherwise it is PUT.
     * @param _canBuy True whether the pool can also buy ACO tokens, otherwise it only sells.
     * @param _uniswapRouter Address of the Uniswap V2 router.
     * @param _underlying Address of the underlying asset.
     * @param _strikeAsset Address of the strike asset.
     */
    function _approveAssetsOnRouter(
        bool _isCall, 
        bool _canBuy, 
        address _uniswapRouter,
        address _underlying,
        address _strikeAsset
    ) internal {
        if (_isCall) {
            if (!ACOERC20Helper._isEther(_strikeAsset)) {
                _setAuthorizedSpender(_strikeAsset, _uniswapRouter);
            }
            if (_canBuy && !ACOERC20Helper._isEther(_underlying)) {
                _setAuthorizedSpender(_underlying, _uniswapRouter);
            }
        } else if (!ACOERC20Helper._isEther(_underlying)) {
            _setAuthorizedSpender(_underlying, _uniswapRouter);
        }
    }
    
    /**
     * @dev Internal function to infinite authorize a spender on an asset.
     * @param asset Address of the asset.
     * @param spender Address of the spender to be authorized.
     */
    function _setAuthorizedSpender(address asset, address spender) internal {
        ACOERC20Helper._callApproveERC20(asset, spender, MAX_UINT);
    }
    
    /**
     * @dev Internal function to get the pool balance of an asset.
     * @param asset Address of the asset.
     * @return The pool balance.
     */
    function _getPoolBalanceOf(address asset) internal view returns(uint256) {
        return ACOERC20Helper._getAssetBalanceOf(asset, address(this));
    }
    
    /**
     * @dev Internal function to get the exercible amount of an ACO token.
     * @param acoToken Address of the ACO token.
     * @return The exercisable amount.
     */
    function _getExercisableAmount(address acoToken) internal view returns(uint256) {
        uint256 balance = _getPoolBalanceOf(acoToken);
        if (balance > 0) {
            uint256 collaterized = IACOToken(acoToken).currentCollateralizedTokens(address(this));
            if (balance > collaterized) {
                return balance.sub(collaterized);
            }
        }
        return 0;
    }
    
    /**
     * @dev Internal function to get an accepted ACO token by the pool.
     * @param acoToken Address of the ACO token.
     * @return The ACO token strike price, and the ACO token expiration.
     */
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
    
    /**
     * @dev Internal function to get the token name.
     * The token name is assembled  with the token data:
     * ACO POOL UNDERLYING_SYMBOL-STRIKE_ASSET_SYMBOL-TYPE-{ONLY_SELL}-MIN_STRIKE_PRICE-MAX_STRIKE_PRICE-MIN_EXPIRATION-MAX_EXPIRATION
     * @return The token name.
     */
    function _name() internal view returns(string memory) {
        uint8 strikeDecimals = ACOERC20Helper._getAssetDecimals(strikeAsset);
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
            ACOERC20Helper._getAssetSymbol(underlying),
            "-",
            ACOERC20Helper._getAssetSymbol(strikeAsset),
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