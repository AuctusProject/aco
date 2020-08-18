import Axios from 'axios'
import { gasStationApiUrl, gasPriceType, defaultGasPrice, gwei } from './constants';

var gasPrice = null
var lastGasPriceTime = null
export const getGasPrice = () => {
    return new Promise((resolve, reject) => {
        if (hasValidGasPrice()) {
            resolve(gasPrice)
            return;
        }
        Axios.get(gasStationApiUrl).then((response) => {
            if (response && response.data && response.data[gasPriceType]) {
                gasPrice = Math.ceil(response.data[gasPriceType] * gwei / 10.0)
                lastGasPriceTime = new Date().getTime()
                resolve(gasPrice)
            }
            else {
                if (gasPrice > defaultGasPrice) {
                    resolve(gasPrice)
                }
                else {
                    resolve(defaultGasPrice)
                }
            }
        }).catch(() => {
            if (gasPrice > defaultGasPrice) {
                resolve(gasPrice)
            }
            else {
                resolve(defaultGasPrice)
            }
        })
    })
}

const hasValidGasPrice = () => {
    var timeSincePrice = new Date().getTime() - lastGasPriceTime
    return gasPrice !== null && gasPrice > 0 && timeSincePrice < 30000
}