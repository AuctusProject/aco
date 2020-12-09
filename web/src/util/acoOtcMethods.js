import { getWeb3, sendTransactionWithNonce, sendTransaction, signTypedData } from './web3Methods'
import { acoOtcAddress, CHAIN_ID, toDecimals, usdcAddress } from './constants'
import { acoOtcABI } from './acoOtcABI'

var acoOtcContract = null
function getAcoOtcContract() {
  if (acoOtcContract == null) {
    const _web3 = getWeb3()
    if (_web3) {
      acoOtcContract = new _web3.eth.Contract(acoOtcABI, acoOtcAddress)
    }
  }
  return acoOtcContract
}

export function swapAskOrder(from, signedOrder, nonce) {
  const contract = getAcoOtcContract()
  const data = contract.methods.swapAskOrder(signedOrder).encodeABI()
  return sendTransactionWithNonce(null, null, from, acoOtcAddress, null, data, null, nonce)
}

export function swapBidOrder(from, signedOrder, nonce) {
  const contract = getAcoOtcContract()
  const data = contract.methods.swapBidOrder(signedOrder).encodeABI()
  return sendTransactionWithNonce(null, null, from, acoOtcAddress, null, data, null, nonce)
}

export function cancel(from, orderNonce) {
  const contract = getAcoOtcContract()
  const data = contract.methods.cancel([orderNonce]).encodeABI()
  return sendTransaction(null, null, from, acoOtcAddress, null, data)
}

export function isValidAskOrder(signedOrder) {
  const contract = getAcoOtcContract()
  return contract.methods.isValidAskOrder(signedOrder).call()
}

export function isValidBidOrder(signedOrder) {
  const contract = getAcoOtcContract()
  return contract.methods.isValidBidOrder(signedOrder).call()
}

export function signerNonceStatus(from, nonce) {
  const contract = getAcoOtcContract()
  return contract.methods.signerNonceStatus(from, nonce).call()
}

export function signOrder(from, isAsk, option, optionAmount, usdcValue, expiry, counterpartyAddress) {
  return new Promise(function (resolve, reject) { 
    const otcContract = acoOtcAddress;
    if (!counterpartyAddress) {
      counterpartyAddress = "0x0000000000000000000000000000000000000000"
    }
    var partyAco = {
      "responsible": isAsk ? from : counterpartyAddress,
      "amount": optionAmount.toString(),
      "underlying": option.selectedUnderlying.address,
      "strikeAsset": usdcAddress,
      "isCall": option.selectedType === 1,
      "strikePrice": toDecimals(option.strikeValue, 6).toString(),
      "expiryTime": Math.ceil(option.expirationDate.getTime() / 1000)
    }
    var partyToken = {
      "responsible": isAsk ? counterpartyAddress : from,
      "amount": usdcValue.toString(),
      "token": usdcAddress
    }
    const order = {
      "nonce": Date.now(), 
      "expiry": expiry,
      "signer": isAsk ? partyAco : partyToken,
      "sender": isAsk ? partyToken : partyAco,
      "affiliate": {
        "responsible": "0x0000000000000000000000000000000000000000",
        "amount": "0",
        "token": "0x0000000000000000000000000000000000000000"
      }
    }
    const data = JSON.stringify({
      "domain": {
        "name": "ACOOTC",
        "version": "1",
        "chainId": Number.parseInt(CHAIN_ID),
        "verifyingContract": otcContract
      },
      "message": order,
      "primaryType": isAsk ? "AskOrder" : "BidOrder",
      "types": {
          "EIP712Domain": [{
                  "name": "name",
                  "type": "string"
              }, {
                  "name": "version",
                  "type": "string"
              }, {
                  "name": "chainId",
                  "type": "uint256"
              }, {
                  "name": "verifyingContract",
                  "type": "address"
              }
          ],
          "PartyAco": [{
                  "name": "responsible",
                  "type": "address"
              }, {
                  "name": "amount",
                  "type": "uint256"
              }, {
                  "name": "underlying",
                  "type": "address"
              }, {
                  "name": "strikeAsset",
                  "type": "address"
              }, {
                  "name": "isCall",
                  "type": "bool"
              }, {
                  "name": "strikePrice",
                  "type": "uint256"
              }, {
                  "name": "expiryTime",
                  "type": "uint256"
              }
          ],
          "PartyToken": [{
                  "name": "responsible",
                  "type": "address"
              }, {
                  "name": "amount",
                  "type": "uint256"
              }, {
                  "name": "token",
                  "type": "address"
              }
          ],
          "AskOrder": [{
                  "name": "nonce",
                  "type": "uint256"
              }, {
                  "name": "expiry",
                  "type": "uint256"
              }, {
                  "name": "signer",
                  "type": "PartyAco"
              }, {
                  "name": "sender",
                  "type": "PartyToken"
              }, {
                  "name": "affiliate",
                  "type": "PartyToken"
              }
          ],
          "BidOrder": [{
                  "name": "nonce",
                  "type": "uint256"
              }, {
                  "name": "expiry",
                  "type": "uint256"
              }, {
                  "name": "signer",
                  "type": "PartyToken"
              }, {
                  "name": "sender",
                  "type": "PartyAco"
              }, {
                  "name": "affiliate",
                  "type": "PartyToken"
              }
          ]
      }
    });

    signTypedData(from, data)
    .then((result) => {
      order.signature = {
        signatory: from,
        validator: otcContract,
        version: "0x01",
        v: result.v,
        r: result.r,
        s: result.s
      }
      resolve(order)
    })
    .catch(err => reject(err))
  })
}