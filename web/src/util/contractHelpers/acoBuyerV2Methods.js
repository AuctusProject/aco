import { getWeb3 } from '../web3Methods'
import { acoBuyerV2ABI } from './acoBuyerV2ABI'
import { acoBuyerAddress } from '../network'

function getAcoBuyerV2Contract() {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoBuyerV2ABI, acoBuyerAddress())
    }
    return null
}

export const getBuyData = (acoToken, paymentToken, paymentAmount, arrayData) => {
    const acoBuyerV2Contract = getAcoBuyerV2Contract()
    const data = acoBuyerV2Contract.methods.buy(acoToken, paymentToken, paymentAmount, arrayData).encodeABI()
    return data
}