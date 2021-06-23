import Axios from 'axios'
import { removeOptionsToIgnore } from './constants'
import { apiUrl } from './network'

export const clearApiData = () => {
    acoOptions = null
    acoPools = null
}

let acoOptions = null
export function getAcoOptions() {
    return new Promise(function(resolve,reject){
        if (acoOptions != null) {
            resolve(acoOptions)
            return
        }
        Axios.get(apiUrl() + "tokens")
        .then(res => {
            if (res && res.data) {
                acoOptions = removeOptionsToIgnore(res.data)
            }
            resolve(acoOptions)
        })
        .catch(err => reject(err));
    })
}

let acoPools = null
export function getAcoPools(forceRefresh) {
    return new Promise(function(resolve,reject){
        if (acoPools != null && !forceRefresh) {
            resolve(acoPools)
            return
        }
        Axios.get(apiUrl() + "pools")
        .then(res => {
            if (res && res.data) {
                acoPools = res.data
            }
            resolve(acoPools)
        })
        .catch(err => reject(err));
    })
}

export function getAcoPoolStatus(poolAddress) {
    return new Promise(function(resolve,reject){
        Axios.get(apiUrl() + "pools/"+poolAddress+"/status")
        .then(res => {
            if (res && res.data) {
                resolve(res.data)
            }
            else {
                resolve(null)
            }            
        })
        .catch(err => reject(err));
    })
}

export function getAcoPoolEvents(poolAddress) {
    return new Promise(function(resolve,reject){
        Axios.get(apiUrl() + "pools/"+poolAddress+"/events")
        .then(res => {
            if (res && res.data) {
                resolve(res.data)
            }
            else {
                resolve(null)
            }            
        })
        .catch(err => reject(err));
    })
}

export function getAcoPoolHistory(poolAddress) {
    return new Promise(function(resolve,reject){
        Axios.get(apiUrl() + "pools/"+poolAddress+"/historical")
        .then(res => {
            if (res && res.data) {
                resolve(res.data)
            }
            else {
                resolve(null)
            }            
        })
        .catch(err => reject(err));
    })
}