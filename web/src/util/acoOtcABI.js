export const acoOtcABI = 
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_acoFactory",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_weth",
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
				"name": "authorizerAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "authorizedSender",
				"type": "address"
			}
		],
		"name": "AuthorizeSender",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "authorizerAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "authorizedSigner",
				"type": "address"
			}
		],
		"name": "AuthorizeSigner",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "signer",
				"type": "address"
			}
		],
		"name": "Cancel",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "signer",
				"type": "address"
			}
		],
		"name": "CancelUpTo",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "authorizerAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "revokedSender",
				"type": "address"
			}
		],
		"name": "RevokeSender",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "authorizerAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "revokedSigner",
				"type": "address"
			}
		],
		"name": "RevokeSigner",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "signer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isAskOrder",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "signerAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "signerToken",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "senderAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "senderToken",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "affiliate",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "affiliateAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "affiliateToken",
				"type": "address"
			}
		],
		"name": "Swap",
		"type": "event"
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
		"inputs": [
			{
				"internalType": "address",
				"name": "authorizedSender",
				"type": "address"
			}
		],
		"name": "authorizeSender",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "authorizedSigner",
				"type": "address"
			}
		],
		"name": "authorizeSigner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256[]",
				"name": "nonces",
				"type": "uint256[]"
			}
		],
		"name": "cancel",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "minimumNonce",
				"type": "uint256"
			}
		],
		"name": "cancelUpTo",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "expiry",
						"type": "uint256"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
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
								"name": "strikePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "expiryTime",
								"type": "uint256"
							}
						],
						"internalType": "struct OTCTypes.PartyAco",
						"name": "signer",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "sender",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "affiliate",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "signatory",
								"type": "address"
							},
							{
								"internalType": "address",
								"name": "validator",
								"type": "address"
							},
							{
								"internalType": "bytes1",
								"name": "version",
								"type": "bytes1"
							},
							{
								"internalType": "uint8",
								"name": "v",
								"type": "uint8"
							},
							{
								"internalType": "bytes32",
								"name": "r",
								"type": "bytes32"
							},
							{
								"internalType": "bytes32",
								"name": "s",
								"type": "bytes32"
							}
						],
						"internalType": "struct OTCTypes.Signature",
						"name": "signature",
						"type": "tuple"
					}
				],
				"internalType": "struct OTCTypes.AskOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "isValidAskOrder",
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
				"components": [
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "expiry",
						"type": "uint256"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "signer",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
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
								"name": "strikePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "expiryTime",
								"type": "uint256"
							}
						],
						"internalType": "struct OTCTypes.PartyAco",
						"name": "sender",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "affiliate",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "signatory",
								"type": "address"
							},
							{
								"internalType": "address",
								"name": "validator",
								"type": "address"
							},
							{
								"internalType": "bytes1",
								"name": "version",
								"type": "bytes1"
							},
							{
								"internalType": "uint8",
								"name": "v",
								"type": "uint8"
							},
							{
								"internalType": "bytes32",
								"name": "r",
								"type": "bytes32"
							},
							{
								"internalType": "bytes32",
								"name": "s",
								"type": "bytes32"
							}
						],
						"internalType": "struct OTCTypes.Signature",
						"name": "signature",
						"type": "tuple"
					}
				],
				"internalType": "struct OTCTypes.BidOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "isValidBidOrder",
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
				"name": "authorizedSender",
				"type": "address"
			}
		],
		"name": "revokeSender",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "authorizedSigner",
				"type": "address"
			}
		],
		"name": "revokeSigner",
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
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "senderAuthorizations",
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
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "signerAuthorizations",
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
				"name": "",
				"type": "address"
			}
		],
		"name": "signerMinimumNonce",
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
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "signerNonceStatus",
		"outputs": [
			{
				"internalType": "bytes1",
				"name": "",
				"type": "bytes1"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "expiry",
						"type": "uint256"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
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
								"name": "strikePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "expiryTime",
								"type": "uint256"
							}
						],
						"internalType": "struct OTCTypes.PartyAco",
						"name": "signer",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "sender",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "affiliate",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "signatory",
								"type": "address"
							},
							{
								"internalType": "address",
								"name": "validator",
								"type": "address"
							},
							{
								"internalType": "bytes1",
								"name": "version",
								"type": "bytes1"
							},
							{
								"internalType": "uint8",
								"name": "v",
								"type": "uint8"
							},
							{
								"internalType": "bytes32",
								"name": "r",
								"type": "bytes32"
							},
							{
								"internalType": "bytes32",
								"name": "s",
								"type": "bytes32"
							}
						],
						"internalType": "struct OTCTypes.Signature",
						"name": "signature",
						"type": "tuple"
					}
				],
				"internalType": "struct OTCTypes.AskOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "swapAskOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "expiry",
						"type": "uint256"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "signer",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
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
								"name": "strikePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "expiryTime",
								"type": "uint256"
							}
						],
						"internalType": "struct OTCTypes.PartyAco",
						"name": "sender",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "responsible",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							}
						],
						"internalType": "struct OTCTypes.PartyToken",
						"name": "affiliate",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "signatory",
								"type": "address"
							},
							{
								"internalType": "address",
								"name": "validator",
								"type": "address"
							},
							{
								"internalType": "bytes1",
								"name": "version",
								"type": "bytes1"
							},
							{
								"internalType": "uint8",
								"name": "v",
								"type": "uint8"
							},
							{
								"internalType": "bytes32",
								"name": "r",
								"type": "bytes32"
							},
							{
								"internalType": "bytes32",
								"name": "s",
								"type": "bytes32"
							}
						],
						"internalType": "struct OTCTypes.Signature",
						"name": "signature",
						"type": "tuple"
					}
				],
				"internalType": "struct OTCTypes.BidOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "swapBidOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "weth",
		"outputs": [
			{
				"internalType": "contract IWETH",
				"name": "",
				"type": "address"
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