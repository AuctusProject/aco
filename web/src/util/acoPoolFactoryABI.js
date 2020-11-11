export const acoPoolFactoryABI = 
[
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "underlying",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "strikeAsset",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "isCall",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "poolStart",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "minStrikePrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxStrikePrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "minExpiration",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxExpiration",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "canBuy",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "acoPool",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "acoPoolImplementation",
				"type": "address"
			}
		],
		"name": "NewAcoPool",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousAcoAssetConverterHelper",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoAssetConverterHelper",
				"type": "address"
			}
		],
		"name": "SetAcoAssetConverterHelper",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousAcoFactory",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoFactory",
				"type": "address"
			}
		],
		"name": "SetAcoFactory",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousAcoFlashExercise",
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
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "previousAcoFee",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "newAcoFee",
				"type": "uint256"
			}
		],
		"name": "SetAcoPoolFee",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousAcoPoolFeeDestination",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoPoolFeeDestination",
				"type": "address"
			}
		],
		"name": "SetAcoPoolFeeDestination",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousAcoPoolImplementation",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoPoolImplementation",
				"type": "address"
			}
		],
		"name": "SetAcoPoolImplementation",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "poolAdmin",
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
		"name": "SetAcoPoolPermission",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousChiToken",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newChiToken",
				"type": "address"
			}
		],
		"name": "SetChiToken",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousFactoryAdmin",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newFactoryAdmin",
				"type": "address"
			}
		],
		"name": "SetFactoryAdmin",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "strategy",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "previousPermission",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "newPermission",
				"type": "bool"
			}
		],
		"name": "SetStrategyPermission",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "acoFactory",
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
		"name": "acoFlashExercise",
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
		"name": "acoPoolData",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "poolStart",
				"type": "uint256"
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
			},
			{
				"internalType": "bool",
				"name": "canBuy",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acoPoolFee",
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
		"name": "acoPoolFeeDestination",
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
		"name": "acoPoolImplementation",
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
		"name": "assetConverterHelper",
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
		"name": "chiToken",
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
				"name": "poolStart",
				"type": "uint256"
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
			},
			{
				"internalType": "bool",
				"name": "canBuy",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "strategy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "baseVolatility",
				"type": "uint256"
			}
		],
		"name": "createAcoPool",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "factoryAdmin",
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
				"name": "_factoryAdmin",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_acoPoolImplementation",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_acoFactory",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_acoFlashExercise",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_chiToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_acoPoolFee",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_acoPoolFeeDestination",
				"type": "address"
			}
		],
		"name": "init",
		"outputs": [],
		"stateMutability": "nonpayable",
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
		"name": "poolAdminPermission",
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
				"internalType": "address",
				"name": "newAcoAssetConverterHelper",
				"type": "address"
			}
		],
		"name": "setAcoAssetConverterHelper",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoFactory",
				"type": "address"
			}
		],
		"name": "setAcoFactory",
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
				"internalType": "uint256[]",
				"name": "baseVolatilities",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "acoPools",
				"type": "address[]"
			}
		],
		"name": "setAcoPoolBaseVolatility",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newAcoPoolFee",
				"type": "uint256"
			}
		],
		"name": "setAcoPoolFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoPoolFeeDestination",
				"type": "address"
			}
		],
		"name": "setAcoPoolFeeDestination",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoPoolImplementation",
				"type": "address"
			}
		],
		"name": "setAcoPoolImplementation",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "poolAdmin",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "newPermission",
				"type": "bool"
			}
		],
		"name": "setAcoPoolPermission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "strategy",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "acoPools",
				"type": "address[]"
			}
		],
		"name": "setAcoPoolStrategy",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "strategy",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "newPermission",
				"type": "bool"
			}
		],
		"name": "setAcoPoolStrategyPermission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newChiToken",
				"type": "address"
			}
		],
		"name": "setChiToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newFactoryAdmin",
				"type": "address"
			}
		],
		"name": "setFactoryAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
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
		"name": "strategyPermitted",
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
		"stateMutability": "payable",
		"type": "receive"
	}
]