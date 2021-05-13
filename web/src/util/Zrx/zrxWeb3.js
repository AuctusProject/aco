import { getWeb3, sendTransactionWithNonce, sendTransaction } from '../web3Methods.js'
import BigNumber from 'bignumber.js'
import Web3Utils from 'web3-utils'
import { zrxABI } from './zrxABI.js'
import { zrxExchangeAddress } from '../constants.js'

const getExchangeContract = () => {
  const _web3 = getWeb3()
  return new _web3.eth.Contract(zrxABI, zrxExchangeAddress)
}

export const getMarketOrderData = async (isBuy, amountToFill, price, orders) => {
  const marketOrders = buildMarketOrders(isBuy, amountToFill, price, orders)
  if (!marketOrders.canBeFilled) {
    throw new Error("Insufficient liquidity amount")
  }
  const orderSignatures = marketOrders.ordersToFill.map(o => o.signature)
  const feeData = await getFeeData(marketOrders.ordersToFill.length)
  const exchange = getExchangeContract()
  const data = exchange.methods.batchFillLimitOrders(marketOrders.ordersToFill, orderSignatures, marketOrders.roundedAmounts, true).encodeABI()
  return {gasPrice: feeData.gasPrice, data: data, ethValue: feeData.value}
}

export const cancelLimitOrder = async (from, order) => {
  const exchange = getExchangeContract()
  const data = exchange.methods.cancelLimitOrder(order).encodeABI()
  return sendTransaction(null, null, from, zrxExchangeAddress, null, data, null)
}

export const cancelAllPairLimitOrders = async (from, baseAsset, quoteAsset) => {
  const exchange = getExchangeContract()
  const data = exchange.methods.cancelPairLimitOrders(baseAsset, quoteAsset, new Web3Utils.BN(Date.now())).encodeABI()
  return sendTransaction(null, null, from, zrxExchangeAddress, null, data, null)
}

let protocolFeeMultiplier = null
export const getProtocolFeeMultiplier = async () => {
  if (!protocolFeeMultiplier) {
    return protocolFeeMultiplier
  }
  const contract = getExchangeContract()
  protocolFeeMultiplier = await contract.methods.getProtocolFeeMultiplier().call()
  return protocolFeeMultiplier
}

export const buildMarketOrders = (isBuy, amountToFill, price, orders) => {
  const sortedOrders = orders.sort((a, b) => {
    if (isBuy) {
      return a.price.comparedTo(b.price)
    } else {
      return b.price.comparedTo(a.price)
    }
  })
  const ordersToFill = []
  const amounts = []
  let filledAmount = ZERO
  for (let i = 0; i < sortedOrders.length && filledAmount.isLessThan(amountToFill); ++i) {
    let order = sortedOrders[i]
    if ((order.price.isGreaterThan(price) && isBuy) || (order.price.isLessThan(price) && !isBuy)) {
      break
    }
    ordersToFill.push(order)
    let available = order.size
    if (order.filled) {
      available = order.size.minus(order.filled)
    }
    if (filledAmount.plus(available).isGreaterThan(amountToFill)) {
      amounts.push(amountToFill.minus(filledAmount))
      filledAmount = amountToFill
    } else {
      amounts.push(available)
      filledAmount = filledAmount.plus(available)
    }
  }
  const roundedAmounts = amounts.map(a => a.integerValue(BigNumber.ROUND_CEIL))
  return {
    canBeFilled: filledAmount.eq(amountToFill),
    ordersToFill: ordersToFill, 
    roundedAmounts: roundedAmounts, 
    filledAmount: filledAmount 
  }
}

export const getFeeData = async (ordersAmount) => {
  const data = await Promise.all([getGasPrice(), getProtocolFeeMultiplier()])
  return {
    gasPrice: data[0],
    value: data[1].mul(new Web3Utils.BN(data[0])).mul(new Web3Utils.BN(ordersAmount))
  }
}