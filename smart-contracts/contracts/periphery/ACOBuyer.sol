pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import "../libs/ACOAssetHelper.sol";
import "../libs/SafeMath.sol";
import "../interfaces/IACOPool2.sol";
import "../interfaces/IACOFactory.sol";
import "../interfaces/IChiToken.sol";

contract ACOBuyer {
    
    IACOFactory immutable public acoFactory;
	IChiToken immutable public chiToken;

    bool internal _notEntered;

    modifier nonReentrant() {
        require(_notEntered, "ACOBuyer::Reentry");
        _notEntered = false;
        _;
        _notEntered = true;
    }
    
    modifier discountCHI {
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        chiToken.freeFromUpTo(msg.sender, (gasSpent + 14154) / 41947);
    }
    
    constructor(address _acoFactory, address _chiToken) public {
        acoFactory = IACOFactory(_acoFactory);
	    chiToken = IChiToken(_chiToken);
        _notEntered = true;
    }

    function buy(
        address acoToken, 
        address to,
        uint256 deadline,
        address[] calldata acoPools,
        uint256[] calldata amounts,
        uint256[] calldata restrictions
    ) 
        nonReentrant 
        external 
    {
        _buy(acoToken, to, deadline, acoPools, amounts, restrictions);
    }
    
    function buyWithGasToken(
        address acoToken, 
        address to,
        uint256 deadline,
        address[] calldata acoPools,
        uint256[] calldata amounts,
        uint256[] calldata restrictions
    ) 
        discountCHI
        nonReentrant 
        external 
    {
        _buy(acoToken, to, deadline, acoPools, amounts, restrictions);
    }
    
    function _buy(
        address acoToken, 
        address to,
        uint256 deadline,
        address[] memory acoPools,
        uint256[] memory acoAmounts,
        uint256[] memory restrictions
    ) internal {
        require(acoToken != address(0), "ACOBuyer::buy: Invalid ACO token");
        require(acoPools.length > 0, "ACOBuyer::buy: Invalid pools");
        require(acoPools.length == acoAmounts.length && acoPools.length == restrictions.length, "ACOBuyer::buy: Invalid arguments");
        
        (,address strikeAsset,,,) = acoFactory.acoTokenData(acoToken);
        
        uint256 amount = 0;
        for (uint256 i = 0; i < acoPools.length; ++i) {
            require(acoAmounts[i] > 0, "ACOBuyer::buy: Invalid amount");
            require(restrictions[i] > 0, "ACOBuyer::buy: Invalid restriction");
            amount = SafeMath.add(amount, restrictions[i]);
        }
        
        ACOAssetHelper._receiveAsset(strikeAsset, amount);
        
        address _this = address(this);
        uint256 previousBalance = ACOAssetHelper._getAssetBalanceOf(strikeAsset, _this);
        previousBalance = SafeMath.sub(previousBalance, amount);
        
        for (uint256 j = 0; j < acoPools.length; ++j) {
            ACOAssetHelper._setAssetInfinityApprove(strikeAsset, _this, acoPools[j], restrictions[j]);
            IACOPool2(acoPools[j]).swap(acoToken, acoAmounts[j], restrictions[j], to, deadline);
        }
        
        uint256 afterBalance = ACOAssetHelper._getAssetBalanceOf(strikeAsset, _this);
        uint256 remaining = SafeMath.sub(afterBalance, previousBalance);
        if (remaining > 0) {
            ACOAssetHelper._transferAsset(strikeAsset, msg.sender, remaining);
        }
    }
}