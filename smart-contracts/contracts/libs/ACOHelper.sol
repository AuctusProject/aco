pragma solidity ^0.6.6;

import './ACOERC20Helper.sol';

library ACOHelper {
    
	/**
     * @dev Internal function to transfer an asset. 
     * @param asset Address of the asset to be transferred.
     * @param to Address of the destination.
     * @param amount The amount to be transferred.
     */
    function _transferAsset(address asset, address to, uint256 amount) internal {
        if (ACOERC20Helper._isEther(asset)) {
            payable(to).transfer(amount);
        } else {
            ACOERC20Helper._callTransferERC20(asset, to, amount);
        }
    }
    
	/**
     * @dev Internal function to receive an asset. 
     * @param asset Address of the asset to be received.
     * @param amount The amount to be received.
     */
    function _receiveAsset(address asset, uint256 amount) internal {
        if (ACOERC20Helper._isEther(asset)) {
            require(msg.value == amount, "ACOHelper:: Invalid ETH amount");
        } else {
            require(msg.value == 0, "ACOHelper:: Ether is not expected");
            ACOERC20Helper._callTransferFromERC20(asset, msg.sender, address(this), amount);
        }
    }
}