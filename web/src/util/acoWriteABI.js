export const acoWriteABI = 
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_weth",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_erc20proxy",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "erc20proxy",
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
		"name": "weth",
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
				"name": "collateralAmount",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "exchangeAddress",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "exchangeData",
				"type": "bytes"
			}
		],
		"name": "write",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
]