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
    event RewardAco(address indexed acoToken, uint256 acoTokenAmountIn);
    event ExerciseAco(address indexed acoToken, uint256 acoTokensOut, uint256 tokenIn);

    IACOPoolFactory public immutable override acoPoolFactory;
    IACOFactory public immutable override acoFactory;
    IERC20 public immutable override token;
    
    uint256 public override minPercentageToKeep;
    
    IController public override controller;
    IACOAssetConverterHelper public override assetConverter;
    IACOFlashExercise public override acoFlashExercise;
    
    IACOPool public override acoPool;
    IACOToken public override currentAcoToken;
    address[] public override acoTokens;
    uint256 public override tolerancePriceAbove;
    uint256 public override tolerancePriceBelow;
    uint256 public override minExpiration;
    uint256 public override maxExpiration;
    uint256 public override minTimeToExercise;
    
    mapping(address => Position) internal positions;
    mapping(address => AccountData) internal accounts;
    
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
        _setAcoToken(
            IERC20(initData.token),
            IACOAssetConverterHelper(initData.assetConverter), 
            IACOFactory(initData.acoFactory), 
            IACOPoolFactory(initData.acoPoolFactory), 
            initData.currentAcoToken, 
            initData.acoPool
        );
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
    
    function getPosition(address acoToken) external view override returns(Position memory) {
        return positions[acoToken];
    }
    
    function getAccountPositionsCount(address account) external view override returns(uint256) {
        AccountData storage data = accounts[account];
        return data.acoTokensOnDeposit.length;
    }
    
    function getAccountPositionByIndex(address account, uint256 index) external view override returns(address, Position memory) {
        AccountData storage data = accounts[account];
        address acoToken = data.acoTokensOnDeposit[index];
        return (acoToken, data.positionsOnDeposit[acoToken]);
    }
    
    function getAccountPositionByAco(address account, address acoToken) external view override returns(Position memory) {
        return accounts[account].positionsOnDeposit[acoToken];   
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
        _setAcoToken(token, assetConverter, acoFactory, acoPoolFactory, newAcoToken, newAcoPool);
    }
    
    function earn() public override {
        controller.earn(address(token), available());
    }

    function deposit(uint256 amount) external override {
        require(amount > 0, "ACOVault:: Invalid amount");
        uint256 _totalBalance = balance();
        ACOAssetHelper._receiveAsset(address(token), amount);
        
        uint256 shares = 0;
        if (_totalBalance == 0) {
            shares = amount;
        } else {
            shares = amount.mul(totalSupply()).div(_totalBalance);
        }
            
        address _currentAcoToken = address(currentAcoToken);
        Position storage acoData = positions[_currentAcoToken];
        AccountData storage accountData = accounts[msg.sender];
        _setAccountData(_currentAcoToken, acoData.amount, acoData.profit, balanceOf(msg.sender), shares, accountData);
        
        super._mintAction(msg.sender, shares);
    }

    function withdraw(uint256 shares) external override {
        uint256 vaulTotalSupply = totalSupply();
        uint256 accountBalance = shares.mul(balance()).div(vaulTotalSupply);
        
        uint256 accountShares = balanceOf(msg.sender);
        super._burnAction(msg.sender, shares);
        
        AccountData storage data = accounts[msg.sender];
        for (uint256 i = data.acoTokensOnDeposit.length; i > 0; --i) {
            address acoToken = data.acoTokensOnDeposit[i - 1];
            (uint256 acoAmount,,uint256 adjust) = _getPositionData(acoToken, shares, vaulTotalSupply, data);
            accountBalance = accountBalance.sub(adjust);
            uint256 expiryTime = IACOToken(acoToken).expiryTime();
            if (expiryTime >= block.timestamp) {
                _removeFromAccountData(acoToken, data);
            } else {
                if (acoAmount > 0) {
                    ACOAssetHelper._transferAsset(acoToken, msg.sender, acoAmount);
                }
                data.positionsOnDeposit[acoToken].amount = positions[acoToken].amount;  
                data.positionsOnDeposit[acoToken].profit = positions[acoToken].profit;  
            }
        }
        
        if (accountShares == shares) {
            delete accounts[msg.sender];
        }
        
        uint256 bufferBalance = token.balanceOf(address(this));
        if (bufferBalance < accountBalance) {
            uint256 _withdraw = accountBalance.sub(bufferBalance);
            controller.withdraw(address(token), _withdraw);
            uint256 afterBalance = token.balanceOf(address(this));
            uint256 diff = afterBalance.sub(bufferBalance);
            if (diff < _withdraw) {
                accountBalance = bufferBalance.add(diff);
            }
        }
        ACOAssetHelper._transferAsset(address(token), msg.sender, accountBalance);
    }
    
    function exerciseAco(address acoToken) external override {
        (uint256 acoBalance, uint256 minIntrinsicValue, address collateral) = _exerciseValidation(acoToken);
        
        uint256 previousTokenAmount = token.balanceOf(address(this));
        if (IACOToken(acoToken).allowance(address(this), address(acoFlashExercise)) < acoBalance) {
            ACOAssetHelper._callApproveERC20(acoToken, address(acoFlashExercise), MAX_UINT);    
        }
        acoFlashExercise.flashExercise(acoToken, acoBalance, minIntrinsicValue, block.timestamp);
        
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
        positions[acoToken].profit = positions[acoToken].profit.add(tokenIn); 
        
        emit ExerciseAco(acoToken, acoBalance, tokenIn);
    }
    
    function setReward(uint256 acoTokenAmount, uint256 assetAmount) external override {
        require(msg.sender == controller.getStrategy(address(this)), "ACOVault:: Invalid sender");
        address _currentAcoToken = address(currentAcoToken);
        uint256 amount = acoPool.swap(true, _currentAcoToken, acoTokenAmount, assetAmount, address(this), block.timestamp);
        positions[_currentAcoToken].amount = amount.add(positions[_currentAcoToken].amount);
        emit RewardAco(_currentAcoToken, amount);
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal override {
        AccountData storage senderData = accounts[sender];
        AccountData storage recipientData = accounts[recipient];
        uint256 senderPreviousShares = balanceOf(sender);
        uint256 recipientPreviousShares = balanceOf(recipient);
        for (uint256 i = senderData.acoTokensOnDeposit.length; i > 0; --i) {
            address acoToken = senderData.acoTokensOnDeposit[i - 1];
            uint256 acoAmount;
            uint256 acoProfit;
            
            if (senderPreviousShares == amount) {
                acoAmount = senderData.positionsOnDeposit[acoToken].amount;
                acoProfit = senderData.positionsOnDeposit[acoToken].profit;
                _removeFromAccountData(acoToken, senderData);
            } else {
                (acoAmount, acoProfit) = _setAcoDataForTransfer(acoToken, amount, senderPreviousShares, senderData);
            }
            
            _setAccountData(acoToken, acoAmount, acoProfit, recipientPreviousShares, amount, recipientData);
        }
        super._transferAction(sender, recipient, amount);   
    }
    
    function _setAcoDataForTransfer(
        address acoToken,
        uint256 amount,
        uint256 senderPreviousShares,
        AccountData storage senderData
    ) internal returns(uint256, uint256) {
        Position storage acoData = positions[acoToken];
        uint256 senderAmount = senderData.positionsOnDeposit[acoToken].amount;
        uint256 senderProfit = senderData.positionsOnDeposit[acoToken].profit;
        uint256 diffAmount = acoData.amount.sub(senderAmount);
        uint256 diffProfit = acoData.profit.sub(senderProfit);
        uint256 remainingAmount = amount.mul(diffAmount).div(senderPreviousShares);
        uint256 remainingProfit = amount.mul(diffProfit).div(senderPreviousShares);
        senderData.positionsOnDeposit[acoToken].amount = senderAmount.add(remainingAmount);
        senderData.positionsOnDeposit[acoToken].profit = senderProfit.add(remainingProfit);
        uint256 acoAmount = senderAmount.add(diffAmount.sub(remainingAmount));
        uint256 acoProfit = senderProfit.add(diffProfit.sub(remainingProfit));
        return (acoAmount, acoProfit);           
    }
    
    function _removeFromAccountData(address acoToken, AccountData storage data) internal {
        uint256 index = data.positionsOnDeposit[acoToken].index;
        uint256 lastIndex = data.acoTokensOnDeposit.length - 1;
		if (lastIndex != index) {
			address last = data.acoTokensOnDeposit[lastIndex];
			data.positionsOnDeposit[last].index = index;
			data.acoTokensOnDeposit[index] = last;
		}
        data.acoTokensOnDeposit.pop();
        delete data.positionsOnDeposit[acoToken];
    }
    
    function _setAccountData(
        address acoToken, 
        uint256 acoAmount, 
        uint256 acoProfit, 
        uint256 previousShares,
        uint256 newShares,
        AccountData storage accountData
    ) internal {
        if (accountData.positionsOnDeposit[acoToken].initialized) {
            //TODO check calculation
            uint256 weight = newShares.add(previousShares);
            accountData.positionsOnDeposit[acoToken].amount = newShares.mul(acoAmount).add(previousShares.mul(accountData.positionsOnDeposit[acoToken].amount)).div(weight);
            accountData.positionsOnDeposit[acoToken].profit = newShares.mul(acoProfit).add(previousShares.mul(accountData.positionsOnDeposit[acoToken].profit)).div(weight);
        } else {
            accountData.positionsOnDeposit[acoToken] = Position(acoAmount, acoProfit, accountData.acoTokensOnDeposit.length, true);
            accountData.acoTokensOnDeposit.push(acoToken);
        }
    }
    
    function _getPositionData(
        address acoToken,
        uint256 shares, 
        uint256 vaulTotalSupply,
        AccountData storage data
    ) internal view returns(uint256, uint256, uint256) {
        Position storage _position = positions[acoToken];
        uint256 amount = shares.mul(_position.amount.sub(data.positionsOnDeposit[acoToken].amount)).div(vaulTotalSupply);
        uint256 totalProfit = _position.profit.sub(data.positionsOnDeposit[acoToken].profit);
        uint256 profit = 0;
        uint256 adjust = 0;
        if (totalProfit > 0) {
            address _token = address(token);
            profit = shares.mul(totalProfit).div(vaulTotalSupply);
            uint256 actualTotalValue = controller.actualBalance(_token, totalProfit);
            adjust = actualTotalValue.sub(controller.actualBalance(_token, profit));
        }
        return (amount, profit, adjust);
    }
    
    function _exerciseValidation(address acoToken) internal view returns(uint256, uint256, address) {
        (address underlying, 
         address strikeAsset, 
         bool isCall,
         uint256 strikePrice, 
         uint256 expiryTime) = acoFactory.acoTokenData(acoToken);
        require(expiryTime <= minTimeToExercise.add(block.timestamp), "ACOVault:: Invalid time to exercise");
        
        uint256 acoBalance = ACOAssetHelper._getAssetBalanceOf(acoToken, address(this));
        require(acoBalance > 0, "ACOVault:: No balance to exercise");
        
        uint256 price = assetConverter.getPrice(underlying, strikeAsset);
        uint256 diff;
        address collateral;
        uint256 _decimals;
        if (isCall) {
            require(price > strikePrice, "ACOVault:: It's not ITM");
            diff = price.sub(strikePrice);
            collateral = underlying;
            _decimals = ACOAssetHelper._getAssetDecimals(strikeAsset);
        } else {
            require(price < strikePrice, "ACOVault:: It's not ITM");
            diff = strikePrice.sub(price);
            collateral = strikeAsset;
            _decimals = ACOAssetHelper._getAssetDecimals(underlying);
        }
        uint256 minIntrinsicValue = diff.mul(acoBalance).div((10 ** _decimals));
        require(minIntrinsicValue > 0, "ACOVault:: Profit too small");
        
        return (acoBalance, minIntrinsicValue, collateral);
    }

    function _setAcoToken(
        IERC20 _token,
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
        
        _token.approve(newAcoPool, MAX_UINT);
        
        if (!positions[newAcoToken].initialized) {
            positions[newAcoToken] = Position(0, 0, acoTokens.length, true);
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
            poolMinStrikePrice <= strikePrice &&
            poolMaxStrikePrice >= strikePrice &&
            poolMinExpiration <= expiryTime &&
            poolMaxExpiration >= expiryTime, 
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
        require(newMaxExpiration >= minExpiration, "ACOVault:: Invalid max expiration");
        emit SetMaxExpiration(maxExpiration, newMaxExpiration);
        maxExpiration = newMaxExpiration;
    }
    
    function _setMinTimeToExercise(uint256 newMinTimeToExercise) internal {
        require(newMinTimeToExercise >= 3600, "ACOVault:: Invalid min time to exercise");
        emit SetMinTimeToExercise(minTimeToExercise, newMinTimeToExercise);
        minTimeToExercise = newMinTimeToExercise;
    }
}