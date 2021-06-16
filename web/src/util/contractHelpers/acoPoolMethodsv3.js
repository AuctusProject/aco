import { getWeb3, sendTransaction } from '../web3Methods'
import { acoPoolABIv3 } from './acoPoolABIv3';

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABIv3, acoPoolAddress)
    }
    return null
}

export const setBaseVolatility = (from, acoPoolAddress, newBaseVolatility) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.setBaseVolatility(newBaseVolatility).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const restoreCollateral = (from, acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.restoreCollateral().encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const redeemACOTokens = (from, acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.redeemACOTokens().encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const setPoolDataForAcoPermission = (from, acoPoolAddress, newTolerancePriceBelow, newTolerancePriceAbove, newMinExpiration, newMaxExpiration) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.setPoolDataForAcoPermission(newTolerancePriceBelow, newTolerancePriceAbove, newMinExpiration, newMaxExpiration).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}