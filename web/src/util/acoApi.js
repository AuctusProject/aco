import Axios from 'axios'
import { apiUrl, removeOptionsToIgnore } from './constants';

var apiTokenList = null
export function getTokensList() {
    return new Promise(function(resolve,reject){
        if (apiTokenList != null) {
            resolve(apiTokenList)
            return
        }
        Axios.get(apiUrl + "tokens")
        .then(res => {
            if (res && res.data) {
                apiTokenList = removeOptionsToIgnore(res.data)
            }
            resolve(apiTokenList)
        })
        .catch(err => reject(err));
    })
}

var acoAssets = null
export function getAcoAssets() {
    return new Promise(function(resolve,reject){
        if (acoAssets != null) {
            resolve(acoAssets)
            return
        }
        Axios.get(apiUrl + "assets")
        .then(res => {
            if (res && res.data) {
                acoAssets = res.data
            }
            resolve(acoAssets)
        })
        .catch(err => reject(err));
    })
}

var acoPools = null
export function getAcoPools() {
    return new Promise(function(resolve,reject){
        if (acoPools != null) {
            resolve(acoPools)
            return
        }
        Axios.get(apiUrl + "pools")
        .then(res => {
            if (res && res.data) {
                acoPools = res.data
            }
            resolve(acoPools)
        })
        .catch(err => reject(err));
    })
}

export function getOtcOrder(orderId) {
    return new Promise(function(resolve,reject){
        Axios.get(apiUrl + "order/" + encodeURIComponent(orderId))
        .then((res) => {
            if (res && res.data) {
                resolve(res.data);
            } else {
                resolve(null);
            }
        }).catch(err => reject(err));
    })
}

export function createOtcOrder(isAskOrder, signedOrder) {
    return new Promise(function(resolve,reject){
        Axios.post(apiUrl + "order", {isAskOrder:isAskOrder,order:signedOrder})
        .then((res) => {
            if (res && res.data) {
                resolve(res.data);
            } else {
                resolve(null);
            }
        }).catch(err => reject(err));
    })
}

export function isStrikeStableCoin(optionData) {
    return (optionData.strikeAssetInfo.symbol === "USDC" || optionData.strikeAssetInfo.symbol === "DAI"
    || optionData.strikeAssetInfo.symbol === "USDT")
}

export function getDeribiData(optionData) {
    return new Promise(function(resolve,reject) {
        if (!isStrikeStableCoin(optionData) || (optionData.underlyingInfo.symbol !== "TBTC" &&
        optionData.underlyingInfo.symbol !== "WBTC" && optionData.underlyingInfo.symbol !== "ETH")) {
            resolve(null)
        } else {
            var expiry = new Date(optionData.expiryTime * 1000)
            var underlyingSymbol = 
                optionData.underlyingInfo.symbol !== "TBTC" && optionData.underlyingInfo.symbol !== "WBTC" ?
                optionData.underlyingInfo.symbol : "BTC"
            var deribitName = underlyingSymbol + "-" + expiry.getDate() + 
                expiry.toLocaleString('en-us', {month: 'short'}).toUpperCase() + (expiry.getFullYear() % 100) + "-" +
                (BigInt(optionData.strikePrice) / BigInt(10 ** optionData.strikeAssetInfo.decimals)).toString(10) + "-" + 
                (optionData.isCall ? "C" : "P")
            Axios.get(apiUrl + "deribit/ticker?instrument_name=" + deribitName)
            .then(res => {
                if (res && res.data) {
                    resolve(res.data)
                } else {
                    resolve(null)
                }
            })
            .catch(err => reject(err))
        }
    })
}

var opynList = null
function getOpynTokenList() {
    return new Promise(function(resolve,reject) {
        if (opynList != null) {
            resolve(opynList)
        } else {
            Axios.post("https://api.thegraph.com/subgraphs/name/aparnakr/opyn", {"query":"{\n    optionsContracts {\n      address\n      oracleAddress\n      optionsExchangeAddress\n      minCollateralizationRatioValue\n      minCollateralizationRatioExp\n      \n      oTokenExchangeRateExp\n      \n      strikePriceExp\n      strikePriceValue\n      \n      expiry\n      collateral\n      underlying\n      strike\n      \n      totalSupply\n      totalExercised\n      totalCollateral\n    }\n  }\n "})
            .then(res => {
                if (res && res.data && res.data.data && res.data.data.optionsContracts && res.data.data.optionsContracts.length) {
                    opynList = res.data.data.optionsContracts
                }
                resolve(opynList)
            })
            .catch(err => reject(err))
        }
    })
}

export function getOpynQuote(optionData, isBuy, tokenAmount) {
    return new Promise(function(resolve,reject) {
        getOpynTokenList().then((list) =>
        {
            if (list) {
                var opynData = null
                for (var i = 0; i < list.length; ++i) {
                    if (list[i].strike === list[i].collateral && ((optionData.isCall &&
                        list[i].underlying === optionData.strikeAsset && list[i].strike === optionData.underlying) ||
                        (!optionData.isCall && list[i].underlying === optionData.underlying && list[i].strike === optionData.strikeAsset)) && 
                        parseInt(list[i].expiry) === optionData.expiryTime) {
                            var strikePrice = BigInt(optionData.strikePrice) / BigInt(10 ** optionData.strikeAssetInfo.decimals)
                            if (optionData.isCall && strikePrice ===
                                 (BigInt(10 ** (-1 * parseInt(list[i].oTokenExchangeRateExp) + optionData.strikeAssetInfo.decimals + parseInt(list[i].strikePriceExp))) / BigInt(list[i].strikePriceValue))) {
                                opynData = list[i]
                                break
                            } else if (!optionData.isCall && strikePrice === (BigInt(list[i].strikePriceValue) * BigInt(10 ** ((-1 * parseInt(list[i].oTokenExchangeRateExp) + parseInt(list[i].strikePriceExp)))))) {
                                opynData = list[i]
                                break
                            }
                        }
                }
                if (opynData) {
                    Axios.get(apiUrl + "opyn/quote?isBuy=" + (isBuy ? "true" : "false") + "&exchange=" + opynData.optionsExchangeAddress + "&token=" + opynData.address + "&swappedToken=" + (optionData.isCall ? opynData.underlying : opynData.strike) + "&amount=" + (BigInt(tokenAmount) * BigInt(10 ** (-1 * parseInt(opynData.oTokenExchangeRateExp))) / BigInt(10 ** optionData.acoTokenInfo.decimals)).toString(10))
                    .then(res => {
                        if (res && res.data) {
                            if (optionData.isCall) {
                                resolve((BigInt(res.data) * BigInt(optionData.strikePrice) / BigInt(10 ** optionData.strikeAssetInfo.decimals)).toString(10))
                            } else if (isBuy) {
                                resolve(res.data)
                            } else {
                                resolve((BigInt(res.data) * BigInt(10 ** optionData.strikeAssetInfo.decimals) / BigInt(optionData.strikePrice)).toString(10))
                            }
                        } else {
                            resolve(null)
                        }
                    }).catch(err => reject(err))
                } else {
                    resolve(null)
                }
            } else {
                resolve(null)
            }
        }).catch(err => reject(err))
    })
}