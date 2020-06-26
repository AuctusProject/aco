import Axios from 'axios'
import { gasStationApiUrl, gasPriceType, defaultGasPrice, gwei } from './constants';


var gasPrice = null
export const getGasPrice = () => {
    return new Promise((resolve, reject) => {
        if (gasPrice !== null && gasPrice > 0) {
            resolve(gasPrice)
            return;
        }
        Axios.get(gasStationApiUrl).then((response) => {
            if (response && response.data && response.data[gasPriceType]) {
                gasPrice = Math.ceil(response.data[gasPriceType] * gwei / 10.0)
                resolve(gasPrice)
            }
            else {
                resolve(defaultGasPrice)
            }
        }).catch(() => {
            resolve(defaultGasPrice)
        })
    })
}