import Axios from 'axios'
import { coingeckoApiUrl, isEther, retry } from './constants';

export function getCoingeckoPrice(ids) {
    return new Promise(function(resolve,reject){
        retry(() => {return Axios.get(coingeckoApiUrl + "simple/price?vs_currencies=usd&ids="+ids)}, 3, 100)
        .then(res => {
            resolve(res.data)
        })
        .catch(err => {
            reject(err)
        });
    })
}

export function getCoingeckoInfoFromAddress(address) {
    return new Promise(function(resolve,reject){
        Axios.get(coingeckoApiUrl + "coins/ethereum/contract/"+address)
        .then(res => {
            resolve(res.data)
        })
        .catch(err => reject(err));
    })
}

export function getCoingeckoUsdPriceFromAddress(address) {
    return new Promise(function(resolve,reject){
        if (isEther(address)) {
            getCoingeckoPrice("ethereum").then(data => {
                if (data && data.ethereum && data.ethereum.usd) {
                    resolve(data.ethereum.usd)
                }
                else {
                    resolve(null)
                }                
            })
            .catch(err => reject(err));
        }
        else {
            getCoingeckoInfoFromAddress(address).then(data => {
                if (data && data.market_data && data.market_data.current_price && data.market_data.current_price.usd) {
                    resolve(data.market_data.current_price.usd)
                }
                else {
                    resolve(null)
                }
            })
            .catch(err => reject(err));
        }
    })
}