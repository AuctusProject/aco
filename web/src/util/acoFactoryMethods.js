import { getWeb3, sendTransaction } from './web3Methods'
import { acoFactoryAddress, getOtcOptions, isExpired, removeExpiredOptions, removeNotWhitelistedOptions, removeOptionsToIgnore, sortByDesc, sortByFn, baseEthPair, baseWbtcPair } from './constants';
import { acoFactoryABI } from './acoFactoryABI';
import { getERC20AssetInfo } from './erc20Methods';
import { acoFee, unassignableCollateral, currentCollateral, assignableCollateral, balanceOf, getOpenPositionAmount, currentCollateralizedTokens, unassignableTokens, assignableTokens } from './acoTokenMethods';

var acoFactoryContract = null
function getAcoFactoryContract() {
    if (acoFactoryContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoFactoryContract = new _web3.eth.Contract(acoFactoryABI, acoFactoryAddress)
        }
    }
    return acoFactoryContract
}

var availableOptions = null
function getAllAvailableOptions() {
    return new Promise((resolve, reject) => {
        if (availableOptions != null) {
            resolve(availableOptions)
        }
        else {
            const acoFactoryContract = getAcoFactoryContract()
            Promise.all([
                acoFactoryContract.getPastEvents('NewAcoToken', { fromBlock: 0, toBlock: 'latest' }),
                acoFactoryContract.getPastEvents('NewAcoTokenData', { fromBlock: 0, toBlock: 'latest' })
            ]).then((events) => {
                Promise.all([parseAcoCreationEvent(events[0]),parseAcoCreationEvent(events[1])]).then((result) => {
                    availableOptions = [].concat(result[0], result[1])
                    resolve(availableOptions)
                }).catch((err) => reject(err))
            }).catch((err) => reject(err))
        }
    })
}

export const getAvailableAcosForUnderlying = (underlying) => {
    return new Promise((resolve, reject) => {
        const acoFactoryContract = getAcoFactoryContract()
        acoFactoryContract.getPastEvents('NewAcoTokenData', {filter:{underlying: underlying},fromBlock:0,toBlock:'latest'}).then((events) => {
            var acoOptions = []
            const now = Math.ceil(Date.now() / 1000)
            for (let i = 0; i < events.length; i++) {
                const eventValues = events[i].returnValues;
                let expiryTime = parseInt(eventValues.expiryTime) 
                if (expiryTime > now) {
                    acoOptions.push({
                        acoToken: eventValues.acoToken,
                        acoTokenImplementation: eventValues.acoTokenImplementation,
                        creator: eventValues.creator,
                        expiryTime: expiryTime,
                        isCall: eventValues.isCall,
                        strikeAsset: eventValues.strikeAsset,
                        strikePrice: eventValues.strikePrice,
                        underlying: eventValues.underlying
                    })
                }   
            }
            resolve(acoOptions)
        }).catch((err) => reject(err))
    })
}

export function refreshAllOptions() {
    availableOptions = null
    return getAllAvailableOptions()
}

function getAllAvailableOptionsWhitelisted() {
    return new Promise((resolve, reject) => {
        getAllAvailableOptions()
        .then(allOptions => {
            var optionsWhitelisted = removeNotWhitelistedOptions(allOptions)
            resolve(optionsWhitelisted)
        })
        .catch((err) => reject(err))
    })
}

function getOtcAvailableOptions() {
    return new Promise((resolve, reject) => {
        getAllAvailableOptions()
        .then(allOptions => {
            var otcOptions = getOtcOptions(allOptions)
            resolve(otcOptions)
        })
        .catch((err) => reject(err))
    })
}

function parseAcoCreationEvent(events) {
    return new Promise((resolve, reject) => {
        var assetsAddresses = []
        var acoOptions = []
        for (let i = 0; i < events.length; i++) {
            const eventValues = events[i].returnValues;
            acoOptions.push(eventValues)
            if (!assetsAddresses.includes(eventValues.strikeAsset)) {
                assetsAddresses.push(eventValues.strikeAsset)
            }
            if (!assetsAddresses.includes(eventValues.underlying)) {
                assetsAddresses.push(eventValues.underlying)
            }
        }
        acoOptions = removeOptionsToIgnore(acoOptions)
        fillTokensInformations(acoOptions, assetsAddresses).then(options => {
            resolve(options)
        }).catch((err) => reject(err))
    })
}

function fillTokensInformations(options, assetsAddresses) {
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
            var acoTokenPromises = []
            for (let i = 0; i < options.length; i++) {
                var acoTokenPromise = getERC20AssetInfo(options[i].acoToken)
                acoTokenPromises.push(acoTokenPromise)
                acoTokenPromise.then(result => {
                    options[i].acoTokenInfo = result
                    options[i].underlyingInfo = assetsInfo[options[i].underlying]
                    options[i].strikeAssetInfo = assetsInfo[options[i].strikeAsset]
                })

                var acoTokenFeePromise = acoFee(options[i])
                acoTokenPromises.push(acoTokenFeePromise)
                acoTokenFeePromise.then(result => {
                    options[i].acoFee = result
                })
            }
            Promise.all(acoTokenPromises).then(() => {
                resolve(options)
            }).catch((err) => reject(err))            
        }).catch((err) => reject(err))
    })
}

export const listPairs = () => {
    return new Promise((resolve, reject) => {
        getAllAvailableOptionsWhitelisted().then(options => {
            var opt = removeExpiredOptions(options)
            var pairs = getPairsFromOptions(opt)
            resolve(pairs)
        })
    })
}

export const getPairsFromOptions = (options) => {
    var pairs = {}
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (!pairs[option.underlyingInfo.symbol + "_" + option.strikeAssetInfo.symbol]) {
            pairs[option.underlyingInfo.symbol + "_" + option.strikeAssetInfo.symbol] = {
                id: option.underlyingInfo.symbol + "_" + option.strikeAssetInfo.symbol,
                underlying: option.underlying,
                underlyingInfo: option.underlyingInfo,
                underlyingSymbol: option.underlyingInfo.symbol,
                strikeAsset: option.strikeAsset,
                strikeAssetInfo: option.strikeAssetInfo,
                strikeAssetSymbol: option.strikeAssetInfo.symbol
            }
        }
    }
    var ethPair = baseEthPair()
    if (!pairs[ethPair.id]) {
        pairs[ethPair.id] = ethPair
    }
    var wbtcPair = baseWbtcPair()
    if (!pairs[wbtcPair.id]) {
        pairs[wbtcPair.id] = wbtcPair
    }
    return Object.values(pairs);
}
  
export const getOptionsFromPair = (options, selectedPair) => {
    return options && selectedPair ? options.filter(o => 
        o.underlyingInfo.symbol === selectedPair.underlyingSymbol && 
        o.strikeAssetInfo.symbol === selectedPair.strikeAssetSymbol) : []
}

export const listOptions = (pair, optionType = null, removeExpired = false, onlyOtcOptions = false) => {
    return new Promise((resolve, reject) => {
        var optionsMethod = !onlyOtcOptions ? getAllAvailableOptionsWhitelisted : getOtcAvailableOptions
        optionsMethod().then(availableOptions => {
            var options = []
            for (let i = 0; i < availableOptions.length; i++) {
                const option = availableOptions[i];
                if ((!pair || (option.underlyingInfo.symbol === pair.underlyingSymbol && 
                    option.strikeAssetInfo.symbol === pair.strikeAssetSymbol)) && 
                    (!optionType || (optionType === 1 ? option.isCall : !option.isCall)) && 
                    (!removeExpired || !isExpired(option.expiryTime))) {
                    options.push(option)
                }
            }
            var sortedOptions = sortByDesc(options, "isCall")
            resolve(sortedOptions)
        })
    })
}

export const getOption = (address, removeExpired=true) => {
    return new Promise((resolve, reject) => {
        getAllAvailableOptions().then(availableOptions => {
            for (let i = 0; i < availableOptions.length; i++) {
                const option = availableOptions[i];
                if (option.acoToken.toLowerCase() === address.toLowerCase() && 
                    (!removeExpired || !isExpired(option.expiryTime))) {
                    resolve(option)
                    return
                }
            }
            resolve(null)
        })
    })
}

export const getOptionPairIdFromAddress = (optionAddress) => {
    return new Promise((resolve, reject) => {
        getAllAvailableOptions().then(availableOptions => {
            for (let i = 0; i < availableOptions.length; i++) {
                const option = availableOptions[i];
                if (option.acoToken.toLowerCase() === optionAddress.toLowerCase()) {
                    resolve(option.underlyingInfo.symbol + "_" + option.strikeAssetInfo.symbol)
                    return
                }
            }
            resolve(null)
        })
    })
}

export function getOptionsPositions(pair, userAccount, otcPositions) {
    return new Promise((resolve, reject) => {
        listOptions(pair, null, false, otcPositions).then(options => {
            var positions = []
            for (let i = 0; i < options.length; i++) {
                getPositionForOption(options[i], userAccount).then(position => {
                    if (position.currentCollateral > 0) {
                        positions.push(position)
                    }
                    if ((options.length - 1) === i) {
                        resolve(positions)
                    }
                })
            }            
            if (options.length === 0) {
                resolve(positions)
            }
        })
    })
}

export function listPositionsForExercise(pair, userAccount, otcPositions) {
    return new Promise((resolve, reject) => {
        listOptions(pair, null, true, otcPositions).then(options => {
            var positions = []
            for (let i = 0; i < options.length; i++) {
                getPositionForOption(options[i], userAccount).then(position => {
                    if (position.openPosition > 0) {
                        positions.push(position)
                    }

                    if ((options.length - 1) === i) {
                        var sortedPositions = sortByFn(positions, (p) => p.option.isCall)
                        resolve(sortedPositions)
                    }
                })
            }
            if (options.length === 0) {
                resolve(positions)
            }
        })
    })
}

function getPositionForOption(option, userAccount) {
    return new Promise((resolve, reject) => {
        var promises = []
        promises.push(currentCollateral(option, userAccount))
        promises.push(assignableCollateral(option, userAccount))
        promises.push(unassignableCollateral(option, userAccount))
        promises.push(currentCollateralizedTokens(option, userAccount))
        promises.push(unassignableTokens(option, userAccount))
        promises.push(assignableTokens(option, userAccount))
        promises.push(balanceOf(option, userAccount))
        Promise.all(promises).then(results => {
            var position = {
                option: option, 
                currentCollateral: results[0],
                assignableCollateral: results[1],
                unassignableCollateral: results[2],
                currentCollateralizedTokens: results[3],
                unassignableTokens: results[4],
                assignableTokens: results[5],
                balance: results[6]
            }
            position.openPosition = getOpenPositionAmount(position)
            resolve(position)
        })
    })
}

export function newAcoToken(from, underlying, strikeAsset, isCall, strikePrice, expiryTime) {
    const contract = getAcoFactoryContract()
    var data = contract.methods.newAcoToken(underlying, strikeAsset, isCall, strikePrice, expiryTime).encodeABI()
    return sendTransaction(null, null, from, acoFactoryAddress, null, data)
}

export const acoTokenData = (aco) => {
    const acoFactoryContract = getAcoFactoryContract()
    return acoFactoryContract.methods.acoTokenData(aco).call()
}