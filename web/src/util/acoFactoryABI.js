export const acoFactoryABI = 
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
				"name": "strikePrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "expiryTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "acoTokenImplementation",
				"type": "address"
			}
		],
		"name": "NewAcoToken",
		"type": "event"
	},
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
				"name": "strikePrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "expiryTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "acoToken",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "acoTokenImplementation",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"name": "NewAcoTokenData",
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
		"name": "SetAcoFee",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousAcoFeeDestination",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoFeeDestination",
				"type": "address"
			}
		],
		"name": "SetAcoFeeDestination",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousAcoTokenImplementation",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAcoTokenImplementation",
				"type": "address"
			}
		],
		"name": "SetAcoTokenImplementation",
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
				"name": "operator",
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
		"name": "SetOperator",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "acoFee",
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
		"name": "acoFeeDestination",
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
		"name": "acoTokenData",
		"outputs": [
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
				"name": "strikePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "expiryTime",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acoTokenImplementation",
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
				"name": "strikePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "expiryTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxExercisedAccounts",
				"type": "uint256"
			}
		],
		"name": "createAcoToken",
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
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "creators",
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
				"name": "_acoTokenImplementation",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_acoFee",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_acoFeeDestination",
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
		"name": "operators",
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
				"name": "newAcoFee",
				"type": "uint256"
			}
		],
		"name": "setAcoFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoFeeDestination",
				"type": "address"
			}
		],
		"name": "setAcoFeeDestination",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAcoTokenImplementation",
				"type": "address"
			}
		],
		"name": "setAcoTokenImplementation",
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
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "newPermission",
				"type": "bool"
			}
		],
		"name": "setOperator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
]