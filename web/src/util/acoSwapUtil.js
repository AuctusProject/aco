import { getSwapData as getPoolSwapData, getSwapQuote as getPoolQuote } from "./acoPoolMethods"
import { getSwapQuote as getZrxQuote } from "./Zrx/zrxApi"
import { getSwapData as getZrxSwapData } from "./Zrx/zrxWeb3"
import BigNumber from "bignumber.js"
import { acoBuyerAddress, ONE_SECOND, zrxExchangeAddress } from "./constants"
import { sendTransactionWithNonce } from "./web3Methods"
import { getBuyData } from "./acoBuyerV2Methods"

export const getQuote = async (isBuy, option, acoAmount = null, acoPrice = null) => {
  if (acoAmount) {
    acoAmount = new BigNumber(acoAmount, option.underlyingInfo.decimals)
  }
  if (acoPrice) {
    acoPrice = new BigNumber(acoPrice, option.strikeAssetInfo.decimals)
  }
  let promises = [getZrxQuote(isBuy, option, acoAmount, acoPrice)]
  if (isBuy) {
    promises.push(getPoolQuote(option, acoAmount, acoPrice))
  }
  const quotes = await Promise.all(promises)

  const totalLiquidity = (isBuy ? quotes[0].filledAmount.plus(quotes[1].filledAmount) : quotes[0].filledAmount)
  if (acoAmount && totalLiquidity.lt(acoAmount)) {
    throw new Error("Insufficient liquidity")
  }

  const sortedOrders = (isBuy ? quotes[0].zrxData.concat(quotes[1].poolData).sort((a, b) => a.price.gt(b.price) ? 1 : a.price.eq(b.price) ? 0 : -1) : quotes[0].zrxData)
  let totalAcoAmount = new BigNumber(0)
  let totalStrikeAssetAmount = new BigNumber(0)
  const poolData = []
  const zrxData = []
  for (let i = 0; i < sortedOrders.length && (!acoAmount || totalAcoAmount.isLessThan(acoAmount)); ++i) {
    let aco
    let strikeAsset
    if (acoAmount && totalAcoAmount.plus(sortedOrders[i].acoAmount).isGreaterThan(acoAmount)) {
      aco = acoAmount.minus(totalAcoAmount).integerValue(BigNumber.ROUND_CEIL)
      strikeAsset = aco.times(sortedOrders[i].price).integerValue(BigNumber.ROUND_CEIL)
    } else {
      aco = sortedOrders[i].acoAmount.integerValue(BigNumber.ROUND_CEIL)
      strikeAsset = sortedOrders[i].strikeAssetAmount.integerValue(BigNumber.ROUND_CEIL)
    }
    totalAcoAmount = totalAcoAmount.plus(aco)
    totalStrikeAssetAmount = totalStrikeAssetAmount.plus(strikeAsset)

    let data = {
      acoAmount: aco, 
      strikeAssetAmount: strikeAsset, 
      price: sortedOrders[i].price
    }
    if (sortedOrders[i].acoPool) {
      data.acoPool = sortedOrders[i].acoPool
      poolData.push(data)
    }
    if (sortedOrders[i].order) {
      data.order = sortedOrders[i].order
      zrxData.push(data)
    }
  }
  return {
    option: option, 
    acoAmount: totalAcoAmount,
    strikeAssetAmount: totalStrikeAssetAmount,
    price: (totalAcoAmount.gt(0) ? totalStrikeAssetAmount.div(totalAcoAmount) : null),
    poolData: poolData,
    zrxData: zrxData
  }
}

export const buy = async (from, nonce, zrxData, poolData = null, option = null, slippage = null) => {
  let ethValue = null
  let gasPrice = null
  let totalPayment = new BigNumber(0)
  let data = []
  if (zrxData && zrxData.length > 0) {
    const orders = []
    const takerAmounts = []
    for (let i = 0; i < zrxData.length; ++i) {
      orders.push(zrxData[i].order)
      takerAmounts.push(zrxData[i].strikeAssetAmount.toString(10))
      totalPayment = totalPayment.plus(zrxData[i].strikeAssetAmount)
    }
    const zrxOrder = await getZrxSwapData(orders, takerAmounts)
    ethValue = zrxOrder.ethValue
    gasPrice = zrxOrder.gasPrice
    data.push({from: zrxExchangeAddress, ethValue: zrxOrder.ethValue, data: zrxOrder.data})
  }
  if (poolData && option && poolData.length > 0) {
    const deadline = parseInt(new Date().getTime()/ONE_SECOND + (20*60))
    for (let j = 0; j < poolData.length; ++j) {
      let strikeAssetAmount = (slippage ? poolData[j].strikeAssetAmount.times((new BigNumber(1)).plus(new BigNumber(slippage))) : poolData[j].strikeAssetAmount)
      let web3Data = getPoolSwapData(from, poolData[j].acoPool, option.acoToken, poolData[j].acoAmount.toString(10), strikeAssetAmount.toString(10), deadline.toString(10))
      data.push({from: poolData[j].acoPool, ethValue: "0", data: web3Data})
      totalPayment = totalPayment.plus(strikeAssetAmount)
    }
  }
  let to
  let finalData
  if (data.length > 1) {
    to = acoBuyerAddress
    finalData = getBuyData(option.strikeAsset, totalPayment.toString(10), data)
  } else {
    to = data[0].from
    finalData = data[0].data
  }
  return sendTransactionWithNonce(gasPrice, null, from, to, ethValue, finalData, null, nonce)
}

export const sell = async (from, nonce, zrxData) => {
  const orders = []
  const takerAmounts = []
  for (let i = 0; i < zrxData.length; ++i) {
    orders.push(zrxData[i].order)
    takerAmounts.push(zrxData[i].acoAmount.toString(10))
  }
  const zrxOrder = await getZrxSwapData(orders, takerAmounts)
  return sendTransactionWithNonce(zrxOrder.gasPrice, null, from, zrxExchangeAddress, zrxOrder.ethValue, zrxOrder.data, null, nonce)
}