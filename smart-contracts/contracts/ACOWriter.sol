pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import "./IACOToken.sol";
import "./I0x.sol";
import "./IWETH.sol";

/**
 * @title ACOWriter
 * @dev Contract to write ACO tokens. Minting them and selling on the 0x.
 */
contract ACOWriter {
    
    /**
     * @dev Address for 0x exchange.
     */
    address immutable public exchange;
    
    /**
     * @dev The WETH address.
     */
    address immutable public weth;
    
    /**
     * @dev Address for 0x ERC20 proxy.
     */
    address immutable public erc20proxy;
    
    /**
     * @dev Selector for ERC20 balanceOf function.
     */
    bytes4 immutable internal _balanceOfSelector;
    
    /**
     * @dev Selector for ERC20 transfer function.
     */
    bytes4 immutable internal _transferSelector;
    
    /**
     * @dev Selector for ERC20 transferFrom function.
     */
    bytes4 immutable internal _transferFromSelector;
    
    /**
     * @dev Selector for ERC20 approve function.
     */
    bytes4 immutable internal _approveSelector;
    
    constructor(address _exchange, address _weth, address _erc20proxy) public {
        exchange = _exchange;
        weth =_weth;
        erc20proxy = _erc20proxy;
        
        _balanceOfSelector = bytes4(keccak256(bytes("balanceOf(address)")));
        _transferSelector = bytes4(keccak256(bytes("transfer(address,uint256)")));
        _transferFromSelector = bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));
        _approveSelector = bytes4(keccak256(bytes("approve(address,uint256)")));
    }
    
    /**
     * @dev Function to guarantee that the contract will receive ether only from the 0x exchange.
     */
    receive() external payable {
        if (msg.sender != exchange) {
            revert();
        }
    }
    
    /**
     * @dev Function to write ACO tokens.
     * The tokens are minted then sold on the 0x exchange. The transaction sender receive the profit. 
     * @param acoToken Address of the ACO token.
     * @param collateralAmount Amount of collateral deposited.
     * @param orders List of 0x orders.
     * @param signatures List of 0x signatures.
     */
    function write(address acoToken, uint256 collateralAmount, I0x.Order[] memory orders, bytes[] memory signatures) public payable {
        require(msg.value > 0,  "ACOWriter::write: Invalid msg value");
        require(collateralAmount > 0,  "ACOWriter::write: Invalid collateral amount");
        
        address _collateral = IACOToken(acoToken).collateral();
        if (_isEther(_collateral)) {
            IACOToken(acoToken).mintToPayable{value: collateralAmount}(msg.sender);
        } else {
            _transferFromERC20(_collateral, msg.sender, address(this), collateralAmount);
            _approveERC20(_collateral, acoToken, collateralAmount);
            IACOToken(acoToken).mintTo(msg.sender, collateralAmount);
        }
        
        _sellACOTokens(acoToken, orders, signatures);
    }
    
    /**
     * @dev Internal function to sell the ACO tokens and transfer the profit to the transaction sender.
     * @param acoToken Address of the ACO token.
     * @param orders List of 0x orders.
     * @param signatures List of 0x signatures.
     */
    function _sellACOTokens(address acoToken, I0x.Order[] memory orders, bytes[] memory signatures) internal {
        uint256 acoBalance = _balanceOfERC20(acoToken, address(this));
        _approveERC20(acoToken, erc20proxy, acoBalance);
        I0x(exchange).marketSellOrdersFillOrKill{value: address(this).balance}(orders, acoBalance, signatures);
        
        address token = IACOToken(acoToken).strikeAsset();
        if(_isEther(token)) {
            IWETH(weth).withdraw(_balanceOfERC20(weth, address(this)));
        } else {
            _transferERC20(token, msg.sender, _balanceOfERC20(token, address(this)));
        }
        
        if (address(this).balance > 0) {
            msg.sender.transfer(address(this).balance);
        }
    }
    
    /**
     * @dev Internal function to get if the address is for Ethereum (0x0).
     * @param _address Address to be checked.
     * @return Whether the address is for Ethereum.
     */ 
    function _isEther(address _address) internal pure returns(bool) {
        return _address == address(0);
    } 
    
    /**
     * @dev Internal function to get balance of ERC20 tokens.
     * @param token Address of the token.
     * @param owner Address of the owner.
     * @return The token balance of the owner.
     */
    function _balanceOfERC20(address token, address owner) internal view returns(uint256) {
        (bool success, bytes memory returndata) = token.staticcall(abi.encodeWithSelector(_balanceOfSelector, owner));
        require(success, "ACOWriter::_balanceOfERC20");
        return abi.decode(returndata, (uint256));
    }
    
    /**
     * @dev Internal function to approve ERC20 tokens.
     * @param token Address of the token.
     * @param spender Authorized address.
     * @param amount Amount to transfer.
     */
    function _approveERC20(address token, address spender, uint256 amount) internal {
        (bool success, bytes memory returndata) = token.call(abi.encodeWithSelector(_approveSelector, spender, amount));
        require(success && (returndata.length == 0 || abi.decode(returndata, (bool))), "ACOWriter::_approveERC20");
    }
    
    /**
     * @dev Internal function to call transferFrom on ERC20 tokens.
     * @param token Address of the token.
     * @param sender Address of the sender.
     * @param recipient Address of the transfer destination.
     * @param amount Amount to transfer.
     */
     function _transferFromERC20(address token, address sender, address recipient, uint256 amount) internal {
        (bool success, bytes memory returndata) = token.call(abi.encodeWithSelector(_transferFromSelector, sender, recipient, amount));
        require(success && (returndata.length == 0 || abi.decode(returndata, (bool))), "ACOWriter::_transferFromERC20");
    }
    
    /**
     * @dev Internal function to transfer ERC20 tokens.
     * @param token Address of the token.
     * @param recipient Address of the transfer destination.
     * @param amount Amount to transfer.
     */
    function _transferERC20(address token, address recipient, uint256 amount) internal {
        (bool success, bytes memory returndata) = token.call(abi.encodeWithSelector(_transferSelector, recipient, amount));
        require(success && (returndata.length == 0 || abi.decode(returndata, (bool))), "ACOWriter::_transferERC20");
    }
}