import Axios from 'axios'
import { coingeckoApiUrl } from './constants';

export function getCoingeckoPrice(ids) {
    return new Promise(function(resolve,reject){
        Axios.get(coingeckoApiUrl + "simple/price?vs_currencies=usd&ids="+ids)
        .then(res => {
            resolve(res.data)
        })
        .catch(err => reject(err));
    })
}