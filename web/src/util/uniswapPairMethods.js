import { getWeb3 } from './web3Methods';
import { uniswapPairABI } from './uniswapPairABI';

var uniswapPairContracts = {}
function getUniswapPairContract(pair) {
    if (!uniswapPairContracts[pair.toLowerCase()]) {
        const _web3 = getWeb3()
        if (_web3) {
            uniswapPairContracts[pair.toLowerCase()] = new _web3.eth.Contract(uniswapPairABI, pair)
        }
    }
    return uniswapPairContracts[pair.toLowerCase()]
}

var uniswapPairData = {}
export const getPairData = (pair) => {
    return new Promise((resolve, reject) => {
        if (uniswapPairData[pair.toLowerCase()]) {
            resolve(uniswapPairData[pair.toLowerCase()])
        } else {
            Promise.all([token0(pair), token1(pair), getReserves(pair), totalSupply(pair)]).then((data) => {
                uniswapPairData[pair.toLowerCase()] = {token0: data[0], token1: data[1], reserve0: data[2].reserve0, reserve1: data[2].reserve1, totalSupply: data[3]}
                resolve(uniswapPairData[pair.toLowerCase()])
            }).catch((err) => reject(err))
        }
    })
}

const token0 = (pair) => {
    const uniswapPairContract = getUniswapPairContract(pair)
    return uniswapPairContract.methods.token0().call()
}

const token1 = (pair) => {
    const uniswapPairContract = getUniswapPairContract(pair)
    return uniswapPairContract.methods.token1().call()
}

const totalSupply = (pair) => {
    const uniswapPairContract = getUniswapPairContract(pair)
    return uniswapPairContract.methods.totalSupply().call()
}

const getReserves = (pair) => {
    const uniswapPairContract = getUniswapPairContract(pair)
    return uniswapPairContract.methods.getReserves().call()
}