pragma solidity ^0.6.6;

import "./ERC20ForTest.sol";

/**
 * @title ERC20ForTest
 * @dev The contract is only for test purpose.
 */
contract yERC20ForTest is ERC20ForTest {
    constructor(string memory _erc20name, 
        string memory _erc20symbol, 
        uint8 _erc20decimals, 
        uint256 _erc20totalSupply) 
        ERC20ForTest(_erc20name, _erc20symbol, _erc20decimals, _erc20totalSupply)
        public {}

    function getPricePerFullShare() external pure returns(uint) {
        return 1;
    }
}