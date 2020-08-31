pragma solidity ^0.6.6;

import "../../libs/Address.sol";
import "../../interfaces/IACOPool.sol";

/**
 * @title ACOPoolFactory
 * @dev The contract is the implementation for the ACOProxy.
 */
contract ACOPoolFactory {
    
    /**
     * @dev Struct to store the ACO pool basic data.
     */
    struct ACOPoolData {
        /**
         * @dev The UNIX time that the ACO pool can start negotiated ACO tokens.
         */
        uint256 poolStart;
        
        /**
         * @dev Address of the underlying asset (0x0 for Ethereum).
         */
        address underlying;
        
        /**
         * @dev Address of the strike asset (0x0 for Ethereum).
         */
        address strikeAsset;
        
        /**
         * @dev True if the type is CALL, false for PUT.
         */
        bool isCall;
        
        /**
         * @dev The minimum strike price allowed with the strike asset precision.
         */
        uint256 minStrikePrice;
        
        /**
         * @dev The maximum strike price allowed with the strike asset precision.
         */
        uint256 maxStrikePrice;
        
        /**
         * @dev The minimum UNIX time for the ACO token expiration.
         */
        uint256 minExpiration;
        
        /**
         * @dev The maximum UNIX time for the ACO token expiration.
         */
        uint256 maxExpiration;
        
        /**
         * @dev Whether the pool buys ACO tokens otherwise, it only sells.
         */
        bool canBuy;
    }
    
    /**
     * @dev Emitted when the factory admin address has been changed.
     * @param previousFactoryAdmin Address of the previous factory admin.
     * @param newFactoryAdmin Address of the new factory admin.
     */
    event SetFactoryAdmin(address indexed previousFactoryAdmin, address indexed newFactoryAdmin);
    
    /**
     * @dev Emitted when the ACO pool implementation has been changed.
     * @param previousAcoPoolImplementation Address of the previous ACO pool implementation.
     * @param previousAcoPoolImplementation Address of the new ACO pool implementation.
     */
    event SetAcoPoolImplementation(address indexed previousAcoPoolImplementation, address indexed newAcoPoolImplementation);
    
    /**
     * @dev Emitted when the ACO factory has been changed.
     * @param previousAcoFactory Address of the previous ACO factory.
     * @param newAcoFactory Address of the new ACO factory.
     */
    event SetAcoFactory(address indexed previousAcoFactory, address indexed newAcoFactory);
    
    /**
     * @dev Emitted when the ACO fee has been changed.
     * @param previousAcoFlashExercise Address of the previous ACO flash exercise.
     * @param newAcoFlashExercise Address of the new ACO flash exercise.
     */
    event SetAcoFlashExercise(address indexed previousAcoFlashExercise, address indexed newAcoFlashExercise);
    
    /**
     * @dev Emitted when permission for an ACO pool admin has been changed.
     * @param poolAdmin Address of the ACO pool admin.
     * @param previousPermission The previous permission situation.
     * @param newPermission The new permission situation.
     */
    event SetAcoPoolPermission(address indexed poolAdmin, bool indexed previousPermission, bool indexed newPermission);
    
    /**
     * @dev Emitted when a strategy permission has been changed.
     * @param strategy Address of the strategy.
     * @param previousPermission The previous strategy permission.
     * @param newPermission The new strategy permission.
     */
    event SetStrategyPermission(address indexed strategy, bool indexed previousPermission, bool newPermission);
    
    /**
     * @dev Emitted when the pool strategy has been changed.
     * @param previousPoolStrategy Address of the previous pool strategy.
     * @param newPoolStrategy Address of the new pool strategy.
     */
    event SetPoolStrategy(address indexed previousPoolStrategy, address indexed newPoolStrategy);
    
    /**
     * @dev Emitted when the pool tolerance to the oracle price has been changed.
     * @param previousPoolTolerancePercentageToOraclePrice The previous pool tolerance to the oracle price.
     * @param newPoolTolerancePercentageToOraclePrice The new pool tolerance to the oracle price.
     */
    event SetPoolTolerancePercentageToOraclePrice(uint256 indexed previousPoolTolerancePercentageToOraclePrice, uint256 indexed newPoolTolerancePercentageToOraclePrice);
    
    /**
     * @dev Emitted when the pool minimum time in minutes to exercise ACO tokens with any profit has been changed.
     * @param previousPoolMinimumTimeInMinutesToExerciseAnyProfit The previous pool minimum time in minutes to exercise ACO tokens with any profit.
     * @param newPoolMinimumTimeInMinutesToExerciseAnyProfit The new pool minimum time in minutes to exercise ACO tokens with any profit.
     */
    event SetPoolMinimumTimeInMinutesToExerciseAnyProfit(uint256 indexed previousPoolMinimumTimeInMinutesToExerciseAnyProfit, uint256 indexed newPoolMinimumTimeInMinutesToExerciseAnyProfit);
    
    /**
     * @dev Emitted when the pool minimum profit to exercise ACO tokens any time has been changed.
     * @param previousPoolMinimumProfitToExerciseAnyTime The previous pool minimum profit to exercise ACO tokens any time.
     * @param newPoolMinimumProfitToExerciseAnyTime The new pool minimum profit to exercise ACO tokens any time.
     */
    event SetPoolMinimumProfitToExerciseAnyTime(uint256 indexed previousPoolMinimumProfitToExerciseAnyTime, uint256 indexed newPoolMinimumProfitToExerciseAnyTime);
    
    /**
     * @dev Emitted when a new ACO pool has been created.
     * @param underlying Address of the underlying asset (0x0 for Ethereum).
     * @param strikeAsset Address of the strike asset (0x0 for Ethereum).
     * @param isCall True if the type is CALL, false for PUT.
     * @param poolStart The UNIX time that the ACO pool can start negotiated ACO tokens.
     * @param minStrikePrice The minimum strike price for ACO tokens with the strike asset precision.
     * @param maxStrikePrice The maximum strike price for ACO tokens with the strike asset precision.
     * @param minExpiration The minimum expiration time for ACO tokens.
     * @param maxExpiration The maximum expiration time for ACO tokens.
     * @param canBuy Whether the pool buys ACO tokens otherwise, it only sells.
     * @param acoPool Address of the new ACO pool created.
     * @param acoPoolImplementation Address of the ACO pool implementation used on creation.
     */
    event NewAcoPool(address indexed underlying, address indexed strikeAsset, bool indexed isCall, uint256 poolStart, uint256 minStrikePrice, uint256 maxStrikePrice, uint256 minExpiration, uint256 maxExpiration, bool canBuy, address acoPool, address acoPoolImplementation);
    
    /**
     * @dev The factory admin address.
     */
    address public factoryAdmin;
    
    /**
     * @dev The ACO pool implementation address.
     */
    address public acoPoolImplementation;
    
    /**
     * @dev The ACO factory address.
     */
    address public acoFactory;
    
    /**
     * @dev The ACO flash exercise address.
     */
    address public acoFlashExercise;
    
    /**
     * @dev The base pool strategy address.
     */
    address public poolStrategy;
    
    /**
     * @dev The pool tolerance to the oracle price.
     * It is a percentage value (100000 is 100%).
     */
    uint256 public poolTolerancePercentageToOraclePrice;
    
    /**
     * @dev The pool minimum time in minutes to exercise ACO tokens with any profit.
     */
    uint256 public poolMinimumTimeInMinutesToExerciseAnyProfit;
    
    /**
     * @dev The pool minimum profit to exercise ACO tokens any time.
     * It is a percentage value (100000 is 100%).
     */
    uint256 public poolMinimumProfitToExerciseAnyTime;
    
    /**
     * @dev The ACO pool admin permissions.
     */
    mapping(address => bool) public poolAdminPermission;
    
    /**
     * @dev The strategies permitted.
     */
    mapping(address => bool) public strategyPermitted;
    
    /**
     * @dev The ACO pool basic data.
     */
    mapping(address => ACOPoolData) public acoPoolData;
    
    /**
     * @dev Modifier to check if the `msg.sender` is the factory admin.
     * Only factory admin address can execute.
     */
    modifier onlyFactoryAdmin() {
        require(msg.sender == factoryAdmin, "ACOPoolFactory::onlyFactoryAdmin");
        _;
    }
    
    /**
     * @dev Modifier to check if the `msg.sender` is a pool admin.
     * Only a pool admin address can execute.
     */
    modifier onlyPoolAdmin() {
        require(poolAdminPermission[msg.sender], "ACOPoolFactory::onlyPoolAdmin");
        _;
    }
    
    /**
     * @dev Function to initialize the contract.
     * It should be called through the `data` argument when creating the proxy.
     * It must be called only once. The first `require` is to guarantee that behavior.
     * @param _factoryAdmin Address of the factory admin.
     * @param _acoPoolImplementation Address of the ACO pool implementation.
     * @param _poolStrategy Address of the base pool strategy.
     * @param _poolTolerancePercentageToOraclePrice The pool tolerance to the oracle price. It is a percentage value (100000 is 100%).
     * @param _poolMinimumTimeInMinutesToExerciseAnyProfit The pool minimum time in minutes to exercise ACO tokens with any profit.
     * @param _poolMinimumProfitToExerciseAnyTime The pool minimum profit to exercise ACO tokens any time. It is a percentage value (100000 is 100%).
     */
    function init(
        address _factoryAdmin, 
        address _acoPoolImplementation, 
        address _acoFactory, 
        address _acoFlashExercise,
        address _poolStrategy,
        uint256 _poolTolerancePercentageToOraclePrice,
        uint256 _poolMinimumTimeInMinutesToExerciseAnyProfit,
        uint256 _poolMinimumProfitToExerciseAnyTime
    ) public {
        require(factoryAdmin == address(0) && acoPoolImplementation == address(0), "ACOPoolFactory::init: Contract already initialized.");
        
        _setFactoryAdmin(_factoryAdmin);
        _setAcoPoolImplementation(_acoPoolImplementation);
        _setAcoFactory(_acoFactory);
        _setAcoFlashExercise(_acoFlashExercise);
        _setAcoPoolPermission(_factoryAdmin, true);
        _setAcoPoolStrategyPermission(_poolStrategy, true);
        _setPoolStrategy(_poolStrategy);
        _setPoolTolerancePercentageToOraclePrice(_poolTolerancePercentageToOraclePrice);
        _setPoolMinimumTimeInMinutesToExerciseAnyProfit(_poolMinimumTimeInMinutesToExerciseAnyProfit);
        _setPoolMinimumProfitToExerciseAnyTime(_poolMinimumProfitToExerciseAnyTime);
    }

    /**
     * @dev Function to guarantee that the contract will not receive ether.
     */
    receive() external payable virtual {
        revert();
    }
    
    /**
     * @dev Internal function to put on array all uint256 argumenst to create an ACO pool.
     * This is to handle with stack too deep error throw due the number of variables.
     * @param poolStart The UNIX time that the ACO pool can start negotiated ACO tokens.
     * @param minStrikePrice The minimum strike price for ACO tokens with the strike asset precision.
     * @param maxStrikePrice The maximum strike price for ACO tokens with the strike asset precision.
     * @param minExpiration The minimum expiration time for ACO tokens.
     * @param maxExpiration The maximum expiration time for ACO tokens.
     * @param baseVolatility The base volatility for the pool starts. It is a percentage value (100000 is 100%).
     * @param tolerancePercentageToOraclePrice The pool tolerance to the oracle price. It is a percentage value (100000 is 100%).
     * @param minimumTimeInMinutesToExerciseAnyProfit The pool minimum time in minutes to exercise ACO tokens with any profit.
     * @param minimumProfitToExerciseAnyTime The pool minimum profit to exercise ACO tokens any time. It is a percentage value (100000 is 100%).
     * @return All arguments on a uint256 array.
     */
    function getUintArgumentsToCreateAcoPool(
        uint256 poolStart,
        uint256 minStrikePrice,
        uint256 maxStrikePrice,
        uint256 minExpiration,
        uint256 maxExpiration,
        uint256 baseVolatility,
        uint256 tolerancePercentageToOraclePrice,
        uint256 minimumTimeInMinutesToExerciseAnyProfit,
        uint256 minimumProfitToExerciseAnyTime
    ) pure public virtual returns(uint256[] memory) {
        uint256[] memory uintArguments = new uint256[](9);
        uintArguments[0] = poolStart;
        uintArguments[1] = minStrikePrice;
        uintArguments[2] = maxStrikePrice;
        uintArguments[3] = minExpiration;
        uintArguments[4] = maxExpiration;
        uintArguments[5] = baseVolatility;
        uintArguments[6] = tolerancePercentageToOraclePrice;
        uintArguments[7] = minimumTimeInMinutesToExerciseAnyProfit;
        uintArguments[8] = minimumProfitToExerciseAnyTime;
        return uintArguments;
    }
    
    /**
     * @dev Function to create a new ACO pool.
     * It deploys a minimal proxy for the ACO pool implementation address. 
     * @param underlying Address of the underlying asset (0x0 for Ethereum).
     * @param strikeAsset Address of the strike asset (0x0 for Ethereum).
     * @param isCall True if the type is CALL, false for PUT.
     * @param poolStart The UNIX time that the ACO pool can start negotiated ACO tokens.
     * @param minStrikePrice The minimum strike price for ACO tokens with the strike asset precision.
     * @param maxStrikePrice The maximum strike price for ACO tokens with the strike asset precision.
     * @param minExpiration The minimum expiration time for ACO tokens.
     * @param maxExpiration The maximum expiration time for ACO tokens.
     * @param canBuy Whether the pool buys ACO tokens otherwise, it only sells.
     * @param baseVolatility The base volatility for the pool starts. It is a percentage value (100000 is 100%).
     * @return The created ACO pool address.
     */
    function createAcoPool(
        address underlying, 
        address strikeAsset, 
        bool isCall,
        uint256 poolStart,
        uint256 minStrikePrice,
        uint256 maxStrikePrice,
        uint256 minExpiration,
        uint256 maxExpiration,
        bool canBuy,
        uint256 baseVolatility
    ) onlyFactoryAdmin external virtual returns(address) {
        return _createAcoPool(
            underlying, 
            strikeAsset, 
            isCall,
            canBuy,
            poolStrategy,
            getUintArgumentsToCreateAcoPool(
                poolStart,
                minStrikePrice,
                maxStrikePrice,
                minExpiration,
                maxExpiration,
                baseVolatility,
                poolTolerancePercentageToOraclePrice,
                poolMinimumTimeInMinutesToExerciseAnyProfit,
                poolMinimumProfitToExerciseAnyTime
            )
        );
    }
    
    /**
     * @dev Function to create a new ACO pool overriding base pool parameters on the factory.
     * It deploys a minimal proxy for the ACO pool implementation address. 
     * @param underlying Address of the underlying asset (0x0 for Ethereum).
     * @param strikeAsset Address of the strike asset (0x0 for Ethereum).
     * @param isCall True if the type is CALL, false for PUT.
     * @param canBuy Whether the pool buys ACO tokens otherwise, it only sells.
     * @param strategy Address of the pool strategy to be overriden.
     * @param uintArguments All uint256 arguments required to create ACO pool. (handle with stack too deep error)
     * @return The created ACO pool address.
     */
    function createAcoPoolOverriding(
        address underlying, 
        address strikeAsset, 
        bool isCall,
        bool canBuy,
        address strategy,
        uint256[] calldata uintArguments
    ) onlyFactoryAdmin external virtual returns(address) {
        _validateStrategy(strategy);
        return _createAcoPool(
            underlying, 
            strikeAsset, 
            isCall,
            canBuy,
            strategy,
            uintArguments
        );
    }
    
    /**
     * @dev Function to set the factory admin address.
     * Only can be called by the factory admin.
     * @param newFactoryAdmin Address of the new factory admin.
     */
    function setFactoryAdmin(address newFactoryAdmin) onlyFactoryAdmin external virtual {
        _setFactoryAdmin(newFactoryAdmin);
    }
    
    /**
     * @dev Function to set the ACO pool implementation address.
     * Only can be called by the factory admin.
     * @param newAcoPoolImplementation Address of the new ACO pool implementation.
     */
    function setAcoPoolImplementation(address newAcoPoolImplementation) onlyFactoryAdmin external virtual {
        _setAcoPoolImplementation(newAcoPoolImplementation);
    }
    
    /**
     * @dev Function to set the ACO factory address.
     * Only can be called by the factory admin.
     * @param newAcoFactory Address of the new ACO pool implementation.
     */
    function setAcoFactory(address newAcoFactory) onlyFactoryAdmin external virtual {
        _setAcoFactory(newAcoFactory);
    }
    
    /**
     * @dev Function to set the ACO flash exercise address.
     * Only can be called by the factory admin.
     * @param newAcoFlashExercise Address of the new ACO flash exercise.
     */
    function setAcoFlashExercise(address newAcoFlashExercise) onlyFactoryAdmin external virtual {
        _setAcoFlashExercise(newAcoFlashExercise);
    }
    
    /**
     * @dev Function to set the ACO pool permission.
     * Only can be called by the factory admin.
     * @param poolAdmin Address of the pool admin.
     * @param newPermission The permission to be set.
     */
    function setAcoPoolPermission(address poolAdmin, bool newPermission) onlyFactoryAdmin external virtual {
        _setAcoPoolPermission(poolAdmin, newPermission);
    }
    
    /**
     * @dev Function to set the ACO pool strategies permitted.
     * Only can be called by the factory admin.
     * @param strategy Address of the strategy.
     * @param newPermission The permission to be set.
     */
    function setAcoPoolStrategyPermission(address strategy, bool newPermission) onlyFactoryAdmin external virtual {
        _setAcoPoolStrategyPermission(strategy, newPermission);
    }
    
    /**
     * @dev Function to set the base pool strategy.
     * Only can be called by a pool admin.
     * @param newPoolStrategy Address of the new base pool strategy.
     */
    function setPoolStrategy(address newPoolStrategy) onlyPoolAdmin external virtual {
        _setPoolStrategy(newPoolStrategy);
    }
    
    /**
     * @dev Function to set the base pool tolerance to the oracle price.
     * Only can be called by a pool admin.
     * @param newPoolTolerancePercentageToOraclePrice Value of the new base pool tolerance to the oracle price. It is a percentage value (100000 is 100%).
     */
    function setPoolTolerancePercentageToOraclePrice(uint256 newPoolTolerancePercentageToOraclePrice) onlyPoolAdmin external virtual {
        _setPoolTolerancePercentageToOraclePrice(newPoolTolerancePercentageToOraclePrice);
    }
    
    /**
     * @dev Function to set the base pool minimum time in minutes to exercise ACO tokens with any profit.
     * Only can be called by a pool admin.
     * @param newPoolMinimumTimeInMinutesToExerciseAnyProfit Value of the new base pool minimum time in minutes to exercise ACO tokens with any profit.
     */
    function setPoolMinimumTimeInMinutesToExerciseAnyProfit(uint256 newPoolMinimumTimeInMinutesToExerciseAnyProfit) onlyPoolAdmin external virtual {
        _setPoolMinimumTimeInMinutesToExerciseAnyProfit(newPoolMinimumTimeInMinutesToExerciseAnyProfit);
    }
    
    /**
     * @dev Function to set the base pool minimum profit to exercise ACO tokens any time.
     * Only can be called by a pool admin.
     * @param newPoolMinimumProfitToExerciseAnyTime Value of the new base pool minimum profit to exercise ACO tokens any time. It is a percentage value (100000 is 100%).
     */
    function setPoolMinimumProfitToExerciseAnyTime(uint256 newPoolMinimumProfitToExerciseAnyTime) onlyPoolAdmin external virtual {
        _setPoolMinimumProfitToExerciseAnyTime(newPoolMinimumProfitToExerciseAnyTime);
    }
    
    /**
     * @dev Function to change the ACO pools strategy.
     * Only can be called by a pool admin.
     * @param strategy Address of the strategy to be set.
     * @param acoPools Array of ACO pools addresses.
     */
    function setAcoPoolStrategy(address strategy, address[] calldata acoPools) onlyPoolAdmin external virtual {
        _setAcoPoolStrategy(strategy, acoPools);
    }
    
    /**
     * @dev Function to change the ACO pools base volatilities.
     * Only can be called by a pool admin.
     * @param baseVolatilities Array of the base volatilities to be set.
     * @param acoPools Array of ACO pools addresses.
     */
    function setAcoPoolBaseVolatility(uint256[] calldata baseVolatilities, address[] calldata acoPools) onlyPoolAdmin external virtual {
        _setAcoPoolBaseVolatility(baseVolatilities, acoPools);
    }
    
    /**
     * @dev Internal function to set the factory admin address.
     * @param newFactoryAdmin Address of the new factory admin.
     */
    function _setFactoryAdmin(address newFactoryAdmin) internal virtual {
        require(newFactoryAdmin != address(0), "ACOPoolFactory::_setFactoryAdmin: Invalid factory admin");
        emit SetFactoryAdmin(factoryAdmin, newFactoryAdmin);
        factoryAdmin = newFactoryAdmin;
    }
    
    /**
     * @dev Internal function to set the ACO pool implementation address.
     * @param newAcoPoolImplementation Address of the new ACO pool implementation.
     */
    function _setAcoPoolImplementation(address newAcoPoolImplementation) internal virtual {
        require(Address.isContract(newAcoPoolImplementation), "ACOPoolFactory::_setAcoPoolImplementation: Invalid ACO pool implementation");
        emit SetAcoPoolImplementation(acoPoolImplementation, newAcoPoolImplementation);
        acoPoolImplementation = newAcoPoolImplementation;
    }
    
    /**
     * @dev Internal function to set the ACO factory address.
     * @param newAcoFactory Address of the new ACO pool implementation.
     */
    function _setAcoFactory(address newAcoFactory) internal virtual {
        require(Address.isContract(newAcoFactory), "ACOPoolFactory::_setAcoFactory: Invalid ACO factory");
        emit SetAcoFactory(acoFactory, newAcoFactory);
        acoFactory = newAcoFactory;
    }
    
    /**
     * @dev Internal function to set the ACO flash exercise address.
     * @param newAcoFlashExercise Address of the new ACO flash exercise.
     */
    function _setAcoFlashExercise(address newAcoFlashExercise) internal virtual {
        require(Address.isContract(newAcoFlashExercise), "ACOPoolFactory::_setAcoFlashExercise: Invalid ACO flash exercise");
        emit SetAcoFlashExercise(acoFlashExercise, newAcoFlashExercise);
        acoFlashExercise = newAcoFlashExercise;
    }
    
    /**
     * @dev Internal function to set the ACO pool permission.
     * @param poolAdmin Address of the pool admin.
     * @param newPermission The permission to be set.
     */
    function _setAcoPoolPermission(address poolAdmin, bool newPermission) internal virtual {
        emit SetAcoPoolPermission(poolAdmin, poolAdminPermission[poolAdmin], newPermission);
        poolAdminPermission[poolAdmin] = newPermission;
    }
    
    /**
     * @dev Internal function to set the ACO pool strategies permitted.
     * @param strategy Address of the strategy.
     * @param newPermission The permission to be set.
     */
    function _setAcoPoolStrategyPermission(address strategy, bool newPermission) internal virtual {
        require(Address.isContract(strategy), "ACOPoolFactory::_setAcoPoolStrategy: Invalid strategy");
        emit SetStrategyPermission(strategy, strategyPermitted[strategy], newPermission);
        strategyPermitted[strategy] = newPermission;
    }
    
    /**
     * @dev Internal function to set the base pool strategy.
     * @param newPoolStrategy Address of the new base pool strategy.
     */
    function _setPoolStrategy(address newPoolStrategy) internal virtual {
        _validateStrategy(newPoolStrategy);
        emit SetPoolStrategy(poolStrategy, newPoolStrategy);
        poolStrategy = newPoolStrategy;
    }
    
    /**
     * @dev Internal function to set the base pool tolerance to the oracle price.
     * @param newPoolTolerancePercentageToOraclePrice Value of the new base pool tolerance to the oracle price. It is a percentage value (100000 is 100%).
     */
    function _setPoolTolerancePercentageToOraclePrice(uint256 newPoolTolerancePercentageToOraclePrice) internal virtual {
        emit SetPoolTolerancePercentageToOraclePrice(poolTolerancePercentageToOraclePrice, newPoolTolerancePercentageToOraclePrice);
        poolTolerancePercentageToOraclePrice = newPoolTolerancePercentageToOraclePrice;
    }
    
    /**
     * @dev Internal function to set the base pool minimum time in minutes to exercise ACO tokens with any profit.
     * @param newPoolMinimumTimeInMinutesToExerciseAnyProfit Value of the new base pool minimum time in minutes to exercise ACO tokens with any profit.
     */
    function _setPoolMinimumTimeInMinutesToExerciseAnyProfit(uint256 newPoolMinimumTimeInMinutesToExerciseAnyProfit) internal virtual {
        emit SetPoolMinimumTimeInMinutesToExerciseAnyProfit(poolMinimumTimeInMinutesToExerciseAnyProfit, newPoolMinimumTimeInMinutesToExerciseAnyProfit);
        poolMinimumTimeInMinutesToExerciseAnyProfit = newPoolMinimumTimeInMinutesToExerciseAnyProfit;
    }
    
    /**
     * @dev Internal unction to set the base pool minimum profit to exercise ACO tokens any time.
     * @param newPoolMinimumProfitToExerciseAnyTime Value of the new base pool minimum profit to exercise ACO tokens any time. It is a percentage value (100000 is 100%).
     */
    function _setPoolMinimumProfitToExerciseAnyTime(uint256 newPoolMinimumProfitToExerciseAnyTime) internal virtual {
        emit SetPoolMinimumProfitToExerciseAnyTime(poolMinimumProfitToExerciseAnyTime, newPoolMinimumProfitToExerciseAnyTime);
        poolMinimumProfitToExerciseAnyTime = newPoolMinimumProfitToExerciseAnyTime;
    }
    
    /**
     * @dev Internal function to validate strategy.
     * @param strategy Address of the strategy.
     */
    function _validateStrategy(address strategy) view internal virtual {
        require(strategyPermitted[strategy], "ACOPoolFactory::_validateStrategy: Invalid strategy");
    }
    
    /**
     * @dev Internal function to change the ACO pools strategy.
     * @param strategy Address of the strategy to be set.
     * @param acoPools Array of ACO pools addresses.
     */
    function _setAcoPoolStrategy(address strategy, address[] memory acoPools) internal virtual {
        _validateStrategy(strategy);
        for (uint256 i = 0; i < acoPools.length; ++i) {
            IACOPool(acoPools[i]).setStrategy(strategy);
        }
    }
    
    /**
     * @dev Internal function to change the ACO pools base volatilities.
     * @param baseVolatilities Array of the base volatilities to be set.
     * @param acoPools Array of ACO pools addresses.
     */
    function _setAcoPoolBaseVolatility(uint256[] memory baseVolatilities, address[] memory acoPools) internal virtual {
        require(baseVolatilities.length == acoPools.length, "ACOPoolFactory::_setAcoPoolBaseVolatility: Invalid arguments");
        for (uint256 i = 0; i < acoPools.length; ++i) {
            IACOPool(acoPools[i]).setBaseVolatility(baseVolatilities[i]);
        }
    }
    
    /**
     * @dev Internal function to create a new ACO pool.
     * @param underlying Address of the underlying asset (0x0 for Ethereum).
     * @param strikeAsset Address of the strike asset (0x0 for Ethereum).
     * @param isCall True if the type is CALL, false for PUT.
     * @param canBuy Whether the pool buys ACO tokens otherwise, it only sells.
     * @param strategy Address of the pool strategy.
     * @param uintArguments All uint256 arguments required to create ACO pool. (handle with stack too deep error)
     * @return Address of the new minimal proxy deployed for the ACO pool.
     */
    function _createAcoPool(
        address underlying, 
        address strikeAsset, 
        bool isCall,
        bool canBuy,
        address strategy,
        uint256[] memory uintArguments
    ) internal virtual returns(address) {
        address acoPool  = _deployAcoPool(underlying, strikeAsset, isCall, canBuy, strategy, uintArguments);
        acoPoolData[acoPool] = ACOPoolData(uintArguments[0], underlying, strikeAsset, isCall, uintArguments[1], uintArguments[2], uintArguments[3], uintArguments[4], canBuy);
        emit NewAcoPool(underlying, strikeAsset, isCall, uintArguments[0], uintArguments[1], uintArguments[2], uintArguments[3], uintArguments[4], canBuy, acoPool, acoPoolImplementation);
        return acoPool;
    }
    
    /**
     * @dev Internal function to deploy a minimal proxy using ACO pool implementation.
     * @param underlying Address of the underlying asset (0x0 for Ethereum).
     * @param strikeAsset Address of the strike asset (0x0 for Ethereum).
     * @param isCall True if the type is CALL, false for PUT.
     * @param canBuy Whether the pool buys ACO tokens otherwise, it only sells.
     * @param strategy Address of the pool strategy.
     * @param uintArguments All uint256 arguments required to create ACO pool. (handle with stack too deep error)
     * @return Address of the new minimal proxy deployed for the ACO pool.
     */
    function _deployAcoPool(
        address underlying, 
        address strikeAsset, 
        bool isCall,
        bool canBuy,
        address strategy,
        uint256[] memory uintArguments
    ) internal virtual returns(address) {
        bytes20 implentationBytes = bytes20(acoPoolImplementation);
        address proxy;
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), implentationBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            proxy := create(0, clone, 0x37)
        }
        _initPool(proxy, underlying, strikeAsset, isCall, canBuy, strategy, uintArguments);
        return proxy;
    }
    
    /**
     * @dev Internal function to initialize the ACO pool.
     * @param proxy Address of the minimal proxy created for the ACO pool.
     * @param underlying Address of the underlying asset (0x0 for Ethereum).
     * @param strikeAsset Address of the strike asset (0x0 for Ethereum).
     * @param isCall True if the type is CALL, false for PUT.
     * @param canBuy Whether the pool buys ACO tokens otherwise, it only sells.
     * @param strategy Address of the pool strategy.
     * @param uintArguments All uint256 arguments required to create ACO pool. (handle with stack too deep error)
     */
    function _initPool(
        address proxy,
        address underlying, 
        address strikeAsset, 
        bool isCall,
        bool canBuy,
        address strategy,
        uint256[] memory uintArguments
    ) internal virtual {
        IACOPool(proxy).init(uintArguments[0], acoFlashExercise, acoFactory, underlying, strikeAsset, uintArguments[1], uintArguments[2], uintArguments[3], uintArguments[4], isCall, canBuy, uintArguments[6], uintArguments[7], uintArguments[8]);
        IACOPool(proxy).setStrategy(strategy);
        IACOPool(proxy).setBaseVolatility(uintArguments[5]);
    }
}