import { getWeb3, sendTransaction, sendTransactionWithNonce } from './web3Methods'
import { acoPoolABI } from './acoPoolABI';
import { getAvailablePoolsForOption } from './acoPoolFactoryMethods';
import BigNumber from 'bignumber.js';
import { fromDecimals } from './constants';

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABI, acoPoolAddress)
    }
    return null;
}

export const getPoolQuote = (isBuying, acoPoolAddress, option, amount) => {
    var acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var defaultDecodeMethodReturn = acoPoolContract._decodeMethodReturn
    acoPoolContract._decodeMethodReturn = (outputs, result) => {
        if (result && result.length >= 202) {
            const errorLength = parseInt(result.substring(74, 138), 16);
            const hexError = result.substring(138, 138 + errorLength * 2);
            let errorMsg = "";
            for (let i = 0; i < hexError.length; i += 2) {
              errorMsg += String.fromCharCode(parseInt(hexError.substr(i, 2), 16));
            }
            return errorMsg;
        }
        else {
            return defaultDecodeMethodReturn(outputs, result)
        }        
    }
    return acoPoolContract.methods.quote(isBuying, option.acoToken, amount).call()
}


export const getBestPoolQuote = (isBuying, option, amount) => {
    return new Promise((resolve, reject) => {
        getAvailablePoolsForOption(option).then(acoPoolAddresses => {
            let swapPromises = []   
            for (let i = 0; i < acoPoolAddresses.length; i++) {
                swapPromises.push(getPoolQuote(isBuying, acoPoolAddresses[i].acoPool, option, amount))
            }
            Promise.all(swapPromises).then(result => {
                let bestResult = null
                for (let i = 0; i < result.length; i++) {
                    if (!isNaN(result[i][0])) {
                        let swapPrice = new BigNumber(fromDecimals(result[i][0], option.strikeAssetInfo.decimals, option.strikeAssetInfo.decimals, option.strikeAssetInfo.decimals))
                        let unitPrice = swapPrice.div(new BigNumber(fromDecimals(amount, option.underlyingInfo.decimals, option.underlyingInfo.decimals, option.underlyingInfo.decimals)))
                        if (!bestResult || !bestResult.swapPrice || swapPrice < bestResult.swapPrice) {
                            bestResult = {isPoolQuote: true, price: unitPrice, poolAddress: acoPoolAddresses[i].acoPool}
                        }
                    }
                }
                resolve(bestResult)
            })
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })
}

export const swap = (from, isBuying, acoPoolAddress, acoToken, amount, restriction, deadline, nonce) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.swap(isBuying, acoToken, amount, restriction, from, deadline).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoPoolAddress, null, data, null, nonce)
}

export function collateralDeposited(acoPoolAddress) {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.collateralDeposited().call()
}

export function baseVolatility(acoPoolAddress) {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.baseVolatility().call()
}

export const deposit = (from, acoPoolAddress, amount, isEther, nonce) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.deposit(amount, from).encodeABI()
    var value = isEther ? amount : 0
    return sendTransactionWithNonce(null, null, from, acoPoolAddress, value, data, null, nonce)
}

export const redeem = (from, acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.redeem().encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}