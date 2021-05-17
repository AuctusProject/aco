import { getWeb3, sendTransactionWithNonce } from './web3Methods'
import { acoWriterAddress } from './constants'
import { acoWriterV2ABI } from './acoWriterV2ABI'
import { getSwapData } from './Zrx/zrxWeb3'
import BigNumber from 'bignumber.js'
import Web3Utils from 'web3-utils'

let acoWriterContract = null
const getAcoWriteContract = () => {
    if (acoWriterContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoWriterContract = new _web3.eth.Contract(acoWriterV2ABI, acoWriterAddress)
        }
    }
    return acoWriterContract
}

export const write = async (from, acoToken, isCollateralEther, zrxData, nonce) => {
    const orders = []
    const takerAmounts = []
    let totalTaker = new BigNumber(0)
    for (let i = 0; i < zrxData.length; ++i) {
        orders.push(zrxData[i].order)
        takerAmounts.push(zrxData[i].acoAmount.toString(10))
        totalTaker = totalTaker.plus(zrxData[i].acoAmount)
    }
    const zrxOrder = await getSwapData(orders, takerAmounts)
    const contract = getAcoWriteContract()
    const data = contract.methods.write(acoToken, totalTaker.toString(10), zrxOrder.data).encodeABI()
    let ethValue = zrxOrder.ethValue
    let gasPrice = zrxOrder.gasPrice
    if (isCollateralEther) {
        ethValue = ethValue.add(new Web3Utils.BN(totalTaker.toString(10)))
    }
    return sendTransactionWithNonce(gasPrice, null, from, acoWriterAddress, ethValue, data, null, nonce)
}