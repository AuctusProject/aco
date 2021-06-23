import Axios from 'axios'
import { ONE_SECOND } from './constants'
import { btcSymbol, ethSymbol, getNetworkName, usdSymbol } from './network'

const baseApi = process.env.REACT_APP_BASE_API

export const clearBaseApiData = () => {
  acoAssets = null
}

let acoAssets = null
export const getAcoAssets = async () => {
  if (!acoAssets) {
    let res = await Axios.get(baseApi + getNetworkName() + "/assets")
    if (res && res.data) {
      acoAssets = res.data
    }
  }
  return acoAssets
}

export const getAcoAsset = async (address) => {
  let assets = await getAcoAssets()
  for (let i = 0; i < assets.length; ++i) {
    if (assets[i].address.toLowerCase() === address.toLowerCase()) {
      return assets[i]
    }
  }
  return null
}

export const getAcoAssetBySymbol = async (symbol) => {
  let assets = await getAcoAssets()
  for (let i = 0; i < assets.length; ++i) {
    if (assets[i].symbol.toLowerCase() === symbol.toLowerCase()) {
      return assets[i]
    }
  }
  return null
}

export const getDeribitOptions = async (asset, isCall, expiration) => {
  let assetSymbol = asset !== "TBTC" && asset !== "WBTC" && asset !== "BTCB" ? asset : "BTC"
  let url = baseApi + "deribit/instruments?asset=" + assetSymbol + "&isCall=" + isCall
  if (expiration) {
    let unixExpiration = expiration.getTime()/ONE_SECOND 
    url = url + "&expiration="+unixExpiration
  }
  let res = await Axios.get(url)
  if (res && res.data) {
    return res.data
  }
  return null
}

export const isStrikeStableCoin = (optionData) => {
  return (optionData.strikeAssetInfo.symbol === "BUSD" || optionData.strikeAssetInfo.symbol === "USDC" 
    || optionData.strikeAssetInfo.symbol === "DAI" || optionData.strikeAssetInfo.symbol === "USDT"
    || optionData.strikeAssetInfo.symbol === usdSymbol())
}

export const getDeribiData = async (optionData) => {
  if (!isStrikeStableCoin(optionData) || (optionData.underlyingInfo.symbol !== "TBTC" &&
    optionData.underlyingInfo.symbol !== "WBTC" && optionData.underlyingInfo.symbol !== "BTCB" && 
    optionData.underlyingInfo.symbol !== "ETH" && optionData.underlyingInfo.symbol !== btcSymbol() && 
    optionData.underlyingInfo.symbol !== ethSymbol())) {
    return null
  } else {
    let expiry = new Date(optionData.expiryTime * 1000)
    
    let underlyingSymbol = (optionData.underlyingInfo.symbol === "TBTC" 
      || optionData.underlyingInfo.symbol === "WBTC"
      || optionData.underlyingInfo.symbol === "BTCB" 
      || optionData.underlyingInfo.symbol === btcSymbol()) ? "BTC" :
      (optionData.underlyingInfo.symbol === "ETH" || optionData.underlyingInfo.symbol === ethSymbol()) ? "ETH" :
      optionData.underlyingInfo.symbol

    let deribitName = underlyingSymbol + "-" + expiry.getDate() + 
      expiry.toLocaleString('en-us', {month: 'short'}).toUpperCase() + (expiry.getFullYear() % 100) + "-" +
      (BigInt(optionData.strikePrice) / BigInt(10 ** optionData.strikeAssetInfo.decimals)).toString(10) + "-" + 
      (optionData.isCall ? "C" : "P")
      
    let res = await Axios.get(baseApi + "deribit/ticker?instrument_name=" + deribitName)
    if (res && res.data) {
      return res.data
    }
    return null
  }
}

export const getOtcOrder = async (orderId) => {
  let res = await Axios.get(baseApi + getNetworkName() + "/order/" + encodeURIComponent(orderId))
  if (res && res.data) {
    return res.data
  }
  return null
}

export const createOtcOrder = async (isAskOrder, signedOrder) => {
  let res = await Axios.post(baseApi + getNetworkName() + "/order", {isAskOrder:isAskOrder,order:signedOrder})
  if (res && res.data) {
    return res.data
  }
  return null
}