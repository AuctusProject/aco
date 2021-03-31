import { getWeb3, sendTransaction, sendTransactionWithNonce } from './web3Methods';
import { acoRewardAddress, acoRewardsPools } from './constants';
import { acoRewardsABI } from './acoRewardsABI';
import { acoTokenData } from './acoFactoryMethods';
import { balanceOf } from './erc20Methods';

var acoRewardsContract = null
function getAcoRewardsContract() {
    if (acoRewardsContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoRewardsContract = new _web3.eth.Contract(acoRewardsABI, acoRewardAddress)
        }
    }
    return acoRewardsContract
}

let rewardsBaseData = null
export const listRewardsData = (forceLoad = false) => {
    return new Promise((resolve, reject) => {
        if (!forceLoad && rewardsBaseData !== null) {
            resolve(rewardsBaseData)
        } else {
            Promise.all([totalAllocPoint(), currentReward()]).then((base) => {
                const totalAlloc = BigInt(base[0])
                const promises = []
                for (let i = 0; i < acoRewardsPools.length; ++i) {
                    promises.push(poolInfo(acoRewardsPools[i].pid))
                }
                promises.push(acoTokenData(base[1].aco))
                Promise.all(promises).then((data) => {
                    const totalBalPromises = []
                    for (let i = 0; i < acoRewardsPools.length; ++i) {
                        totalBalPromises.push(balanceOf(data[i].lpToken, acoRewardAddress))
                    }
                    Promise.all(totalBalPromises).then((balances) => {
                        const currentAcoData = data[acoRewardsPools.length]
                        const monthlyAmount = BigInt(base[1].rewardRate) * BigInt("2592000")
                        const result = []
                        for (let i = 0; i < acoRewardsPools.length; ++i) {
                            result.push({
                                pid: acoRewardsPools[i].pid,
                                name: acoRewardsPools[i].name,
                                image: acoRewardsPools[i].image,
                                address: data[i].lpToken,
                                totalBalance: balances[i],
                                monthlyReward: (monthlyAmount * BigInt(data[i].allocPoint) / totalAlloc).toString(),
                                currentAco: { 
                                    aco: base[1].aco,
                                    expiryTime: parseInt(currentAcoData.expiryTime),
                                    underlying: currentAcoData.underlying,
                                    strikeAsset: currentAcoData.strikeAsset,
                                    strikePrice: currentAcoData.strikePrice,
                                    isCall: currentAcoData.isCall
                                }
                            })
                        }
                        rewardsBaseData = result
                        resolve(rewardsBaseData)
                    }).catch((err) => reject(err))
                }).catch((err) => reject(err))
            }).catch((err) => reject(err))
        }
    })
}

export const listUnclaimedRewards = (from) => {
    return new Promise((resolve, reject) => {
        const promises = []
        for (let i = 0; i < acoRewardsPools.length; ++i) {
            promises.push(pendingReward(acoRewardsPools[i].pid, from))
        }
        Promise.all(promises).then((rewards) => {
            const acoPromises = []
            let acoIndexes = {}
            for (let i = 0; i < rewards.length; ++i) {
                for (let j = 0; j < rewards[i][0].length; ++j) { 
                    if (acoIndexes[rewards[i][0][j]] === undefined) {
                        acoIndexes[rewards[i][0][j]] = {p: [acoRewardsPools[i].pid], i: acoPromises.length, a: BigInt(rewards[i][1][j])}
                        acoPromises.push(acoTokenData(rewards[i][0][j]))
                    } else {
                        acoIndexes[rewards[i][0][j]].p.push(acoRewardsPools[i].pid)
                        acoIndexes[rewards[i][0][j]].a += BigInt(rewards[i][1][j])
                    }
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
                        amount: (acoIndexes[aco].a).toString(),
                        poolPids: acoIndexes[aco].p
                    })
                }
                resolve(result)
            }).catch((err) => reject(err))
        }).catch((err) => reject(err))
    })
}

export const listClaimedRewards = (from) => {
    return new Promise((resolve, reject) => {
        listPaidRewards(from).then((rewards) => {
            const acoPromises = []
            let acoIndexes = {}
            for (let i = 0; i < rewards.length; ++i) {
                if (acoIndexes[rewards[i].returnValues.aco] === undefined) {
                    acoIndexes[rewards[i].returnValues.aco] = {i: acoPromises.length, a: BigInt(rewards[i].returnValues.reward)}
                    acoPromises.push(acoTokenData(rewards[i].returnValues.aco))
                } else {
                    acoIndexes[rewards[i].returnValues.aco].a += BigInt(rewards[i].returnValues.reward)
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

export const accountBalance = (pid, from) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.balanceOf(pid, from).call()
}

export const deposit = (from, pid, amount, nonce) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.deposit(pid, amount).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoRewardAddress, null, data, null, nonce)
}

export const withdraw = (from, pid, amount) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.withdraw(pid, amount).encodeABI()
    return sendTransaction(null, null, from, acoRewardAddress, null, data, null)
}

export const claimReward = (from, pid) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.claimReward(pid).encodeABI()
    return sendTransaction(null, null, from, acoRewardAddress, null, data, null)
}

export const claimRewards = (from, pids) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.claimRewards(pids).encodeABI()
    return sendTransaction(null, null, from, acoRewardAddress, null, data, null)
}

const poolLength = () => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.poolLength().call()
}

const poolInfo = (pid) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.poolInfo(pid).call()
}

const totalAllocPoint = () => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.totalAllocPoint().call()
}

const currentReward = () => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.currentReward().call()
}

const pendingReward = (pid, from) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.pendingReward(pid, from).call()
}

const listPaidRewards = (from) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.getPastEvents('RewardPaid', { filter: {user: from}, fromBlock: 0, toBlock: 'latest' })
}