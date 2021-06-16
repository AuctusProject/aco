import { aggregate } from "./contractHelpers/multicallMethods";
import { getWeb3 } from "./web3Methods";

const poolInfo = {
    compound: {
        swap: '0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56',
        swap_token: '0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2',
        name: 'compound',
        gauge: '0x7ca5b0a2910B33e9759DC7dDB0413949071D7575',
    },
    usdt: {
        swap: '0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C',
        swap_token: '0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23',
        name: 'usdt',
        gauge: '0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53',
    },
    y: {
        swap: '0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51',
        swap_token: '0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8',
        name: 'y',
        gauge: '0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1',
    },
    busd: {
        swap: '0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27',
        swap_token: '0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B',
        name: 'busd',
        gauge: '0x69Fb7c45726cfE2baDeE8317005d3F94bE838840',
    },
    susdv2: {
        swap: '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD',
        swap_token: '0xC25a3A3b969415c80451098fa907EC722572917F',
        name: 'susdv2',
        gauge: '0xA90996896660DEcC6E997655E065b23788857849',
    },
    pax: {
        swap: '0x06364f10B501e868329afBc005b3492902d6C763',
        swap_token: '0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8',
        name: 'pax',
        gauge: '0x64E3C23bfc40722d3B649844055F1D51c1ac041d',
    },
    ren: {
        swap: '0x93054188d876f558f4a66B2EF1d97d16eDf0895B',
        swap_token: '0x49849C98ae39Fff122806C06791Fa73784FB3675',
        name: 'ren',
        gauge: '0xB1F2cdeC61db658F091671F5f199635aEF202CAC',
    },
    sbtc: {
        swap: '0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714',
        swap_token: '0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3',
        name: 'sbtc',
        gauge: '0x705350c4BcD35c9441419DdD5d2f097d7a55410F',
    },
    hbtc: {
        swap: '0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F',
        swap_token: '0xb19059ebb43466C323583928285a49f558E572Fd',
        name: 'hbtc',
        gauge: '0x4c18E409Dc8619bFb6a1cB56D114C3f592E0aE79',
    },
    '3pool': {
        swap: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
        swap_token: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490',
        name: '3pool',
        gauge: '0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A',
    },
    gusd: {
        swap: '0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956',
        swap_token: '0xD2967f45c4f384DEEa880F807Be904762a3DeA07',
        name: 'gusd',
        gauge: '0xC5cfaDA84E902aD92DD40194f0883ad49639b023',
    },
    husd: {
        swap: '0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604',
        swap_token: '0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858',
        name: 'husd',
        gauge: '0x2db0E83599a91b508Ac268a6197b8B14F5e72840',
    },
    usdk: {
        swap: '0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb',
        swap_token: '0x97E2768e8E73511cA874545DC5Ff8067eB19B787',
        name: 'usdk',
        gauge: '0xC2b1DF84112619D190193E48148000e3990Bf627',
    },
    usdn: {
        swap: '0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1',
        swap_token: '0x4f3E8F405CF5aFC05D68142F3783bDfE13811522',
        name: 'usdn',
        gauge: '0xF98450B5602fa59CC66e1379DFfB6FDDc724CfC4',
    },
    musd: {
        swap: '0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6',
        swap_token: '0x1AEf73d49Dedc4b1778d0706583995958Dc862e6',
        name: 'musd',
        gauge: '0x5f626c30EC1215f4EdCc9982265E8b1F411D1352',
    },
    tbtc: {
        swap: '0xC25099792E9349C7DD09759744ea681C7de2cb66',
        swap_token: '0x64eda51d3Ad40D56b9dFc5554E06F94e1Dd786Fd',
        name: 'tbtc',
        gauge: '0x6828bcF74279eE32f2723eC536c22c51Eed383C6',
    },
}

export function getCRVAPY() {
    return new Promise(function (resolve, reject) {
        let web3 = getWeb3()
        let gaugeController_address = '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB'
        let gauge_relative_weight = '0x6207d866000000000000000000000000'

        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,curve-dao-token&vs_currencies=usd').then(prices => {
            prices.json().then(prices => {
                let btcPrice = prices.bitcoin.usd
                let CRVprice = prices['curve-dao-token'].usd

                let poolInfoArr = Object.values(poolInfo)
                
                let weightCalls = poolInfoArr.map(poolInfoItem => [gaugeController_address, gauge_relative_weight + poolInfoItem.gauge.slice(2)])

                aggregate(weightCalls).then(aggCallsWeights => {
                    let decodedWeights = aggCallsWeights[1].map((hex, i) => [weightCalls[i][0], web3.eth.abi.decodeParameter('uint256', hex) / 1e18])

                    let ratesCalls = poolInfoArr.map(poolInfoItem => [
                        [poolInfoItem.gauge, "0x180692d0"],
                        [poolInfoItem.gauge, "0x17e28089"],
                        [poolInfoItem.gauge, "0x18160ddd"],
                    ])        
                    aggregate(ratesCalls.flat()).then(aggRates => {
                        let decodedRate = aggRates[1].map(hex => web3.eth.abi.decodeParameter('uint256', hex))
                        let gaugeRates = decodedRate.filter((_, i) => i % 3 === 0).map(v => v / 1e18)
                        let workingSupplies = decodedRate.filter((_, i) => i % 3 === 1).map(v => v / 1e18)
                    
                        let virtualPriceCalls = poolInfoArr.map(v => [v.swap, "0xbb7b8b80"])
                        aggregate(virtualPriceCalls).then(aggVirtualPrices => {
                            let decodedVirtualPrices = aggVirtualPrices[1].map((hex, i) => [virtualPriceCalls[i][0], web3.eth.abi.decodeParameter('uint256', hex) / 1e18])
                            let CRVAPYs = {}
                            decodedWeights.map((w, i) => {
                                let pool = poolInfoArr.find(v => v.gauge.toLowerCase() === '0x' + weightCalls[i][1].slice(34).toLowerCase()).name
                                let swap_address = poolInfo[pool].swap
                                let virtual_price = decodedVirtualPrices.find(v => v[0].toLowerCase() === swap_address.toLowerCase())[1]
                                let _working_supply = workingSupplies[i]
                                if(['ren', 'sbtc', 'hbtc', 'tbtc'].includes(pool)) {
                                    _working_supply *= btcPrice
                                }
                                let rate = (gaugeRates[i] * w[1] * 31536000 / _working_supply * 0.4) / virtual_price
                                let apy = rate * CRVprice * 100
                                if(isNaN(apy))
                                    apy = 0
                                poolInfoArr.find(v => v.name === pool).gauge_relative_weight = w[1]
                                CRVAPYs[pool] = apy
                                return apy
                            })
                            resolve(CRVAPYs);
                        })
                    })
                })
            })
        })    
    })
}