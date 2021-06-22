import Web3Utils from 'web3-utils'
import { wrapperAddress } from './network'

let _web3 = null
let _connector = null

export const getWeb3 = () => {
  if (_web3 !== null) {
    return _web3
  } else {
    throw new Error("No web3")
  }
}

export const setWeb3 = (web3, connector = null) => {
  _web3 = web3
  _connector = connector
}

export function checkEthBalanceOf(address) {    
  return new Promise(function (resolve, reject) {
    getWeb3().eth.getBalance(address, function (err, result) {
      if (err) {
        console.error(err)
      }
      resolve(result)
    })
  })
}

export function checkTransactionIsMined(transactionHash) {
  return new Promise(function(resolve, reject){
    checkTransactionTimeout(transactionHash, (result) => resolve(result))
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

function isTransactionMined(hash) {
  return new Promise(function (resolve, reject) {
    getWeb3().eth.getTransactionReceipt(hash, function (err, receipt) {
      if (err) {
        console.error(err)
      }
      if (receipt && receipt.blockNumber) {
        resolve(receipt)
      } else {
        resolve(null)
      }
    })
  })
}

export function wrapEth(from, value, nonce) {
  return sendTransactionWithNonce(null, null, from, wrapperAddress(), value, null, null, nonce)
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
        from: from,
        to: to,
        data: data
    };
    if (value) {
      transactionObj.value = Web3Utils.toHex(value)
    }
    if (chainId) {
      transactionObj.chainId = Web3Utils.toHex(chainId)
    }
    if (gasPrice) {
      transactionObj.gasPrice = Web3Utils.toHex(gasPrice)
    }
    if (gasLimit) {
      transactionObj.gasLimit = Web3Utils.toHex(gasLimit)
    }

    let promise
    if (_connector !== null) {
      promise = _connector.sendTransaction(transactionObj)
    } else {
      const web3 = getWeb3()
      const requestData = {
        method: 'eth_sendTransaction',
        params: [transactionObj]
      }
      if (web3.eth.currentProvider.request) {
        promise = web3.eth.currentProvider.request(requestData)
      } else {
        promise = web3.eth.currentProvider.send(requestData)
      }
    }
    promise.then((result) => resolve(result)).catch((err) => reject(err))
  })
}

export function signTypedData(from, data){
  return new Promise(function (resolve, reject) { 
    const params = [from, data]  
    let promise
    if (_connector !== null) {
      promise = _connector.signTypedData(params)
    } else {
      const web3 = getWeb3()
      const requestData = {
        method: 'eth_signTypedData_v4',
        params: params,
        from
      }
      if (web3.eth.currentProvider.request) {
        promise = web3.eth.currentProvider.request(requestData)
      } else {
        promise = web3.eth.currentProvider.send(requestData)
      }
    }
    promise.then((result) => {
      let signature = result.substring(2)
      const r = '0x' + signature.slice(0, 64)
      const s = '0x' + signature.slice(64, 128)
      const v = parseInt('0x' + signature.slice(128, 130), 16)
      resolve({v: v, r: r, s: s})
    }).catch((err) => reject(err))
  })
}

export function switchNetwork(connectionData) {
  return new Promise((resolve, reject) => { 
    if (_connector !== null) {
      reject("It is Walletconnect")
    } else {
      let promise
      const web3 = getWeb3()
      const requestData = {
        method: 'wallet_addEthereumChain',
        params: [connectionData]
      }
      if (web3.eth.currentProvider.request) {
        promise = web3.eth.currentProvider.request(requestData)
      } else {
        promise = web3.eth.currentProvider.send(requestData)
      }
      promise.then(() => resolve()).catch((err) => reject(err))
    }
  })
}