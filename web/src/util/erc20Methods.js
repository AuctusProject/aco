import Web3Utils from 'web3-utils'
import { getWeb3, sendTransactionWithNonce, sendTransaction } from './web3Methods'
import { isEther } from './constants'
import { erc20ABI } from './erc20ABI'


export const getERC20AssetInfo = (assetAddress) => {
    return new Promise((resolve, reject) => {
        if (isEther(assetAddress)) {
            resolve({address: assetAddress, name: "Ethereum", symbol: "ETH", decimals: 18})
        }
        else {
            var _web3 = getWeb3()
            var assetContract = new _web3.eth.Contract(erc20ABI, assetAddress)
            var promises = []
            promises.push(assetContract.methods.name().call())
            promises.push(assetContract.methods.symbol().call())
            promises.push(assetContract.methods.decimals().call())
            Promise.all(promises).then(result => {
                resolve({address: assetAddress, name: result[0], symbol: result[1], decimals: result[2]})
            })
        }
    })
}

export function allowDeposit(from, value, token, to, nonce) {
    const _web3 = getWeb3()
    const tokenContract = new _web3.eth.Contract(erc20ABI, token)
    var data = tokenContract.methods.approve(to, value).encodeABI()
    if (nonce != null) {
        return sendTransactionWithNonce(null, null, from, token, null, data, null, nonce)
    }
    else {
        return sendTransaction(null, null, from, token, null, data, null)
    }
}

export function allowance(from, token, to) {
    const _web3 = getWeb3()
    const tokenContract = new _web3.eth.Contract(erc20ABI, token)
    return tokenContract.methods.allowance(from, to).call()
}

export function getTokenBalance(tknContractAddress, accountAddrs) {
    return new Promise(function (resolve, reject) {
        const _web3 = getWeb3()
        const exchangeContract = new _web3.eth.Contract(erc20ABI, tknContractAddress)
        var data = exchangeContract.methods.balanceOf(accountAddrs).encodeABI()
        _web3.eth.call({
            to: tknContractAddress,
            data: data
        }, function (err, result) {
            if (result) {
                var tokensBN = Web3Utils.toBN(result)
                resolve(tokensBN)
            }
            else {
                resolve(0)
            }
        })
    })
}