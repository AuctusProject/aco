import { getSwapData as getPoolSwapData, getSwapQuote as getPoolQuote } from "./acoPoolMethods"
import { getSwapQuote as getZrxQuote, getZrxOrdersFormatted } from "./Zrx/zrxApi"
import { getSwapData as getZrxSwapData } from "./Zrx/zrxWeb3"
import BigNumber from "bignumber.js"
import Web3Utils from 'web3-utils'
import { acoBuyerAddress, ONE_SECOND, toDecimals, zrxExchangeAddress } from "./constants"
import { sendTransactionWithNonce } from "./web3Methods"
import { getBuyData } from "./acoBuyerV2Methods"

let orderbooks = {}
export const getOrderbook = async (option) => {
  if (orderbooks[option.acoToken]) {
    return (await reprocessOrderbook(option, orderbooks[option.acoToken]))
  } else {
    const data = await Promise.all([getQuote(true, option), getQuote(false, option)])
    orderbooks[option.acoToken] = {
      ask: {
        acoAmount: data[0].acoAmount,
        strikeAssetAmount: data[0].strikeAssetAmount,
        price: data[0].price,
        orders: getSortedOrders(true, data[0].zrxData, data[0].poolData)
      },
      bid: {
        acoAmount: data[1].acoAmount,
        strikeAssetAmount: data[1].strikeAssetAmount,
        price: data[1].price,
        orders: data[1].zrxData
      }
    }
    return orderbooks[option.acoToken]
  }
}

export const getUpdatedOrderbook = async (option, wssData) => {
  const askOrders = []
  const bidOrders = []
  let orderbook = orderbooks[option.acoToken]
  for (let i = 0; i < wssData.payload.length; ++i) {
    let isBuy = null
    if (wssData.payload[i].order.makerToken === option.acoToken) {
      askOrders.push(wssData.payload[i])
      isBuy = true
    } else if (wssData.payload[i].order.takerToken === option.acoToken) {
      bidOrders.push(wssData.payload[i])
      isBuy = false
    }
    if (orderbook && isBuy !== null) {
      let order = getZrxOrdersFormatted(isBuy, option, [wssData.payload[i]])
      let sideOrders = (isBuy ? orderbook.ask : orderbook.bid)
      let index = sideOrders.findIndex((c) => c.orderHash === wssData.payload[i].metaData.orderHash)
      if (index >= 0) {
        sideOrders.splice(index, 1)
      }
      if (isBuy) {
        orderbook.ask = orderbook.ask.concat(order)
      } else {
        orderbook.bid = orderbook.bid.concat(order)
      }
    }
  }
  if (orderbook) {
    orderbook.ask.orders = getSortedOrders(true, orderbook.ask.orders, [])
    orderbook.bid.orders = getSortedOrders(false, orderbook.bid.orders, [])
  } else {
    const zrxAskOrders = getZrxOrdersFormatted(true, option, askOrders)
    const zrxBidOrders = getZrxOrdersFormatted(false, option, bidOrders)
    const ask = buildQuotedData(option, zrxAskOrders, null)
    const bid = buildQuotedData(option, zrxBidOrders, null)
    orderbook = {
      ask: {
        acoAmount: ask.acoAmount,
        strikeAssetAmount: ask.strikeAssetAmount,
        price: ask.price,
        orders: ask.zrxData
      },
      bid: {
        acoAmount: bid.acoAmount,
        strikeAssetAmount: bid.strikeAssetAmount,
        price: bid.price,
        orders: bid.zrxData
      }
    }
  }
  return (await reprocessOrderbook(option, orderbook))
}

const reprocessOrderbook = async (option, orderbook) => {
  const now = Math.ceil(Date.now() / 1000)
  const sides = await Promise.all([getOrderBookSideProcessed(now, option, true, orderbook.ask), getOrderBookSideProcessed(now, option, false, orderbook.bid)])
  orderbooks[option.acoToken].ask = sides[0]
  orderbooks[option.acoToken].bid = sides[1]
  return orderbooks[option.acoToken]
}

const getOrderBookSideProcessed = async (now, option, isBuy, orderbookSide) => {
  const zrxOrders = []
  const poolPromises = (isBuy ? [getPoolQuote(option)] : [])
  for (let i = 0; i < orderbookSide.orders.length; ++i) {
    if (orderbookSide.orders[i].order) {
      if (parseInt(orderbookSide.orders[i].order.expiry) > now) {
        zrxOrders.push(orderbookSide.orders[i])
      }
    }
  }
  const poolData = await Promise.all(poolPromises)
  const sortedOrders = getSortedOrders(isBuy, zrxOrders, poolData.length > 0 ? poolData[0].poolData : [])
  const data = buildQuotedData(option, sortedOrders, null)
  return  {
    acoAmount: data.acoAmount,
    strikeAssetAmount: data.strikeAssetAmount,
    price: data.price,
    orders: getSortedOrders(isBuy, data.zrxData, data.poolData)
  }
}

export const getQuote = async (isBuy, option, acoAmount = null, throwLiquidityException = true, acoPrice = null) => {
  if (acoAmount) {
    acoAmount = new BigNumber(toDecimals(acoAmount, option.underlyingInfo.decimals))
  }
  if (acoPrice) {
    acoPrice = new BigNumber(toDecimals(acoPrice, option.strikeAssetInfo.decimals))
  }
  let promises = [getZrxQuote(isBuy, option, acoAmount, acoPrice)]
  if (isBuy) {
    promises.push(getPoolQuote(option, acoAmount, acoPrice))
  }
  const quotes = await Promise.all(promises)
  
  const totalLiquidity = (isBuy ? quotes[0].filledAmount.plus(quotes[1].filledAmount) : quotes[0].filledAmount)
  if (throwLiquidityException && acoAmount && totalLiquidity.lt(acoAmount)) {
    throw new Error("Insufficient liquidity")
  }

  const sortedOrders = getSortedOrders(isBuy, quotes[0].zrxData, quotes.length > 0 ? quotes[1].poolData : [])
  return buildQuotedData(option, sortedOrders, acoAmount)
}

const getSortedOrders = (isBuy, zrxData, poolData) => {
  return (isBuy ? zrxData.concat(poolData).sort((a, b) => a.price.gt(b.price) ? 1 : a.price.eq(b.price) ? 0 : -1) : zrxData)
}

const buildQuotedData = (option, sortedOrders, acoAmount) => {
  let totalAcoAmount = new BigNumber(0)
  let totalStrikeAssetAmount = new BigNumber(0)
  const oneUnderlying = new BigNumber(toDecimals("1", option.underlyingInfo.decimals))
  const poolData = []
  const zrxData = []
  for (let i = 0; i < sortedOrders.length && (!acoAmount || totalAcoAmount.isLessThan(acoAmount)); ++i) {
    let aco
    let strikeAsset
    if (acoAmount && totalAcoAmount.plus(sortedOrders[i].acoAmount).isGreaterThan(acoAmount)) {
      aco = acoAmount.minus(totalAcoAmount).integerValue(BigNumber.ROUND_CEIL)
      strikeAsset = aco.times(sortedOrders[i].price).div(oneUnderlying).integerValue(BigNumber.ROUND_CEIL)
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
      data.createdAt = sortedOrders[i].createdAt
      data.orderHash = sortedOrders[i].orderHash
      data.order = sortedOrders[i].order
      zrxData.push(data)
    }
  }
  return {
    option: option, 
    acoAmount: totalAcoAmount,
    strikeAssetAmount: totalStrikeAssetAmount,
    price: (totalAcoAmount.gt(0) ? totalStrikeAssetAmount.times(oneUnderlying).div(totalAcoAmount).integerValue(BigNumber.ROUND_CEIL) : null),
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
    ethValue = new Web3Utils.BN(zrxOrder.ethValue.toString(10))
    gasPrice = new Web3Utils.BN(zrxOrder.gasPrice.toString(10))
    data.push({from: zrxExchangeAddress, ethValue: zrxOrder.ethValue.toString(10), data: zrxOrder.data})
  }
  if (poolData && option && poolData.length > 0) {
    const deadline = parseInt(new Date().getTime()/ONE_SECOND + (20*60))
    for (let j = 0; j < poolData.length; ++j) {
      let strikeAssetAmount = (slippage ? poolData[j].strikeAssetAmount.times((new BigNumber(1)).plus(new BigNumber(slippage))) : poolData[j].strikeAssetAmount).integerValue(BigNumber.ROUND_CEIL)
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