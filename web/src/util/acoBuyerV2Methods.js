import { getWeb3 } from './web3Methods'
import { acoBuyerAddress } from './constants'
import { acoBuyerV2ABI } from './acoBuyerV2ABI'

let acoBuyerV2Contract = null
function getAcoBuyerV2Contract() {
    if (acoBuyerV2Contract === null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoBuyerV2Contract = new _web3.eth.Contract(acoBuyerV2ABI, acoBuyerAddress)
        }
    }
    return acoBuyerV2Contract
}

export const getBuyData = (paymentToken, paymentAmount, arrayData) => {
    const acoBuyerV2Contract = getAcoBuyerV2Contract()
    const data = acoBuyerV2Contract.methods.buy(paymentToken, paymentAmount, arrayData).encodeABI()
    return data
}