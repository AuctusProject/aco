pragma solidity ^0.6.6;

import './ACOERC20Helper.sol';

contract ACOHelper is ACOERC20Helper {
    
    function _transferAsset(address asset, address to, uint256 amount) internal {
        if (_isEther(asset)) {
            payable(to).transfer(amount);
        } else {
            _callTransferERC20(asset, to, amount);
        }
    }
    
    function _receiveAsset(address asset, uint256 amount) internal {
        if (_isEther(asset)) {
            require(msg.value == amount, "ACOHelper:: Invalid ETH amount");
        } else {
            require(msg.value == 0, "ACOHelper:: Ether is not expected");
            _callTransferFromERC20(asset, msg.sender, address(this), amount);
        }
    }
}