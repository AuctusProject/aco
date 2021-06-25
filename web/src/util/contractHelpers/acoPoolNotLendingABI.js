export const acoPoolNotLendingABI = 
[{
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
        "internalType": "uint256",
        "name": "shares",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
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
}]