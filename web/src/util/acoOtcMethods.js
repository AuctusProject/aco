import { getWeb3, sendTransactionWithNonce, sendTransaction } from './web3Methods'
import { acoOtcAddress } from './constants'
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