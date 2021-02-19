import { getWeb3, sendTransaction, sendTransactionWithNonce } from './web3Methods'
import { acoPoolABIv2 } from './acoPoolABIv2';

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABIv2, acoPoolAddress)
    }
    return null;
}

export const deposit = (from, acoPoolAddress, amount, minShares, isEther, nonce) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.deposit(amount, minShares, from, false).encodeABI()
    var value = isEther ? amount : 0
    return sendTransactionWithNonce(null, null, from, acoPoolAddress, value, data, null, nonce)
}

export const withdrawNoLocked = (from, acoPoolAddress, shares, minCollateral) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.withdrawNoLocked(shares, minCollateral, from, false).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const withdrawWithLocked = (from, acoPoolAddress, shares) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.withdrawWithLocked(shares, from, false).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const getGeneralData = (acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.getGeneralData().call()
}