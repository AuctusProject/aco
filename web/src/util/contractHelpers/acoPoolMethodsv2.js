import { hasAave } from '../network'
import { getWeb3, sendTransaction, sendTransactionWithNonce } from '../web3Methods'
import { acoPoolABIv2 } from './acoPoolABIv2'
import { acoPoolNotLendingABI } from './acoPoolNotLendingABI'

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABIv2, acoPoolAddress)
    }
    return null
}

function getAcoPoolNotLendingContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolNotLendingABI, acoPoolAddress)
    }
    return null
}

export const deposit = (from, acoPoolAddress, amount, minShares, isBaseAsset, nonce) => {
    let data = null
    if (hasAave()) {
        const acoPoolContract = getAcoPoolContract(acoPoolAddress)
        data = acoPoolContract.methods.deposit(amount, minShares, from, false).encodeABI()
    } else {
        const acoPoolContractNotLending = getAcoPoolNotLendingContract(acoPoolAddress)
        data = acoPoolContractNotLending.methods.deposit(amount, minShares, from).encodeABI()
    }
    let value = isBaseAsset ? amount : 0
    return sendTransactionWithNonce(null, null, from, acoPoolAddress, value, data, null, nonce)
}

export const withdrawNoLocked = (from, acoPoolAddress, shares, minCollateral) => {
    let data = null
    if (hasAave()) {
        const acoPoolContract = getAcoPoolContract(acoPoolAddress)
        data = acoPoolContract.methods.withdrawNoLocked(shares, minCollateral, from, false).encodeABI()
    } else {
        const acoPoolContractNotLending = getAcoPoolNotLendingContract(acoPoolAddress)
        data = acoPoolContractNotLending.methods.withdrawNoLocked(shares, minCollateral, from).encodeABI()
    }
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const withdrawWithLocked = (from, acoPoolAddress, shares) => {
    let data = null
    if (hasAave()) {
        const acoPoolContract = getAcoPoolContract(acoPoolAddress)
        data = acoPoolContract.methods.withdrawWithLocked(shares, from, false).encodeABI()
    } else {
        const acoPoolContractNotLending = getAcoPoolNotLendingContract(acoPoolAddress)
        data = acoPoolContractNotLending.methods.withdrawWithLocked(shares, from).encodeABI()
    }
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const getGeneralData = (acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.getGeneralData().call()
}