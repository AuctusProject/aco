import Axios from 'axios'
import { gwei } from './constants'
import { defaultGasPrice, gasPriceType, gasApiUrl } from './network'

var gasPrice = null
var lastGasPriceTime = null
export const getGasPrice = (forceRefresh = false) => {
    return new Promise((resolve, reject) => {
        if (!forceRefresh && hasValidGasPrice()) {
            resolve(gasPrice)
            return;
        }
        let gasUrl = gasApiUrl()
        if (gasUrl) {
            Axios.get(gasUrl).then((response) => {
                if (response && response.data && response.data[gasPriceType()]) {
                    gasPrice = Math.ceil(response.data[gasPriceType()] * gwei / 10.0)
                    lastGasPriceTime = new Date().getTime()
                    resolve(gasPrice)
                }
                else {
                    if (gasPrice > defaultGasPrice()) {
                        resolve(gasPrice)
                    }
                    else {
                        resolve(defaultGasPrice())
                    }
                }
            }).catch(() => {
                if (gasPrice > defaultGasPrice()) {
                    resolve(gasPrice)
                }
                else {
                    resolve(defaultGasPrice())
                }
            })
        } else {
            resolve(defaultGasPrice())
        }
    })
}

const hasValidGasPrice = () => {
    var timeSincePrice = new Date().getTime() - lastGasPriceTime
    return gasPrice !== null && gasPrice > 0 && timeSincePrice < 30000
}