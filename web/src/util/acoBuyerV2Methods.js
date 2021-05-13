import { getWeb3, sendTransactionWithNonce } from './web3Methods'
import { acoBuyerAddress } from './constants'
import { acoBuyerV2ABI } from './acoBuyerV2ABI'

let acoBuyerV2Contract = null
function getAcoBuyerV2Contract() {
    if (acoBuyerContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoBuyerV2Contract = new _web3.eth.Contract(acoBuyerV2ABI, acoBuyerAddress)
        }
    }
    return acoBuyerV2Contract
}

export const buy = (from, paymentToken, paymentAmount, arrayData, nonce, gasPrice = null, ethValue = null) => {
    const acoBuyerV2Contract = getAcoBuyerV2Contract()
    const data = acoBuyerV2Contract.methods.buy(paymentToken, paymentAmount, arrayData).encodeABI()
    return sendTransactionWithNonce(gasPrice, null, from, acoBuyerAddress, ethValue, data, null, nonce)
}