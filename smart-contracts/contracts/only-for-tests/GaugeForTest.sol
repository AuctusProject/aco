pragma solidity ^0.6.6;

import "../interfaces/IGauge.sol";
import "../interfaces/IERC20.sol";

/**
 * @title GaugeForTest
 * @dev The contract is only for test purpose.
 */
contract GaugeForTest is IGauge {
    address public lp_token;
    mapping (address => uint256) public balances;
    uint256 public totalSupply;

    constructor(address lp_addr
    ) public {
        lp_token = lp_addr;
    }    
    
    function deposit(uint256 _value) external override {
        if (_value != 0) {
            address addr = msg.sender;
            uint256 _balance = balances[addr] + _value;
            uint256 _supply = totalSupply + _value;
            balances[addr] = _balance;
            totalSupply = _supply;

            IERC20(lp_token).transferFrom(msg.sender, address(this), _value);
        }
    }

    function balanceOf(address addr) external view override returns (uint256) {
        return balances[addr];
    }

    function withdraw(uint256 _value) external override {
        uint256 _balance = balances[msg.sender] - _value;
        uint256 _supply = totalSupply - _value;
        balances[msg.sender] = _balance;
        totalSupply = _supply;

        IERC20(lp_token).transfer(msg.sender, _value);
    }
}