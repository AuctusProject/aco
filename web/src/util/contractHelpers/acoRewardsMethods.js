import { getWeb3, sendTransaction, sendTransactionWithNonce } from '../web3Methods';
import { parseBigIntToNumber } from '../constants';
import { acoRewardsABI } from './acoRewardsABI';
import { acoTokenData } from './acoFactoryMethods';
import { balanceOf } from './erc20Methods';
import { getPairData } from './uniswapPairMethods';
import { getCoingeckoPrice } from '../coingeckoApi';
import { getPool } from '../dataController';
import { acoRewardAddress, acoRewardsPools, auctusAddress } from '../network';

function getAcoRewardsContract() {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoRewardsABI, acoRewardAddress())
    }
    return null
}

export const resetRewardData = () => {
    rewardsBaseData = null
}

let rewardsBaseData = null
export const listRewardsData = (forceLoad = false) => {
    return new Promise((resolve, reject) => {
        if (!forceLoad && rewardsBaseData !== null) {
            resolve(rewardsBaseData)
        } else {
            const _acoRewardsPools = acoRewardsPools()
            Promise.all([totalAllocPoint(), currentReward()]).then((base) => {
                const totalAlloc = BigInt(base[0])
                const promises = []
                for (let i = 0; i < _acoRewardsPools.length; ++i) {
                    promises.push(poolInfo(_acoRewardsPools[i].pid))
                }
                promises.push(acoTokenData(base[1].aco))
                Promise.all(promises).then((data) => {
                    const valuePromises = []
                    for (let i = 0; i < _acoRewardsPools.length; ++i) {
                        valuePromises.push(balanceOf(data[i].lpToken, acoRewardAddress()))
                        if (_acoRewardsPools[i].pid === 0) {
                            valuePromises.push(getPairData(data[i].lpToken))
                        } else {
                            valuePromises.push(getPool(data[i].lpToken))
                        }
                    }
                    valuePromises.push(getCoingeckoPrice(["auctus","ethereum","bitcoin"]))
                    Promise.all(valuePromises).then((values) => {
                        const currentAcoData = data[_acoRewardsPools.length]
                        const monthlyAmount = BigInt(base[1].rewardRate) * BigInt("2592000")
                        const coingeckoValues = values[values.length -1]
                        let aucPrice = coingeckoValues["auctus"] && coingeckoValues["auctus"].usd ? coingeckoValues["auctus"].usd : 0
                        let ethPrice = coingeckoValues["ethereum"] && coingeckoValues["ethereum"].usd ? coingeckoValues["ethereum"].usd : 0
                        let btcPrice = coingeckoValues["bitcoin"] && coingeckoValues["bitcoin"].usd ? coingeckoValues["bitcoin"].usd : 0
                        const result = []
                        let index = 0
                        for (let i = 0; i < _acoRewardsPools.length; ++i) {
                            let monthlyReward = parseBigIntToNumber(monthlyAmount * BigInt(data[i].allocPoint) / totalAlloc, 18)
                            let lpValuePerShare = 0
                            let poolData = null
                            let poolDecimals = (_acoRewardsPools[i].pid === 3 ? 8 : _acoRewardsPools[i].pid === 2 || _acoRewardsPools[i].pid === 4 ? 6 : 18)
                            let balance = parseBigIntToNumber(BigInt(values[index]), poolDecimals)
                            if (_acoRewardsPools[i].pid === 0) {
                                let uniData = values[index+1]
                                let ts = parseBigIntToNumber(BigInt(uniData.totalSupply), 18)
                                if (ts > 0) {
                                    if (uniData.token0.toLowerCase() === auctusAddress()) {
                                        lpValuePerShare = parseBigIntToNumber(BigInt(uniData.reserve0), 18) * aucPrice + parseBigIntToNumber(BigInt(uniData.reserve1), 18) * ethPrice
                                    } else {
                                        lpValuePerShare = parseBigIntToNumber(BigInt(uniData.reserve0), 18) * ethPrice + parseBigIntToNumber(BigInt(uniData.reserve1), 18) * aucPrice
                                    }
                                    lpValuePerShare = lpValuePerShare / ts
                                }
                            } else {
                                poolData = values[index+1]
                                lpValuePerShare = parseBigIntToNumber(BigInt(poolData.strikeAssetPerShare), 6)
                                if (_acoRewardsPools[i].pid === 1 || _acoRewardsPools[i].pid === 2) {
                                    lpValuePerShare += parseBigIntToNumber(BigInt(poolData.underlyingPerShare), 18) * ethPrice
                                } else {
                                    lpValuePerShare += parseBigIntToNumber(BigInt(poolData.underlyingPerShare), 8) * btcPrice
                                }
                            }
                            let monthly1kReward = 0
                            let kb = (lpValuePerShare > 0 ? 1000 / lpValuePerShare : 0)
                            let totalLocked = lpValuePerShare * balance    
                            if (balance > 0) {
                                monthly1kReward = Math.min((kb / balance), 1) * monthlyReward
                            } else {
                                monthly1kReward = monthlyReward
                            }
                            index = index + 2
                            result.push({
                                pid: _acoRewardsPools[i].pid,
                                name: _acoRewardsPools[i].name,
                                image: _acoRewardsPools[i].image,
                                address: data[i].lpToken,
                                decimals: poolDecimals,
                                lpValuePerShare: lpValuePerShare,
                                poolData: poolData,
                                totalLocked: Math.round(totalLocked * 100) / 100,
                                monthly1kReward: Math.round(monthly1kReward),
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
        const _acoRewardsPools = acoRewardsPools()
        for (let i = 0; i < _acoRewardsPools.length; ++i) {
            promises.push(pendingReward(_acoRewardsPools[i].pid, from))
        }
        Promise.all(promises).then((rewards) => {
            const acoPromises = []
            let acoIndexes = {}
            for (let i = 0; i < rewards.length; ++i) {
                for (let j = 0; j < rewards[i][0].length; ++j) { 
                    let amount = BigInt(rewards[i][1][j])
                    if (acoIndexes[rewards[i][0][j]] === undefined) {
                        acoIndexes[rewards[i][0][j]] = {p: [{pid: _acoRewardsPools[i].pid, amount: amount.toString()}], i: acoPromises.length, a: amount}
                        acoPromises.push(acoTokenData(rewards[i][0][j]))
                    } else {
                        acoIndexes[rewards[i][0][j]].p.push({pid: _acoRewardsPools[i].pid, amount: amount.toString()})
                        acoIndexes[rewards[i][0][j]].a += amount
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
                        poolData: acoIndexes[aco].p
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
    return sendTransactionWithNonce(null, null, from, acoRewardAddress(), null, data, null, nonce)
}

export const withdraw = (from, pid, amount) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.withdraw(pid, amount).encodeABI()
    return sendTransaction(null, null, from, acoRewardAddress(), null, data, null)
}

export const claimReward = (from, pid) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.claimReward(pid).encodeABI()
    return sendTransaction(null, null, from, acoRewardAddress(), null, data, null)
}

export const claimRewards = (from, pids) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.claimRewards(pids).encodeABI()
    return sendTransaction(null, null, from, acoRewardAddress(), null, data, null)
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