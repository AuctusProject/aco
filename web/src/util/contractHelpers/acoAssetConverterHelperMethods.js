import { getWeb3 } from '../web3Methods'
import { acoAssetConverterHelperABI } from './acoAssetConverterHelperABI'
import { acoAssetConverterHelperAddress } from '../network'

function getAcoAssetConverterHelperContract() {
    const _web3 = getWeb3()
    if (_web3) {
        return new _web3.eth.Contract(acoAssetConverterHelperABI, acoAssetConverterHelperAddress())
    }
    return null
}

export const getPrice = (baseToken, quoteToken) => {
    const contract = getAcoAssetConverterHelperContract()
    return contract.methods.getPrice(baseToken, quoteToken).call()
}