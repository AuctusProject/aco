pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import '../../util/Ownable.sol';
import '../../libs/SafeMath.sol';
import '../../libs/Address.sol';
import '../../libs/ACOAssetHelper.sol';
import '../../interfaces/IACOVault.sol';
import '../../interfaces/IController.sol';
import '../../interfaces/IACOFlashExercise.sol';
import '../../interfaces/IACOFactory.sol';
import '../../interfaces/IACOAssetConverterHelper.sol';
import '../../interfaces/IACOToken.sol';
import '../../interfaces/IACOPoolV2.sol';


contract ACOVault is Ownable, IACOVault {
    using Address for address;
    using SafeMath for uint256;
    
    uint256 internal constant PERCENTAGE_PRECISION = 100000;
    uint256 internal constant MAX_UINT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    event SetController(address indexed oldController, address indexed newController);
    event SetAssetConverter(address indexed oldAssetConverter, address indexed newAssetConverter);
    event SetAcoFlashExercise(address indexed oldAcoFlashExercise, address indexed newAcoFlashExercise);
    event SetMinPercentageToKeep(uint256 indexed oldMinPercentageToKeep, uint256 indexed newMinPercentageToKeep);
    event SetAcoToken(address indexed oldAcoToken, address indexed newAcoToken);
    event SetTolerancePriceAbove(uint256 indexed oldTolerancePriceAbove, uint256 indexed newTolerancePriceAbove);
    event SetTolerancePriceBelow(uint256 indexed oldTolerancePriceBelow, uint256 indexed newTolerancePriceBelow);
    event SetMinExpiration(uint256 indexed oldMinExpiration, uint256 indexed newMinExpiration);
    event SetMaxExpiration(uint256 indexed oldMaxExpiration, uint256 indexed newMaxExpiration);
    event SetMinTimeToExercise(uint256 indexed oldMinTimeToExercise, uint256 indexed newMinTimeToExercise);
    event SetExerciseSlippage(uint256 indexed oldExerciseSlippage, uint256 indexed newExerciseSlippage);
    event SetWithdrawFee(uint256 indexed oldWithdrawFee, uint256 indexed newWithdrawFee);
    event SetOperator(address indexed operator, bool indexed previousPermission, bool indexed newPermission);
    event RewardAco(address indexed acoToken, uint256 acoTokenAmountIn);
    event ExerciseAco(address indexed acoToken, uint256 acoTokensOut, uint256 tokenIn);
    event Deposit(address indexed account, uint256 shares, uint256 amount);
    event Withdraw(address indexed account, uint256 shares, uint256 amount, uint256 fee);

    IACOPoolFactory public immutable override acoPoolFactory;
    IACOFactory public immutable override acoFactory;
    address public immutable override token;
    
    uint256 public override minPercentageToKeep;
    
    IController public override controller;
    IACOAssetConverterHelper public override assetConverter;
    IACOFlashExercise public override acoFlashExercise;
    
    IACOToken public override currentAcoToken;
    address[] public override acoTokens;
    address[] public override validAcos;
    uint256 public override tolerancePriceAbove;
    uint256 public override tolerancePriceBelow;
    uint256 public override minExpiration;
    uint256 public override maxExpiration;
    uint256 public override minTimeToExercise;
    uint256 public override exerciseSlippage;
    uint256 public override withdrawFee;
    uint256 public override totalSupply;
    
    mapping(address => bool) public operators;
    
    mapping(address => uint256) internal balances;
    mapping(address => AcoData) internal acoData;
    mapping(address => AccountData) internal accounts;
    
    constructor(VaultInitData memory initData) public {
        super.init();
        
        require(initData.acoPoolFactory.isContract(), "ACOVault:: Invalid ACO pool factory");
        require(initData.acoFactory.isContract(), "ACOVault:: Invalid ACO factory");
        require(initData.token.isContract(), "ACOVault:: Invalid token");
        
        acoPoolFactory = IACOPoolFactory(initData.acoPoolFactory);
        acoFactory = IACOFactory(initData.acoFactory);
        token = initData.token;
        _setAssetConverter(initData.assetConverter);
        _setAcoFlashExercise(initData.acoFlashExercise);
        _setMinPercentageToKeep(initData.minPercentageToKeep);
        _setMinTimeToExercise(initData.minTimeToExercise);
        _setExerciseSlippage(initData.exerciseSlippage);
        _setWithdrawFee(initData.withdrawFee);
        _setMaxExpiration(initData.maxExpiration);
        _setMinExpiration(initData.minExpiration);
        _setTolerancePriceAbove(initData.tolerancePriceAbove);
        _setTolerancePriceBelow(initData.tolerancePriceBelow);
        _setAcoToken(IACOAssetConverterHelper(initData.assetConverter), IACOFactory(initData.acoFactory), initData.currentAcoToken);
        _setOperator(msg.sender, true);
    }

    receive() external payable {
        require(msg.sender != tx.origin, "ACOVault:: Only contract");
    }

    function name() public view override returns(string memory) {
        return string(abi.encodePacked("ACO Vault ", ACOAssetHelper._getAssetSymbol(address(token))));
    }

    function decimals() public view override returns(uint8) {
        return ACOAssetHelper._getAssetDecimals(address(token));
    }
    
    function balanceOf(address account) public view override returns(uint256) {
        return balances[account];
    }
    
    function getAcoData(address acoToken) external view override returns(AcoData memory) {
        return acoData[acoToken];
    }
    
    function getAccountAcoDataCount(address account) external view override returns(uint256) {
        AccountData storage data = accounts[account];
        return data.acoTokensOnDeposit.length;
    }
    
    function getAccountAcoDataByIndex(address account, uint256 index) external view override returns(address, AccountAcoData memory) {
        AccountData storage data = accounts[account];
        address acoToken = data.acoTokensOnDeposit[index];
        return (acoToken, data.dataOnDeposit[acoToken]);
    }
    
    function getAccountAcoDataByAco(address account, address acoToken) external view override returns(AccountAcoData memory) {
        return accounts[account].dataOnDeposit[acoToken];   
    }
    
    function getAccountSituation(address account, uint256 shares) external view override returns(uint256, uint256, address[] memory, uint256[] memory) {
        require(shares > 0, "ACOVault:: Invalid shares");
        uint256 fullShare = balanceOf(account);
        require(fullShare >= shares, "ACOVault:: Shares not available");
        
        (uint256 totalProfit, uint256 individualProfit, address[] memory acos, uint256[] memory acosAmount) = _getAccountAcoSituation(account, shares, fullShare);
        
        uint256 bufferBalance = ACOAssetHelper._getAssetBalanceOf(token, address(this));
        uint256 accountBalance = _getAccountBalance(shares, totalSupply, totalProfit, individualProfit, bufferBalance);
        if (bufferBalance < accountBalance) {
            accountBalance = bufferBalance.add(controller.actualAmount(address(this), accountBalance.sub(bufferBalance)));
        }
        uint256 fee = accountBalance.mul(withdrawFee).div(PERCENTAGE_PRECISION);
        accountBalance = accountBalance.sub(fee);
        
        return (accountBalance, fee, acos, acosAmount);
    }

    function balance() public override view returns(uint256) {
        return ACOAssetHelper._getAssetBalanceOf(token, address(this)).add(controller.balanceOf(address(this)));
    }

    function available() public override view returns(uint256) {
        return PERCENTAGE_PRECISION.sub(minPercentageToKeep).mul(ACOAssetHelper._getAssetBalanceOf(token, address(this))).div(PERCENTAGE_PRECISION);
    }

    function numberOfAcoTokensNegotiated() public override view returns(uint256) {
        return acoTokens.length;
    }

    function numberOfValidAcoTokens() public override view returns(uint256) {
        return validAcos.length;
    }

    function getPricePerFullShare() public override view returns(uint256) {
        uint256 _decimals = uint256(decimals());
        return balance().mul(_decimals).div(totalSupply);
    }
  
    function setController(address newController) onlyOwner external override {
        _setController(newController);
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
    
    function setExerciseSlippage(uint256 newExerciseSlippage) onlyOwner external override {
        _setExerciseSlippage(newExerciseSlippage);
    }
    
    function setWithdrawFee(uint256 newWithdrawFee) onlyOwner external override {
        _setWithdrawFee(newWithdrawFee);
    }
    
    function setOperator(address operator, bool permission) onlyOwner external override {
        _setOperator(operator, permission);
    }
    
    function setAcoToken(address newAcoToken) external override {
        require(operators[msg.sender], "ACOVault:: Invalid sender");
        _setAcoToken(assetConverter, acoFactory, newAcoToken);
    }

    function withdrawStuckToken(address _token, address destination) external override {
        require(msg.sender == address(controller), "ACOVault:: Invalid sender");
        require(address(token) != _token && !acoData[_token].initialized, "ACOVault:: Invalid token");
        uint256 _balance = ACOAssetHelper._getAssetBalanceOf(_token, address(this));
        if (_balance > 0) {
            ACOAssetHelper._transferAsset(_token, destination, _balance);
        }
    }
    
    function earn() external override {
        require(operators[msg.sender], "ACOVault:: Invalid sender");
        controller.earn(available());
    }

    function deposit(uint256 amount) external override {
        require(address(controller) != address(0), "ACOVault:: No controller");
        require(amount > 0, "ACOVault:: Invalid amount");
        uint256 _totalBalance = balance();
        ACOAssetHelper._receiveAsset(address(token), amount);
        
        uint256 shares = 0;
        if (_totalBalance == 0) {
            shares = amount;
        } else {
            shares = amount.mul(totalSupply).div(_totalBalance);
        }
            
        AccountData storage data = accounts[msg.sender];
        _setAccountDataOnDeposit(address(currentAcoToken), balanceOf(msg.sender), data);
        
        _mint(msg.sender, shares);
        
        emit Deposit(msg.sender, shares, amount);
    }

    function withdraw(uint256 shares) external override {
        require(shares > 0, "ACOVault:: Invalid shares");
        
        uint256 fullShare = balanceOf(msg.sender);
        uint256 vaultTotalSupply = totalSupply;
        _burn(msg.sender, shares);
        
        AccountData storage data = accounts[msg.sender];
        (uint256 totalProfit, uint256 individualProfit) = _setAccountOpenPositionDataOnWithdraw(shares, fullShare, data);
        
        _setAccountValidAcoDataOnWithdraw(shares, fullShare, data);

        if (fullShare == shares) {
            delete accounts[msg.sender];
        }
        
        uint256 bufferBalance = ACOAssetHelper._getAssetBalanceOf(token, address(this));
        uint256 accountBalance = _getAccountBalance(shares, vaultTotalSupply, totalProfit, individualProfit, bufferBalance);
        if (bufferBalance < accountBalance) {
            accountBalance = bufferBalance.add(controller.withdraw(accountBalance.sub(bufferBalance)));
        }
        uint256 fee = accountBalance.mul(withdrawFee).div(PERCENTAGE_PRECISION);
        accountBalance = accountBalance.sub(fee);
        
        controller.sendFee(fee);
        ACOAssetHelper._transferAsset(address(token), msg.sender, accountBalance);
        
        emit Withdraw(msg.sender, shares, accountBalance, fee);
    }
    
    function exerciseAco(address acoToken, uint256 acoAmount) external override {
        (uint256 acoBalance, uint256 minIntrinsicValue, address collateral) = _exerciseValidation(acoToken, acoAmount);
        
        uint256 previousTokenAmount = ACOAssetHelper._getAssetBalanceOf(token, address(this));
        
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
        
        uint256 tokenIn = ACOAssetHelper._getAssetBalanceOf(token, address(this)).sub(previousTokenAmount);
        AcoData storage _acoData = acoData[acoToken];
        _acoData.profit = tokenIn.add(_acoData.profit); 
        _acoData.exercised = acoBalance.add(_acoData.exercised); 
        
        emit ExerciseAco(acoToken, acoBalance, tokenIn);
    }
    
    function setReward(address acoPool, uint256 acoTokenAmount, uint256 rewardAmount) external override {
        require(msg.sender == address(controller), "ACOVault:: Invalid sender");
		
        address _currentAcoToken = address(currentAcoToken);
        require(IACOToken(_currentAcoToken).expiryTime() > minTimeToExercise.add(block.timestamp), "ACOVault:: Invalid time to buy");
		
		(address poolUnderlying, address poolStrikeAsset,) = acoPoolFactory.acoPoolBasicData(acoPool);
		require(poolUnderlying != poolStrikeAsset, "ACOVault:: Invalid pool");
		IACOPool _pool = IACOPool(acoPool);
		require(_pool.canSwap(_currentAcoToken), "ACOVault:: Pool cannot swap");
		
        address _token = token;
        address poolExpectedAsset = IACOToken(_currentAcoToken).strikeAsset();
        
        uint256 restriction;
        if (_token != poolExpectedAsset) {
            restriction = assetConverter.swapExactAmountOutWithMinAmountToReceive(_token, poolExpectedAsset, rewardAmount, 1);    
        } else {
            restriction = rewardAmount;
        }
        
		ACOAssetHelper._setAssetInfinityApprove(poolExpectedAsset, address(this), acoPool, restriction);
        _pool.swap(_currentAcoToken, acoTokenAmount, restriction, address(this), block.timestamp);
        
        AcoData storage _acoData = acoData[_currentAcoToken];
        _acoData.amount = acoTokenAmount.add(_acoData.amount);
        _acoData.tokenPerShare = acoTokenAmount.mul(1e18).div(totalSupply).add(_acoData.tokenPerShare);
        
        if (_token != poolExpectedAsset) {
            uint256 poolAssetBalance = ACOAssetHelper._getAssetBalanceOf(poolExpectedAsset, address(this));
            if (poolAssetBalance > 0) {
                assetConverter.swapExactAmountOutWithMinAmountToReceive(poolExpectedAsset, _token, poolAssetBalance, 1);  
            }
        }
        
        emit RewardAco(_currentAcoToken, acoTokenAmount);
    }
    
    function skim(address account) external override {
        AccountData storage data = accounts[account];
        for (uint256 i = data.acoTokensOnDeposit.length; i > 0; --i) {
            address acoToken = data.acoTokensOnDeposit[i - 1];
            if (block.timestamp >= IACOToken(acoToken).expiryTime()) {
                AcoData storage _acoData = acoData[acoToken];
                uint256 acoTotalProfit = _acoData.profit.sub(_acoData.withdrawnProfit); 
                if (acoTotalProfit == 0) {
                    _removeFromAccountData(acoToken, data);
                }
            }
        }
    }

    function setValidAcoTokens() public override {
        for (uint256 i = validAcos.length; i > 0; --i) {
            uint256 index = i - 1;
            address acoToken = validAcos[index];
            if (block.timestamp >= IACOToken(acoToken).expiryTime()) {
                _removeFromValidAcos(index);
            }
        }
    }
    
    function _removeFromAccountData(address acoToken, AccountData storage data) internal {
        uint256 index = data.dataOnDeposit[acoToken].index;
        uint256 lastIndex = data.acoTokensOnDeposit.length - 1;
		if (lastIndex != index) {
			address last = data.acoTokensOnDeposit[lastIndex];
			data.dataOnDeposit[last].index = index;
			data.acoTokensOnDeposit[index] = last;
		}
        data.acoTokensOnDeposit.pop();
        delete data.dataOnDeposit[acoToken];
    }

    function _removeFromValidAcos(uint256 index) internal {
        uint256 lastIndex = validAcos.length - 1;
		if (lastIndex != index) {
		    address last = validAcos[lastIndex];
			validAcos[index] = last;
		}
        validAcos.pop();
    }
    
    function _setAccountDataOnDeposit(
        address acoToken, 
        uint256 previousShares,
        AccountData storage data
    ) internal {
        AcoData storage _acoData = acoData[acoToken];
        if (data.dataOnDeposit[acoToken].initialized) {
            AccountAcoData storage accountData = data.dataOnDeposit[acoToken];
            accountData.tokenAccumulated = accountData.tokenAccumulated.add(_getAccountAcoAmount(previousShares, _acoData, accountData));
            accountData.tokenPerShare = _acoData.tokenPerShare;
        } else if (previousShares > 0 || _acoData.amount > _acoData.exercised) {
            uint256 tokenAccumulated = 0;
            if (previousShares > 0) {
                tokenAccumulated = _getAccountAcoAmount(previousShares, _acoData, data.dataOnDeposit[acoToken]);
            }
            data.dataOnDeposit[acoToken] = AccountAcoData(_acoData.tokenPerShare, tokenAccumulated, data.acoTokensOnDeposit.length, true);
            data.acoTokensOnDeposit.push(acoToken);
        }
    }
    
    function _setAccountDataOnWithdraw(
        address acoToken,
        uint256 acoAmount,
        uint256 tokenAccumulated,
        uint256 individualProfit,
        AcoData storage _acoData,
        AccountAcoData storage accountData
    ) internal {
        uint256 normalizedAmount = _getAcoNormalizedAmount(acoToken, acoAmount, _acoData);
        
        if (accountData.initialized) {
            accountData.tokenAccumulated = tokenAccumulated;
            accountData.tokenPerShare = _acoData.tokenPerShare;
        }
        _acoData.withdrawnNormalizedAmount = acoAmount.add(_acoData.withdrawnNormalizedAmount);
        _acoData.withdrawnProfit = individualProfit.add(_acoData.withdrawnProfit);
        
        if (normalizedAmount > 0) {
            ACOAssetHelper._transferAsset(acoToken, msg.sender, normalizedAmount);
        }
    }
    
    function _setAccountOpenPositionDataOnWithdraw(
        uint256 shares,
        uint256 fullShare,
        AccountData storage data
    ) internal returns(uint256, uint256) {
        uint256 totalProfit = 0;
        uint256 individualProfit = 0;
        for (uint256 i = data.acoTokensOnDeposit.length; i > 0; --i) {
            address acoToken = data.acoTokensOnDeposit[i - 1];
            AcoData storage _acoData = acoData[acoToken];
            AccountAcoData storage accountData = data.dataOnDeposit[acoToken];
            
            uint256 acoTotalProfit = _acoData.profit.sub(_acoData.withdrawnProfit);
            (uint256 acoAmount, uint256 tokenAccumulated) = _getAcoAmountAndTokenAccumulated(shares, fullShare, _acoData, accountData);
            uint256 acoProfit = _getAccountAcoProfit(acoAmount, acoTotalProfit, _acoData);
            
            totalProfit = totalProfit.add(acoTotalProfit);
            individualProfit = individualProfit.add(acoProfit);
            
            if (block.timestamp >= IACOToken(acoToken).expiryTime()) {
                if (fullShare > shares && acoTotalProfit == 0) {
                    _removeFromAccountData(acoToken, data);
                }
            } else {
                _setAccountDataOnWithdraw(acoToken, acoAmount, tokenAccumulated, acoProfit, _acoData, accountData);
            }   
        }
        return (totalProfit, individualProfit);
    }
    
    function _setAccountValidAcoDataOnWithdraw(
        uint256 shares,
        uint256 fullShare,
        AccountData storage data
    ) internal {
        for (uint256 j = validAcos.length; j > 0; --j) {
            uint256 index = j - 1;
            address acoToken = validAcos[index];
            if (block.timestamp >= IACOToken(acoToken).expiryTime()) {
                _removeFromValidAcos(index);
            } else {
                AccountAcoData storage accountData = data.dataOnDeposit[acoToken];
                if (!accountData.initialized) {
                    AcoData storage _acoData = acoData[acoToken];
                    (uint256 acoAmount,) = _getAcoAmountAndTokenAccumulated(shares, fullShare, _acoData, accountData);
                    _setAccountDataOnWithdraw(acoToken, acoAmount, 0, 0, _acoData, accountData);
                }
            }
        }
    }
    
    function _getAccountBalance(
        uint256 shares,
        uint256 vaultTotalSupply,
        uint256 totalProfit,
        uint256 individualProfit,
        uint256 tokenBalance
    ) internal view returns(uint256) {
        uint256 _balance = controller.balanceOf(address(this));
        uint256 normalizedIndividualProfit = 0;
        if (individualProfit > 0) {
            normalizedIndividualProfit = controller.actualAmount(address(this), individualProfit);
        }
        if (totalProfit > 0) {
            if (tokenBalance >= totalProfit) {
                _balance = _balance.add(tokenBalance.sub(totalProfit));
            } else {
                _balance = _balance.sub(controller.actualAmount(address(this), totalProfit.sub(tokenBalance)));
            }
        } else {
            _balance = _balance.add(tokenBalance);
        }
        return shares.mul(_balance).div(vaultTotalSupply).add(normalizedIndividualProfit);
    }
    
    function _getAcoAmountAndTokenAccumulated(
        uint256 shares,
        uint256 fullShare,
        AcoData storage _acoData,
        AccountAcoData storage accountData
    ) internal view returns(uint256, uint256) {
        uint256 acoAmountFullShare = _getAccountAcoAmount(fullShare, _acoData, accountData).add(accountData.tokenAccumulated);
        
        uint256 amount = 0;
        uint256 tokenAccumulated = 0;
        if (fullShare == shares) {
            amount = acoAmountFullShare;
        } else {
            uint256 acoAmountShare = _getAccountAcoAmount(shares, _acoData, accountData);
            uint256 tokenAccumulatedShare = shares.mul(accountData.tokenAccumulated).div(fullShare);
            amount = acoAmountShare.add(tokenAccumulatedShare);
            tokenAccumulated = acoAmountFullShare.sub(amount);
        }
        return (amount, tokenAccumulated);
    }

    function _getAccountAcoProfit(
        uint256 acoAmount,
        uint256 totalProfit,
        AcoData storage _acoData
    ) internal view returns(uint256) {
        uint256 totalAmount = _acoData.amount.sub(_acoData.withdrawnNormalizedAmount);
        if (totalAmount > 0) {
            return acoAmount.mul(totalProfit).div(totalAmount);
        } else {
            return 0;
        }
    }
    
    function _getAccountAcoAmount(
        uint256 shares,
        AcoData storage _acoData,
        AccountAcoData storage accountData
    ) internal view returns(uint256) {
        if (accountData.initialized) {
            return _acoData.tokenPerShare.sub(accountData.tokenPerShare).mul(shares).div(1e18);
        } else {
            return _acoData.tokenPerShare.mul(shares).div(1e18);
        }
    }
    
    function _getAcoNormalizedAmount(
        address acoToken,
        uint256 amount,
        AcoData storage _acoData
    ) internal view returns(uint256) {
        if (amount > 0) {
            uint256 totalAmount = _acoData.amount.sub(_acoData.withdrawnNormalizedAmount);
            if (totalAmount > 0) {
                uint256 acoAmount = ACOAssetHelper._getAssetBalanceOf(acoToken, address(this));
                return acoAmount.mul(amount).div(totalAmount);
            }
        }
        return 0;
    }
    
    function _exerciseValidation(
        address acoToken, 
        uint256 acoAmount
    ) internal view returns(
        uint256 actualAcoAmount, 
        uint256 minIntrinsicValue, 
        address collateral
    ) {
        (address underlying, 
         address strikeAsset, 
         bool isCall,
         uint256 strikePrice, 
         uint256 expiryTime) = acoFactory.acoTokenData(acoToken);
        require(expiryTime <= minTimeToExercise.add(block.timestamp), "ACOVault:: Invalid time to exercise");
        
        uint256 acoBalance = ACOAssetHelper._getAssetBalanceOf(acoToken, address(this));
        if (acoAmount > acoBalance) {
            actualAcoAmount = acoBalance;
        } else {
            actualAcoAmount = acoAmount;
        }
        require(actualAcoAmount > 0, "ACOVault:: Invalid ACO amount");
        
        uint256 price = assetConverter.getPrice(underlying, strikeAsset);
        if (isCall) {
            require(price > strikePrice, "ACOVault:: It's not ITM");
            uint256 priceWithSlippage = price.mul(PERCENTAGE_PRECISION.sub(exerciseSlippage)).div(PERCENTAGE_PRECISION);
            if (priceWithSlippage > strikePrice) {
                minIntrinsicValue = priceWithSlippage.sub(strikePrice).mul(actualAcoAmount).div(price);
            } else {
                minIntrinsicValue = actualAcoAmount.div(price);
            }
            collateral = underlying;
        } else {
            require(price < strikePrice, "ACOVault:: It's not ITM");
            uint256 priceWithSlippage = price.mul(PERCENTAGE_PRECISION.add(exerciseSlippage)).div(PERCENTAGE_PRECISION);
            uint256 acoPrecision = 10 ** uint256(ACOAssetHelper._getAssetDecimals(acoToken));
            if (priceWithSlippage < strikePrice) {
                minIntrinsicValue = strikePrice.sub(priceWithSlippage).mul(actualAcoAmount).div(acoPrecision);
            } else {
                minIntrinsicValue = actualAcoAmount.div(acoPrecision);
            }
            collateral = strikeAsset;
        }
        require(minIntrinsicValue > 0, "ACOVault:: Profit too small");
    }
        
    function _getAccountAcoSituation(
        address account, 
        uint256 shares,
        uint256 fullShare
    ) internal view returns(uint256, uint256, address[] memory, uint256[] memory) {
        AccountData storage data = accounts[account];
        
        (uint256 totalProfit, uint256 individualProfit, uint256 countOnDeposit, uint256[] memory accountAcoDataOnDeposit) = _getAccountOnDepositAcoAmounts(shares, fullShare, data);
        (uint256 countValidAcos, uint256[] memory accountValidAcoData) = _getAccountValidAcoAmounts(shares, fullShare, data);
        
        uint256[] memory acosAmount = new uint256[](countOnDeposit + countValidAcos);
        address[] memory acos = new address[](countOnDeposit + countValidAcos);
        uint256 index = 0;
        for (uint256 i = 0; i < accountAcoDataOnDeposit.length; ++i) {
            if (accountAcoDataOnDeposit[i] > 0) {
                acosAmount[index] = accountAcoDataOnDeposit[i];
                acos[index] = data.acoTokensOnDeposit[i];
                ++index;
            }
        }
        for (uint256 j = 0; j < accountValidAcoData.length; ++j) {
            if (accountValidAcoData[j] > 0) {
                acosAmount[index] = accountValidAcoData[j];
                acos[index] = validAcos[j];
                ++index;
            }
        }
        return (totalProfit, individualProfit, acos, acosAmount);
    }

    function _getAccountOnDepositAcoAmounts(
        uint256 shares,
        uint256 fullShare,
        AccountData storage data
    ) internal view returns(uint256 totalProfit, uint256 individualProfit, uint256 count, uint256[] memory accountAcoData) {
        accountAcoData = new uint256[](data.acoTokensOnDeposit.length);
        for (uint256 i = 0; i < data.acoTokensOnDeposit.length; ++i) {
            address acoToken = data.acoTokensOnDeposit[i];
            
            (uint256 amount, uint256 acoTotalProfit, uint256 acoProfit) = _getAccountOnDepositAcoData(acoToken, shares, fullShare, data);

            totalProfit = totalProfit.add(acoTotalProfit);
            individualProfit = individualProfit.add(acoProfit);
            
            if (amount > 0) {
                ++count;
                accountAcoData[i] = amount;
            } else {
                accountAcoData[i] = 0;
            }
        }
    }
    
    function _getAccountOnDepositAcoData(
        address acoToken,
        uint256 shares,
        uint256 fullShare,
        AccountData storage data
    ) internal view returns(uint256, uint256, uint256) {
        AcoData storage _acoData = acoData[acoToken];
        AccountAcoData storage accountData = data.dataOnDeposit[acoToken];
        
        uint256 acoTotalProfit = _acoData.profit.sub(_acoData.withdrawnProfit);
        (uint256 acoAmount,) = _getAcoAmountAndTokenAccumulated(shares, fullShare, _acoData, accountData);
        uint256 acoProfit = _getAccountAcoProfit(acoAmount, acoTotalProfit, _acoData);
        
        uint256 amount = 0;
        if (block.timestamp < IACOToken(acoToken).expiryTime()) {
            amount = _getAcoNormalizedAmount(acoToken, acoAmount, _acoData);
        }   
        return (amount, acoTotalProfit, acoProfit);
    }

    function _getAccountValidAcoAmounts(
        uint256 shares,
        uint256 fullShare,
        AccountData storage data
    ) internal view returns(uint256, uint256[] memory) {
        uint256 count = 0;
        uint256[] memory accountAcoData = new uint256[](validAcos.length);
        for (uint256 i = 0; i < validAcos.length; ++i) {
            address acoToken = validAcos[i];
            if (block.timestamp < IACOToken(acoToken).expiryTime()) {
                AccountAcoData storage accountData = data.dataOnDeposit[acoToken];
                if (!accountData.initialized) {
                    AcoData storage _acoData = acoData[acoToken];
                    (uint256 acoAmount,) = _getAcoAmountAndTokenAccumulated(shares, fullShare, _acoData, accountData);
                    uint256 amount = _getAcoNormalizedAmount(acoToken, acoAmount, _acoData);
                    if (amount > 0) {
                        ++count;
                        accountAcoData[i] = amount;
                    } else {
                        accountAcoData[i] = 0;
                    }    
                } else {
                    accountAcoData[i] = 0;
                }
            } else {
                accountAcoData[i] = 0;
            }
        }
        return (count, accountAcoData);
    }

    function _setAcoToken(
        IACOAssetConverterHelper _assetConverter,
        IACOFactory _acoFactory, 
        address newAcoToken
    ) internal {
        (address underlying, 
         address strikeAsset,, 
         uint256 strikePrice, 
         uint256 expiryTime) = _acoFactory.acoTokenData(newAcoToken);
         
        _acoTokenValidation(_assetConverter, underlying, strikeAsset, strikePrice, expiryTime);
        
        emit SetAcoToken(address(currentAcoToken), newAcoToken);
        
        setValidAcoTokens();
        
        ACOAssetHelper._callApproveERC20(newAcoToken, address(acoFlashExercise), MAX_UINT);    
        
        currentAcoToken = IACOToken(newAcoToken);
        
        if (!acoData[newAcoToken].initialized) {
            acoData[newAcoToken] = AcoData(0, 0, 0, 0, 0, 0, acoTokens.length, true);
            acoTokens.push(newAcoToken);
            validAcos.push(newAcoToken);
        }
    }
    
    function _acoTokenValidation(
        IACOAssetConverterHelper _assetConverter,
        address underlying, 
        address strikeAsset, 
        uint256 strikePrice, 
        uint256 expiryTime
    ) internal view {
        require(underlying != strikeAsset, "ACOVault:: Invalid ACO token");
        
        uint256 minExpiryTime = minExpiration.add(block.timestamp);
        uint256 maxExpiryTime = maxExpiration.add(block.timestamp);
        require(expiryTime >= minExpiryTime && expiryTime <= maxExpiryTime, "ACOVault:: Invalid ACO expiry time");
        
        uint256 price = _assetConverter.getPrice(underlying, strikeAsset);
        uint256 maxPrice = strikePrice.mul(PERCENTAGE_PRECISION.add(tolerancePriceAbove)).div(PERCENTAGE_PRECISION);
        uint256 minPrice = strikePrice.mul(PERCENTAGE_PRECISION.sub(tolerancePriceBelow)).div(PERCENTAGE_PRECISION);
        
        require(price >= minPrice && price <= maxPrice, "ACOVault:: Invalid ACO strike price");
    }
    
    function _setController(address newController) internal {
        require(newController.isContract(), "ACOVault:: Invalid controller");
        emit SetController(address(controller), newController);
        ACOAssetHelper._callApproveERC20(token, newController, MAX_UINT);
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
        
        address _currentAcoToken = address(currentAcoToken);
        if (_currentAcoToken != address(0)) {
            ACOAssetHelper._callApproveERC20(_currentAcoToken, newAcoFlashExercise, MAX_UINT);   
        }
        
        acoFlashExercise = IACOFlashExercise(newAcoFlashExercise);
    }
    
    function _setMinPercentageToKeep(uint256 newMinPercentageToKeep) internal {
        require(newMinPercentageToKeep < PERCENTAGE_PRECISION, "ACOVault:: Invalid percentage");
        emit SetMinPercentageToKeep(minPercentageToKeep, newMinPercentageToKeep);
        minPercentageToKeep = newMinPercentageToKeep;
    }
    
    function _setTolerancePriceAbove(uint256 newTolerancePriceAbove) internal {
        require(newTolerancePriceAbove < PERCENTAGE_PRECISION, "ACOVault:: Invalid tolerance");
        emit SetTolerancePriceAbove(tolerancePriceAbove, newTolerancePriceAbove);
        tolerancePriceAbove = newTolerancePriceAbove;
    }
    
    function _setTolerancePriceBelow(uint256 newTolerancePriceBelow) internal {
        require(newTolerancePriceBelow < PERCENTAGE_PRECISION, "ACOVault:: Invalid tolerance");
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
    
    function _setExerciseSlippage(uint256 newExerciseSlippage) internal {
        require(newExerciseSlippage < PERCENTAGE_PRECISION, "ACOVault:: Invalid exercise slippage");
        emit SetExerciseSlippage(exerciseSlippage, newExerciseSlippage);
        exerciseSlippage = newExerciseSlippage;
    }
    
    function _setWithdrawFee(uint256 newWithdrawFee) internal {
        require(newWithdrawFee <= 1000, "ACOVault:: Invalid withdraw fee");
        emit SetWithdrawFee(withdrawFee, newWithdrawFee);
        withdrawFee = newWithdrawFee;
    }
    
    function _setOperator(address operator, bool newPermission) internal {
        emit SetOperator(operator, operators[operator], newPermission);
        operators[operator] = newPermission;
    }
    
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ACOVault:: Invalid account");
        totalSupply = totalSupply.add(amount);
        balances[account] = balances[account].add(amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ACOVault:: Invalid account");
        balances[account] = balances[account].sub(amount);
        totalSupply = totalSupply.sub(amount);
    }
}