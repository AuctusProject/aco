import { getWeb3, sendTransactionWithNonce } from '../web3Methods'
import { acoFlashExerciseABI } from './acoFlashExerciseABI';
import { acoFlashExerciseAddress } from '../network';

function getAcoFlashExerciseTokenContract() {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoFlashExerciseABI, acoFlashExerciseAddress())
    }
    return null
}

export function hasUniswapPair(acoToken) {
    const contract = getAcoFlashExerciseTokenContract()
    return contract.methods.hasFlashExercise(acoToken).call()
}

export function flashExercise(from, acoToken, tokenAmount, minimumCollateral, nonce) {
    const contract = getAcoFlashExerciseTokenContract()
    var data = contract.methods.flashExercise(acoToken, tokenAmount, minimumCollateral, new Date().getTime()).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoFlashExerciseAddress(), null, data, null, nonce)
}

export function getEstimatedReturn(acoToken, tokenAmount) {
    const contract = getAcoFlashExerciseTokenContract()
    return contract.methods.getEstimatedReturn(acoToken, tokenAmount).call()
}

export function getFlashExerciseData(acoToken, tokenAmount) {
    const contract = getAcoFlashExerciseTokenContract()
    return contract.methods.getExerciseData(acoToken, tokenAmount, []).call()
}