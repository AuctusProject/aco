import { getWeb3, sendTransaction } from './web3Methods';
import { acoDistributorAddress } from './constants';
import { acoDistributorABI } from './acoDistributorABI';
import { acoTokenData } from './acoFactoryMethods';

var acoDistributorContract = null
function getAcoDistributorContract() {
    if (acoDistributorContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoDistributorContract = new _web3.eth.Contract(acoDistributorABI, acoDistributorAddress)
        }
    }
    return acoDistributorContract
}

export const listClaimedAcos = (from) => {
    return new Promise((resolve, reject) => {
        listClaimed(from).then((rewards) => {
            const acoPromises = []
            let acoIndexes = {}
            for (let i = 0; i < rewards.length; ++i) {
                if (acoIndexes[rewards[i].aco] === undefined) {
                    acoIndexes = {i: acoPromises.length, a: BigInt(rewards[i].amount)}
                    acoPromises.push(acoTokenData(rewards[i].aco))
                } else {
                    acoIndexes[rewards[i].aco].a += BigInt(rewards[i].amount)
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

export const acoAmountAvailable = (aco) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.methods.acosAmount(aco).call()
}

export const claim = (id, from, amount, v, r, s) => {
    const acoDistributorContract = getAcoDistributorContract()
    const data = acoDistributorContract.methods.claim(id, from, amount, v, r, s).encodeABI()
    return sendTransaction(null, null, from, acoDistributorAddress, null, data, null)
}

const getClaimable = (amount) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.methods.getClaimableAcos(amount).call()
}

const listClaimed = (from) => {
    const acoDistributorContract = getAcoDistributorContract()
    return acoDistributorContract.getPastEvents('Claim', { filter: {account: from}, fromBlock: 0, toBlock: 'latest' })
}