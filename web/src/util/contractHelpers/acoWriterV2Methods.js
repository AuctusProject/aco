import { getWeb3, sendTransactionWithNonce } from '../web3Methods'
import { isBaseAsset, toDecimals } from '../constants'
import { acoWriterV2ABI } from './acoWriterV2ABI'
import { getSwapData } from '../Zrx/zrxWeb3'
import BigNumber from 'bignumber.js'
import Web3Utils from 'web3-utils'
import { acoWriterAddress } from '../network'

const getAcoWriteContract = () => {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoWriterV2ABI, acoWriterAddress())
    }
    return null
}

export const write = async (from, option, zrxData, nonce) => {
    const orders = []
    const takerAmounts = []
    const oneUnderlying = new BigNumber(toDecimals("1", option.underlyingInfo.decimals))
    const strikePrice = new BigNumber(option.strikePrice)
    let totalCollateral = new BigNumber(0)
    for (let i = 0; i < zrxData.length; ++i) {
        orders.push(zrxData[i].order)
        takerAmounts.push(zrxData[i].acoAmount.toString(10))
        let collateralAmount = new BigNumber(0)
        if (option.isCall) {
            collateralAmount = zrxData[i].acoAmount
        } else {
            collateralAmount = zrxData[i].acoAmount.times(strikePrice).div(oneUnderlying).integerValue(BigNumber.ROUND_CEIL)
        }
        totalCollateral = totalCollateral.plus(collateralAmount)
    }
    const zrxOrder = await getSwapData(orders, takerAmounts)
    const contract = getAcoWriteContract()
    const data = contract.methods.write(option.acoToken, totalCollateral.toString(10), zrxOrder.data).encodeABI()
    let ethValue = zrxOrder.ethValue
    let gasPrice = zrxOrder.gasPrice
    let collateralAddress = (option.isCall ? option.underlying : option.strikeAsset)
    if (isBaseAsset(collateralAddress)) {
        ethValue = ethValue.add(new Web3Utils.BN(totalCollateral.toString(10)))
    }
    return sendTransactionWithNonce(gasPrice, null, from, acoWriterAddress(), ethValue, data, null, nonce)
}