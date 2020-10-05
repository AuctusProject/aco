pragma solidity ^0.6.6;

import './IERC20.sol';

interface IACOVault is IERC20 {
    struct VaultInitData {
        address acoFactory;
        address acoPoolFactory;
        address token;
        address controller;
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
    }
    function setController(address newController) external;
    function setAssetConverter(address newAssetConverter) external;
    function setAcoFlashExercise(address newAcoFlashExercise) external;
    function setMinPercentageToKeep(uint256 newMinPercentageToKeep) external;
    function setTolerancePriceBelow(uint256 newTolerancePriceBelow) external;
    function setTolerancePriceAbove(uint256 newTolerancePriceAbove) external;
    function setMinExpiration(uint256 newMinExpiration) external;
    function setMaxExpiration(uint256 newMaxExpiration) external;
    function setMinTimeToExercise(uint256 newMinTimeToExercise) external;
    function setAcoToken(address newAcoToken, address newAcoPool) external;
    function balance() external view returns(uint256);
    function available() external view returns(uint256);
    function getPricePerFullShare() external view returns(uint256);
    function numberOfAcoTokensNegotiated() external view returns(uint256);
    function removeExpiredAcos() external;
    function removeExpiredAco(address acoToken) external;
    function exerciseAco(address acoToken) external;
    function deposit(uint256 amount) external;
    function earn() external;
    function withdraw(uint256 shares) external;
}