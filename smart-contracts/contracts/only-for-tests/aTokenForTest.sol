pragma solidity ^0.6.6;

import "../libs/ACOAssetHelper.sol";
import "../core/ERC20.sol";

interface ILendingPoolForTest {
    function getInterestRate() external view returns(uint256);
    function getUnderlying(address asset) external view returns(address);
}

contract aTokenForTest is ERC20 {
    uint256 public constant PRECISION = 1e18;
    uint256 public constant YEAR = 31104000;
    
    ILendingPoolForTest public immutable POOL;
    
    mapping(address => uint256) public userBaseTime;

    modifier onlyLendingPool {
        require(msg.sender == address(POOL), "Only Pool");
        _;
    }

    constructor() public {
        POOL = ILendingPoolForTest(msg.sender);
    }
    
    function name() public view override returns(string memory) {
        return string(abi.encodePacked("a", ACOAssetHelper._getAssetName(POOL.getUnderlying(address(this)))));
    }
    
    function symbol() public view override returns(string memory) {
        return string(abi.encodePacked("a", ACOAssetHelper._getAssetSymbol(POOL.getUnderlying(address(this)))));
    }
    
    function decimals() public view override returns(uint8) {
        return ACOAssetHelper._getAssetDecimals(POOL.getUnderlying(address(this)));
    }

    function totalSupply() public view override returns(uint256) {
        return _getBalanceNormalized(super.totalSupply(), userBaseTime[address(0)]);
    }
    
    function balanceOf(address user) public view override returns(uint256) {
        return _getBalanceNormalized(super.balanceOf(user), userBaseTime[user]);
    }
    
    function burn(
        address user,
        uint256 amount
    ) external onlyLendingPool {
        uint256 amountUnnormalized = _getBalanceUnnormalized(amount, userBaseTime[user]);
        super._burnAction(user, amountUnnormalized);
    }

    function mint(
        address user,
        uint256 amount
    ) external onlyLendingPool {
        require(amount != 0, "No balance");
        _setTime(user, amount);
        _setTime(address(0), amount);
        super._mintAction(user, amount);
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal override {
        uint256 amountUnnormalized = _getBalanceUnnormalized(amount, userBaseTime[sender]);
        _setTime(recipient, amountUnnormalized);
        super._transferAction(sender, recipient, amountUnnormalized);
    }
    
    function _setTime(address user, uint256 amount) internal {
        uint256 previousBalance = super.balanceOf(user);
        if (previousBalance > 0) {
            uint256 previousBaseTime = userBaseTime[user];
            userBaseTime[user] = previousBalance.mul(previousBaseTime).add(amount.mul(block.timestamp)).div(previousBalance.add(amount));
        } else {
            userBaseTime[user] = block.timestamp;
        }
    }
    
    function _getBalanceUnnormalized(uint256 amount, uint256 time) internal view returns(uint256) {
        return amount.mul(PRECISION).div(_factor(time));
    }
    
    function _getBalanceNormalized(uint256 amount, uint256 time) internal view returns(uint256) {
        return amount.mul(_factor(time)).div(PRECISION);
    }
    
    function _factor(uint256 time) internal view returns(uint256) {
        uint256 ir = POOL.getInterestRate();
        return ir.mul(block.timestamp.sub(time)).div(YEAR).add(PRECISION);
    }
}