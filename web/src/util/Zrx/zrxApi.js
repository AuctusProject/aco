import Axios from 'axios'
import { zrxApiUrl } from '../constants';
import { getGasPrice } from '../gasStationApi';
import BigNumber from 'bignumber.js';

export function getSwapQuote(buyToken, sellToken, amount, isBuy) {
    return new Promise(function(resolve,reject){
        var url = zrxApiUrl + "swap/v0/quote?"
        url += "buyToken=" + buyToken
        url += "&sellToken=" + sellToken
        if (isBuy) {
            url += "&buyAmount="+amount
        }
        else {
            url += "&sellAmount="+amount
        }
        url+="&gasPrice=1"
        getGasPrice().then(gasPrice => {
            Axios.get(url)
            .then(res => {
                if (res && res.data) {
                    const ordersFee = new BigNumber(res.data.protocolFee)
                    const protocolFee = ordersFee.times(gasPrice)
                    res.data.value = new BigNumber(res.data.value).minus(ordersFee).plus(protocolFee).toString()
                    res.data.gasPrice = gasPrice
                    resolve(res.data)
                }
                else {
                    resolve(null)
                }
            })
            .catch(err => 
                reject(err)
            );
        })
        .catch(err => reject(err))        
    })
}

export function isInsufficientLiquidity(err) {
  return err && err.response && err.response.data && err.response.data.validationErrors && 
    err.response.data.validationErrors.filter(v => v.reason === "INSUFFICIENT_ASSET_LIQUIDITY").length > 0
}

export function getOrders(makerToken, takerToken, page = 1, perPage = 100){
    return new Promise(function(resolve,reject){
        var url = zrxApiUrl + "sra/v4/orders?"
        url += "makerToken=" + makerToken
        url += "&takerToken=" + takerToken
        url += "&page=" + page
        url += "&perPage=" + perPage
        Axios.get(url)
        .then(res => {
            if (res && res.data) {
                resolve(res.data)
            }
            else {
                resolve(null)
            }
        })
        .catch(err => 
            reject(err)
        )
    })
}

export function postOrder(order){
    return new Promise(function(resolve,reject){
        var url = zrxApiUrl + "sra/v4/order"
        Axios.post(url, order)
        .then(res => {
            if (res && res.data) {
                resolve(res)
            }
            else {
                resolve(null)
            }
        })
        .catch(err => 
            reject(err)
        )
    })
}

export function postOrderConfig(order){
    return new Promise(function(resolve,reject){
        var url = zrxApiUrl + "sra/v4/order_config"
        Axios.post(url, order)
        .then(res => {
            if (res && res.data) {
                resolve(res)
            }
            else {
                resolve(null)
            }
        })
        .catch(err => 
            reject(err)
        )
    })
}