import { getWeb3, sendTransaction } from '../web3Methods';
import { acoDistributorABI } from './acoDistributorABI';
import { acoTokenData } from './acoFactoryMethods';
import { acoDistributorAddress } from '../network';

function getAcoDistributorContract() {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoDistributorABI, acoDistributorAddress())
    }
    return null
}

export const listClaimedAcos = (from) => {
    return new Promise((resolve, reject) => {
        listClaimed(from).then((rewards) => {
            const acoPromises = []
            let acoIndexes = {}
            for (let i = 0; i < rewards.length; ++i) {
                if (acoIndexes[rewards[i].returnValues.aco] === undefined) {
                    acoIndexes[rewards[i].returnValues.aco] = {i: acoPromises.length, a: BigInt(rewards[i].returnValues.amount)}
                    acoPromises.push(acoTokenData(rewards[i].returnValues.aco))
                } else {
                    acoIndexes[rewards[i].returnValues.aco].a += BigInt(rewards[i].returnValues.amount)
                }
            }
            Promise.all(acoPromises).then((acos) => {
                const result = []
                for (let aco in acoIndexes) {
                    result.push({
                        aco: aco,
                        expiryTime: parseInt(acos[acoIndexes[aco].i].expiryTime),
                        underlying: acos[acoIndexes[aco].i].underlying,
                        strikeAsset: acos[acoIndexes[aco].i].strikeAsset,
                        strikePrice: acos[acoIndexes[aco].i].strikePrice,
                        isCall: acos[acoIndexes[aco].i].isCall,
                        amount: (acoIndexes[aco].a).toString()
                    })
                }
                resolve(result)
            }).catch((err) => reject(err))
        }).catch((err) => reject(err))
    })
}

export const getClaimableAcos = (amount) => {
    return new Promise((resolve, reject) => {
        getClaimable(amount).then((rewards) => {
            const acoPromises = []
            for (let i = 0; i < rewards[0].length; ++i) {
                acoPromises.push(acoTokenData(rewards[0][i]))
            }
            Promise.all(acoPromises).then((acos) => {
                const result = []
                for (let i = 0; i < rewards[0].length; ++i) {
                    result.push({
                        aco: rewards[0][i],
                        expiryTime: parseInt(acos[i].expiryTime),
                        underlying: acos[i].underlying,
                        strikeAsset: acos[i].strikeAsset,
                        strikePrice: acos[i].strikePrice,
                        isCall: acos[i].isCall,
                        amount: (rewards[1][i]).toString()
                    })
                }
                resolve(result)
            }).catch((err) => reject(err))
        }).catch((err) => reject(err))
    })
}

export const getAcosAmount = () => {
    return new Promise((resolve, reject) => {
        acosLength().then((length) => {
            length = parseInt(length)
            const promises = []
            for (let i = 0; i < length; ++i) {
                promises.push(getAco(i))
            }
            Promise.all(promises).then((acos) => {
                const amountPromises = []
                for (let j = 0; j < length; ++j) {
                    amountPromises.push(acoAmountAvailable(acos[j]))
                }
                Promise.all(amountPromises).then((amounts) => {
                    const result = []
                    for (let k = 0; k < length; ++k) {
                        result.push({aco: acos[k], amount: amounts[k]})
                    }
                    resolve(result)
                }).catch((err) => reject(err))
            }).catch((err) => reject(err))
        }).catch((err) => reject(err))
    })
}

export const claimed = (id) => {
    return new Promise((resolve, reject) => {
        if (!id) {
            resolve(false)
        } else {
            const acoDistributorContract = getAcoDistributorContract()
            acoDistributorContract.methods.claimed(id).call().then((isClaimed) => resolve(isClaimed)).catch((err) => reject(err))
        }
    })
}

export const claim = (id, from, amount, v, r, s) => {
    const acoDistributorContract = getAcoDistributorContract()
    const data = acoDistributorContract.methods.claim(id, from, amount, v, r, s).encodeABI()
    return sendTransaction(null, null, from, acoDistributorAddress(), null, data, null)
}

const getClaimable = (amount) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.methods.getClaimableAcos(amount).call()
}

const listClaimed = (from) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.getPastEvents('Claim', { filter: {account: from}, fromBlock: 0, toBlock: 'latest' })
}

const acoAmountAvailable = (aco) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.methods.acosAmount(aco).call()
}

const acosLength = () => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.methods.acosLength().call()
}

const getAco = (index) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.methods.acos(index).call()
}