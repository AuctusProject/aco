import Axios from 'axios'
import { apiUrl } from './constants';

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
                apiTokenList = res.data
            }
            resolve(apiTokenList)
        })
        .catch(err => reject(err));
    })
}