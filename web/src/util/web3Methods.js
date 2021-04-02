import Web3Utils from 'web3-utils'
import Web3 from 'web3'
import { wethAddress, wssInfuraAddress } from './constants'
import detectEthereumProvider from '@metamask/detect-provider'
import WalletConnectProvider from "@walletconnect/web3-provider"


const infuraId = "8d03fea006b64542ab9c26af741965b2"
let _web3 = null
let _web3Fallback = null
let _web3Provider = null
let _web3Connect = null
let _web3Disconnect = null
let _web3AccountChanged = null
let _web3ChainChanged = null

const getWeb3ConnectEvent = () => {
  if (_web3Connect === null) {
    _web3Connect = new CustomEvent("web3-connect", {bubbles: true})
  }
  return _web3Connect
}

const getWeb3DisconnectEvent = () => {
  if (_web3Disconnect === null) {
    _web3Disconnect = new CustomEvent("web3-disconnect", {bubbles: true})
  }
  return _web3Disconnect
}

const getWeb3AccountChangedEvent = () => {
  if (_web3AccountChanged === null) {
    _web3AccountChanged = new CustomEvent("web3-accounts", {bubbles: true})
  }
  return _web3AccountChanged
}

const getWeb3ChainChangedEvent = () => {
  if (_web3ChainChanged === null) {
    _web3ChainChanged = new CustomEvent("web3-chain", {bubbles: true})
  }
  return _web3ChainChanged
}

export const getWeb3 = () => {
  if (_web3 !== null) {
    return _web3
  } else if (_web3Provider) {
    _web3 = new Web3(_web3Provider)
    return _web3
  } else if (_web3Fallback === null) {
    _web3Fallback = new Web3(
      new Web3.providers.WebsocketProvider(wssInfuraAddress + infuraId)
    )
  }
  return _web3Fallback
}

export const hasWeb3Provider = () => {
  return !!_web3Provider
}

export const disconnect = () => {
  _web3 = null
  _web3Fallback = null
  _web3Provider = null
  window.localStorage.removeItem('WEB3_LOGGED')
  document.dispatchEvent(getWeb3DisconnectEvent())
}

export const connectWeb3Provider = async (connector) => {

  if (connector === "metamask") {
    _web3Provider = await detectEthereumProvider()
  } else if (connector === "walletconnect") {
    _web3Provider = new WalletConnectProvider({
      infuraId: infuraId
    })
  } else {
    throw new Error("Invalid web3 connector")
  }
  _web3Provider.on("accountsChanged", (accounts) => {
    document.dispatchEvent(getWeb3AccountChangedEvent())
  })
  _web3Provider.on("chainChanged", (chainId) => {
    document.dispatchEvent(getWeb3ChainChangedEvent())
  })
  _web3Provider.on("disconnect", (error) => {
    disconnect()
  })
  try {
    if (connector === "metamask") {
      await _web3Provider.request({ method: 'eth_accounts' })
    } else if (connector === "walletconnect") {
      await _web3Provider.enable()
    }
    window.localStorage.setItem('WEB3_LOGGED', connector)
    document.dispatchEvent(getWeb3ConnectEvent())
  } catch (err) {
    console.error(err)
    _web3Provider = null
  }
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