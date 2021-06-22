import { getWeb3, sendTransaction, sendTransactionWithNonce } from '../web3Methods'
import { acoPoolABI } from './acoPoolABI';
import { getAvailablePoolsForOption } from './acoPoolFactoryMethods';
import BigNumber from 'bignumber.js';
import { toDecimals } from '../constants';
import { getCollateralAmountInDecimals } from './acoTokenMethods';
import { getOption } from '../dataController';

function getAcoPoolContract(acoPoolAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoPoolABI, acoPoolAddress)
    }
    return null
}

const getPoolQuote = (acoPoolAddress, option, amount) => {
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

export const getSwapQuote = (option, acoAmount = null, acoPrice = null, slippage = null) => {
    return new Promise((resolve, reject) => {
        getAvailablePoolsForOption(option).then((acoPools) => {
            internalSwapQuote(acoPools, option, acoAmount, acoPrice, slippage).then((r) => resolve(r)).catch((err) => reject(err))
        }).catch((err) => reject(err))
    })
}

const internalSwapQuote = (acoPools, option, acoAmount, acoPrice, slippage = null) => {
    return new Promise((resolve, reject) => {
        let swapPromises = []   
        let indexes = {}
        const oneAcoToken = new BigNumber(toDecimals("1", option.underlyingInfo.decimals))
        for (let i = 0; i < acoPools.length; i++) {
            let liquidity
            if (option.isCall) {
                liquidity = new BigNumber(acoPools[i].underlyingBalance)
            } else {
                let collateralLiquidity = new BigNumber(acoPools[i].strikeAssetBalance)
                if (collateralLiquidity.gt(0)) {
                    liquidity = collateralLiquidity.times(oneAcoToken).div(new BigNumber(option.strikePrice)).integerValue(BigNumber.ROUND_FLOOR)
                } else {
                    liquidity = new BigNumber(0)
                }
            }
            if (liquidity.gt(0)) {
                let amountToQuote = (acoAmount ? BigNumber.minimum(liquidity, acoAmount) : liquidity)
                indexes[swapPromises.length.toString()] = {
                    acoPool: acoPools[i].acoPool, 
                    amount: amountToQuote
                }
                swapPromises.push(getPoolQuote(acoPools[i].acoPool, option, amountToQuote.toString(10)))
            }
        }
        Promise.all(swapPromises).then((result) => {
            const response = {poolData: [], filledAmount: new BigNumber(0)}
            const pricesSorted = []
            for (let i = 0; i < result.length; i++) {
                if (!isNaN(result[i][0])) {
                    let swapPrice = new BigNumber(result[i][0])
                    if (slippage) {
                        swapPrice = swapPrice.times((new BigNumber(1)).plus(new BigNumber(slippage))).integerValue(BigNumber.ROUND_CEIL)
                    }
                    let pricePerUnit = oneAcoToken.times(swapPrice).div(indexes[i.toString()].amount)
                    if (!acoPrice || pricePerUnit.lte(acoPrice)) {
                        pricesSorted.push({
                            acoPool: indexes[i.toString()].acoPool, 
                            acoAmount: indexes[i.toString()].amount, 
                            strikeAssetAmount: swapPrice, 
                            price: pricePerUnit
                        })
                    }
                }
            }
            pricesSorted.sort((a, b) => a.price.gt(b.price) ? 1 : a.price.eq(b.price) ? 0 : -1)
            if (pricesSorted.length > 0) {
                for (let j = 0; j < pricesSorted.length && (!acoAmount || response.filledAmount.isLessThan(acoAmount)); ++j) {
                    
                    let aco
                    let strikeAsset
                    if (acoAmount && response.filledAmount.plus(pricesSorted[j].acoAmount).isGreaterThan(acoAmount)) {
                        aco = acoAmount.minus(response.filledAmount)
                        strikeAsset = aco.times(pricesSorted[j].price).div(oneAcoToken)
                        response.filledAmount = acoAmount
                    } else {
                        aco = pricesSorted[j].acoAmount
                        strikeAsset = pricesSorted[j].strikeAssetAmount
                        response.filledAmount = response.filledAmount.plus(pricesSorted[j].acoAmount)
                    }
                    response.poolData.push({
                        acoPool: pricesSorted[j].acoPool, 
                        acoAmount: aco, 
                        strikeAssetAmount: strikeAsset, 
                        price: pricesSorted[j].price
                    })
                }
            }
            resolve(response)
        })
        .catch(err => reject(err))
    })
}

export const getSwapData = (from, acoPoolAddress, acoToken, amount, restriction, deadline) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.swap(acoToken, amount, restriction, from, deadline).encodeABI()
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
                if (accountSituation[3][i] > 0) {
                    promises.push(new Promise((resolve) => {
                        var acoTokenAddress = accountSituation[2][i]
                        getOption(acoTokenAddress, false).then(result => {
                            accountSituation.acoTokensInfos[acoTokenAddress] = result
                            accountSituation.acoTokensInfos[acoTokenAddress].balance = accountSituation[3][i]
                            accountSituation.acoTokensInfos[acoTokenAddress].collateralAmount = getCollateralAmountInDecimals(result, accountSituation[3][i])
                            resolve()
                        })
                    }))
                }
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

export const minExpiration = (acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.minExpiration().call()
}

export const maxExpiration = (acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.maxExpiration().call()
}

export const tolerancePriceAbove = (acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.tolerancePriceAbove().call()
}

export const tolerancePriceBelow = (acoPoolAddress) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    return acoPoolContract.methods.tolerancePriceBelow().call()
}

export const deposit = (from, acoPoolAddress, amount, minShares, isBaseAsset, nonce) => {
    const acoPoolContract = getAcoPoolContract(acoPoolAddress)
    var data = acoPoolContract.methods.deposit(amount, minShares, from).encodeABI()
    var value = isBaseAsset ? amount : 0
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