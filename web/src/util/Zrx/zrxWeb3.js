import { getWeb3, sendTransaction } from '../web3Methods.js'
import Web3Utils from 'web3-utils'
import { zrxABI } from './zrxABI.js'
import { getGasPrice } from '../gasStationApi.js'
import { zrxExchangeAddress } from '../network.js'

const getExchangeContract = () => {
  const _web3 = getWeb3()
  return new _web3.eth.Contract(zrxABI, zrxExchangeAddress())
}

export const getSwapData = async (orders, amounts) => {
  const orderSignatures = orders.map(o => o.signature)
  const feeData = await getFeeData(orders.length)
  const exchange = getExchangeContract()
  const data = exchange.methods.batchFillLimitOrders(orders, orderSignatures, amounts, true).encodeABI()
  return {gasPrice: feeData.gasPrice, data: data, ethValue: feeData.value}
}

export const cancelLimitOrder = async (from, order) => {
  const exchange = getExchangeContract()
  const data = exchange.methods.cancelLimitOrder(order).encodeABI()
  return sendTransaction(null, null, from, zrxExchangeAddress(), null, data, null)
}

export const cancelAllPairLimitOrders = async (from, baseAsset, quoteAsset) => {
  const exchange = getExchangeContract()
  const data = exchange.methods.cancelPairLimitOrders(baseAsset, quoteAsset, new Web3Utils.BN(Date.now())).encodeABI()
  return sendTransaction(null, null, from, zrxExchangeAddress(), null, data, null)
}

let protocolFeeMultiplier = null
export const getProtocolFeeMultiplier = async () => {
  if (protocolFeeMultiplier) {
    return protocolFeeMultiplier
  }
  const contract = getExchangeContract()
  protocolFeeMultiplier = await contract.methods.getProtocolFeeMultiplier().call()
  return protocolFeeMultiplier
}

export const getFeeData = async (ordersAmount) => {
  const data = await Promise.all([getGasPrice(), getProtocolFeeMultiplier()])
  let gas = new Web3Utils.BN(Math.ceil(data[0]))
  return {
    gasPrice: gas,
    value: gas.mul(new Web3Utils.BN(data[1])).mul(new Web3Utils.BN(ordersAmount))
  }
}

export const resetZrxData = () => {
  protocolFeeMultiplier = null
}