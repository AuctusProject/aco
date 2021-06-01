export const acoPoolABIv5 = 
[
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "valueSold",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "collateralLocked",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "collateralRedeemed",
				"type": "uint256"
			}
		],
		"name": "ACORedeem",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "collateralAmount",
				"type": "uint256"
			}
		],
		"name": "Deposit",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "collateralAmount",
				"type": "uint256"
			}
		],
		"name": "LendCollateral",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountOut",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "collateralRestored",
				"type": "uint256"
			}
		],
		"name": "RestoreCollateral",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "tolerancePriceBelowMin",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceBelowMax",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceAboveMin",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceAboveMax",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "minExpiration",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxExpiration",
						"type": "uint256"
					}
				],
				"indexed": false,
				"internalType": "struct IACOPool2.PoolAcoPermissionConfig",
				"name": "oldConfig",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "tolerancePriceBelowMin",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceBelowMax",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceAboveMin",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceAboveMax",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "minExpiration",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxExpiration",
						"type": "uint256"
					}
				],
				"indexed": false,
				"internalType": "struct IACOPool2.PoolAcoPermissionConfig",
				"name": "newConfig",
				"type": "tuple"
			}
		],
		"name": "SetAcoPermissionConfig",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"components": [
					{
						"internalType": "int256",
						"name": "tolerancePriceBelowMin",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceBelowMax",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceAboveMin",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceAboveMax",
						"type": "int256"
					},
					{
						"internalType": "uint256",
						"name": "minStrikePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxStrikePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "minExpiration",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxExpiration",
						"type": "uint256"
					}
				],
				"indexed": false,
				"internalType": "struct IACOPool2.PoolAcoPermissionConfigV2",
				"name": "oldConfig",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "int256",
						"name": "tolerancePriceBelowMin",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceBelowMax",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceAboveMin",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceAboveMax",
						"type": "int256"
					},
					{
						"internalType": "uint256",
						"name": "minStrikePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxStrikePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "minExpiration",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxExpiration",
						"type": "uint256"
					}
				],
				"indexed": false,
				"internalType": "struct IACOPool2.PoolAcoPermissionConfigV2",
				"name": "newConfig",
				"type": "tuple"
			}
		],
		"name": "SetAcoPermissionConfigV2",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldBaseVolatility",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newBaseVolatility",
				"type": "uint256"
			}
		],
		"name": "SetBaseVolatility",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "previousStatus",
				"type": "bool"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "newStatus",
				"type": "bool"
			}
		],
		"name": "SetForbiddenAcoCreator",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldAdmin",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAdmin",
				"type": "address"
			}
		],
		"name": "SetPoolAdmin",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"components": [
					{
						"internalType": "uint16",
						"name": "lendingPoolReferral",
						"type": "uint16"
					},
					{
						"internalType": "uint256",
						"name": "withdrawOpenPositionPenalty",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "underlyingPriceAdjustPercentage",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maximumOpenAco",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "feeDestination",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "assetConverter",
						"type": "address"
					}
				],
				"indexed": false,
				"internalType": "struct IACOPool2.PoolProtocolConfig",
				"name": "oldConfig",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "uint16",
						"name": "lendingPoolReferral",
						"type": "uint16"
					},
					{
						"internalType": "uint256",
						"name": "withdrawOpenPositionPenalty",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "underlyingPriceAdjustPercentage",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maximumOpenAco",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "feeDestination",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "assetConverter",
						"type": "address"
					}
				],
				"indexed": false,
				"internalType": "struct IACOPool2.PoolProtocolConfig",
				"name": "newConfig",
				"type": "tuple"
			}
		],
		"name": "SetProtocolConfig",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldStrategy",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newStrategy",
				"type": "address"
			}
		],
		"name": "SetStrategy",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "previousPermission",
				"type": "bool"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "newPermission",
				"type": "bool"
			}
		],
		"name": "SetValidAcoCreator",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "protocolFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "underlyingPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "volatility",
				"type": "uint256"
			}
		],
		"name": "Swap",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "noLocked",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "underlyingWithdrawn",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "strikeAssetWithdrawn",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address[]",
				"name": "acos",
				"type": "address[]"
			},
			{
				"indexed": false,
				"internalType": "uint256[]",
				"name": "acosAmount",
				"type": "uint256[]"
			}
		],
		"name": "Withdraw",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "acoData",
		"outputs": [
			{
				"internalType": "bool",
				"name": "open",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "valueSold",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "collateralLocked",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "collateralRedeemed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "openIndex",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acoFactory",
		"outputs": [
			{
				"internalType": "contract IACOFactory",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acoPermissionConfig",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "tolerancePriceBelowMin",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tolerancePriceBelowMax",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tolerancePriceAboveMin",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tolerancePriceAboveMax",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minExpiration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxExpiration",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acoPermissionConfigV2",
		"outputs": [
			{
				"internalType": "int256",
				"name": "tolerancePriceBelowMin",
				"type": "int256"
			},
			{
				"internalType": "int256",
				"name": "tolerancePriceBelowMax",
				"type": "int256"
			},
			{
				"internalType": "int256",
				"name": "tolerancePriceAboveMin",
				"type": "int256"
			},
			{
				"internalType": "int256",
				"name": "tolerancePriceAboveMax",
				"type": "int256"
			},
			{
				"internalType": "uint256",
				"name": "minStrikePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxStrikePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minExpiration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxExpiration",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "acoTokens",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "baseVolatility",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			}
		],
		"name": "canSwap",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "chiToken",
		"outputs": [
			{
				"internalType": "contract IChiToken",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "collateral",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "decreaseAllowance",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "collateralAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minShares",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isLendingToken",
				"type": "bool"
			}
		],
		"name": "deposit",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "forbiddenAcoCreators",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "collateralAmount",
				"type": "uint256"
			}
		],
		"name": "getDepositShares",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getGeneralData",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "underlyingBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "strikeAssetBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "collateralLocked",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "collateralOnOpenPosition",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "collateralLockedRedeemable",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "poolSupply",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			}
		],
		"name": "getWithdrawNoLockedData",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "underlyingWithdrawn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "strikeAssetWithdrawn",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isPossible",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			}
		],
		"name": "getWithdrawWithLocked",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "underlyingWithdrawn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "strikeAssetWithdrawn",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "acos",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "acosAmount",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "increaseAllowance",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "acoFactory",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "lendingPool",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "underlying",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "strikeAsset",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "isCall",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "baseVolatility",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "admin",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "strategy",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "isPrivate",
						"type": "bool"
					},
					{
						"components": [
							{
								"internalType": "int256",
								"name": "tolerancePriceBelowMin",
								"type": "int256"
							},
							{
								"internalType": "int256",
								"name": "tolerancePriceBelowMax",
								"type": "int256"
							},
							{
								"internalType": "int256",
								"name": "tolerancePriceAboveMin",
								"type": "int256"
							},
							{
								"internalType": "int256",
								"name": "tolerancePriceAboveMax",
								"type": "int256"
							},
							{
								"internalType": "uint256",
								"name": "minStrikePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "maxStrikePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "minExpiration",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "maxExpiration",
								"type": "uint256"
							}
						],
						"internalType": "struct IACOPool2.PoolAcoPermissionConfigV2",
						"name": "acoPermissionConfigV2",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint16",
								"name": "lendingPoolReferral",
								"type": "uint16"
							},
							{
								"internalType": "uint256",
								"name": "withdrawOpenPositionPenalty",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "underlyingPriceAdjustPercentage",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "fee",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "maximumOpenAco",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "feeDestination",
								"type": "address"
							},
							{
								"internalType": "address",
								"name": "assetConverter",
								"type": "address"
							}
						],
						"internalType": "struct IACOPool2.PoolProtocolConfig",
						"name": "protocolConfig",
						"type": "tuple"
					}
				],
				"internalType": "struct IACOPool2.InitData",
				"name": "initData",
				"type": "tuple"
			}
		],
		"name": "init",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isCall",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isPrivate",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lendCollateral",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lendingPool",
		"outputs": [
			{
				"internalType": "contract ILendingPool",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "numberOfAcoTokensNegotiated",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "numberOfOpenAcoTokens",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "openAcos",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "poolAdmin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "protocolConfig",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "lendingPoolReferral",
				"type": "uint16"
			},
			{
				"internalType": "uint256",
				"name": "withdrawOpenPositionPenalty",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "underlyingPriceAdjustPercentage",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maximumOpenAco",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "feeDestination",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetConverter",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			}
		],
		"name": "quote",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "swapPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "protocolFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "underlyingPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "volatility",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			}
		],
		"name": "redeemACOToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "redeemACOTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "restoreCollateral",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "int256",
						"name": "tolerancePriceBelowMin",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceBelowMax",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceAboveMin",
						"type": "int256"
					},
					{
						"internalType": "int256",
						"name": "tolerancePriceAboveMax",
						"type": "int256"
					},
					{
						"internalType": "uint256",
						"name": "minStrikePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxStrikePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "minExpiration",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxExpiration",
						"type": "uint256"
					}
				],
				"internalType": "struct IACOPool2.PoolAcoPermissionConfigV2",
				"name": "newConfig",
				"type": "tuple"
			}
		],
		"name": "setAcoPermissionConfig",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newBaseVolatility",
				"type": "uint256"
			}
		],
		"name": "setBaseVolatility",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "acoCreator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isForbidden",
				"type": "bool"
			}
		],
		"name": "setForbiddenAcoCreator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAdmin",
				"type": "address"
			}
		],
		"name": "setPoolAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "uint16",
						"name": "lendingPoolReferral",
						"type": "uint16"
					},
					{
						"internalType": "uint256",
						"name": "withdrawOpenPositionPenalty",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "underlyingPriceAdjustPercentage",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maximumOpenAco",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "feeDestination",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "assetConverter",
						"type": "address"
					}
				],
				"internalType": "struct IACOPool2.PoolProtocolConfig",
				"name": "newConfig",
				"type": "tuple"
			}
		],
		"name": "setProtocolConfig",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newStrategy",
				"type": "address"
			}
		],
		"name": "setStrategy",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "acoCreator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "newPermission",
				"type": "bool"
			}
		],
		"name": "setValidAcoCreator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "strategy",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "strikeAsset",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "restriction",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			}
		],
		"name": "swap",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "underlying",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "validAcoCreators",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minCollateral",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "withdrawLendingToken",
				"type": "bool"
			}
		],
		"name": "withdrawNoLocked",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "underlyingWithdrawn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "strikeAssetWithdrawn",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "destination",
				"type": "address"
			}
		],
		"name": "withdrawStuckToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "withdrawLendingToken",
				"type": "bool"
			}
		],
		"name": "withdrawWithLocked",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "underlyingWithdrawn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "strikeAssetWithdrawn",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "acos",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "acosAmount",
				"type": "uint256[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
]