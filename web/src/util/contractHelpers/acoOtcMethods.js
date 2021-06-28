import { getWeb3, sendTransactionWithNonce, sendTransaction, signTypedData, signPersonalData } from '../web3Methods'
import { addressToData, booleanToData, numberToData, toDecimals } from '../constants'
import { acoOtcABI } from './acoOtcABI'
import { acoOtcAddress, CHAIN_ID, usdAddress, usdAsset } from '../network'
import { keccak256 } from 'web3-utils'

const EIP712_DOMAIN_TYPEHASH = "0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f"
const PARTY_TOKEN_TYPEHASH = "0x2931dfcf984959555dea390582fca02c9f667964f705623d66f5e4ad8d97b497"
const PARTY_ACO_TYPEHASH = "0x3dab66b8067f5bc672f7c1d6ae941d7363806e20273b6bc67fe219df39b70dd2"
const ASK_ORDER_TYPEHASH = "0x36ae6ef16f8b2b0560c47c872c9cad5b4e9e7729bc56412cb7e6404c0ce294af"
const BID_ORDER_TYPEHASH = "0x48396ab859da953775befe0a5422cae35adb7cc18f2a6510dca0caa957c030c0"

function getAcoOtcContract() {
  const _web3 = getWeb3()
  if (_web3) {
    return new _web3.eth.Contract(acoOtcABI, acoOtcAddress())
  }
  return null
}

export function swapAskOrder(from, signedOrder, nonce) {
  const contract = getAcoOtcContract()
  const data = contract.methods.swapAskOrder(signedOrder).encodeABI()
  return sendTransactionWithNonce(null, null, from, acoOtcAddress(), null, data, null, nonce)
}

export function swapBidOrder(from, signedOrder, nonce) {
  const contract = getAcoOtcContract()
  const data = contract.methods.swapBidOrder(signedOrder).encodeABI()
  return sendTransactionWithNonce(null, null, from, acoOtcAddress(), null, data, null, nonce)
}

export function cancel(from, orderNonce) {
  const contract = getAcoOtcContract()
  const data = contract.methods.cancel([orderNonce]).encodeABI()
  return sendTransaction(null, null, from, acoOtcAddress(), null, data)
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
    const order = getOrder(from, isAsk, option, optionAmount, usdcValue, expiry, counterpartyAddress)
    typedSignOrder(from, isAsk, order).then((res) => resolve(res)).catch((err) => reject(err))
  })
}

const personalSignOrder = (from, isAsk, order) => {
  return new Promise((resolve, reject) => { 
    const otcContract = acoOtcAddress()
    const orderHash = (isAsk ? getAskOrderHash(order, otcContract) : getBidOrderHash(order, otcContract))
    const hash = keccak256(
      "0x19457468657265756d205369676e6564204d6573736167653a0a3332" + // "\x19Ethereum Signed Message:\n32"
      orderHash.substring(2)
    )
    signPersonalData(from, hash).then((result) => {
      order.signature = {
        signatory: from,
        validator: otcContract,
        version: "0x45",
        v: result.v,
        r: result.r,
        s: result.s
      }
      resolve(order)
    })
    .catch(err => reject(err))
  })
}

const typedSignOrder = (from, isAsk, order) => {
  return new Promise((resolve, reject) => { 
    const otcContract = acoOtcAddress()
    const data = JSON.stringify({
      "domain": {
        "name": "ACOOTC",
        "version": "1",
        "chainId": Number.parseInt(CHAIN_ID()),
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

    signTypedData(from, data).then((result) => {
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

const getOrder = (from, isAsk, option, optionAmount, usdcValue, expiry, counterpartyAddress) => {
    if (!counterpartyAddress) {
      counterpartyAddress = "0x0000000000000000000000000000000000000000"
    }
    var usd = usdAsset()
    var partyAco = {
      "responsible": isAsk ? from : counterpartyAddress,
      "amount": optionAmount.toString(),
      "underlying": option.selectedUnderlying.address,
      "strikeAsset": usdAddress(),
      "isCall": option.selectedType === 1,
      "strikePrice": toDecimals(option.strikeValue, usd.decimals).toString(),
      "expiryTime": Math.ceil(option.expirationDate.getTime() / 1000)
    }
    var partyToken = {
      "responsible": isAsk ? counterpartyAddress : from,
      "amount": usdcValue.toString(),
      "token": usdAddress()
    }
    return {
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
}

const getAskOrderHash = (order, otcContract) => {
  return keccak256(
    "0x1901" +
    hashDomain(otcContract).substring(2) +
    hashAskOrder(order).substring(2)
  )
}

const getBidOrderHash = (order, otcContract) => {
  return keccak256(
    "0x1901" +
    hashDomain(otcContract).substring(2) +
    hashBidOrder(order).substring(2)
  )
}

const hashAskOrder = (order) => {
  return keccak256(
    ASK_ORDER_TYPEHASH + 
    numberToData(order.nonce) +
    numberToData(order.expiry) +
    hashPartyAco(order.signer).substring(2) +
    hashPartyToken(order.sender).substring(2) +
    hashPartyToken(order.affiliate).substring(2) 
  )
}

const hashBidOrder = (order) => {
  return keccak256(
    BID_ORDER_TYPEHASH + 
    numberToData(order.nonce) +
    numberToData(order.expiry) +
    hashPartyToken(order.signer).substring(2) +
    hashPartyAco(order.sender).substring(2) +
    hashPartyToken(order.affiliate).substring(2)
  )
}

const hashDomain = (otcContract) => {
  return keccak256(
    EIP712_DOMAIN_TYPEHASH + 
    "9d77b271bcbb2f09d99a35c38a060803258e6b22730d9b17fee308c15b4775d6" + //keccak256 ACOOTC
    "c89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6" + //keccak256 1
    numberToData(CHAIN_ID()) +
    addressToData(otcContract)
  )
}

const hashPartyAco = (partyAco) => {
  return keccak256(
    PARTY_ACO_TYPEHASH +
    addressToData(partyAco.responsible) +
    numberToData(partyAco.amount) +
    addressToData(partyAco.underlying) +
    addressToData(partyAco.strikeAsset) +
    booleanToData(partyAco.isCall) +
    numberToData(partyAco.strikePrice) +
    numberToData(partyAco.expiryTime)
  )
}

const hashPartyToken = (partyToken) => {
  return keccak256(
    PARTY_TOKEN_TYPEHASH +
    addressToData(partyToken.responsible) +
    numberToData(partyToken.amount) +
    addressToData(partyToken.token)
  )
}