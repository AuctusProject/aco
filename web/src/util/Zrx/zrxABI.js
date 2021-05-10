export const zrxABI = [
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "takerTokenFillAmount",
				"type": "uint128"
			},
			{
				"internalType": "address",
				"name": "taker",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "_fillLimitOrder",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "takerTokenFilledAmount",
				"type": "uint128"
			},
			{
				"internalType": "uint128",
				"name": "makerTokenFilledAmount",
				"type": "uint128"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "takerTokenFillAmount",
				"type": "uint128"
			},
			{
				"internalType": "address",
				"name": "taker",
				"type": "address"
			}
		],
		"name": "_fillRfqOrder",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "takerTokenFilledAmount",
				"type": "uint128"
			},
			{
				"internalType": "uint128",
				"name": "makerTokenFilledAmount",
				"type": "uint128"
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder[]",
				"name": "orders",
				"type": "tuple[]"
			}
		],
		"name": "batchCancelLimitOrders",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "makerTokens",
				"type": "address[]"
			},
			{
				"internalType": "address[]",
				"name": "takerTokens",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "minValidSalts",
				"type": "uint256[]"
			}
		],
		"name": "batchCancelPairLimitOrders",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "makerTokens",
				"type": "address[]"
			},
			{
				"internalType": "address[]",
				"name": "takerTokens",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "minValidSalts",
				"type": "uint256[]"
			}
		],
		"name": "batchCancelPairLimitOrdersWithSigner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "makerTokens",
				"type": "address[]"
			},
			{
				"internalType": "address[]",
				"name": "takerTokens",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "minValidSalts",
				"type": "uint256[]"
			}
		],
		"name": "batchCancelPairRfqOrders",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "makerTokens",
				"type": "address[]"
			},
			{
				"internalType": "address[]",
				"name": "takerTokens",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "minValidSalts",
				"type": "uint256[]"
			}
		],
		"name": "batchCancelPairRfqOrdersWithSigner",
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder[]",
				"name": "orders",
				"type": "tuple[]"
			}
		],
		"name": "batchCancelRfqOrders",
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder[]",
				"name": "orders",
				"type": "tuple[]"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature[]",
				"name": "signatures",
				"type": "tuple[]"
			},
			{
				"internalType": "uint128[]",
				"name": "takerTokenFillAmounts",
				"type": "uint128[]"
			},
			{
				"internalType": "bool",
				"name": "revertIfIncomplete",
				"type": "bool"
			}
		],
		"name": "batchFillLimitOrders",
		"outputs": [
			{
				"internalType": "uint128[]",
				"name": "takerTokenFilledAmounts",
				"type": "uint128[]"
			},
			{
				"internalType": "uint128[]",
				"name": "makerTokenFilledAmounts",
				"type": "uint128[]"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder[]",
				"name": "orders",
				"type": "tuple[]"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature[]",
				"name": "signatures",
				"type": "tuple[]"
			},
			{
				"internalType": "uint128[]",
				"name": "takerTokenFillAmounts",
				"type": "uint128[]"
			},
			{
				"internalType": "bool",
				"name": "revertIfIncomplete",
				"type": "bool"
			}
		],
		"name": "batchFillRfqOrders",
		"outputs": [
			{
				"internalType": "uint128[]",
				"name": "takerTokenFilledAmounts",
				"type": "uint128[]"
			},
			{
				"internalType": "uint128[]",
				"name": "makerTokenFilledAmounts",
				"type": "uint128[]"
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder[]",
				"name": "orders",
				"type": "tuple[]"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature[]",
				"name": "signatures",
				"type": "tuple[]"
			}
		],
		"name": "batchGetLimitOrderRelevantStates",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "orderHash",
						"type": "bytes32"
					},
					{
						"internalType": "enum IExchange.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFilledAmount",
						"type": "uint128"
					}
				],
				"internalType": "struct IExchange.OrderInfo[]",
				"name": "orderInfos",
				"type": "tuple[]"
			},
			{
				"internalType": "uint128[]",
				"name": "actualFillableTakerTokenAmounts",
				"type": "uint128[]"
			},
			{
				"internalType": "bool[]",
				"name": "isSignatureValids",
				"type": "bool[]"
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
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder[]",
				"name": "orders",
				"type": "tuple[]"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature[]",
				"name": "signatures",
				"type": "tuple[]"
			}
		],
		"name": "batchGetRfqOrderRelevantStates",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "orderHash",
						"type": "bytes32"
					},
					{
						"internalType": "enum IExchange.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFilledAmount",
						"type": "uint128"
					}
				],
				"internalType": "struct IExchange.OrderInfo[]",
				"name": "orderInfos",
				"type": "tuple[]"
			},
			{
				"internalType": "uint128[]",
				"name": "actualFillableTakerTokenAmounts",
				"type": "uint128[]"
			},
			{
				"internalType": "bool[]",
				"name": "isSignatureValids",
				"type": "bool[]"
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
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "cancelLimitOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "makerToken",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "takerToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "minValidSalt",
				"type": "uint256"
			}
		],
		"name": "cancelPairLimitOrders",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "makerToken",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "takerToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "minValidSalt",
				"type": "uint256"
			}
		],
		"name": "cancelPairLimitOrdersWithSigner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "makerToken",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "takerToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "minValidSalt",
				"type": "uint256"
			}
		],
		"name": "cancelPairRfqOrders",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "makerToken",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "takerToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "minValidSalt",
				"type": "uint256"
			}
		],
		"name": "cancelPairRfqOrdersWithSigner",
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "cancelRfqOrder",
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "takerTokenFillAmount",
				"type": "uint128"
			}
		],
		"name": "fillLimitOrder",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "takerTokenFilledAmount",
				"type": "uint128"
			},
			{
				"internalType": "uint128",
				"name": "makerTokenFilledAmount",
				"type": "uint128"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "takerTokenFillAmount",
				"type": "uint128"
			}
		],
		"name": "fillOrKillLimitOrder",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "makerTokenFilledAmount",
				"type": "uint128"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "takerTokenFillAmount",
				"type": "uint128"
			}
		],
		"name": "fillOrKillRfqOrder",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "makerTokenFilledAmount",
				"type": "uint128"
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "takerTokenFillAmount",
				"type": "uint128"
			}
		],
		"name": "fillRfqOrder",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "takerTokenFilledAmount",
				"type": "uint128"
			},
			{
				"internalType": "uint128",
				"name": "makerTokenFilledAmount",
				"type": "uint128"
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
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "getLimitOrderHash",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "orderHash",
				"type": "bytes32"
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
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "getLimitOrderInfo",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "orderHash",
						"type": "bytes32"
					},
					{
						"internalType": "enum IExchange.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFilledAmount",
						"type": "uint128"
					}
				],
				"internalType": "struct IExchange.OrderInfo",
				"name": "orderInfo",
				"type": "tuple"
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
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFeeAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "feeRecipient",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.LimitOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			}
		],
		"name": "getLimitOrderRelevantState",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "orderHash",
						"type": "bytes32"
					},
					{
						"internalType": "enum IExchange.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFilledAmount",
						"type": "uint128"
					}
				],
				"internalType": "struct IExchange.OrderInfo",
				"name": "orderInfo",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "actualFillableTakerTokenAmount",
				"type": "uint128"
			},
			{
				"internalType": "bool",
				"name": "isSignatureValid",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getProtocolFeeMultiplier",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "multiplier",
				"type": "uint32"
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
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "getRfqOrderHash",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "orderHash",
				"type": "bytes32"
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
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder",
				"name": "order",
				"type": "tuple"
			}
		],
		"name": "getRfqOrderInfo",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "orderHash",
						"type": "bytes32"
					},
					{
						"internalType": "enum IExchange.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFilledAmount",
						"type": "uint128"
					}
				],
				"internalType": "struct IExchange.OrderInfo",
				"name": "orderInfo",
				"type": "tuple"
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
						"internalType": "address",
						"name": "makerToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "takerToken",
						"type": "address"
					},
					{
						"internalType": "uint128",
						"name": "makerAmount",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "takerAmount",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "maker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "taker",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "txOrigin",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "pool",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expiry",
						"type": "uint64"
					},
					{
						"internalType": "uint256",
						"name": "salt",
						"type": "uint256"
					}
				],
				"internalType": "struct IExchange.RfqOrder",
				"name": "order",
				"type": "tuple"
			},
			{
				"components": [
					{
						"internalType": "enum IExchange.SignatureType",
						"name": "signatureType",
						"type": "uint8"
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
				"internalType": "struct IExchange.Signature",
				"name": "signature",
				"type": "tuple"
			}
		],
		"name": "getRfqOrderRelevantState",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "orderHash",
						"type": "bytes32"
					},
					{
						"internalType": "enum IExchange.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint128",
						"name": "takerTokenFilledAmount",
						"type": "uint128"
					}
				],
				"internalType": "struct IExchange.OrderInfo",
				"name": "orderInfo",
				"type": "tuple"
			},
			{
				"internalType": "uint128",
				"name": "actualFillableTakerTokenAmount",
				"type": "uint128"
			},
			{
				"internalType": "bool",
				"name": "isSignatureValid",
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
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "signer",
				"type": "address"
			}
		],
		"name": "isValidOrderSigner",
		"outputs": [
			{
				"internalType": "bool",
				"name": "isAllowed",
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
				"name": "signer",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "registerAllowedOrderSigner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "origins",
				"type": "address[]"
			},
			{
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "registerAllowedRfqOrigins",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32[]",
				"name": "poolIds",
				"type": "bytes32[]"
			}
		],
		"name": "transferProtocolFeesForPools",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]