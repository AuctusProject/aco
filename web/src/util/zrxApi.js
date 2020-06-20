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