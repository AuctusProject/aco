pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import './IERC20.sol';
import './IController.sol';
import './IACOPoolFactory.sol';
import './IACOFlashExercise.sol';
import './IACOFactory.sol';
import './IACOAssetConverterHelper.sol';
import './IACOToken.sol';
import './IACOPool.sol';
import './IControlled.sol';

interface IACOVault is IERC20, IControlled {
    struct VaultInitData {
        address acoFactory;
        address acoPoolFactory;
        address token;
        address assetConverter;
        address acoFlashExercise;
        uint256 minPercentageToKeep;
        address currentAcoToken;
        address acoPool;
        uint256 tolerancePriceAbove;
        uint256 tolerancePriceBelow;
        uint256 minExpiration;
        uint256 maxExpiration;
        uint256 minTimeToExercise;
        uint256 exerciseSlippage;
        uint256 withdrawFee;
    }
        
    struct Position {
        uint256 amount;
        uint256 profit;
        uint256 exercised;
        uint256 index;
        bool initialized;
    }
    
    struct AccountData {
        mapping(address => Position) positionsOnDeposit;
        address[] acoTokensOnDeposit;
    }
    
    function acoPoolFactory() external view returns(IACOPoolFactory);
    function acoFactory() external view returns(IACOFactory);
    function controller() external view returns(IController);
    function assetConverter() external view returns(IACOAssetConverterHelper);
    function acoFlashExercise() external view returns(IACOFlashExercise);
    function acoPool() external view returns(IACOPool);
    function currentAcoToken() external view returns(IACOToken);
    function acoTokens(uint256 index) external view returns(address);
    function minPercentageToKeep() external view returns(uint256);
    function tolerancePriceAbove() external view returns(uint256);
    function tolerancePriceBelow() external view returns(uint256);
    function minExpiration() external view returns(uint256);
    function maxExpiration() external view returns(uint256);
    function minTimeToExercise() external view returns(uint256);
    function exerciseSlippage() external view returns(uint256);
    function withdrawFee() external view returns(uint256);
    function getPosition(address acoToken) external view returns(Position memory);
    function getAccountPositionsCount(address account) external view returns(uint256);
    function getAccountPositionByIndex(address account, uint256 index) external view returns(address, Position memory);
    function getAccountPositionByAco(address account, address acoToken) external view returns(Position memory);
    function getAccountSituation(address account) external view returns(uint256, uint256, address[] memory, uint256[] memory);
    function setController(address newController) external;
    function setAssetConverter(address newAssetConverter) external;
    function setAcoFlashExercise(address newAcoFlashExercise) external;
    function setMinPercentageToKeep(uint256 newMinPercentageToKeep) external;
    function setTolerancePriceBelow(uint256 newTolerancePriceBelow) external;
    function setTolerancePriceAbove(uint256 newTolerancePriceAbove) external;
    function setMinExpiration(uint256 newMinExpiration) external;
    function setMaxExpiration(uint256 newMaxExpiration) external;
    function setMinTimeToExercise(uint256 newMinTimeToExercise) external;
    function setExerciseSlippage(uint256 newMinTimeToExercise) external;
    function setWithdrawFee(uint256 newWithdrawFee) external;
    function setAcoToken(address newAcoToken, address newAcoPool) external;
    function setAcoPool(address newAcoPool) external;
    function balance() external view returns(uint256);
    function available() external view returns(uint256);
    function getPricePerFullShare() external view returns(uint256);
    function numberOfAcoTokensNegotiated() external view returns(uint256);
    function exerciseAco(address acoToken) external;
    function deposit(uint256 amount) external;
    function earn() external;
    function withdraw(uint256 shares) external;
    function setReward(uint256 acoTokenAmount, uint256 rewardAmount) external;
    function skim(address account) external;
}