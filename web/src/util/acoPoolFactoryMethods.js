import { getWeb3 } from './web3Methods'
import { acoPoolFactoryAddress, getBalanceOfAsset } from './constants';
import { acoPoolFactoryABI } from './acoPoolFactoryABI';
import { getERC20AssetInfo } from './erc20Methods';
import { baseVolatility, collateralDeposited } from './acoPoolMethods';

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
function getAvailablePools(underlying, strikeAsset, isCall) {
    return new Promise((resolve, reject) => {
        getAllAvailablePools().then(pools => {
            let filteredPools = []
            if (pools) {
                filteredPools = pools.filter(p => p.underlying.toLowerCase() === underlying.toLowerCase() && p.strikeAsset.toLowerCase() === strikeAsset.toLowerCase() && p.isCall === isCall)
            }
            resolve(filteredPools)
        })
        .catch(err => reject(err))
    })
}

export const getAllAvailablePools = () => {
    return new Promise((resolve, reject) => {
        if (availablePools != null) {
            resolve(availablePools)
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
                        pools.push(eventValues)
                        if (!assetsAddresses.includes(eventValues.strikeAsset)) {
                            assetsAddresses.push(eventValues.strikeAsset)
                        }
                        if (!assetsAddresses.includes(eventValues.underlying)) {
                            assetsAddresses.push(eventValues.underlying)
                        }
                    }
                    fillTokensInformations(pools, assetsAddresses)
                    .then(pools => {
                        availablePools = pools
                        resolve(availablePools)
                    })
                    .catch(err => reject(err))
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
                var acoPoolPromise = getERC20AssetInfo(pools[i].acoPool)
                acoPoolPromises.push(acoPoolPromise)
                acoPoolPromise.then(result => {
                    pools[i].acoPoolInfo = result
                    pools[i].underlyingInfo = assetsInfo[pools[i].underlying]
                    pools[i].strikeAssetInfo = assetsInfo[pools[i].strikeAsset]
                })

                var acoPoolCollateralDepositedPromise = collateralDeposited(pools[i].acoPool)
                acoPoolPromises.push(acoPoolCollateralDepositedPromise)
                acoPoolCollateralDepositedPromise.then(result => {
                    pools[i].collateralDeposited = result
                })

                var acoPoolVolatilityPromise = baseVolatility(pools[i].acoPool)
                acoPoolPromises.push(acoPoolVolatilityPromise)
                acoPoolVolatilityPromise.then(result => {
                    pools[i].volatility = result
                })

                var acoPoolUnderlyingBalancePromise = getBalanceOfAsset(pools[i].underlying, pools[i].acoPool)
                acoPoolPromises.push(acoPoolUnderlyingBalancePromise)
                acoPoolUnderlyingBalancePromise.then(result => {
                    pools[i].underlyingBalance = result
                })

                var acoPoolStrikeAssetBalancePromise = getBalanceOfAsset(pools[i].strikeAsset, pools[i].acoPool)
                acoPoolPromises.push(acoPoolStrikeAssetBalancePromise)
                acoPoolStrikeAssetBalancePromise.then(result => {
                    pools[i].strikeAssetBalance = result
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
        getAvailablePools(option.underlying, option.strikeAsset, option.isCall).then(pools => {
            let filteredPools = []
            for (let i = 0; i < pools.length; i++) {
                const pool = pools[i];
                if (pool.poolStart * 1000 <= Date.now() &&
                    pool.minExpiration <= option.expiryTime &&
                    pool.maxExpiration >= option.expiryTime &&
                    pool.minStrikePrice <= option.strikePrice &&
                    pool.maxStrikePrice >= option.strikePrice) {
                    filteredPools.push(pool)
                }
            }
            resolve(filteredPools)
        })
        .catch(err => reject(err))
    })
}