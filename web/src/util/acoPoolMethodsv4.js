import { getWeb3, sendTransaction } from './web3Methods'
import { acoPoolABIv4 } from './acoPoolABIv4';

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABIv4, acoPoolAddress)
    }
    return null;
}

export const setAcoPermissionConfig = (from, acoPoolAddress, newTolerancePriceBelowMin, newTolerancePriceBelowMax, newTolerancePriceAboveMin, newTolerancePriceAboveMax, newMinExpiration, newMaxExpiration) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.setAcoPermissionConfig([newTolerancePriceBelowMin, newTolerancePriceBelowMax, newTolerancePriceAboveMin, newTolerancePriceAboveMax, newMinExpiration, newMaxExpiration]).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}