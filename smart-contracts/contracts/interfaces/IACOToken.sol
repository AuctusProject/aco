pragma solidity ^0.6.6;

import "./IERC20.sol";

interface IACOToken is IERC20 {
	function init(address _underlying, address _strikeAsset, bool _isCall, uint256 _strikePrice, uint256 _expiryTime, uint256 _acoFee, address payable _feeDestination, uint256 _maxExercisedAccounts) external;
    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function decimals() external view returns(uint8);
    function underlying() external view returns (address);
    function strikeAsset() external view returns (address);
    function feeDestination() external view returns (address);
    function isCall() external view returns (bool);
    function strikePrice() external view returns (uint256);
    function expiryTime() external view returns (uint256);
    function totalCollateral() external view returns (uint256);
    function acoFee() external view returns (uint256);
	function maxExercisedAccounts() external view returns (uint256);
    function underlyingSymbol() external view returns (string memory);
    function strikeAssetSymbol() external view returns (string memory);
    function underlyingDecimals() external view returns (uint8);
    function strikeAssetDecimals() external view returns (uint8);
    function currentCollateral(address account) external view returns(uint256);
    function unassignableCollateral(address account) external view returns(uint256);
    function assignableCollateral(address account) external view returns(uint256);
    function currentCollateralizedTokens(address account) external view returns(uint256);
    function unassignableTokens(address account) external view returns(uint256);
    function assignableTokens(address account) external view returns(uint256);
    function getCollateralAmount(uint256 tokenAmount) external view returns(uint256);
    function getTokenAmount(uint256 collateralAmount) external view returns(uint256);
    function getBaseExerciseData(uint256 tokenAmount) external view returns(address, uint256);
    function numberOfAccountsWithCollateral() external view returns(uint256);
    function getCollateralOnExercise(uint256 tokenAmount) external view returns(uint256, uint256);
    function collateral() external view returns(address);
    function mintPayable() external payable returns(uint256);
    function mintToPayable(address account) external payable returns(uint256);
    function mint(uint256 collateralAmount) external returns(uint256);
    function mintTo(address account, uint256 collateralAmount) external returns(uint256);
    function burn(uint256 tokenAmount) external returns(uint256);
    function burnFrom(address account, uint256 tokenAmount) external returns(uint256);
    function redeem() external returns(uint256);
    function redeemFrom(address account) external returns(uint256);
    function exercise(uint256 tokenAmount, uint256 salt) external payable returns(uint256);
    function exerciseFrom(address account, uint256 tokenAmount, uint256 salt) external payable returns(uint256);
    function exerciseAccounts(uint256 tokenAmount, address[] calldata accounts) external payable returns(uint256);
    function exerciseAccountsFrom(address account, uint256 tokenAmount, address[] calldata accounts) external payable returns(uint256);
}