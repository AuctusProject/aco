pragma solidity ^0.6.6;

import "../interfaces/IMintr.sol";
import "../interfaces/IERC20.sol";
import "./ERC20ForTest.sol";

/**
 * @title MintrForTest
 * @dev The contract is only for test purpose.
 */
contract MintrForTest is IMintr {
    address public token;
    mapping (address => uint256) public balanceToMint;

    constructor(address token_addr
    ) public {
        token = token_addr;
    }    
    
    function mint(address addr) external override {
        uint256 _balance = balanceToMint[addr];
        balanceToMint[addr] = 0;
        ERC20ForTest(token).mint(msg.sender, _balance);
    }

    function setBalanceToMint(address addr, uint256 amount) external {
        balanceToMint[addr] = amount;
    }
}