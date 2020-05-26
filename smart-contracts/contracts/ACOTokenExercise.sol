pragma solidity ^0.6.6;

import "./IWETH.sol";
import "./IUniswapV2Pair.sol";
import "./IUniswapV2Callee.sol";
import "./IUniswapV2Router01.sol";
import "./UniswapV2Library.sol";
import "./IACOToken.sol";

/**
 * @title ACOTokenExercise
 * @dev TODO
 */
contract ACOTokenExercise is IUniswapV2Callee {
    
    address immutable public uniswapFactory;
    IWETH immutable public WETH;
    bytes4 immutable internal _approveSelector;
    bytes4 immutable internal _transferSelector;
    
    constructor(address _uniswapFactory, address _uniswapRouter) public {
        uniswapFactory = _uniswapFactory;
        WETH = IWETH(IUniswapV2Router01(_uniswapRouter).WETH());
        
        _approveSelector = bytes4(keccak256(bytes("approve(address,uint256)")));
        _transferSelector = bytes4(keccak256(bytes("transfer(address,uint256)")));
    }
    
    receive() external payable {}
    
    function uniswapV2Call(address sender, uint256 amount0, uint256 amount1, bytes calldata data) external override {
        uint256 amountRequired;
        {
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        require(msg.sender == UniswapV2Library.pairFor(uniswapFactory, token0, token1), "ACOTokenExercise::uniswapV2Call: Invalid sender"); 
        require(amount0 == 0 || amount1 == 0, "ACOTokenExercise::uniswapV2Call: Invalid amount"); 
        
        address[] memory path = new address[](2);
        path[0] = amount0 == 0 ? token0 : token1;
        path[1] = amount0 == 0 ? token1 : token0;
        amountRequired = UniswapV2Library.getAmountsIn(uniswapFactory, (amount1 + amount0), path)[0];
        }
        
        address acoToken;
        uint256 tokenAmount; 
        uint256 ethValue = 0;
        address[] memory accounts;
        uint256 remainingAmount;
        {
        uint256 minimumCollateral;
        (acoToken, tokenAmount, minimumCollateral, accounts) = abi.decode(data, (address, uint256, uint256, address[]));
        (address exerciseAddress, uint256 expectedAmount) = IACOToken(acoToken).getExerciseData(tokenAmount);
        
        require(expectedAmount == (amount1 + amount0), "ACOTokenExercise::uniswapV2Call: Invalid expected amount");
        
        (uint256 collateralAmount,) = IACOToken(acoToken).getCollateralOnExercise(tokenAmount);
        require(amountRequired < collateralAmount, "ACOTokenExercise::uniswapV2Call: Insufficient collateral amount");
        
        remainingAmount = collateralAmount - amountRequired;
        require(remainingAmount >= minimumCollateral, "ACOTokenExercise::uniswapV2Call: Minimum amount not satisfied");
        
        if (exerciseAddress == address(0)) {
            ethValue = expectedAmount;
            WETH.withdraw(expectedAmount);
        } else {
            _callApproveERC20(exerciseAddress, acoToken, expectedAmount);
        }
        }
        
        if (accounts.length == 0) {
            IACOToken(acoToken).exerciseFrom{value: ethValue}(sender, tokenAmount);
        } else {
            IACOToken(acoToken).exerciseAccountsFrom{value: ethValue}(sender, tokenAmount, accounts);
        }
        
        address collateral = IACOToken(acoToken).collateral();
        address uniswapPayment;
        if (collateral == address(0)) {
            payable(sender).transfer(remainingAmount);
            WETH.deposit{value: amountRequired}();
            uniswapPayment = address(WETH);
        } else {
            _callTransferERC20(collateral, sender, remainingAmount); 
            uniswapPayment = collateral;
        }
        
        _callTransferERC20(uniswapPayment, msg.sender, amountRequired); 
    }
    
    function _callApproveERC20(address token, address spender, uint256 amount) internal {
        (bool success, bytes memory returndata) = token.call(abi.encodeWithSelector(_approveSelector, spender, amount));
        require(success && (returndata.length == 0 || abi.decode(returndata, (bool))), "ACOTokenExercise::_callApproveERC20");
    }
    
    function _callTransferERC20(address token, address recipient, uint256 amount) internal {
        (bool success, bytes memory returndata) = token.call(abi.encodeWithSelector(_transferSelector, recipient, amount));
        require(success && (returndata.length == 0 || abi.decode(returndata, (bool))), "ACOTokenExercise::_callTransferERC20");
    }
}