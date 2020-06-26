import Web3Utils from 'web3-utils'

export const zero = new Web3Utils.BN(0);
const negative1 = new Web3Utils.BN(-1);

export const acoFactoryAddress = process.env.REACT_APP_ACO_FACTORY_ADDRESS; 
export const acoFlashExerciseAddress = process.env.REACT_APP_ACO_FLASH_EXERCISE_ADDRESS; 
export const acoWriteAddress = process.env.REACT_APP_ACO_WRITE_ADDRESS; 
export const erc20Proxy = process.env.REACT_APP_ERC20_PROXY; 
export const CHAIN_ID = process.env.REACT_APP_CHAIN_ID; 
export const apiUrl = process.env.REACT_APP_ACO_API_URL;
export const zrxApiUrl = process.env.REACT_APP_ZRX_API_URL;
export const etherscanUrl = process.env.REACT_APP_ETHERSCAN_URL;
export const maxAllowance = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
export const uniswapUrl = "https://uniswap.exchange/swap?outputCurrency=";
export const symbolsMappedToQuoteAsset = JSON.parse(process.env.REACT_APP_SYMBOLS_MAPPED_TO_QUOTE_ASSET)
export const symbolsMappedToBaseAsset = JSON.parse(process.env.REACT_APP_SYMBOLS_MAPPED_TO_BASE_ASSET)
export const acoImplementationVersionMap = JSON.parse(process.env.REACT_APP_ACO_IMPLEMENTATION_VERSION)
export const swapQuoteBuySize = "1000";
export const acoFeePrecision = 100000;
export const ethAddress = "0x0000000000000000000000000000000000000000"; 
export const ethTransactionTolerance = 0.01;
export const ONE_SECOND = 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_YEAR_TOTAL_MINUTES = 365 * 24 * 60

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

export const ellipsisCenterOfUsername = (username) => {
    if (username && username.length > 10) {
      return username.substring(0, 6) + "..." + username.substring(username.length - 4, username.length)
    }
    return username
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

export function fromDecimals(input, decimals, maxSignificantsDigits = 4, minSignificantsDigits = 4) {
    if (input && input.decimalPlaces) {
        input = input.decimalPlaces(0)
    }
    var integerValue = Web3Utils.toBN(input.toString())
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
    if (fraction.length > baseLength) { throw new Error(`[ethjs-unit] while converting number ${input} to wei, too many decimal places`); }
  
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

export function getBinanceSymbolForPair(pair) {
    var underlyingSymbol = pair.underlyingSymbol.toLowerCase()
    if (symbolsMappedToBaseAsset[underlyingSymbol.toUpperCase()]){
        underlyingSymbol = symbolsMappedToBaseAsset[underlyingSymbol.toUpperCase()]
    }
    if (symbolsMappedToQuoteAsset[pair.strikeAssetSymbol.toUpperCase()]){
        return (underlyingSymbol + symbolsMappedToQuoteAsset[pair.strikeAssetSymbol.toUpperCase()]).toLowerCase()
    }
    return (underlyingSymbol + pair.strikeAssetSymbol).toLowerCase()
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

export function sortBy(array, property) {
    return array.sort((a,b) => {
        return (a[property] === b[property])? 0 : ((a[property] > b[property]) ? -1 : 1);
    })
}

export function sortByFn(array, propertyFn) {
    return array.sort((a,b) => {
        return (propertyFn(a) === propertyFn(b))? 0 : ((propertyFn(a) > propertyFn(b)) ? -1 : 1);
    })
}

export const getTimeToExpiry = (expiryTimeInSeconds) => {
    let timeInSeconds = getSecondsToExpiry(expiryTimeInSeconds)
    let seconds = timeInSeconds;
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    return {
        days,
        hours,
        minutes
    };
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