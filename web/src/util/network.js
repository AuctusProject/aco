import { arbitrum } from "../config/arbitrum"
import { arbitrumTestnet } from "../config/arbitrum-testnet"
import { bsc } from "../config/bsc"
import { bscTestnet } from "../config/bsc-testnet"
import { kovan } from "../config/kovan"
import { mainnet } from "../config/mainnet"
import { ropsten } from "../config/ropsten"
import { ASSETS_INFO } from "./assets"

const networkNameStorage = 'DEFAULT_NETWORK'

const networks = JSON.parse(process.env.REACT_APP_NETWORKS)

let loggedNetworkData = null
export const setLoggedNetworkById = (chainId) => {
  setLoggedNetwork(getValidNetworkById(chainId))
}
export const setLoggedNetworkByName = (chainName) => {
  setLoggedNetwork(getValidNetworkByName(chainName))
}

export const getNetworkName = () => getNetworkData("name")
export const getNetworkIconUrl = () => getNetworkData("iconUrl")
export const getCustomRpc = () => getNetworkData("customRpc")
export const acoFactoryAddress = () => getNetworkData("acoFactoryAddress")
export const acoPoolFactoryAddress = () => getNetworkData("acoPoolFactoryAddress")
export const acoFlashExerciseAddress = () => getNetworkData("acoFlashExerciseAddress")
export const acoWriterAddress = () => getNetworkData("acoWriterAddress")
export const zrxExchangeAddress = () => getNetworkData("zrxExchangeAddress")
export const multicallAddress = () => getNetworkData("multicallAddress")
export const allAcoOtcAddresses = () => getNetworkData("allAcoOtcAddresses")
export const acoBuyerAddress = () => getNetworkData("acoBuyerAddress")
export const acoDistributorAddress = () => getNetworkData("acoDistributorAddress")
export const acoRewardAddress = () => getNetworkData("acoRewardAddress")
export const auctusAddress = () => getNetworkData("auctusAddress")
export const acoAssetConverterHelperAddress = () => getNetworkData("acoAssetConverterHelperAddress")
export const CHAIN_ID = () => getNetworkData("CHAIN_ID")
export const apiUrl = () =>getNetworkData("apiUrl")
export const subgraphUrl = () => getNetworkData("subgraphUrl")
export const zrxApiUrl = () =>getNetworkData("zrxApiUrl")
export const zrxWSSUrl = () => getNetworkData("zrxWSSUrl")
export const explorerUrl = () => getNetworkData("explorerUrl")
export const explorerTxUrl = () => getNetworkData("explorerTxUrl")
export const gasPriceType = () => getNetworkData("gasPriceType")
export const defaultGasPrice = () => getNetworkData("defaultGasPrice")
export const hasAave = () => getNetworkData("hasAave")
export const deprecatedPoolImplementation = () => getNetworkData("deprecatedPoolImplementation")
export const acoVaults = () => getNetworkData("acoVaults")
export const acoVaultsV2 = () => getNetworkData("acoVaultsV2")
export const defaultPoolAdmin = () => getNetworkData("defaultPoolAdmin")
export const defaultAcoCreators = () => getNetworkData("defaultAcoCreators")
export const gasApiUrl = () => getNetworkData("gasApiUrl")
export const swapUrl = () => getNetworkData("swapUrl")
export const rpcWssUrl = () => getNetworkData("rpcWssUrl")
export const rpcApiUrl = () => getNetworkData("rpcApiUrl")
export const ethAddress = () => getNetworkData("ethAddress")
export const usdAddress = () => getNetworkData("usdAddress")
export const baseAddress = () => getNetworkData("baseAddress")
export const wrapperAddress = () => getNetworkData("wrapperAddress")
export const btcAddress = () => getNetworkData("btcAddress")
export const usdSymbol = () => getNetworkData("usdSymbol")
export const btcSymbol = () => getNetworkData("btcSymbol")
export const ethSymbol = () => getNetworkData("ethSymbol")
export const baseSymbol = () => getNetworkData("baseSymbol")
export const zrxRequestPerSecond = () => getNetworkData("zrxRequestPerSecond")
export const acoRewardsPools = () => getNetworkData("acoRewardsPools")
export const acoAirdropAmounts = () => getNetworkData("acoAirdropAmounts")
export const airdropClaimStart = () => getNetworkData("airdropClaimStart")
export const optionsToIgnore = () => getNetworkData("optionsToIgnore")
export const coingeckoPlataform = () => getNetworkData("coingeckoPlataform")
export const coingeckoBaseAsset = () => getNetworkData("coingeckoBaseAsset")
export const menuConfig = () => getNetworkData("menuConfig")
const prodNet = () => getNetworkData("prodNet")

export const acoOtcAddress = () => {
  let allOtcs = allAcoOtcAddresses()
  if (allOtcs && allOtcs.length) {
    return allOtcs[allOtcs.length-1]
  }
  return null
}

export const getDefaultChainId = () => {
  let network = getValidNetworkByName(getDefaultNetworkName())
  if (network) {
    return network.CHAIN_ID
  }
  return null
}

export const getDefaultNetworkName = () => {
  let networkName = window && window.localStorage && window.localStorage.getItem(networkNameStorage)
  if (networkName) {
    return networkName
  } else {
    return networks[0]
  }
}

export const getDefaultNetworkIconUrl = () => {
  let network = getValidNetworkByName(getDefaultNetworkName())
  if (network) {
    return network.iconUrl
  }
  return null
}

const setLoggedNetwork = (network) => {
  loggedNetworkData = network
  if (network && window && window.localStorage) {
    let name = getNetworkName()
    if (name) {
      window.localStorage.setItem(networkNameStorage, name)
    }
  }
}

const getNetworkData = (propertyName) => {
  return loggedNetworkData && loggedNetworkData[propertyName]
}

const getValidNetworkById = (chainId) => {
  let availableNetworks = getAvailableNetworksData()
  if (chainId && !isNaN(chainId)) {
    chainId = parseInt(chainId)
    for (let i = 0; i < availableNetworks.length; ++i) {
      if (availableNetworks[i].CHAIN_ID === chainId) {
        return availableNetworks[i]
      }
    }
  }
  return getValidNetworkByName()
}

const getValidNetworkByName = (chainName) => {
  let availableNetworks = getAvailableNetworksData()
  let defaultNetwork = getDefaultNetworkName()
  if (chainName) {
    chainName = chainName.toUpperCase()
    for (let i = 0; i < availableNetworks.length; ++i) {
      if (availableNetworks[i].name === chainName) {
        return availableNetworks[i]
      }
    }
    if (chainName === defaultNetwork) {
      return availableNetworks[0]
    }
  }
  return getValidNetworkByName(defaultNetwork)
}

const getNetworkByName = (chainName) => {
  if (chainName) {
    chainName = chainName.toUpperCase()
    if (chainName === mainnet.name) {
      return mainnet
    } else if (chainName === arbitrum.name) {
      return arbitrum
    } else if (chainName === bsc.name) {
      return bsc
    } else if (chainName === ropsten.name) {
      return ropsten
    } else if (chainName === kovan.name) {
      return kovan
    } else if (chainName === arbitrumTestnet.name) {
      return arbitrumTestnet
    } else if (chainName === bscTestnet.name) {
      return bscTestnet
    }
  }
  return null
}

export const getAvailableNetworksData = () => {
  let result = []
  for (let i = 0; i < networks.length; ++i) {
    let network = getNetworkByName(networks[i])
    if (network) {
      result.push(network)
    }
  }
  return result
}

export const usdAsset = () => {
  let asset = ASSETS_INFO[usdSymbol()]
  if (asset) {
    return asset
  } else {
    let prod = prodNet()
    if (prod) {
      let net = getNetworkByName(prod)
      return ASSETS_INFO[net.usdSymbol]
    }
  }
  return null
}

export const btcAsset = () => {
  let asset = ASSETS_INFO[btcSymbol()]
  if (asset) {
    return asset
  } else {
    let prod = prodNet()
    if (prod) {
      let net = getNetworkByName(prod)
      return ASSETS_INFO[net.btcSymbol]
    }
  }
  return null
}

export const ethAsset = () => {
  let asset = ASSETS_INFO[ethSymbol()]
  if (asset) {
    return asset
  } else {
    let prod = prodNet()
    if (prod) {
      let net = getNetworkByName(prod)
      return ASSETS_INFO[net.ethSymbol]
    }
  }
  return null
}

export const baseAsset = () => {
  let asset = ASSETS_INFO[baseSymbol()]
  if (asset) {
    return asset
  } else {
    let prod = prodNet()
    if (prod) {
      let net = getNetworkByName(prod)
      return ASSETS_INFO[net.baseSymbol]
    }
  }
  return null
}