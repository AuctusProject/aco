import { getWeb3 } from './web3Methods'
import { acoPoolFactoryAddress, addressToData, booleanToData } from './constants';
import { acoPoolFactoryABI } from './acoPoolFactoryABI';

var acoPoolFactoryContract = null
function getAcoPoolFactoryContract() {
    if (acoPoolFactoryContract == null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoPoolFactoryContract = new _web3.eth.Contract(acoPoolFactoryABI, acoPoolFactoryAddress)
        }
    }
    return acoPoolFactoryContract
}

function formatPoolsKey(underlying, strikeAsset, isCall) {
    return underlying + "_" + strikeAsset + "_" + isCall
}

var availablePools = {}
function getAvailablePools(underlying, strikeAsset, isCall) {
    return new Promise((resolve, reject) => {
        var key = formatPoolsKey(underlying, strikeAsset, isCall)
        if (availablePools[key] != null) {
            resolve(availablePools[key])
        }
        else {
            const acoPoolFactoryContract = getAcoPoolFactoryContract()
            acoPoolFactoryContract.getPastEvents('NewAcoPool', { fromBlock: 0, toBlock: 'latest', topics: ["0x603b4cf5dbf9184fdb9839cf9675603f15d10459e128ddbeea523235a47d2984", "0x"+addressToData(underlying), "0x"+addressToData(strikeAsset), "0x"+booleanToData(isCall)] }).then((events) => {
                var pools = []
                for (let i = 0; i < events.length; i++) {
                    const eventValues = events[i].returnValues;
                    pools.push(eventValues)
                }
                availablePools[key] = pools
                resolve(availablePools[key])
            })
        }
    })
}

export const getAvailablePoolsForOption = (option) => {
    return new Promise((resolve, reject) => {
        getAvailablePools(option.underlying, option.strikeAsset, option.isCall).then(pools => {
            let filteredPools = []
            for (let i = 0; i < pools.length; i++) {
                const pool = pools[i];
                if (pool.minExpiration <= option.expiryTime &&
                    pool.maxExpiration >= option.expiryTime &&
                    pool.minStrikePrice <= option.strikePrice &&
                    pool.maxStrikePrice >= option.strikePrice) {
                    filteredPools.push(pool)
                }
            }
            resolve(filteredPools)
        })
    })
}