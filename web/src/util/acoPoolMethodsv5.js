import { getWeb3, sendTransaction } from './web3Methods.js'
import { acoPoolABIv5 } from './acoPoolABIv5.js'

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABIv5, acoPoolAddress)
    }
    return null;
}

export const setAcoPermissionConfig = (from, acoPoolAddress, newTolerancePriceBelowMin, newTolerancePriceBelowMax, newTolerancePriceAboveMin, newTolerancePriceAboveMax, newMinStrikePrice, newMaxStrikePrice, newMinExpiration, newMaxExpiration) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.setAcoPermissionConfig([newTolerancePriceBelowMin, newTolerancePriceBelowMax, newTolerancePriceAboveMin, newTolerancePriceAboveMax, newMinStrikePrice, newMaxStrikePrice, newMinExpiration, newMaxExpiration]).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

let poolPermissionConfig = {}
export const acoPermissionConfig = (acoPoolAddress) => {
    return new Promise((resolve, reject) => {
        if (poolPermissionConfig[acoPoolAddress]) {
            resolve(poolPermissionConfig[acoPoolAddress])
        } else {
            const acoPoolContract = getAcoPoolContract(acoPoolAddress)
            acoPoolContract.methods.acoPermissionConfigV2().call().then((result) => {
                poolPermissionConfig[acoPoolAddress] = result
                resolve(poolPermissionConfig[acoPoolAddress])
            }).catch((err) => reject(err))
        }
    })
}

export const refreshAcoPermissionConfig = (acoPoolAddress) => {
    poolPermissionConfig[acoPoolAddress] = undefined
    return acoPermissionConfig(acoPoolAddress)
}