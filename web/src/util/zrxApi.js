import Axios from 'axios'
import { zrxApiUrl } from './constants';
import { getGasPrice } from './gasStationApi';
import BigNumber from 'bignumber.js';

const PROTOCOL_FEE_MULTIPLIER = 150000;

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
                    const ordersFee = res.data.orders.length * PROTOCOL_FEE_MULTIPLIER
                    const protocolFee = new BigNumber(ordersFee).times(gasPrice)
                    res.data.value = res.data.value - ordersFee + protocolFee
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
    })
}

export function isInsufficientLiquidity(err) {
  return err && err.response && err.response.data && err.response.data.validationErrors && 
    err.response.data.validationErrors.filter(v => v.reason === "INSUFFICIENT_ASSET_LIQUIDITY").length > 0
}