pragma solidity ^0.6.6;

interface IACOFlashExercise {
    function uniswapFactory() external view returns(address);
    function uniswapRouter() external view returns(address);
    function weth() external view returns(address);
    function hasFlashExercise(address acoToken) external view returns(bool);
    function getExerciseData(address acoToken, uint256 tokenAmount, address[] calldata accounts) external view returns(uint256, uint256);
    function getEstimatedReturn(address acoToken, uint256 tokenAmount) external view returns(uint256);
    function flashExercise(address acoToken, uint256 tokenAmount, uint256 minimumCollateral, uint256 salt) external;
    function flashExerciseAccounts(address acoToken, uint256 tokenAmount, uint256 minimumCollateral, address[] calldata accounts) external;
    function uniswapV2Call(address sender, uint256 amount0Out, uint256 amount1Out, bytes calldata data) external;
}
