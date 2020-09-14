pragma solidity ^0.6.6;

import './ACOERC20Helper.sol';

/**
 * @title ACOHelper
 * @dev A helper contract to handle with Ether and ERC20 tokens.
 */
contract ACOHelper is ACOERC20Helper {
    
	/**
     * @dev Internal function to transfer an asset. 
     * @param asset Address of the asset to be transferred.
     * @param to Address of the destination.
     * @param amount The amount to be transferred.
     */
    function _transferAsset(address asset, address to, uint256 amount) internal {
        if (_isEther(asset)) {
            payable(to).transfer(amount);
        } else {
            _callTransferERC20(asset, to, amount);
        }
    }
    
	/**
     * @dev Internal function to receive an asset. 
     * @param asset Address of the asset to be received.
     * @param amount The amount to be received.
     */
    function _receiveAsset(address asset, uint256 amount) internal {
        if (_isEther(asset)) {
            require(msg.value == amount, "ACOHelper:: Invalid ETH amount");
        } else {
            require(msg.value == 0, "ACOHelper:: Ether is not expected");
            _callTransferFromERC20(asset, msg.sender, address(this), amount);
        }
    }
}