import Web3Utils from 'web3-utils'
import { balanceOf, getERC20AssetInfo } from './erc20Methods';
import { checkEthBalanceOf } from './web3Methods';

export const zero = new Web3Utils.BN(0);
const negative1 = new Web3Utils.BN(-1);

export const acoFactoryAddress = process.env.REACT_APP_ACO_FACTORY_ADDRESS; 
export const acoPoolFactoryAddress = process.env.REACT_APP_ACO_POOL_FACTORY_ADDRESS; 
export const acoFlashExerciseAddress = process.env.REACT_APP_ACO_FLASH_EXERCISE_ADDRESS; 
export const acoWriteAddress = process.env.REACT_APP_ACO_WRITE_ADDRESS; 
export const erc20Proxy = process.env.REACT_APP_ERC20_PROXY; 
export const multicallAddress = process.env.REACT_APP_MULTICALL_ADDRESS; 
export const allAcoOtcAddresses = process.env.REACT_APP_ACO_OTC_ADDRESS.split(',');
export const acoOtcAddress = allAcoOtcAddresses[allAcoOtcAddresses.length-1];
export const acoBuyerAddress = process.env.REACT_APP_ACO_BUYER_ADDRESS;
export const acoDistributorAddress = process.env.REACT_APP_ACO_DISTRIBUTOR_ADDRESS;
export const acoRewardAddress = process.env.REACT_APP_ACO_REWARD_ADDRESS;
export const auctusAddress = process.env.REACT_APP_AUCTUS_ADDRESS;
export const CHAIN_ID = process.env.REACT_APP_CHAIN_ID; 
export const apiUrl = process.env.REACT_APP_ACO_API_URL;
export const zrxApiUrl = process.env.REACT_APP_ZRX_API_URL;
export const etherscanUrl = process.env.REACT_APP_ETHERSCAN_URL + "address/";
export const etherscanTxUrl = process.env.REACT_APP_ETHERSCAN_URL + "tx/";
export const gasPriceType = process.env.REACT_APP_GAS_PRICE_TYPE;
export const defaultGasPrice = parseInt(process.env.REACT_APP_DEFAULT_GAS_PRICE);
export const deprecatedPoolImplementation = process.env.REACT_APP_DEPRECATED_POOL_DEPRECATED_IMPLEMENTATION.toLowerCase().split(',');
export const acoVaults = JSON.parse(process.env.REACT_APP_ACO_VAULTS);
export const acoVaultsV2 = JSON.parse(process.env.REACT_APP_ACO_VAULTS_V2);
export const defaultPoolAdmin = process.env.REACT_APP_ACO_DEFAULT_POOL_ADMIN.toLowerCase();
export const defaultAcoCreator = process.env.REACT_APP_ACO_DEFAULT_CREATOR.toLowerCase().split(',');
export const gasStationApiUrl = "https://ethgasstation.info/json/ethgasAPI.json"
export const maxAllowance = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
export const uniswapUrl = "https://uniswap.exchange/swap?outputCurrency=";
export const coingeckoApiUrl = "https://api.coingecko.com/api/v3/"
export const wssInfuraAddress = process.env.REACT_APP_INFURA_WSS;
export const swapQuoteBuySize = "1000";
export const PERCENTAGE_PRECISION = 100000;
export const ethAddress = "0x0000000000000000000000000000000000000000"; 
export const usdcAddress = process.env.REACT_APP_USDC_ADDRESS.toLowerCase();
export const wethAddress = process.env.REACT_APP_WETH_ADDRESS.toLowerCase();
export const wbtcAddress = process.env.REACT_APP_WBTC_ADDRESS.toLowerCase();
export const ethTransactionTolerance = 0.01;
export const gwei = 1000000000;
export const ONE_SECOND = 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_YEAR_TOTAL_MINUTES = 365 * 24 * 60
export const DEFAULT_SLIPPAGE = 0.05
export const DEFAULT_POOL_SLIPPAGE = 0.01
export const OTC_ORDER_STATUS_AVAILABLE = "0x00"

export const OPTION_TYPES = {
    1: {
        id: 1,
        name: "CALL"
    },
    2: {
        id: 2,
        name: "PUT"
    }
}

export const OTC_ACTION_OPTIONS = [{
    value: 1,
    name: "Buy"
},
{
    value: 2,
    name: "Sell"
}]

export const OTC_EXPIRATION_OPTIONS = [{
    value: 1,
    name: "Minute"
},
{
    value: 2,
    name: "Hour"
},
{
    value: 3,
    name: "Day"
},
{
    value: 4,
    name: "Week"
},
{
    value: 5,
    name: "Month"
}]

export const PositionsLayoutMode = {
    Basic: 0,
    Advanced: 1
}  

export function getOptionName(isCall) {
    return isCall ? OPTION_TYPES[1].name : OPTION_TYPES[2].name
}

export function getNetworkName(chainId) {
    if (chainId === "4") {
        return "rinkeby"
    }
    else if (chainId === "42") {
        return "kovan"
    }
    return "mainnet"
}

export const ellipsisCenterOfText = (text) => {
    if (text && text.length > 10) {
      return text.substring(0, 6) + "..." + text.substring(text.length - 4, text.length)
    }
    return text
}

export const formatDate = (expiryTime, shortDate= false) => {
    var options = {}
    if (shortDate) {
        options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
    }
    else {
        options = { year: 'numeric', month: 'long', day: 'numeric', hour:'numeric', minute:'numeric', hour12:false, timeZone: 'UTC' }
    }
    return new Date(expiryTime * ONE_SECOND).toLocaleString("en-US", options) + (shortDate ? "" : " UTC")
}

export const isEther = (assetAddress) => {
    return assetAddress === ethAddress
}

export function getBalanceOfAsset(assetAddress, userAddress) {
    return new Promise(function (resolve, reject) {
        let balance
        if (isEther(assetAddress)) {
            balance = checkEthBalanceOf(userAddress)
        }
        else {
            balance = balanceOf(assetAddress, userAddress)
        }
        balance.then(result => {
            if (result) {
                var tokensBN = Web3Utils.toBN(result)
                resolve(tokensBN)
            }
            else {
                resolve(0)
            }
        })
    })    
}

export function fromDecimals(input, decimals, maxSignificantsDigits = 4, minSignificantsDigits = 4) {
    if (!input || isNaN(input)) {
        return null
    }
    if (input.decimalPlaces) {
        input = input.decimalPlaces(0)
    }
    var integerValue = Web3Utils.toBN(input.toFixed ? input.toFixed() : input.toString())
    var negative = integerValue.lt(zero); // eslint-disable-line
    const base = new Web3Utils.BN(10).pow(new Web3Utils.BN(decimals))
    const baseLength = decimals

    if (negative) {
        integerValue = integerValue.mul(negative1);
    }
    
    var fraction = integerValue.mod(base).toString(10);
  
    var fractionLeftZeros = 0
    while (fraction.length < baseLength) {
      fraction = `0${fraction}`;
      fractionLeftZeros++;
    }
  
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];

    var wholeValue = integerValue.div(base)
  
    if (wholeValue.eq(zero)) {
        maxSignificantsDigits = fractionLeftZeros + maxSignificantsDigits
    }

    var whole = wholeValue.toString(10);

    if (fraction.length > maxSignificantsDigits) {
        fraction = fraction.substring(0, maxSignificantsDigits)
    }

    var value = `${whole}${(fraction.length === 0 || fraction == '0') ? '' : `.${fraction}`}`; // eslint-disable-line  
    
    if (decimals < minSignificantsDigits) {
        minSignificantsDigits = decimals
    }

    if (value.length <= minSignificantsDigits) {
        if (value.indexOf('.') <= 0) {
            value = `${value}.0`;
        }
        while (value.length <= minSignificantsDigits) {
            value = `${value}0`;
        }
    }

    if (negative) {
        value = `-${value}`;
    }

    return value;
}

export function toDecimals(input, decimals) {
    var inputStr = input.toString(10)
    const base = new Web3Utils.BN(10).pow(new Web3Utils.BN(decimals))
    const baseLength = decimals

    var negative = (inputStr.substring(0, 1) === '-'); // eslint-disable-line
    if (negative) {
        inputStr = inputStr.substring(1);
    }

    var comps = inputStr.split('.');
    if (comps.length > 2) { throw new Error(`[ethjs-unit] while converting number ${input} to wei,  too many decimal points`); }
  
    var whole = comps[0], fraction = comps[1];
  
    if (!whole) { whole = '0'; }
    if (!fraction) { fraction = '0'; }
    if (fraction.length > baseLength) { 
        fraction = fraction.substring(0, baseLength-1)
     }
  
    while (fraction.length < baseLength) {
      fraction += '0';
    }
  
    whole = new Web3Utils.BN(whole);
    fraction = new Web3Utils.BN(fraction);
    var wei = (whole.mul(base)).add(fraction);

    if (negative) {
        wei = wei.mul(negative1);
    }

    return new Web3Utils.BN(wei.toString(10), 10);
}

export function removeDecimals(strNumber) {
    return strNumber.split(".")[0]
}

export function formatWithPrecision(number, significantDigits = 4) {
    if (number > Math.pow(10, significantDigits-1)) {
        return (number).toFixed(0)
    }
    else {
        return number.toPrecision(significantDigits)
    }
}

export function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

export function getNumberWithSignal(number) {
    if(number > 0){
        return "+" + number;
    }else{
        return number.toString();
    }
}

export function formatPercentage(percentage, decimals = 2) {
    return (percentage * 100).toFixed(decimals) + "%"
}

export function groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
}

export function sortByDesc(array, property) {
    return array.sort((a,b) => {
        return (a[property] === b[property])? 0 : ((a[property] > b[property]) ? -1 : 1);
    })
}


export function sortBy(array, property) {
    return array ? array.sort((a,b) => {
        return (a[property] === b[property])? 0 : ((a[property] < b[property]) ? -1 : 1);
    }) : null
}

export function sortByFn(array, propertyFn) {
    return array.sort((a,b) => {
        return (propertyFn(a) === propertyFn(b))? 0 : ((propertyFn(a) > propertyFn(b)) ? -1 : 1);
    })
}

export const getTimeToExpiry = (expiryTimeInSeconds) => {
    let timeInSeconds = getSecondsToExpiry(expiryTimeInSeconds)
    if (timeInSeconds < 0) {
        return {days: 0, hours: 0, minutes: 0}
    }
    let seconds = timeInSeconds;
    const days = Math.floor(seconds / (3600 * 24))
    seconds -= days * 3600 * 24
    const hours = Math.floor(seconds / 3600)
    seconds -= hours * 3600
    const minutes = Math.floor(seconds / 60)
    return {
        days,
        hours,
        minutes
    }
}

export const getSecondsToExpiry = (expiryTimeInSeconds) => {
    return expiryTimeInSeconds - (new Date().getTime()/ONE_SECOND)
}


export const getMarketDetails = (selectedOption) => {
    return {
        baseToken: {
            "decimals": parseInt(selectedOption.underlyingInfo.decimals),
            "symbol": selectedOption.acoTokenInfo.symbol,
            "name": selectedOption.acoTokenInfo.symbol,
            "icon": null,
            "primaryColor": null,
            "expiryTime": selectedOption.expiryTime,
            "addresses": { [CHAIN_ID]: selectedOption.acoToken },
        },
        quoteToken: {
            "decimals": parseInt(selectedOption.strikeAssetInfo.decimals),
            "symbol": selectedOption.strikeAssetInfo.symbol,
            "name": selectedOption.strikeAssetInfo.symbol,
            "icon": null,
            "primaryColor": null,
            "expiryTime": null,
            "addresses": { [CHAIN_ID]: selectedOption.strikeAsset },
        }
    }
}

export const getPairIdFromRoute = (location) => {
    if (location.pathname) {
        var route = getCurrentRoute(location)
        var paths = location.pathname.split(route)
        if (paths.length >= 2) {
            var params = paths[1].split("/")
            return params[0]
        }
    }
    return null
}

export const getCurrentRoute = (location) => {
    var routes = [
      "/advanced/exercise",
      "/advanced/mint",
      "/advanced/trade",
      "/advanced/pools",
      "/buy",
      "/write",
      "/manage",
      "/pools"
    ]
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (location.pathname.indexOf(route) !== -1) {
        return route  + "/"
      }
    }
    return null;
}


export const addressToData = (address) => {
    return address.substring(2).toLowerCase().padStart(64, '0');
}
  
export const dataToAddress = (data) => {
    return data.substring(23)
}
  
export const numberToData = (num) => {
    return num.toString(16).padStart(64, '0')
}
  
export const booleanToData = (bool) => {
    return "000000000000000000000000000000000000000000000000000000000000000" + (bool ? "1" : "0")
}

export const isDarkMode = () => {
    return window.localStorage.getItem('LAYOUT_MODE') !== "0"
}

export const removeOptionsToIgnore = (options) => {
    const optionsToIgnore = [
        "0xf7902f8db0ee97f9e9b07933ba2724d64f267110",
        "0xde757d935f43781c7079a41a162d8560a800ec13"
    ]
    return options.filter(o => !optionsToIgnore.includes(o.acoToken.toLowerCase()))
}

export const removeOtcOptions = (options) => {
    return options.filter(o => !o.creator || (allAcoOtcAddresses.filter(c => c.toLowerCase() === o.creator.toLowerCase()).length === 0))
}

export const removeNotWhitelistedOptions = (options) => {
    return options.filter(o => o.strikeAsset.toLowerCase() === usdcAddress && 
        (o.underlying.toLowerCase() === wbtcAddress || o.underlying.toLowerCase() === ethAddress || !o.creator ||
            (o.underlying.toLowerCase() !== auctusAddress && defaultAcoCreator.filter(c => c === o.creator.toLowerCase()).length > 0)))
}

export const isExpired = (expiryTime) => {
    return ((expiryTime * ONE_SECOND) <= Date.now())
}

export const removeExpiredOptions = (options) => {
    return options.filter(o => !isExpired(o.expiryTime))
}

export const getOtcOptions = (options) => {
    return options.filter(o => o.creator && (allAcoOtcAddresses.filter(c => c.toLowerCase() === o.creator.toLowerCase()).length > 0))
}

export const baseEthPair = () => {
    return {
        id: "ETH_USDC",
        underlying: ethAddress,
        underlyingInfo: {symbol: "ETH", decimals: 18},
        underlyingSymbol: "ETH",
        strikeAsset: usdcAddress,
        strikeAssetInfo: {symbol: "USDC", decimals: 6},
        strikeAssetSymbol: "USDC"
    }
}

export const baseWbtcPair = () => {
    return {
        id: "WBTC_USDC",
        underlying: wbtcAddress,
        underlyingInfo: {symbol: "WBTC", decimals: 8},
        underlyingSymbol: "WBTC",
        strikeAsset: usdcAddress,
        strikeAssetInfo: {symbol: "USDC", decimals: 6},
        strikeAssetSymbol: "USDC"
    }
}

export const getByAddress = (address) => {
    return new Promise((resolve, reject) => {
        var filter = address ? address.toLowerCase() : ""
        if (Web3Utils.isAddress(filter)) {
            getERC20AssetInfo(filter)
                .then(assetInfo => {
                    assetInfo.foundByAddress = true
                    resolve(assetInfo)
                })
                .catch(() => resolve(null))
        }
        else {
            resolve(null)
        }
    })
}

export const saveToLocalOrders = (order) => {
    var localOrders = getLocalOrders()
    localOrders.push(order)
    window.localStorage.setItem('OTC_LOCAL_ORDERS', JSON.stringify(localOrders))
}

export const getLocalOrders = () => {
    var localOrders = window.localStorage.getItem('OTC_LOCAL_ORDERS')
    if (!localOrders) {
        return []
    }
    else {
        return JSON.parse(localOrders)
    }
}

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}