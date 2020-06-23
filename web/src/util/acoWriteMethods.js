import { getWeb3, sendTransactionWithNonce } from './web3Methods'
import { acoWriteAddress } from './constants';
import { acoWriteABI } from './acoWriteABI';

var acoWriteContract = null
function getAcoWriteContract() {
    if (acoWriteContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoWriteContract = new _web3.eth.Contract(acoWriteABI, acoWriteAddress)
        }
    }
    return acoWriteContract
}

export function write(from, acoToken, collateralAmount, exchangeAddress, exchangeData, value, nonce) {
    const contract = getAcoWriteContract()
    var data = contract.methods.write(acoToken, collateralAmount, exchangeAddress, exchangeData).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoWriteAddress, value, data, null, nonce)
}