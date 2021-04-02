import Web3Utils from 'web3-utils'
import Web3 from 'web3'
import { wethAddress, wssInfuraAddress } from './constants'
import '@metamask/legacy-web3'

var _web3 = null
var _web3Fallback = null
export function getWeb3() {
    if (_web3 !== null) {
        return _web3
    }
    else if (window.web3 && window.web3.currentProvider) {
        _web3 = new Web3(window.web3.currentProvider)
        return _web3
    }
    else {
        if (_web3Fallback === null) {
            _web3Fallback = new Web3(
                new Web3.providers.WebsocketProvider(wssInfuraAddress + "86a7724fd0cb4e5dae62e8c2e474ced0")
            )
        }
        return _web3Fallback
    }
}

export function connectMetamask() {
    return new Promise(function (resolve, reject) {
        const web3 = getWeb3()
        if (web3) {
            web3.currentProvider.enable()
                .then(accounts => resolve(accounts))
                .catch((err) => reject(err))
        }
        else {
            reject()
        }
    })
}

export function checkEthBalanceOf(address) {    
    return new Promise(function (resolve, reject) {
        getWeb3().eth.getBalance(address, function (err, result) {
            resolve(result)
        })
    })
}

export function wrapEth(from, value, nonce) {
    return sendTransactionWithNonce(null, null, from, wethAddress, value, null, null, nonce)
}

export function getNextNonce(from) {
    return new Promise(function (resolve, reject) {
        getWeb3().eth.getTransactionCount(from, (err, result) => {
            if (err) reject(err)
            else {
                resolve(result)
            }
        })
    })
}

export function sendTransaction(gasPrice, gasLimit, from, to, value, data, chainId) {
    return new Promise(function (resolve, reject) {
        getNextNonce(from).then(result => {
            sendTransactionWithNonce(gasPrice, gasLimit, from, to, value, data, chainId, result)
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    })
}

export function sendTransactionWithNonce(gasPrice, gasLimit, from, to, value, data, chainId, nonce) {
    return new Promise(function (resolve, reject) {        
        var transactionObj = {
            nonce: Web3Utils.toHex(nonce),
            gasPrice: Web3Utils.toHex(gasPrice),
            gasLimit: Web3Utils.toHex(gasLimit),
            from: from,
            to: to,
            value: Web3Utils.toHex(value),
            data: data,
            chainId: Web3Utils.toHex(chainId)
        };

        getWeb3().eth.sendTransaction(transactionObj, function (err, result) {
            if (err) {
                reject(err)
            }
            else {
                resolve(result)
            }
        })
        .catch(err => {
            reject(err)
        })
    })
}

export function signTypedData(from, data){
    return new Promise(function (resolve, reject) { 
        const _web3 = getWeb3();
        _web3.eth.currentProvider.sendAsync({
            method: 'eth_signTypedData_v4',
            params: [from, data],
            from,
        }, (err, result) => {
            if (err) {
                reject(err)
                return
            }
            if (result.error) {
                reject(result.error)
            }

            let signature = JSON.stringify(result.result);
            signature = result.result.substring(2);
            const r = '0x' + signature.slice(0, 64);
            const s = '0x' + signature.slice(64, 128);
            const v = parseInt('0x' + signature.slice(128, 130), 16);
            resolve({v: v, r: r, s: s})
        });
    })
}

function isTransactionMined(hash) {
    return new Promise(function (resolve, reject) {
        getWeb3().eth.getTransactionReceipt(hash, function (err, receipt) {
            if (receipt && receipt.blockNumber) {
                resolve(receipt)
            }
            else {
                resolve(null)
            }
        })
    })
}

function checkTransactionTimeout(transactionHash, onMined) {
    setTimeout(() => {
        isTransactionMined(transactionHash).then(result => {
            if (result) {
                setTimeout(() => onMined(result.status), 5000)
            }
            else {
                checkTransactionTimeout(transactionHash, onMined)
            }
        })
    }, 1000)
}

export function checkTransactionIsMined(transactionHash) {
    return new Promise(function(resolve, reject){
        checkTransactionTimeout(transactionHash, (result) => resolve(result))
    })
}