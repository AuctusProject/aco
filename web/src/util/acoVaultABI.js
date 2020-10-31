export const acoVaultABI = 
[
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoFlashExercise",
				"type": "address"
			}
		],
		"name": "setAcoFlashExercise",
		"outputs": [],
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
						"name": "acoPoolFactory",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "assetConverter",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "acoFlashExercise",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "minPercentageToKeep",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "currentAcoToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "acoPool",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceAbove",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tolerancePriceBelow",
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
					},
					{
						"internalType": "uint256",
						"name": "minTimeToExercise",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "exerciseSlippage",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "withdrawFee",
						"type": "uint256"
					}
				],
				"internalType": "struct IACOVault.VaultInitData",
				"name": "initData",
				"type": "tuple"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
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
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Deposit",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "earn",
		"outputs": [],
		"stateMutability": "nonpayable",
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
				"name": "acoAmount",
				"type": "uint256"
			}
		],
		"name": "exerciseAco",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
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
				"name": "acoTokensOut",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenIn",
				"type": "uint256"
			}
		],
		"name": "ExerciseAco",
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
				"indexed": true,
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "acoTokenAmountIn",
				"type": "uint256"
			}
		],
		"name": "RewardAco",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldAcoFlashExercise",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoFlashExercise",
				"type": "address"
			}
		],
		"name": "SetAcoFlashExercise",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoPool",
				"type": "address"
			}
		],
		"name": "setAcoPool",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldAcoPool",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoPool",
				"type": "address"
			}
		],
		"name": "SetAcoPool",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoToken",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "newAcoPool",
				"type": "address"
			}
		],
		"name": "setAcoToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldAcoToken",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoToken",
				"type": "address"
			}
		],
		"name": "SetAcoToken",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAssetConverter",
				"type": "address"
			}
		],
		"name": "setAssetConverter",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldAssetConverter",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAssetConverter",
				"type": "address"
			}
		],
		"name": "SetAssetConverter",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newController",
				"type": "address"
			}
		],
		"name": "setController",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldController",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newController",
				"type": "address"
			}
		],
		"name": "SetController",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newExerciseSlippage",
				"type": "uint256"
			}
		],
		"name": "setExerciseSlippage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldExerciseSlippage",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newExerciseSlippage",
				"type": "uint256"
			}
		],
		"name": "SetExerciseSlippage",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newMaxExpiration",
				"type": "uint256"
			}
		],
		"name": "setMaxExpiration",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldMaxExpiration",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newMaxExpiration",
				"type": "uint256"
			}
		],
		"name": "SetMaxExpiration",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newMinExpiration",
				"type": "uint256"
			}
		],
		"name": "setMinExpiration",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldMinExpiration",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newMinExpiration",
				"type": "uint256"
			}
		],
		"name": "SetMinExpiration",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newMinPercentageToKeep",
				"type": "uint256"
			}
		],
		"name": "setMinPercentageToKeep",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldMinPercentageToKeep",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newMinPercentageToKeep",
				"type": "uint256"
			}
		],
		"name": "SetMinPercentageToKeep",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newMinTimeToExercise",
				"type": "uint256"
			}
		],
		"name": "setMinTimeToExercise",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldMinTimeToExercise",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newMinTimeToExercise",
				"type": "uint256"
			}
		],
		"name": "SetMinTimeToExercise",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "acoTokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "rewardAmount",
				"type": "uint256"
			}
		],
		"name": "setReward",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newTolerancePriceAbove",
				"type": "uint256"
			}
		],
		"name": "setTolerancePriceAbove",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldTolerancePriceAbove",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newTolerancePriceAbove",
				"type": "uint256"
			}
		],
		"name": "SetTolerancePriceAbove",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newTolerancePriceBelow",
				"type": "uint256"
			}
		],
		"name": "setTolerancePriceBelow",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldTolerancePriceBelow",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newTolerancePriceBelow",
				"type": "uint256"
			}
		],
		"name": "SetTolerancePriceBelow",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "setValidAcoTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newWithdrawFee",
				"type": "uint256"
			}
		],
		"name": "setWithdrawFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "oldWithdrawFee",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newWithdrawFee",
				"type": "uint256"
			}
		],
		"name": "SetWithdrawFee",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "skim",
		"outputs": [],
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
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
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
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			}
		],
		"name": "Withdraw",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_token",
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
		"stateMutability": "payable",
		"type": "receive"
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
		"name": "acoFlashExercise",
		"outputs": [
			{
				"internalType": "contract IACOFlashExercise",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acoPool",
		"outputs": [
			{
				"internalType": "contract IACOPool",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acoPoolFactory",
		"outputs": [
			{
				"internalType": "contract IACOPoolFactory",
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
		"inputs": [],
		"name": "assetConverter",
		"outputs": [
			{
				"internalType": "contract IACOAssetConverterHelper",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "available",
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
		"name": "balance",
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
		"name": "controller",
		"outputs": [
			{
				"internalType": "contract IController",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "currentAcoToken",
		"outputs": [
			{
				"internalType": "contract IACOToken",
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
		"inputs": [],
		"name": "exerciseSlippage",
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
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			}
		],
		"name": "getAccountAcoDataByAco",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "tokenPerShare",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tokenAccumulated",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "index",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "initialized",
						"type": "bool"
					}
				],
				"internalType": "struct IACOVault.AccountAcoData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "getAccountAcoDataByIndex",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "tokenPerShare",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tokenAccumulated",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "index",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "initialized",
						"type": "bool"
					}
				],
				"internalType": "struct IACOVault.AccountAcoData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
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
		"name": "getAccountAcoDataCount",
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
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			}
		],
		"name": "getAccountSituation",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "",
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
				"name": "acoToken",
				"type": "address"
			}
		],
		"name": "getAcoData",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "profit",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "exercised",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tokenPerShare",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "withdrawnNormalizedAmount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "withdrawnProfit",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "index",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "initialized",
						"type": "bool"
					}
				],
				"internalType": "struct IACOVault.AcoData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPricePerFullShare",
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
		"name": "maxExpiration",
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
		"name": "minExpiration",
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
		"name": "minPercentageToKeep",
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
		"name": "minTimeToExercise",
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
		"name": "numberOfValidAcoTokens",
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
		"name": "token",
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
		"name": "tolerancePriceAbove",
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
		"name": "tolerancePriceBelow",
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
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "validAcos",
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
		"name": "withdrawFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]