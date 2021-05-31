import Axios from 'axios'
import { toDecimals, zrxApiUrl, ZRX_RPS } from '../constants'
import BigNumber from 'bignumber.js'
import { RateLimit } from 'async-sema';

export const getSwapQuote = async (isBuy, option, acoAmount = null, acoPrice = null) => {
  let makerToken = (isBuy ? option.acoToken : option.strikeAsset)
  let takerToken = (isBuy ? option.strikeAsset : option.acoToken)
  const orders = await getOrders(makerToken, takerToken)
  return getZrxOrdersFormatted(isBuy, option, orders.records, acoAmount, acoPrice)
}

export const getZrxOrdersFormatted = (isBuy, option, zrxOrders, acoAmount = null, acoPrice = null) => {
  const sortedOrders = getSortedOrdersWithPrice(isBuy, option, zrxOrders)
  
  const zrxData = []

  let filledAmount = new BigNumber(0)
  const oneUnderlying = new BigNumber(toDecimals("1", option.underlyingInfo.decimals))
  for (let i = 0; i < sortedOrders.length && (!acoAmount || filledAmount.isLessThan(acoAmount)); ++i) {
    if (acoPrice && 
      ((isBuy && sortedOrders[i].price.isGreaterThan(acoPrice)) || 
      (!isBuy && sortedOrders[i].price.isLessThan(acoPrice)))
    ) {
      break
    }

    if (sortedOrders[i].metaData && sortedOrders[i].metaData.state && (sortedOrders[i].metaData.state.toLowerCase() === "cancelled" || sortedOrders[i].metaData.state.toLowerCase() === "expired")) {
      continue
    }

    let availableTakerAmountString = sortedOrders[i].metaData && sortedOrders[i].metaData.remainingFillableTakerAmount ? new BigNumber(sortedOrders[i].metaData.remainingFillableTakerAmount) : new BigNumber(sortedOrders[i].order.takerAmount)
    let takerAvailable = new BigNumber(availableTakerAmountString)

    if (takerAvailable.eq(new BigNumber(0))) {
      continue
    }
    
    let takerAmount = new BigNumber(sortedOrders[i].order.takerAmount)
    let makerAmount = new BigNumber(sortedOrders[i].order.makerAmount)

    let makerAvailable = makerAmount.times(takerAvailable).div(takerAmount)
    let acoAvailable = (isBuy ? makerAvailable : takerAvailable)
    let strikeAssetAvailable = (isBuy ? takerAvailable : makerAvailable)

    let aco
    let strikeAsset
    if (acoAmount && filledAmount.plus(acoAvailable).isGreaterThan(acoAmount)) {
      let available = acoAmount.minus(filledAmount)
      strikeAsset = available.times(sortedOrders[i].price).div(oneUnderlying)
      aco = available
      filledAmount = acoAmount
    } else {
      strikeAsset = strikeAssetAvailable
      aco = acoAvailable
      filledAmount = filledAmount.plus(acoAvailable)
    }
    zrxData.push({
      createdAt: sortedOrders[i].metaData ? sortedOrders[i].metaData.createdAt ? new Date(sortedOrders[i].metaData.createdAt) : Date.now() : null,
      orderHash: sortedOrders[i].metaData ? sortedOrders[i].metaData.orderHash : null,
      order: sortedOrders[i].order,
      acoAmount: aco,
      strikeAssetAmount: strikeAsset,
      price: sortedOrders[i].price
    })
  }
  return {
    zrxData: zrxData, 
    filledAmount: filledAmount 
  }
}

const getSortedOrdersWithPrice = (isBuy, option, zrxOrders) => {
  const sortedOrders = []
  for (let j = 0; j < zrxOrders.length; ++j) {
    let takerAmount = new BigNumber(zrxOrders[j].order.takerAmount)  
    let makerAmount = new BigNumber(zrxOrders[j].order.makerAmount)    
    let oneUnderlying = new BigNumber(toDecimals("1", option.underlyingInfo.decimals))
    let price
    if (isBuy) {
      price = takerAmount.times(oneUnderlying).div(makerAmount)
    } else {
      price = makerAmount.times(oneUnderlying).div(takerAmount)
    }
    zrxOrders[j].price = price
    sortedOrders.push(zrxOrders[j])
  }
  sortedOrders.sort((a, b) => {
    if (isBuy) {
      return a.price.comparedTo(b.price)
    } else {
      return b.price.comparedTo(a.price)
    }
  })
  return sortedOrders
}

var rateLimit = new RateLimit(ZRX_RPS)
export const getOrders = async (makerToken, takerToken, page = 1, perPage = 100) => {
  await rateLimit()
  let url = zrxApiUrl + "sra/v4/orders?"
  url += "makerToken=" + makerToken
  url += "&takerToken=" + takerToken
  url += "&page=" + page
  url += "&perPage=" + perPage
  const res = await Axios.get(url)
  if (res && res.data) {
    return res.data
  }
  return []
}

export const postOrder = async (order) => {
  await rateLimit()
  const res = await Axios.post(zrxApiUrl + "sra/v4/order", order)
  if (res && res.data) {
    return res.data
  }
  return null
}

export const postOrderConfig = async (order) => {
  await rateLimit()
  const res = await Axios.post(zrxApiUrl + "sra/v4/order_config", order)
  if (res && res.data) {
    return res.data
  }
  return null
}