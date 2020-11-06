const { multicallAddress } = require("./constants");
const { multicallABI } = require("./multicallABI");
const { getWeb3 } = require("./web3Methods");

function getMulticallContract() {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(multicallABI, multicallAddress)
    }
    return null;
}

export const aggregate = (calls) => {
    const contract = getMulticallContract()
    return contract.methods.aggregate(calls).call()
}