pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../util/Ownable.sol';
import '../../libs/SafeMath.sol';
import '../../libs/Address.sol';
import '../../libs/ACOAssetHelper.sol';
import '../../core/ERC20.sol';
import '../../interfaces/IACOVault.sol';
import '../../interfaces/IController.sol';
import '../../interfaces/IACOPoolFactory.sol';
import '../../interfaces/IACOFlashExercise.sol';
import '../../interfaces/IACOFactory.sol';
import '../../interfaces/IACOAssetConverterHelper.sol';
import '../../interfaces/IACOToken.sol';
import '../../interfaces/IACOPool.sol';


contract ACOVault is Ownable, ERC20, IACOVault {
    using Address for address;
    
    uint256 internal constant MAX_UINT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    
    struct AccountData {
        uint256 accumulatedExercisedValue;
        mapping(address => uint256) previousAcoTokensAmounts;
        mapping(address => uint256) acoTokenOnDepositIndex;
        address[] acoTokensOnDeposit;
    }

    event SetController(address indexed oldController, address indexed newController);
    event SetAssetConverter(address indexed oldAssetConverter, address indexed newAssetConverter);
    event SetAcoFlashExercise(address indexed oldAcoFlashExercise, address indexed newAcoFlashExercise);
    event SetMinPercentageToKeep(uint256 indexed oldMinPercentageToKeep, uint256 indexed newMinPercentageToKeep);
    event SetAcoToken(address indexed oldAcoToken, address indexed oldAcoPool, address newAcoToken, address newAcoPool);
    event SetTolerancePriceAbove(uint256 indexed oldTolerancePriceAbove, uint256 indexed newTolerancePriceAbove);
    event SetTolerancePriceBelow(uint256 indexed oldTolerancePriceBelow, uint256 indexed newTolerancePriceBelow);
    event SetMinExpiration(uint256 indexed oldMinExpiration, uint256 indexed newMinExpiration);
    event SetMaxExpiration(uint256 indexed oldMaxExpiration, uint256 indexed newMaxExpiration);
    event SetMinTimeToExercise(uint256 indexed oldMinTimeToExercise, uint256 indexed newMinTimeToExercise);
    event RemoveExpiredAco(address indexed acoToken);
    event ExerciseAco(address indexed acoToken, uint256 acoTokensOut, uint256 tokenIn);

    IACOPoolFactory public immutable acoPoolFactory;
    IACOFactory public immutable acoFactory;
    IERC20 public immutable token;
    
    uint256 public minPercentageToKeep;
    
    IController public controller;
    IACOAssetConverterHelper public assetConverter;
    IACOFlashExercise public acoFlashExercise;
    
    IACOPool public acoPool;
    IACOToken public currentAcoToken;
    address[] public acoTokens;
    mapping(address => uint256) public acoTokensAmount;
    mapping(address => uint256) public acoTokensIndex;
    uint256 public tolerancePriceAbove;
    uint256 public tolerancePriceBelow;
    uint256 public minExpiration;
    uint256 public maxExpiration;
    uint256 public minTimeToExercise;
    
    uint256 public totalTokensOnExercise;
    mapping(address => AccountData) public accounts;
    
    constructor(VaultInitData memory initData) public {
        super.init();
        
        require(initData.acoPoolFactory.isContract(), "ACOVault:: Invalid ACO pool factory");
        require(initData.acoFactory.isContract(), "ACOVault:: Invalid ACO factory");
        require(initData.token.isContract(), "ACOVault:: Invalid token");
        
        acoPoolFactory = IACOPoolFactory(initData.acoPoolFactory);
        acoFactory = IACOFactory(initData.acoFactory);
        token = IERC20(initData.token);
        _setController(IERC20(initData.token), initData.controller);
        _setAssetConverter(initData.assetConverter);
        _setAcoFlashExercise(initData.acoFlashExercise);
        _setMinPercentageToKeep(initData.minPercentageToKeep);
        _setMinTimeToExercise(initData.minTimeToExercise);
        _setMaxExpiration(initData.maxExpiration);
        _setMinExpiration(initData.minExpiration);
        _setTolerancePriceAbove(initData.tolerancePriceAbove);
        _setTolerancePriceBelow(initData.tolerancePriceBelow);
        _setAcoToken(IACOAssetConverterHelper(initData.assetConverter), IACOFactory(initData.acoFactory), IACOPoolFactory(initData.acoPoolFactory), initData.currentAcoToken, initData.acoPool);
    }

    function name() public view override returns(string memory) {
        return string(abi.encodePacked("ACO Vault ", ACOAssetHelper._getAssetSymbol(address(token))));
    }

    function symbol() public view override returns(string memory) {
        return name();
    }

    function decimals() public view override returns(uint8) {
        return ACOAssetHelper._getAssetDecimals(address(token));
    }

    function balance() public override view returns(uint256) {
        return token.balanceOf(address(this)).add(controller.balanceOf(address(token)));
    }

    function available() public override view returns(uint256) {
        return token.balanceOf(address(this)).mul(minPercentageToKeep).div(100000);
    }

    function numberOfAcoTokensNegotiated() public override view returns(uint256) {
        return acoTokens.length;
    }

    function getPricePerFullShare() public override view returns(uint256) {
        uint256 _decimals = uint256(decimals());
        return balance().mul(_decimals).div(totalSupply());
    }
  
    function setController(address newController) onlyOwner external override {
        _setController(token, newController);
    }
    
    function setAssetConverter(address newAssetConverter) onlyOwner external override {
        _setAssetConverter(newAssetConverter);
    }
    
    function setAcoFlashExercise(address newAcoFlashExercise) onlyOwner external override {
        _setAcoFlashExercise(newAcoFlashExercise);
    }
    
    function setMinPercentageToKeep(uint256 newMinPercentageToKeep) onlyOwner external override {
        _setMinPercentageToKeep(newMinPercentageToKeep);
    }
    
    function setTolerancePriceBelow(uint256 newTolerancePriceBelow) onlyOwner external override {
        _setTolerancePriceBelow(newTolerancePriceBelow);
    }

    function setTolerancePriceAbove(uint256 newTolerancePriceAbove) onlyOwner external override {
        _setTolerancePriceAbove(newTolerancePriceAbove);
    }

    function setMinExpiration(uint256 newMinExpiration) onlyOwner external override {
        _setMinExpiration(newMinExpiration);
    }

    function setMaxExpiration(uint256 newMaxExpiration) onlyOwner external override {
        _setMaxExpiration(newMaxExpiration);
    }
    
    function setMinTimeToExercise(uint256 newMinTimeToExercise) onlyOwner external override {
        _setMinTimeToExercise(newMinTimeToExercise);
    }
    
    function setAcoToken(address newAcoToken, address newAcoPool) external override {
        _setAcoToken(assetConverter, acoFactory, acoPoolFactory, newAcoToken, newAcoPool);
    }
    
    function earn() public override {
        controller.earn(address(token), available());
    }

    function deposit(uint256 amount) external override {
        require(amount > 0, "ACOVault:: Invalid amount");
        uint256 _totalBalance = balance();
        ACOAssetHelper._receiveAsset(address(token), amount);
        
        uint256 previousShare = balanceOf(msg.sender);
        uint256 shares = 0;
        if (_totalBalance == 0) {
            shares = amount;
        } else {
            shares = amount.mul(totalSupply()).div(_totalBalance);
        }
            
        address _currentAcoToken = address(currentAcoToken);
        bool addCurrentAcoToken = true;
        AccountData storage data = accounts[msg.sender];
        if (previousShare > 0) {
            _removeExpiredAcoTokensFromAccountData(data);
            
            //TODO check calculation
            data.accumulatedExercisedValue = previousShare.mul(data.accumulatedExercisedValue).add(shares.mul(totalTokensOnExercise)).div(shares.add(previousShare));

            for (uint256 i = 0; i < data.acoTokensOnDeposit.length; ++i) {
                if (data.acoTokensOnDeposit[i] == _currentAcoToken) {
                    addCurrentAcoToken = false;
                    break;
                }
            }
        } else {
            data.accumulatedExercisedValue = totalTokensOnExercise;
        }
        
        if (addCurrentAcoToken) {
            data.previousAcoTokensAmounts[_currentAcoToken] = acoTokensAmount[_currentAcoToken];
            data.acoTokenOnDepositIndex[_currentAcoToken] = data.acoTokensOnDeposit.length;
            data.acoTokensOnDeposit.push(_currentAcoToken);
        }
        
        super._mintAction(msg.sender, shares);
    }

    function withdraw(uint256 shares) external override {
        //TODO
        
        AccountData storage data = accounts[msg.sender];
        uint256 vaultBalance = balance();
        uint256 vaulTotalSupply = totalSupply();
        uint256 profit = totalTokensOnExercise.sub(data.accumulatedExercisedValue);
        uint256 _balance = shares.add(profit.mul(vaultBalance).div(vaulTotalSupply));
        
        _removeExpiredAcoTokensFromAccountData(data);
        //(address _acoTokens[], uint256 amounts) = _getAcoTokensOnWithdraw(data, vaultBalance, vaulTotalSupply);
        uint256 totalShares = balanceOf(msg.sender);
        if (totalShares == shares) {
            delete accounts[msg.sender];
        }
        
        super._burnAction(msg.sender, shares);
        
        uint256 bufferBalance = token.balanceOf(address(this));
        if (bufferBalance < _balance) {
            uint256 _withdraw = _balance.sub(bufferBalance);
            controller.withdraw(address(token), _withdraw);
            uint256 afterBalance = token.balanceOf(address(this));
            uint256 diff = afterBalance.sub(bufferBalance);
            if (diff < _withdraw) {
                _balance = bufferBalance.add(diff);
            }
        }
        ACOAssetHelper._transferAsset(address(token), msg.sender, _balance);
        /*for (uint256 i = 0; i < _acoTokens.length; ++i) {
            ACOAssetHelper._transferAsset(_acoTokens[i], msg.sender, amounts[i]);
        }*/
    }
    
    function exerciseAco(address _acoToken) public override {
        (address underlying, 
         address strikeAsset, 
         bool isCall,, 
         uint256 expiryTime) = acoFactory.acoTokenData(_acoToken);
        require(expiryTime <= minTimeToExercise.add(block.timestamp), "ACOVault:: Invalid time to exercise");
        
        uint256 acoBalance = ACOAssetHelper._getAssetBalanceOf(_acoToken, address(this));
        require(acoBalance > 0, "ACOVault:: No balance to exercise");
        
        address collateral;
        uint256 _decimals;
        if (isCall) {
            collateral = underlying;
            _decimals = ACOAssetHelper._getAssetDecimals(strikeAsset);
        } else {
            collateral = strikeAsset;
            _decimals = ACOAssetHelper._getAssetDecimals(underlying);
        }
        uint256 price = assetConverter.getPrice(underlying, strikeAsset);
        uint256 minIntrinsicValue = price.mul(acoBalance).add(1).div(10 ** _decimals);
        require(minIntrinsicValue > 0, "ACOVault:: Balance too small");
        
        uint256 previousTokenAmount = token.balanceOf(address(this));
        if (IACOToken(_acoToken).allowance(address(this), address(acoFlashExercise)) < acoBalance) {
            ACOAssetHelper._callApproveERC20(_acoToken, address(acoFlashExercise), MAX_UINT);    
        }
        acoFlashExercise.flashExercise(_acoToken, acoBalance, minIntrinsicValue, block.timestamp);
        
        if (collateral != address(token)) {
            uint256 collateralBalance = ACOAssetHelper._getAssetBalanceOf(collateral, address(this));
            uint256 etherAmount = 0;
            if (ACOAssetHelper._isEther(collateral)) {
                etherAmount = collateralBalance;
            } else if (ACOAssetHelper._getAssetAllowance(collateral, address(this), address(assetConverter)) < collateralBalance) {
                ACOAssetHelper._callApproveERC20(collateral, address(assetConverter), MAX_UINT);
            }
            assetConverter.swapExactAmountOut{value: etherAmount}(collateral, address(token), collateralBalance);
        }
        
        uint256 tokenIn = token.balanceOf(address(this)).sub(previousTokenAmount);
        totalTokensOnExercise = tokenIn.add(totalTokensOnExercise);
        
        emit ExerciseAco(_acoToken, acoBalance, tokenIn);
    }
    
    function removeExpiredAcos() public override {
        for (uint256 i = acoTokens.length; i > 0; --i) {
            address acoToken = acoTokens[i - 1];
            removeExpiredAco(acoToken);
        }
    }
    
    function removeExpiredAco(address _acoToken) public override {
        uint256 expiryTime = IACOToken(_acoToken).expiryTime();
        if (expiryTime >= block.timestamp) {
			uint256 lastIndex = acoTokens.length - 1;
			uint256 index = acoTokensIndex[_acoToken];
			if (lastIndex != index) {
				address last = acoTokens[lastIndex];
				acoTokensIndex[last] = index;
				acoTokens[index] = last;
			}
            acoTokens.pop();
            delete acoTokensIndex[_acoToken];
            delete acoTokensAmount[_acoToken];
            emit RemoveExpiredAco(_acoToken);
        }
    }
    
    function _removeExpiredAcoTokensFromAccountData(AccountData storage data) internal {
        for (uint256 i = data.acoTokensOnDeposit.length; i > 0; --i) {
            address _acoToken = data.acoTokensOnDeposit[i - 1];
            uint256 expiryTime = IACOToken(_acoToken).expiryTime();
            if (expiryTime >= block.timestamp) {
                uint256 lastIndex = data.acoTokensOnDeposit.length - 1;
			    uint256 index = data.acoTokenOnDepositIndex[_acoToken];
    			if (lastIndex != index) {
    				address last = data.acoTokensOnDeposit[lastIndex];
    				data.acoTokenOnDepositIndex[last] = index;
    				data.acoTokensOnDeposit[index] = last;
    			}
                data.acoTokensOnDeposit.pop();
                delete data.acoTokenOnDepositIndex[_acoToken];
                delete data.previousAcoTokensAmounts[_acoToken];
            }
        }
    }
    
    function _setAcoToken(
        IACOAssetConverterHelper _assetConverter,
        IACOFactory _acoFactory, 
        IACOPoolFactory _acoPoolFactory, 
        address newAcoToken, 
        address newAcoPool
    ) internal {
        _acoTokenAndPoolValidation(_assetConverter, _acoFactory, _acoPoolFactory, newAcoToken, newAcoPool);
        
        emit SetAcoToken(address(currentAcoToken), address(acoPool), newAcoToken, newAcoPool);
        
        acoPool = IACOPool(newAcoPool);
        currentAcoToken = IACOToken(newAcoToken);
        
        bool add = true;
        for (uint256 i = 0; i < acoTokens.length; ++i) {
            if (acoTokens[i] == newAcoToken) {
                add = false;
                break;
            }
        }
        if (add) {
            acoTokensIndex[newAcoToken] = acoTokens.length;
            acoTokens.push(newAcoToken);
        }
    }
    
    function _acoTokenAndPoolValidation(
        IACOAssetConverterHelper _assetConverter,
        IACOFactory _acoFactory, 
        IACOPoolFactory _acoPoolFactory, 
        address newAcoToken, 
        address newAcoPool
    ) internal view {
        
        (address underlying, 
         address strikeAsset, 
         bool isCall, 
         uint256 strikePrice, 
         uint256 expiryTime) = _acoFactory.acoTokenData(newAcoToken);
        require(underlying != strikeAsset, "ACOVault:: Invalid ACO token");
        
        _acoTokenValidation(_assetConverter, underlying, strikeAsset, strikePrice, expiryTime);
        _acoPoolValidation(_acoPoolFactory, newAcoPool, underlying, strikeAsset, isCall, strikePrice, expiryTime); 
    }
    
    function _acoTokenValidation(
        IACOAssetConverterHelper _assetConverter,
        address underlying, 
        address strikeAsset, 
        uint256 strikePrice, 
        uint256 expiryTime
    ) internal view {
        uint256 minExpiryTime = minExpiration.add(block.timestamp);
        uint256 maxExpiryTime = maxExpiration.add(block.timestamp);
        require(expiryTime >= minExpiryTime && expiryTime <= maxExpiryTime, "ACOVault:: Invalid ACO expiry time");
        
        uint256 price = _assetConverter.getPrice(underlying, strikeAsset);
        uint256 maxPrice = price.mul(uint256(100000).add(tolerancePriceAbove));
        uint256 minPrice = price.mul(uint256(100000).sub(tolerancePriceAbove));
        
        require(strikePrice >= minPrice && strikePrice <= maxPrice, "ACOVault:: Invalid ACO strike price");
    }
    
    function _acoPoolValidation(
        IACOPoolFactory _acoPoolFactory,
        address newAcoPool,
        address underlying, 
        address strikeAsset, 
        bool isCall, 
        uint256 strikePrice, 
        uint256 expiryTime
    ) internal view {
        (uint256 poolStart, 
         address poolUnderlying, 
         address poolStrikeAsset, 
         bool poolIsCall, 
         uint256 poolMinStrikePrice, 
         uint256 poolMaxStrikePrice, 
         uint256 poolMinExpiration, 
         uint256 poolMaxExpiration,) = _acoPoolFactory.acoPoolData(newAcoPool);
        require(
            poolStart >= block.timestamp &&
            underlying == poolUnderlying &&
            strikeAsset == poolStrikeAsset &&
            isCall == poolIsCall &&
            poolMinStrikePrice >= strikePrice &&
            poolMaxStrikePrice <= strikePrice &&
            poolMinExpiration >= expiryTime &&
            poolMaxExpiration <= expiryTime, 
            "ACOVault:: Invalid ACO pool");
    }
    
    function _setController(IERC20 _token, address newController) internal {
        require(newController.isContract(), "ACOVault:: Invalid controller");
        emit SetController(address(controller), newController);
        _token.approve(newController, MAX_UINT);  
        controller = IController(newController);
    }
    
    function _setAssetConverter(address newAssetConverter) internal {
        require(newAssetConverter.isContract(), "ACOVault:: Invalid asset converter");
        emit SetAssetConverter(address(assetConverter), newAssetConverter);
        assetConverter = IACOAssetConverterHelper(newAssetConverter);
    }
    
    function _setAcoFlashExercise(address newAcoFlashExercise) internal {
        require(newAcoFlashExercise.isContract(), "ACOVault:: Invalid ACO flash exercise");
        emit SetAcoFlashExercise(address(acoFlashExercise), newAcoFlashExercise);
        acoFlashExercise = IACOFlashExercise(newAcoFlashExercise);
    }
    
    function _setMinPercentageToKeep(uint256 newMinPercentageToKeep) internal {
        require(newMinPercentageToKeep < 100000, "ACOVault:: Invalid percentage");
        emit SetMinPercentageToKeep(minPercentageToKeep, newMinPercentageToKeep);
        minPercentageToKeep = newMinPercentageToKeep;
    }
    
    function _setTolerancePriceAbove(uint256 newTolerancePriceAbove) internal {
        require(newTolerancePriceAbove < 100000, "ACOVault:: Invalid tolerance");
        emit SetTolerancePriceAbove(tolerancePriceAbove, newTolerancePriceAbove);
        tolerancePriceAbove = newTolerancePriceAbove;
    }
    
    function _setTolerancePriceBelow(uint256 newTolerancePriceBelow) internal {
        require(newTolerancePriceBelow < 100000, "ACOVault:: Invalid tolerance");
        emit SetTolerancePriceBelow(tolerancePriceBelow, newTolerancePriceBelow);
        tolerancePriceBelow = newTolerancePriceBelow;
    }
    
    function _setMinExpiration(uint256 newMinExpiration) internal {
        require(newMinExpiration <= maxExpiration, "ACOVault:: Invalid min expiration");
        emit SetMinExpiration(minExpiration, newMinExpiration);
        minExpiration = newMinExpiration;
    }
    
    function _setMaxExpiration(uint256 newMaxExpiration) internal {
        require(newMaxExpiration >= maxExpiration, "ACOVault:: Invalid max expiration");
        emit SetMaxExpiration(maxExpiration, newMaxExpiration);
        maxExpiration = newMaxExpiration;
    }
    
    function _setMinTimeToExercise(uint256 newMinTimeToExercise) internal {
        require(newMinTimeToExercise >= 3600, "ACOVault:: Invalid min time to exercise");
        emit SetMinTimeToExercise(minTimeToExercise, newMinTimeToExercise);
        minTimeToExercise = newMinTimeToExercise;
    }
}