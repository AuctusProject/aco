import { getWeb3, sendTransactionWithNonce } from './web3Methods';
import { acoBuyerAddress } from './constants';
import { acoBuyerABI } from './acoBuyerABI';

var acoBuyerContract = null
function getAcoBuyerContract() {
    if (acoBuyerContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoBuyerContract = new _web3.eth.Contract(acoBuyerABI, acoBuyerAddress)
        }
    }
    return acoBuyerContract
}

export const buy = (from, acoToken, acoPools, acoAmounts, restrictions, deadline, nonce) => {
    const acoBuyerContract = getAcoBuyerContract()
    const data = acoBuyerContract.methods.buy(acoToken, from, deadline, acoPools, acoAmounts, restrictions).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoBuyerAddress, null, data, null, nonce)
}