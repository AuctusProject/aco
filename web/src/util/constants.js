import Web3Utils from 'web3-utils'
import { balanceOf, getERC20AssetInfo } from './contractHelpers/erc20Methods';
import { allAcoOtcAddresses, defaultAcoCreators, ethAddress, optionsToIgnore, usdcAddress, wbtcAddress } from './network';
import { checkEthBalanceOf } from './web3Methods';

export const zero = new Web3Utils.BN(0);
const negative1 = new Web3Utils.BN(-1);

export const maxAllowance = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
export const coingeckoApiUrl = "https://api.coingecko.com/api/v3/"
export const swapQuoteSellSize = "0.001"
export const PERCENTAGE_PRECISION = 100000
export const ethTransactionTolerance = 0.01
export const gwei = 1000000000
export const ONE_SECOND = 1000
export const ONE_MINUTE = ONE_SECOND * 60
export const ONE_YEAR_TOTAL_MINUTES = 365 * 24 * 60
export const DEFAULT_SLIPPAGE = 0.03
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

export const AdvancedOrderStepsType = {
    MarketApprove: 0,
    BuySellMarket: 1,
    LimitApprove: 2,
    BuySellLimit: 3
}

export const StrikePriceOptions = {
    OTM: 2,
    ITM: 3,
    ATM: 4
}

export const STRIKE_PRICE_OPTIONS = [
    {value: StrikePriceOptions.OTM, name:"OTM"}, 
    {value: StrikePriceOptions.ITM, name:"ITM"}, 
    {value: StrikePriceOptions.ATM, name:"ATM"}
]

export const StrikePriceModes = {
    Fixed: 1,
    Percentage: 2,
    Both: 3,
    AnyPrice: 4
}

export const STRIKE_PRICE_MODE = [
    {value: StrikePriceModes.Fixed, name:"FIXED"}, 
    {value: StrikePriceModes.Percentage, name:"PERCENTAGE"}, 
    {value: StrikePriceModes.Both, name:"BOTH"},
    {value: StrikePriceModes.AnyPrice, name:"ANY PRICE"},
]

export function getOptionName(isCall) {
    return isCall ? OPTION_TYPES[1].name : OPTION_TYPES[2].name
}

export const ellipsisCenterOfText = (text) => {
    if (text && text.length > 10) {
      return text.substring(0, 6) + "..." + text.substring(text.length - 4, text.length)
    }
    return text
}

export const formatDate = (expiryTime, shortDate= false, shortMonth = false) => {
    var options = {}
    if (shortDate) {
        options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
    }
    else {
        options = { year: 'numeric', month: (shortMonth ? 'short' : 'long'), day: 'numeric', hour:'numeric', minute:'numeric', hour12:false, timeZone: 'UTC' }
    }
    return new Date(expiryTime * ONE_SECOND).toLocaleString("en-US", options) + (shortDate ? "" : " UTC")
}

export const isEther = (assetAddress) => {
    return assetAddress === ethAddress()
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
    if (x && x.toString) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    else {
        return null
    }
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
        return {days: 0, hours: 0, minutes: 0, seconds: 0}
    }
    let seconds = timeInSeconds;
    const days = Math.floor(seconds / (3600 * 24))
    seconds -= days * 3600 * 24
    const hours = Math.floor(seconds / 3600)
    seconds -= hours * 3600
    const minutes = Math.floor(seconds / 60)
    seconds -= minutes * 60
    seconds = Math.floor(seconds)
    return {
        days,
        hours,
        minutes,
        seconds
    }
}

export const getSecondsToExpiry = (expiryTimeInSeconds) => {
    return expiryTimeInSeconds - (new Date().getTime()/ONE_SECOND)
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
    return options.filter(o => !optionsToIgnore().includes(o.acoToken.toLowerCase()))
}

export const removeOtcOptions = (options) => {
    return options.filter(o => !o.creator || (allAcoOtcAddresses().filter(c => c.toLowerCase() === o.creator.toLowerCase()).length === 0))
}

export const removeNotWhitelistedOptions = (options) => {
    return options.filter(o => o.strikeAsset.toLowerCase() === usdcAddress() && 
        (o.underlying.toLowerCase() === wbtcAddress() || o.underlying.toLowerCase() === ethAddress() || !o.creator ||
            (defaultAcoCreators().filter(c => c === o.creator.toLowerCase()).length > 0)))
}

export const isExpired = (expiryTime) => {
    return ((expiryTime * ONE_SECOND) <= Date.now())
}

export const removeExpiredOptions = (options) => {
    return options.filter(o => !isExpired(o.expiryTime))
}

export const getOtcOptions = (options) => {
    return options.filter(o => o.creator && (allAcoOtcAddresses().filter(c => c.toLowerCase() === o.creator.toLowerCase()).length > 0))
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

export const setSlippageConfig = (slippageConfig) => {
    window.localStorage.setItem('SLIPPAGE_CONFIG', slippageConfig.toString())
}

export const getSlippageConfig = () => {
    var slippageConfig = window.localStorage.getItem('SLIPPAGE_CONFIG')
    if (!slippageConfig) {
        return DEFAULT_SLIPPAGE
    }
    else {
        return parseFloat(slippageConfig)
    }
}

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const formatAcoRewardName = (acoReward) => {
    var strikePrice = Number(fromDecimals(acoReward.strikePrice, 6)).toFixed(2)
    var formattedDate = formatDate(acoReward.expiryTime, true)
    return `AUC CALL $${strikePrice} Expiration: ${formattedDate}`
}

export const parseBigIntToNumber = (bigInt, decimals = 6) => {
    const precision = 100000000.0
    return parseInt(bigInt * BigInt(precision) / BigInt("1".padEnd(decimals + 1, "0"))) / precision
}

export const retry = (task, retries, delay) => {
    return new Promise(function(resolve,reject){
        internalRetry(task, retries, delay, resolve, reject)
    })
}

const internalRetry = (task, retries, delay, resolve, reject) => {
    task().then(res => {
        resolve(res)
    })
    .catch(err => {
        if (retries > 0) {
            return setTimeout(function () {
                internalRetry(task, retries - 1, delay, resolve, reject)
            }, delay)
        }
        else {
            reject(err)
        }
    })
}