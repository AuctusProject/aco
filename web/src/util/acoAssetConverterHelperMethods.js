import { getWeb3 } from './web3Methods'
import { acoAssetConverterHelperAddress } from './constants'
import { acoAssetConverterHelperABI } from './acoAssetConverterHelperABI'

let acoAssetConverterHelperContract = null
function getAcoAssetConverterHelperContract() {
    if (acoAssetConverterHelperContract === null) {
        const _web3 = getWeb3()
        if (_web3) {
            acoAssetConverterHelperContract = new _web3.eth.Contract(acoAssetConverterHelperABI, acoAssetConverterHelperAddress)
        }
    }
    return acoAssetConverterHelperContract
}

export const getPrice = (baseToken, quoteToken) => {
    const contract = getAcoAssetConverterHelperContract()
    return contract.methods.getPrice(baseToken, quoteToken).call()
}