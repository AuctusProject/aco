pragma solidity ^0.6.6;

import '../../util/Ownable.sol';
import '../../libs/ACOAssetHelper.sol';

contract ACODistributor is Ownable {

    event Claim(uint256 indexed id, address indexed account, address indexed aco, uint256 amount);
	
    address immutable public signer;
    
    mapping(address => uint256) public acosAmount;
    address[] public acos;
    
    bool public finished;
    
    mapping(uint256 => bool) public claimed;
    
    modifier isValidMessage(uint256 id, address account, uint256 amount, uint8 v, bytes32 r, bytes32 s) {
		require(signer == ecrecover(
		    keccak256(abi.encodePacked(
	            "\x19Ethereum Signed Message:\n32", 
	            keccak256(abi.encodePacked(address(this), id, account, amount))
            )), v, r, s), "Invalid arguments");
		_;
	}
    
    constructor (address _signer, address[] memory _acos, uint256[] memory _amounts) public {
        super.init();
        
        signer = _signer;
        finished = false;
        
        for (uint256 i = 0; i < _acos.length; ++i) {
            acosAmount[_acos[i]] = _amounts[i];
            acos.push(_acos[i]);
        }
    }
    
    function withdrawStuckToken(address token, uint256 amount, address destination) onlyOwner external {
        uint256 _balance = ACOAssetHelper._getAssetBalanceOf(token, address(this));
        if (_balance < amount) {
            amount = _balance;
        }
        ACOAssetHelper._transferAsset(token, destination, amount);
    }
    
    function acosLength() view external returns(uint256) {
        return acos.length;
    }
    
    function getClaimableAcos(uint256 amount) view external returns(address[] memory _acos, uint256[] memory _amounts) {
        uint256 qty = 0;
        uint256 remaining = amount;
        for (uint256 i = 0; i < acos.length; ++i) {
            address _aco = acos[i];
            uint256 available = acosAmount[_aco];
            if (available > 0) {
                ++qty;
                if (available >= remaining) {
                    break;
                } else {
                    remaining = remaining - available;
                }
            }
        }
        _acos = new address[](qty);
        _amounts = new uint256[](qty);
        
        if (qty > 0) {
            uint256 index = 0;
            remaining = amount;
            for (uint256 i = 0; i < acos.length; ++i) {
                address _aco = acos[i];
                uint256 available = acosAmount[_aco];
                if (available > 0) {
                    _acos[index] = _aco;
                    if (available >= remaining) {
                        _amounts[index] = remaining;
                        break;
                    } else {
                        remaining = remaining - available;
                        _amounts[index] = available;
                    }
                    ++index;
                }
            }
        }
    }
    
    function claim(uint256 id, address account, uint256 amount, uint8 v, bytes32 r, bytes32 s) isValidMessage(id, account, amount, v, r, s) external {
        require(!claimed[id], "Claimed");
        require(!finished, "Finished");
        
        claimed[id] = true;
        
        uint256 remaining = _claim(id, account, amount);
        if (remaining > 0) {
            finished = true;
        }
    }
    
    function _claim(uint256 id, address account, uint256 amount) internal returns(uint256 remaining) {
        remaining = amount;
        for (uint256 i = 0; i < acos.length; ++i) {
            address _aco = acos[i];
            uint256 available = acosAmount[_aco];
            if (available > 0) {
                if (available >= remaining) {
                    acosAmount[_aco] = available - remaining;
                    ACOAssetHelper._callTransferERC20(_aco, account, remaining);
		            emit Claim(id, account, _aco, remaining);
                    remaining = 0;
                    break;
                } else {
                    remaining = remaining - available;
                    acosAmount[_aco] = 0;
                    ACOAssetHelper._callTransferERC20(_aco, account, available);
		            emit Claim(id, account, _aco, available);
                }
            }
        }
    }
}