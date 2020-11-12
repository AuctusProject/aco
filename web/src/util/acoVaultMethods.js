import { getWeb3, sendTransaction, sendTransactionWithNonce } from './web3Methods'
import { acoVaultABI } from './acoVaultABI';
import { getERC20AssetInfo } from './erc20Methods';
import { getIsCall } from './acoTokenMethods';
import { getBestQuote } from './acoQuote';
import { getOption } from './acoFactoryMethods';
import BigNumber from 'bignumber.js';
import { fromDecimals } from './constants';

function getAcoVaultContract(acoVaultAddress) {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoVaultABI, acoVaultAddress)
    }
    return null;
}

export const getAcoVaultInfo = (acoVaultAddress) => {
    return new Promise((resolve) => {
        var acoVaultInfo = { address: acoVaultAddress }
        var promises = [];
        promises.push(new Promise((resolve) => {
            name(acoVaultAddress).then(name => {
                acoVaultInfo.name = name
                resolve()
            })
        }))
        promises.push(new Promise((resolve) => {
            decimals(acoVaultAddress).then(decimals => {
                acoVaultInfo.decimals = decimals
                resolve()
            })
        }))
        promises.push(new Promise((resolve) => {
            token(acoVaultAddress).then(token => {
                getERC20AssetInfo(token).then(result => {
                    acoVaultInfo.tokenInfo = result
                    resolve()
                })
            })
        }))
        promises.push(new Promise((resolve) => {
            currentAcoToken(acoVaultAddress).then(currentAco => {
                getERC20AssetInfo(currentAco).then(result => {
                    acoVaultInfo.currentAcoTokenInfo = result
                    getIsCall(currentAco).then(isCall => {
                        acoVaultInfo.currentAcoTokenInfo.isCall = isCall
                        resolve()
                    })
                })
            })
        }))
        Promise.all(promises).then(() => {
            resolve(acoVaultInfo)
        })
    })
}

export const currentAcoToken = (acoVaultAddress) => {
    var acoVaultContract = getAcoVaultContract(acoVaultAddress)
    return acoVaultContract.methods.currentAcoToken().call()
}

export const token = (acoVaultAddress) => {
    var acoVaultContract = getAcoVaultContract(acoVaultAddress)
    return acoVaultContract.methods.token().call()
}

export const name = (acoVaultAddress) => {
    var acoVaultContract = getAcoVaultContract(acoVaultAddress)
    return acoVaultContract.methods.name().call()
}

export const decimals = (acoVaultAddress) => {
    var acoVaultContract = getAcoVaultContract(acoVaultAddress)
    return acoVaultContract.methods.decimals().call()
}

export const acoData = (acoVaultAddress) => {
    var acoVaultContract = getAcoVaultContract(acoVaultAddress)
    return acoVaultContract.methods.acoData().call()
}

export const getAccountSituation = (acoVaultAddress, account, shares) => {
    var acoVaultContract = getAcoVaultContract(acoVaultAddress)
    return acoVaultContract.methods.getAccountSituation(account, shares).call()
}

export const getAccountPosition = (acoVaultAddress, account, shares, decimals) => {
    return new Promise((resolve, reject) => {   
        getAccountSituation(acoVaultAddress, account, shares).then(accountSituation => {
            var accountPosition = {}
            accountPosition.balance = accountSituation[0]
            accountPosition.fee = accountSituation[1]
            accountPosition.value = new BigNumber(fromDecimals(new BigNumber(accountPosition.balance).plus(new BigNumber(accountPosition.fee)), decimals))
            accountPosition.acoTokensInfos = {}
            var promises = []
            for (let i = 0; i < accountSituation[2].length; ++i) {
                promises.push(new Promise((resolve) => {
                    var acoTokenAddress = accountSituation[2][i]
                    getOption(acoTokenAddress).then(result => {
                        accountPosition.acoTokensInfos[acoTokenAddress] = result
                        accountPosition.acoTokensInfos[acoTokenAddress].balance = accountSituation[3][i]
                        try {
                            getBestQuote(result, accountSituation[3][i], true)
                            .then(quote => {
                                accountPosition.acoTokensInfos[acoTokenAddress].quote = quote.isPoolQuote ? quote : quote.quote
                                accountPosition.acoTokensInfos[acoTokenAddress].value = fromDecimals(new BigNumber(accountPosition.acoTokensInfos[acoTokenAddress].quote.price.toString()).times(accountPosition.acoTokensInfos[acoTokenAddress].balance), accountPosition.acoTokensInfos[acoTokenAddress].acoTokenInfo.decimals)
                                accountPosition.value = accountPosition.value.plus(new BigNumber(accountPosition.acoTokensInfos[acoTokenAddress].value))
                                resolve()
                            })
                            .catch(() => {
                                accountPosition.acoTokensInfos[acoTokenAddress].quote = {}
                                accountPosition.acoTokensInfos[acoTokenAddress].value = null
                                resolve()
                            })
                        }
                        catch {
                            accountPosition.acoTokensInfos[acoTokenAddress].quote = {}
                            resolve()
                        }                        
                    })
                }))
            }
            Promise.all(promises).then(() => {
                resolve(accountPosition)
            })
            .catch(err => reject(err))
        })
    })
}

export const withdraw = (from, acoVaultAddress, shares) => {
    const acoVaultContract = getAcoVaultContract(acoVaultAddress)
    var data = acoVaultContract.methods.withdraw(shares).encodeABI()
    return sendTransaction(null, null, from, acoVaultAddress, null, data)
}

export const deposit = (from, acoVaultAddress, amount, nonce) => {
    const acoVaultContract = getAcoVaultContract(acoVaultAddress)
    var data = acoVaultContract.methods.deposit(amount).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoVaultAddress, null, data, null, nonce)
}