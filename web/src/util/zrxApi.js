import Axios from 'axios'
import { zrxApiUrl } from './constants';

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
        );
    })
}

export function isInsufficientLiquidity(err) {
  return err && err.response && err.response.data && err.response.data.validationErrors && 
    err.response.data.validationErrors.filter(v => v.reason === "INSUFFICIENT_ASSET_LIQUIDITY").length > 0
}