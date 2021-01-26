pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import "../libs/ACOAssetHelper.sol";
import "../interfaces/ILendingPool.sol";
import "./aTokenForTest.sol";

contract LendingPoolForTest {
	uint256 public immutable interestRate;
	mapping(address => DataTypes.ReserveData) public assets; 
	mapping(address => address) underlyings;
	
	constructor(uint256 _interestRate) public {
        interestRate = _interestRate;
    }
	
	function getInterestRate() external view returns(uint256) {
	    return interestRate;
	}
	
	function getUnderlying(address asset) external view returns(address) {
	    return underlyings[asset];
	}
	
	function getReserveData(address asset) external view returns(DataTypes.ReserveData memory) {
	    return assets[asset];
	}
	
	function setAsset(address asset, uint256 amount) external {
	    DataTypes.ReserveData storage data = assets[asset];
	    require(data.aTokenAddress == address(0), "Asset already defined");
	    
	    ACOAssetHelper._receiveAsset(asset, amount);
	    
	    address aToken = address(new aTokenForTest());
	    data.aTokenAddress = aToken;
	    underlyings[aToken] = asset;
	}
	
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16
    ) external {
        DataTypes.ReserveData storage data = assets[asset];
        require(data.aTokenAddress != address(0), "Asset is not defined");
        
        ACOAssetHelper._receiveAsset(asset, amount);
        aTokenForTest(data.aTokenAddress).mint(onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns(uint256) {
        DataTypes.ReserveData storage data = assets[asset];
        require(data.aTokenAddress != address(0), "Asset is not defined");
        
        aTokenForTest(data.aTokenAddress).burn(msg.sender, amount);
        ACOAssetHelper._transferAsset(asset, to, amount);
    }
}