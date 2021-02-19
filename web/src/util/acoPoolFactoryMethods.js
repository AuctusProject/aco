import { getWeb3 } from './web3Methods'
import { acoPoolFactoryAddress, deprecatedPoolImplementation, getBalanceOfAsset, toDecimals } from './constants';
import { acoPoolFactoryABI } from './acoPoolFactoryABI';
import { getERC20AssetInfo } from './erc20Methods';
import { baseVolatility, canSwap, collateral, getWithdrawNoLockedData } from './acoPoolMethods';
import { getGeneralData } from './acoPoolMethodsv2';

var acoPoolFactoryContract = null
function getAcoPoolFactoryContract() {
    if (acoPoolFactoryContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoPoolFactoryContract = new _web3.eth.Contract(acoPoolFactoryABI, acoPoolFactoryAddress)
        }
    }
    return acoPoolFactoryContract
}

var availablePools = null
var availablePoolsWithExtraData = null
export const getAllAvailablePools = (fillExtraData = true) => {
    return new Promise((resolve, reject) => {
        if (availablePools != null && !fillExtraData) {
            resolve(availablePools)
        }
        else if (availablePoolsWithExtraData != null) {
            resolve(availablePoolsWithExtraData)
        }
        else {
            const acoPoolFactoryContract = getAcoPoolFactoryContract()
            if (acoPoolFactoryContract) {
                acoPoolFactoryContract.getPastEvents('NewAcoPool', { fromBlock: 0, toBlock: 'latest' })
                .then((events) => {
                    var assetsAddresses = []
                    var pools = []
                    for (let i = 0; i < events.length; i++) {
                        const eventValues = events[i].returnValues;
                        if (eventValues.acoPoolImplementation.toLowerCase() !== deprecatedPoolImplementation.toLowerCase()) {                        
                            pools.push(eventValues)
                            if (!assetsAddresses.includes(eventValues.strikeAsset)) {
                                assetsAddresses.push(eventValues.strikeAsset)
                            }
                            if (!assetsAddresses.includes(eventValues.underlying)) {
                                assetsAddresses.push(eventValues.underlying)
                            }
                            if (!assetsAddresses.includes(eventValues.acoPool)) {
                                assetsAddresses.push(eventValues.acoPool)
                            }
                        }
                    }
                    availablePools = pools
                    if (fillExtraData) {
                        var poolsWithExtra = JSON.parse(JSON.stringify(pools))
                        fillTokensInformations(poolsWithExtra, assetsAddresses)
                        .then(poolsWithExtra => {
                            availablePoolsWithExtraData = poolsWithExtra
                            resolve(availablePoolsWithExtraData)
                        })
                        .catch(err => reject(err))
                    } else {
                        resolve(availablePools)
                    }
                })
                .catch(err => reject(err))
            }
            else {
                resolve(null)
            }
        }
    })
}

function fillTokensInformations(pools, assetsAddresses) {
    return new Promise((resolve, reject) => {
        var assetsInfo = {}
        var promises = []
        for (let i = 0; i < assetsAddresses.length; i++) {
            var promise = getERC20AssetInfo(assetsAddresses[i])
            promises.push(promise)
            promise.then(result => {
                assetsInfo[assetsAddresses[i]] = result
            })
        }
        Promise.all(promises).then(() => {
            var acoPoolPromises = []
            for (let i = 0; i < pools.length; i++) {
                pools[i].acoPoolInfo = assetsInfo[pools[i].acoPool]
                pools[i].underlyingInfo = assetsInfo[pools[i].underlying]
                pools[i].strikeAssetInfo = assetsInfo[pools[i].strikeAsset]

                var underlyingBalancePromise = getBalanceOfAsset(pools[i].underlying, pools[i].acoPool)
                acoPoolPromises.push(underlyingBalancePromise)
                underlyingBalancePromise.then(result => {
                    pools[i].underlyingBalance = result
                })

                var strikeAssetBalancePromise = getBalanceOfAsset(pools[i].strikeAsset, pools[i].acoPool)
                acoPoolPromises.push(strikeAssetBalancePromise)
                strikeAssetBalancePromise.then(result => {
                    pools[i].strikeAssetBalance = result
                })

                var acoPoolVolatilityPromise = baseVolatility(pools[i].acoPool)
                acoPoolPromises.push(acoPoolVolatilityPromise)
                acoPoolVolatilityPromise.then(result => {
                    pools[i].volatility = result
                })

                var withdrawNoLockedDataPromise = getWithdrawNoLockedData(pools[i].acoPool, toDecimals(1, pools[i].acoPoolInfo.decimals))
                acoPoolPromises.push(withdrawNoLockedDataPromise)
                withdrawNoLockedDataPromise.then(result => {
                    pools[i].withdrawNoLockedData = result
                })

                var collateralPromise = collateral(pools[i].acoPool)
                acoPoolPromises.push(collateralPromise)
                collateralPromise.then(result => {
                    pools[i].collateralInfo = assetsInfo[result]
                })

                .catch(err => reject(err))
            }
            Promise.all(acoPoolPromises).then(() => {
                resolve(pools)
            })
            .catch(err => reject(err))
        })
    })
}

export const getAvailablePoolsForOption = (option) => {
    return new Promise((resolve, reject) => {
        getAllAvailablePools(false).then(pools => {
            let canSwapPromises = []
            let filteredPools = []
            for (let i = 0; i < pools.length; i++) {
                const pool = pools[i];
                if (pool.underlying.toLowerCase() === option.underlying.toLowerCase() && 
                    pool.strikeAsset.toLowerCase() === option.strikeAsset.toLowerCase() && 
                    pool.isCall === option.isCall) {
                    let canSwapPromise = canSwap(pool.acoPool, option.acoToken)
                    canSwapPromises.push(canSwapPromise)
                    canSwapPromise.then(result => {
                        if (result) {
                            filteredPools.push(pool)
                        }
                    })                
                    .catch(err => reject(err))
                }
            }
            Promise.all(canSwapPromises).then(() => {
                let extraPromises = []
                for (let j = 0; j < filteredPools.length; ++j) {
                    extraPromises.push(getGeneralData(filteredPools[j].acoPool))
                }
                Promise.all(extraPromises).then((extras) => {
                    for (let k = 0; k < filteredPools.length; ++k) {
                        filteredPools[k].collateralLocked = extras[k].collateralLocked
                        filteredPools[k].collateralLockedRedeemable = extras[k].collateralLockedRedeemable
                        filteredPools[k].collateralOnOpenPosition = extras[k].collateralOnOpenPosition
                        filteredPools[k].underlyingBalance = extras[k].underlyingBalance
                        filteredPools[k].strikeAssetBalance = extras[k].strikeAssetBalance
                    }
                    resolve(filteredPools)
                })            
                .catch(err => reject(err))
            })            
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })
}