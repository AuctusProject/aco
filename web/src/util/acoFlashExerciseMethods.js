import { getWeb3, sendTransactionWithNonce } from './web3Methods'
import { acoFlashExerciseAddress, ethAddress } from './constants';
import { acoFlashExerciseABI } from './acoFlashExerciseABI';

var acoFlashExerciseTokenContract = null
function getAcoFlashExerciseTokenContract() {
    if (acoFlashExerciseTokenContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoFlashExerciseTokenContract = new _web3.eth.Contract(acoFlashExerciseABI, acoFlashExerciseAddress)
        }
    }
    return acoFlashExerciseTokenContract
}

export function hasUniswapPair(acoToken) {
    const contract = getAcoFlashExerciseTokenContract()
    return contract.methods.hasFlashExercise(acoToken).call()
}

export function flashExercise(from, acoToken, tokenAmount, minimumCollateral, nonce) {
    const contract = getAcoFlashExerciseTokenContract()
    var data = contract.methods.flashExercise(acoToken, tokenAmount, minimumCollateral, new Date().getTime()).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoFlashExerciseAddress, null, data, null, nonce)
}

export function getEstimatedReturn(acoToken, tokenAmount) {
    const contract = getAcoFlashExerciseTokenContract()
    return contract.methods.getEstimatedReturn(acoToken, tokenAmount).call()
}

export function getFlashExerciseData(acoToken, tokenAmount) {
    const contract = getAcoFlashExerciseTokenContract()
    return contract.methods.getExerciseData(acoToken, tokenAmount, []).call()
}