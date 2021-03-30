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

export const accountBalance = (pid, from) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.balanceOf(pid, from).call()
}

export const pendingReward = (pid, account) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.pendingReward(pid, account).call()
}

export const listAlreadyAwardedAcos = (from) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.getPastEvents('RewardPaid', { filter: {user: from}, fromBlock: 0, toBlock: 'latest' })
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
