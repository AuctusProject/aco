export const mainnet = {
    name: "ETHEREUM",
    iconUrl: "/images/eth_icon.png",
    CHAIN_ID: 1,
    customRpc: null,
    apiUrl: "https://cu3pxr9ydi.execute-api.us-east-1.amazonaws.com/prod/",
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/auctusproject/auctus-options",
    rpcWssUrl: "wss://mainnet.infura.io/ws/v3/8d03fea006b64542ab9c26af741965b2",
    rpcApiUrl: "https://mainnet.infura.io/v3/8d03fea006b64542ab9c26af741965b2",
    zrxApiUrl: "https://api.0x.org/",
    zrxWSSUrl: "wss://api.0x.org/sra/v4",
    zrxRequestPerSecond: 3,
    explorerUrl: "https://etherscan.io/address/",
    explorerTxUrl: "https://etherscan.io/tx/",
    swapUrl: "https://uniswap.exchange/swap?outputCurrency=",
    gasApiUrl: "https://ethgasstation.info/json/ethgasAPI.json",
    gasPriceType: "fastest",
    defaultGasPrice: 21000000000,
    hasAave: true,
    acoFactoryAddress: "0x176b98ab38d1ae8ff3f30bf07f9b93e26f559c17",
    acoPoolFactoryAddress: "0xe28520ddb1b419ac37ecdbb2c0f97c8cf079ccc3",
    acoFlashExerciseAddress: "0x9e8a4b05ba9e5720a4ea8b04b3cb2dfcdf500103",
    acoWriterAddress: "0x977ce0d7f56197a0440a93fa9563e11c509babba",
    zrxExchangeAddress: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    multicallAddress: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
    allAcoOtcAddresses: ["0x4e91baee70d392b74f40565bba451638aa777ff0","0x7ebe3599ba37fd20dda884010d38e6dd75982d81"],
    acoBuyerAddress: "0xa52c8ee8f328a478d8efcba9c4177bd9ba6f9710",
    acoDistributorAddress: "0xa39d1e9cbecdb17901bfa87a5b306d67f15a2391",
    acoRewardAddress: "0x6bb3b1061ce2123ab870c6a6b06b63756dc780da",
    airdropClaimStart: 1617386400,
    acoAssetConverterHelperAddress: "0x8e17731d424887b3f1f488857b68501b3b1c279b",
    auctusAddress: "0xc12d099be31567add4e4e4d0d45691c3f58f5663",
    usdAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    wrapperAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    btcAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    ethAddress: "0x0000000000000000000000000000000000000000",
    baseAddress: "0x0000000000000000000000000000000000000000",
    usdSymbol: "USDC",
    btcSymbol: "WBTC",
    ethSymbol: "ETH",
    baseSymbol: "ETH",
    deprecatedPoolImplementation: ["0x68153d392966d38b7ae4415bd5778d02a579a437","0x1275c3070bba4c88031a726ab2cbd2f31605226a","0xb4f28d9aa4ae8070ba1dea1f2fd888a64b45aa17"],
    acoVaults: {"0x5d28b41bbad874b5efeee0b4158bc50d0af5f637":{"name":"CRV3POOL","img":"logo_crv3pool.svg"}},
    acoVaultsV2: {"0xad45001fc1f10e348a41e871901f936992d80f79":{"name":"CRV3POOL","img":"logo_crv3pool.svg"}},
    defaultPoolAdmin: "0x56803ed55c7182461f587fbbec509d45a0eb1260",
    defaultAcoCreators: ["0xc25a67941ae0897933fc9abd6862dc7c34d49155"],
    optionsToIgnore: ["0xf7902f8db0ee97f9e9b07933ba2724d64f267110","0xde757d935f43781c7079a41a162d8560a800ec13"],
    acoRewardsPools: [{"pid":0,"name":"AUC-ETH UNISWAP LP","image":["/images/pools/eth.png","/images/pools/auc.png"],"address":"0xc04744ab87a4c37afd91680ef280b96ee21a026e","decimals":18,"totalLocked":0,"currentAco":{"aco":"0xb51a3b33a6ae736a1ae1b120d50083ba003e4110","expiryTime":1632988800,"underlying":"0xc12d099be31567add4e4e4d0d45691c3f58f5663","strikeAsset":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","strikePrice":"1000000","isCall":true}},{"pid":1,"name":"WRITE ETH CALL POOL","image":["/images/pools/eth.png"],"address":"0xa2038d9e2c108ba384276f238f164cb7c3fde505","decimals":18,"totalLocked":0,"currentAco":{"aco":"0xb51a3b33a6ae736a1ae1b120d50083ba003e4110","expiryTime":1632988800,"underlying":"0xc12d099be31567add4e4e4d0d45691c3f58f5663","strikeAsset":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","strikePrice":"1000000","isCall":true}},{"pid":2,"name":"WRITE ETH PUT POOL","image":["/images/pools/eth.png"],"address":"0x573b96a018f02aaf4cc6d5c839246a78e36975d2","decimals":6,"totalLocked":0,"currentAco":{"aco":"0xb51a3b33a6ae736a1ae1b120d50083ba003e4110","expiryTime":1632988800,"underlying":"0xc12d099be31567add4e4e4d0d45691c3f58f5663","strikeAsset":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","strikePrice":"1000000","isCall":true}},{"pid":3,"name":"WRITE WBTC CALL POOL","image":["/images/pools/wbtc.png"],"address":"0x535b1d55b27e6e2463619cb453a8356e75bb556d","decimals":8,"totalLocked":0,"currentAco":{"aco":"0xb51a3b33a6ae736a1ae1b120d50083ba003e4110","expiryTime":1632988800,"underlying":"0xc12d099be31567add4e4e4d0d45691c3f58f5663","strikeAsset":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","strikePrice":"1000000","isCall":true}},{"pid":4,"name":"WRITE WBTC PUT POOL","image":["/images/pools/wbtc.png"],"address":"0x47eadf0f79fbaeed1051eb0520617b9ca114898e","decimals":6,"totalLocked":0,"currentAco":{"aco":"0xb51a3b33a6ae736a1ae1b120d50083ba003e4110","expiryTime":1632988800,"underlying":"0xc12d099be31567add4e4e4d0d45691c3f58f5663","strikeAsset":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","strikePrice":"1000000","isCall":true}}],
    acoAirdropAmounts: [{"aco":"0x53125350574a2fc46cb49cabc9c4677489c04184","amount":"500000000000000000000000"},{"aco":"0xcc4a861df6aece576b109fb8187eed97b034b621","amount":"1500000000000000000000000"},{"aco":"0xb51a3b33a6ae736a1ae1b120d50083ba003e4110","amount":"5000000000000000000000000"},{"aco":"0x58ea371c3d7bca0ed0c3a4e4dc9bb92702310489","amount":"2000000000000000000000000"},{"aco":"0xb50947a52c15e7d02cbf12d6faba7995f93af3e0","amount":"1000000000000000000000000"}],
    coingeckoPlataform: "ethereum",
    coingeckoBaseAsset: "ethereum"
}