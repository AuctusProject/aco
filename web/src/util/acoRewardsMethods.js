import { getWeb3, sendTransaction, sendTransactionWithNonce } from './web3Methods';
import { acoRewardAddress } from './constants';
import { acoRewardsABI } from './acoRewardsABI';

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

export const listAlreadyAwardedAcos = (from) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.getPastEvents('RewardPaid', { filter: {user: from}, fromBlock: 0, toBlock: 'latest' })
}

export const balanceOf = (pid, from) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.balanceOf(pid, from).call()
}

export const poolsLength = () => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.poolLength().call()
}

export const poolInfo = (pid) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.poolInfo(pid).call()
}

export const totalWeight = () => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.totalAllocPoint().call()
}

export const currentAcoReward = () => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.currentReward().call()
}

export const pendingReward = (pid, account) => {
    const acoRewardsContract = getAcoRewardsContract()
    return acoRewardsContract.methods.pendingReward(pid, account).call()
}

export const deposit = (from, pid, amount) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.deposit(pid, amount).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoRewardAddress, null, data, null, nonce)
}

export const withdraw = (from, pid, amount) => {
    const acoRewardsContract = getAcoRewardsContract()
    const data = acoRewardsContract.methods.withdraw(pid, amount).encodeABI()
    return sendTransactionWithNonce(null, null, from, acoRewardAddress, null, data, null, nonce)
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