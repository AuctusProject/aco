import { getWeb3 } from './web3Methods'
import { acoVaultABI } from './acoVaultABI';
import { getERC20AssetInfo } from './erc20Methods';

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
            getERC20AssetInfo(acoVaultAddress).then(result => {
                acoVaultInfo = {...acoVaultInfo, ...result}
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
                    resolve()
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

export const getAccountSituation = (acoVaultAddress, account, shares) => {
    var acoVaultContract = getAcoVaultContract(acoVaultAddress)
    return acoVaultContract.methods.getAccountSituation(account, shares).call()
}

export const getAccountPosition = (acoVaultAddress, account, shares) => {
    return new Promise((resolve) => {   
        getAccountSituation(acoVaultAddress, account, shares).then(accountSituation => {
            var accountPosition = {}
            accountPosition.balance = accountSituation[0]
            accountPosition.fee = accountSituation[1]
            accountPosition.acoTokensInfos = {}
            var promises = []
            for (let i = 0; i < accountSituation[2].length; ++i) {
                promises.push(new Promise((resolve) => {
                    var acoTokenAddress = accountSituation[2][i]
                    getERC20AssetInfo(acoTokenAddress).then(result => {
                        accountPosition.acoTokensInfos[acoTokenAddress] = result
                        accountPosition.acoTokensInfos[acoTokenAddress].balance = accountSituation[3]
                        resolve()
                    })
                }))
            }
            Promise.all(promises).then(() => {
                resolve(accountPosition)
            })
        })
    })
}