import { getWeb3, sendTransaction, sendTransactionWithNonce } from './web3Methods'
import { acoPoolABI } from './acoPoolABI';
import { getAvailablePoolsForOption } from './acoPoolFactoryMethods';
import BigNumber from 'bignumber.js';
import { fromDecimals } from './constants';
import { getOption } from './acoFactoryMethods';
import { getCollateralAmount } from './acoTokenMethods';

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABI, acoPoolAddress)
    }
    return null;
}

export const getPoolQuote = (acoPoolAddress, option, amount) => {
    return new Promise((resolve,reject)=>{
        var acoPoolContract = getAcoPoolContract(acoPoolAddress)
        var defaultDecodeMethodReturn = acoPoolContract._decodeMethodReturn
        acoPoolContract._decodeMethodReturn = (outputs, result) => {
            if (result && result.length === 258 && result.startsWith("0x00")) {
                return defaultDecodeMethodReturn(outputs, result)
            } else if (result && result.length >= 202) {
                const errorLength = parseInt(result.substring(74, 138), 16);
                const hexError = result.substring(138, 138 + errorLength * 2);
                let errorMsg = "";
                for (let i = 0; i < hexError.length; i += 2) {
                    errorMsg += String.fromCharCode(parseInt(hexError.substr(i, 2), 16));
                }
                return errorMsg;
            } else {
                return "Invalid quote result";
            }
        }
        acoPoolContract.methods.quote(option.acoToken, amount).call()
        .then(result => resolve(result))
        .catch(err => resolve({}))
    })
}


export const getBestPoolQuote = (option, amount) => {
    return new Promise((resolve, reject) => {
        getAvailablePoolsForOption(option).then(acoPoolAddresses => {
            let swapPromises = []   
            for (let i = 0; i < acoPoolAddresses.length; i++) {
                swapPromises.push(getPoolQuote(acoPoolAddresses[i].acoPool, option, amount))
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

export const swap = (from, acoPoolAddress, acoToken, amount, restriction, deadline, nonce) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.swap(acoToken, amount, restriction, from, deadline).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoPoolAddress, null, data, null, nonce)
}

export function baseVolatility(acoPoolAddress) {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.baseVolatility().call()
}

export const collateral = (acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.collateral().call()
}

export function canSwap(acoPoolAddress, acoToken) {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.canSwap(acoToken).call()
}

export const getDepositShares = (acoPoolAddress, amount) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.getDepositShares(amount).call()
}

export const getAccountPoolPosition = (acoPoolAddress, shares) => {
    return new Promise((resolve, reject) => {   
        getWithdrawWithLocked(acoPoolAddress, shares).then(accountSituation => {
            accountSituation.acoTokensInfos = {}
            var promises = []
            for (let i = 0; i < accountSituation[2].length; ++i) {
                promises.push(new Promise((resolve) => {
                    var acoTokenAddress = accountSituation[2][i]
                    getOption(acoTokenAddress).then(result => {
                        accountSituation.acoTokensInfos[acoTokenAddress] = result
                        accountSituation.acoTokensInfos[acoTokenAddress].balance = accountSituation[3][i]
                        accountSituation.acoTokensInfos[acoTokenAddress].collateralAmount = getCollateralAmount(result, accountSituation[3][i])
                        resolve()
                    })
                }))
            }
            Promise.all(promises).then(() => {
                resolve(accountSituation)
            })
            .catch(err => reject(err))
        })
    })
}

export const getWithdrawWithLocked = (acoPoolAddress, shares) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.getWithdrawWithLocked(shares).call()
}

export const getWithdrawNoLockedData = (acoPoolAddress, shares) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.getWithdrawNoLockedData(shares).call()
}

export const deposit = (from, acoPoolAddress, amount, minShares, isEther, nonce) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.deposit(amount, minShares, from).encodeABI()
    var value = isEther ? amount : 0
    return sendTransactionWithNonce(null, null, from, acoPoolAddress, value, data, null, nonce)
}

export const withdrawNoLocked = (from, acoPoolAddress, shares, minCollateral) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.withdrawNoLocked(shares, minCollateral, from).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}

export const withdrawWithLocked = (from, acoPoolAddress, shares) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.withdrawWithLocked(shares, from).encodeABI()
    return sendTransaction(null, null, from, acoPoolAddress, null, data)
}