export const arbitrum = {
    name: "ARBITRUM",
    iconUrl: "/images/arbitrum_icon.svg",
    CHAIN_ID: 42161,
    customRpc: {"chainId":"0xa4b1","chainName":"Arbitrum","nativeCurrency":{"name":"ETH","symbol":"ETH","decimals":18},"rpcUrls":["https://arb1.arbitrum.io/rpc"],"blockExplorerUrls":["https://arbiscan.io"]},
    apiUrl: null,
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/auctusproject/auctus-options-arbitrum",
    rpcWssUrl: null,
    rpcApiUrl: "https://arb1.arbitrum.io/rpc",
    zrxApiUrl: null,
    zrxWSSUrl: null,
    zrxRequestPerSecond: 3,
    explorerUrl: "https://arbiscan.io/address/",
    explorerTxUrl: "https://arbiscan.io/tx/",
    swapUrl: "https://app.sushi.com/swap?outputCurrency=",
    gasApiUrl: null,
    gasPriceType: null,
    defaultGasPrice: null,
    hasAave: true,
    acoFactoryAddress: "0xe833cb08f7569168a408a24440e550c8897ac4d6",
    acoPoolFactoryAddress: "0x6d18be2167030adc16f64f1c9e0b7294b2011020",
    acoFlashExerciseAddress: "0x7c0608712a2e8dd16866f6898dc5403931b5310f",
    acoWriterAddress: null,
    zrxExchangeAddress: null,
    multicallAddress: null,
    allAcoOtcAddresses: ["0xc91c5dda23704e1f4279d4947b7fa59101aebb86"],
    acoBuyerAddress: "0xd0d8066885e07539cf4d9fecd19d2729a310be4e",
    acoDistributorAddress: null,
    acoRewardAddress: null,
    airdropClaimStart: null,
    acoAssetConverterHelperAddress: "0x58bca4676e37e50c0dfb1f419718ed89a09ad981",
    auctusAddress: null,
    usdAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    wrapperAddress: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    btcAddress: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    ethAddress: "0x0000000000000000000000000000000000000000",
    baseAddress: "0x0000000000000000000000000000000000000000",
    usdSymbol: "USDC",
    btcSymbol: "WBTC",
    ethSymbol: "ETH",
    baseSymbol: "ETH",
    deprecatedPoolImplementation: [],
    acoVaults: null,
    acoVaultsV2: null,
    defaultPoolAdmin: "0xc25a67941ae0897933fc9abd6862dc7c34d49155",
    defaultAcoCreators: ["0xc25a67941ae0897933fc9abd6862dc7c34d49155"],
    optionsToIgnore: [],
    acoRewardsPools: null,
    acoAirdropAmounts: null,
    coingeckoPlataform: "ethereum",
    coingeckoBaseAsset: "ethereum",
    menuConfig: { hasAdvanced: false, hasVaults: false, hasOtc: true, hasFarm: false, hasCreateOption: true, hasPoolHistory: true }
}