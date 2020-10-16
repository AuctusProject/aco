pragma solidity ^0.6.6;

import "../interfaces/ICurveFi3.sol";
import "../libs/ACOAssetHelper.sol";
import "./ERC20ForTest.sol";
import "./yERC20ForTest.sol";

/**
 * @title Curve3PoolForTest
 * @dev The contract is only for test purpose.
 */
contract Curve3PoolForTest is ICurveFi3 {
    uint256 internal constant N_COINS = 3;

    uint256 ZERO256 = 0;
    uint256[N_COINS] internal ZEROS = [ZERO256, ZERO256, ZERO256];

    uint256[N_COINS] internal PRECISION_MUL = [uint256(1), 1000000000000, 1000000000000];
    uint256 internal constant PRECISION = 10 ** 18;
    uint256[N_COINS] internal RATES = [uint256(1000000000000000000), 1000000000000000000000000000000, 1000000000000000000000000000000];
    uint256 FEE_DENOMINATOR = 10 ** 10;
    int128 FEE_INDEX = 2;    
    address[N_COINS] internal i_coins;
    uint256[N_COINS] public balances;
    uint256 public A;
    uint256 public fee;
    uint256 public admin_fee = 0;
    ERC20ForTest public token;

    constructor(
        address[N_COINS] memory _coins,
        address _pool_token,
        uint256 _A, 
        uint256 _fee
    ) public {
        i_coins = _coins;
        A = _A;
        fee = _fee;
        token = ERC20ForTest(_pool_token);
    }
    
    function coins(int128 arg0) external view override returns (address) {
        return i_coins[uint256(arg0)];
    }

    function get_virtual_price() external view override returns (uint) {
        uint256 D = get_D(_xp(_stored_rates()));
        uint256 token_supply = token.totalSupply();
        return D * PRECISION / token_supply;
    }

    function add_liquidity(uint256[N_COINS] calldata amounts, uint256 min_mint_amount) external override {
        uint256[N_COINS] memory fees = ZEROS;
        uint256 _fee = fee * N_COINS / (4 * (N_COINS - 1));
        uint256 _admin_fee = admin_fee;

        uint256 token_supply = token.totalSupply();
        uint256[N_COINS] memory rates = _stored_rates();
        uint256 D0 = 0;
        uint256[N_COINS] memory old_balances = balances;
        if (token_supply > 0) {
            D0 = get_D_mem(rates, old_balances);
        }
        uint256[N_COINS] memory new_balances = old_balances;

        for (uint256 i = 0; i < N_COINS; i++) {
            if (token_supply == 0) {
                assert(amounts[i] > 0);
            }
            new_balances[i] = old_balances[i] + amounts[i];
        }
        
        uint256 D1 = get_D_mem(rates, new_balances);
        assert(D1 > D0);

        uint256 D2 = D1;
        if (token_supply > 0) {
            for (uint256 i = 0; i < N_COINS; i++) {
                uint256 ideal_balance = D1 * old_balances[i] / D0;
                uint256 difference = 0;
                if (ideal_balance > new_balances[i]) {
                    difference = ideal_balance - new_balances[i];
                }
                else {
                    difference = new_balances[i] - ideal_balance;
                }
                fees[i] = _fee * difference / FEE_DENOMINATOR;
                balances[i] = new_balances[i] - fees[i] * _admin_fee / FEE_DENOMINATOR;
                new_balances[i] -= fees[i];
            }
            D2 = get_D_mem(rates, new_balances);
        }
        else {
            balances = new_balances;
        }

        uint256 mint_amount = 0;
        if (token_supply == 0) {
            mint_amount = D1;
        }
        else {
            mint_amount = token_supply * (D2 - D0) / D0;
        }

        require(mint_amount >= min_mint_amount, "Slippage screwed you");

        _transferAmounts(amounts);

        token.mint(msg.sender, mint_amount);
    }

    function _transferAmounts(uint256[N_COINS] memory amounts) internal {
        for (uint256 i = 0; i < N_COINS; i++) {
            ACOAssetHelper._callTransferFromERC20(i_coins[i], msg.sender, address(this), amounts[i]);
        }
    }

    function remove_liquidity(uint256 _amount, uint256[N_COINS] calldata min_amounts) external override {
        uint256 total_supply = token.totalSupply();
        uint256[N_COINS] memory amounts = ZEROS;

        for (uint256 i = 0; i < N_COINS; i++) {
            uint256 value = balances[i] * _amount / total_supply;
            require(value >= min_amounts[i], "Withdrawal resulted in fewer coins than expected");
            balances[i] -= value;
            amounts[i] = value;
            ACOAssetHelper._callTransferERC20(i_coins[i], msg.sender, value);
        }
        token.burnFrom(msg.sender, _amount);
    }
    
    function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external override {
        uint256[N_COINS] memory rates = _stored_rates();
        uint256 dy = _exchange(uint256(i), uint256(j), dx, rates);
        require(dy >= min_dy, "Exchange resulted in fewer coins than expected");

        ACOAssetHelper._callTransferFromERC20(i_coins[uint256(i)], msg.sender, address(this), dx);

        ACOAssetHelper._callTransferERC20(i_coins[uint256(j)], msg.sender, dy);
    }
    
    function _stored_rates() internal view returns (uint256[N_COINS] memory result) {
        result = RATES;
        
    }
    
    function _xp(uint256[N_COINS] memory rates) internal view returns (uint256[N_COINS] memory result) {
        result = rates;
        for (uint256 i = 0; i < N_COINS; i++) {
            result[i] = result[i] * balances[i] / PRECISION;
        }
    }
    
    function get_D(uint256[N_COINS] memory xp) internal view returns (uint256) {
        uint256 S = 0;
        for (uint256 i = 0; i < N_COINS; i++) {
            S += xp[i];
        }
        if (S == 0) {
            return 0;
        }
        uint256 Dprev = 0;
        uint256 D = S;
        uint256 Ann = A * N_COINS;
        for (uint256 i = 0; i < uint256(255); i++) {
            uint256 D_P = D;
            for (uint256 j = 0; j < N_COINS; j++) {
                D_P = D_P * D / (xp[j] * N_COINS);
            }
            Dprev = D;
            D = (Ann * S + D_P * N_COINS) * D / ((Ann - 1) * D + (N_COINS + 1) * D_P);
            if (D > Dprev) {
                if (D - Dprev <= 1) {
                    break;
                }
            }
            else {
                if (Dprev - D <= 1) {
                    break;
                }                    
            }
        }
        return D;
    }

    function get_D_mem(uint256[N_COINS] memory rates, uint256[N_COINS] memory _balances) internal view returns (uint256) {
        get_D(_xp_mem(rates, _balances));
    }

    function _xp_mem(uint256[N_COINS] memory rates, uint256[N_COINS] memory _balances) internal view returns (uint256[N_COINS] memory result) {
        result = rates;
        for (uint256 i = 0; i < N_COINS; i++) {
            result[i] = result[i] * _balances[i] / PRECISION;
        }
    }
    
    function _exchange(uint256 i, uint256 j, uint256 dx, uint256[N_COINS] memory rates) internal returns (uint256) {
        uint256[N_COINS] memory xp = _xp(rates);
        uint256 x = xp[i] + dx * rates[i] / PRECISION;
        uint256 y = get_y(i, j, x, xp);
        uint256 dy = xp[j] - y;
        uint256 dy_fee = dy * fee / FEE_DENOMINATOR;
        uint256 dy_admin_fee = dy_fee * admin_fee / FEE_DENOMINATOR;
        balances[i] = x * PRECISION / rates[i];
        balances[j] = (y + (dy_fee - dy_admin_fee)) * PRECISION / rates[j];

        uint256 _dy = (dy - dy_fee) * PRECISION / rates[j];

        return _dy;
    }

    function get_y(uint256 i, uint256 j, uint256 x, uint256[N_COINS] memory _xp_) internal view returns (uint256) {        
        assert((i != j) && (i >= 0) && (j >= 0) && (i < N_COINS) && (j < N_COINS));

        uint256 D = get_D(_xp_);
        uint256 c = D;
        uint256 S_ = 0;
        uint256 Ann = A * N_COINS;

        uint256 _x = 0;
        for (uint256 _i = 0; _i < N_COINS; _i++) {
            if (_i == i) {
                _x = x;
            }
            else if (_i != j) {
                _x = _xp_[_i];
            }                
            else {
                continue;
            }
            S_ += _x;
            c = c * D / (_x * N_COINS);
        }
        c = c * D / (Ann * N_COINS);
        uint256 b = S_ + D / Ann;
        uint256 y_prev = 0;
        uint256 y = D;
        for (uint256 _i = 0; _i < N_COINS; _i++) {
            y_prev = y;
            y = (y*y + c) / (2 * y + b - D);            
            if (y > y_prev) {
                if (y - y_prev <= 1) {
                    break;
                }
            }
            else {
                if (y_prev - y <= 1) {
                    break;
                }
            }
        }
        return y;
    }
}