import Axios from 'axios'
import { toDecimals, zrxApiUrl } from '../constants'
import BigNumber from 'bignumber.js'

export const getSwapQuote = async (isBuy, option, acoAmount = null, acoPrice = null) => {
  let makerToken = (isBuy ? option.acoToken : option.strikeAsset)
  let takerToken = (isBuy ? option.strikeAsset : option.acoToken)
  const orders = await getOrders(makerToken, takerToken)
  const sortedOrders = getSortedOrdersWithPrice(isBuy, orders)

  const zrxData = []

  let filledAmount = new BigNumber(0)
  const oneUnderlying = new BigNumber(toDecimals("1", option.underlyingInfo.decimals))
  for (let i = 0; i < sortedOrders.length && (!acoAmount || filledAmount.isLessThan(acoAmount)); ++i) {
    if (acoPrice && 
      ((isBuy && sortedOrders[i].price.isGreaterThan(acoPrice)) || 
      (isBuy && sortedOrders[i].price.isLessThan(acoPrice)))
    ) {
      break
    }

    let availableTakerAmountString = sortedOrders[i].metaData && sortedOrders[i].metaData.remainingFillableTakerAmount ? new BigNumber(sortedOrders[i].metaData.remainingFillableTakerAmount) : new BigNumber(sortedOrders[i].order.takerAmount)
    let takerAvailable = new BigNumber(availableTakerAmountString)
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

const getSortedOrdersWithPrice = (isBuy, zrxOrders) => {
  const sortedOrders = []
  for (let j = 0; j < zrxOrders.length; ++j) {
    let takerAmount = new BigNumber(zrxOrders[j].order.takerAmount)  
    let makerAmount = new BigNumber(zrxOrders[j].order.makerAmount)    
    let price
    if (isBuy) {
      price = takerAmount.div(makerAmount)
    } else {
      price = makerAmount.div(takerAmount)
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

export const getOrders = async (makerToken, takerToken, page = 1, perPage = 100) => {
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
  const res = await Axios.post(zrxApiUrl + "sra/v4/order", order)
  if (res && res.data) {
    return res.data
  }
  return null
}

export const postOrderConfig = async (order) => {
  const res = await Axios.post(zrxApiUrl + "sra/v4/order_config", order)
  if (res && res.data) {
    return res.data
  }
  return null
}