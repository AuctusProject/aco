import { getWeb3, sendTransaction } from './web3Methods';
import { acoDistributorAddress } from './constants';
import { acoDistributorABI } from './acoDistributorABI';

var acoDistributorContract = null
function getAcoDistributorContract() {
    if (acoDistributorContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoDistributorContract = new _web3.eth.Contract(acoDistributorABI, acoDistributorAddress)
        }
    }
    return acoDistributorContract
}

export const getClaimableAcos = (amount) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.methods.getClaimableAcos(amount).call()
}

export const claim = (id, from, amount, v, r, s) => {
    const acoDistributorContract = getAcoDistributorContract()
    const data = acoDistributorContract.methods.claim(id, from, amount, v, r, s).encodeABI()
    return sendTransaction(null, null, from, acoDistributorAddress, null, data, null)
}