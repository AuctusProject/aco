export const acoAssetConverterHelperABI =
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_uniswapRouter",
				"type": "address"
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
				"name": "baseAsset",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "previousAggregator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "newAggregator",
				"type": "address"
			}
		],
		"name": "SetAggregator",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "baseAsset",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "oldTolerancePercentage",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newTolerancePercentage",
				"type": "uint256"
			}
		],
		"name": "SetPairTolerancePercentage",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "baseAsset",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address[]",
				"name": "previousUniswapMiddleRoute",
				"type": "address[]"
			},
			{
				"indexed": false,
				"internalType": "address[]",
				"name": "newUniswapMiddleRoute",
				"type": "address[]"
			}
		],
		"name": "SetUniswapMiddleRoute",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "PERCENTAGE_PRECISION",
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
		"name": "WETH",
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
		"name": "assetPrecision",
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
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToBuy",
				"type": "uint256"
			}
		],
		"name": "getExpectedAmountOutToSwapExactAmountIn",
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
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToBuy",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tolerancePercentage",
				"type": "uint256"
			}
		],
		"name": "getExpectedAmountOutToSwapExactAmountInWithSpecificTolerance",
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
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			}
		],
		"name": "getPairData",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
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
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			}
		],
		"name": "getPrice",
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
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isMinimumPrice",
				"type": "bool"
			}
		],
		"name": "getPriceWithTolerance",
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
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "getUniswapMiddleRouteByIndex",
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
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			}
		],
		"name": "hasAggregator",
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
		"inputs": [
			{
				"internalType": "address",
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "aggregator",
				"type": "address"
			}
		],
		"name": "setAggregator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tolerancePercentage",
				"type": "uint256"
			}
		],
		"name": "setPairTolerancePercentage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "baseAsset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "uniswapMiddleRoute",
				"type": "address[]"
			}
		],
		"name": "setUniswapMiddleRoute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToBuy",
				"type": "uint256"
			}
		],
		"name": "swapExactAmountIn",
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
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToBuy",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxAmountToSold",
				"type": "uint256"
			}
		],
		"name": "swapExactAmountInWithMaxAmountToSold",
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
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToBuy",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tolerancePercentage",
				"type": "uint256"
			}
		],
		"name": "swapExactAmountInWithSpecificTolerance",
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
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToSold",
				"type": "uint256"
			}
		],
		"name": "swapExactAmountOut",
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
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToSold",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minAmountToReceive",
				"type": "uint256"
			}
		],
		"name": "swapExactAmountOutWithMinAmountToReceive",
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
				"name": "assetToSold",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assetToBuy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountToSold",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tolerancePercentage",
				"type": "uint256"
			}
		],
		"name": "swapExactAmountOutWithSpecificTolerance",
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
		"name": "uniswapRouter",
		"outputs": [
			{
				"internalType": "contract IUniswapV2Router02",
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
				"name": "asset",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "destination",
				"type": "address"
			}
		],
		"name": "withdrawStuckAsset",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
]