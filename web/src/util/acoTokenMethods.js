import { getWeb3, sendTransaction, sendTransactionWithNonce } from './web3Methods'
import { isEther, fromDecimals, toDecimals, getBalanceOfAsset } from './constants';
import { acoTokenABI } from './acoTokenABI';
import Web3Utils from 'web3-utils';

function getAcoTokenContract(address) {
    var acoTokenContract = null
    const _web3 = getWeb3()
    if (_web3) {
        acoTokenContract = new _web3.eth.Contract(acoTokenABI, address)
    }
    return acoTokenContract
}

export function getCollateralAddress(option) {
    if (option.isCall) {
        return option.underlying;
    } else {
        return option.strikeAsset;
    }
}

export function getExerciseAddress(option) {
    if (!option.isCall) {
        return option.underlying;
    } else {
        return option.strikeAsset;
    }
}

export function mint(userAddress, optionInfo, value, nonce) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    if (isEther(getCollateralAddress(optionInfo))) {
        var data = acoTokenContract.methods.mintPayable().encodeABI()
        return sendTransactionWithNonce(null, null, userAddress, optionInfo.acoToken, value, data, null, nonce)
    }
    else {
        var mintData = acoTokenContract.methods.mint(value).encodeABI()
        return sendTransactionWithNonce(null, null, userAddress, optionInfo.acoToken, null, mintData, null, nonce)
    }
}

export function burn(userAddress, optionInfo, value) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    var data = acoTokenContract.methods.burn(value).encodeABI()
    return sendTransaction(null, null, userAddress, optionInfo.acoToken, null, data)
}

export function redeem(userAddress, optionInfo) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    var data = acoTokenContract.methods.redeem().encodeABI()
    return sendTransaction(null, null, userAddress, optionInfo.acoToken, null, data)
}

export function exercise(userAddress, optionInfo, tokenAmount, value, nonce) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    var data = acoTokenContract.methods.exercise(tokenAmount, new Date().getTime()).encodeABI()
    return sendTransactionWithNonce(null, null, userAddress, optionInfo.acoToken, (isEther(getExerciseAddress(optionInfo)) ? value : null), data, null, nonce)
}

export function getBalanceOfCollateralAsset(optionInfo, userAddress) {
    var assetAddress = getCollateralAddress(optionInfo)
    return getBalanceOfAsset(assetAddress, userAddress)
}

export function getBalanceOfExerciseAsset(optionInfo, userAddress) {
    var assetAddress = getExerciseAddress(optionInfo)
    return getBalanceOfAsset(assetAddress, userAddress)
}

export function acoFee(optionInfo) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.acoFee().call()
}

export function balanceOf(optionInfo, userAddress) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.balanceOf(userAddress).call()
}

export function currentCollateral(optionInfo, userAddress) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.currentCollateral(userAddress).call()
}

export function unassignableCollateral(optionInfo, userAddress) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.unassignableCollateral(userAddress).call()
}

export function assignableCollateral(optionInfo, userAddress) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.assignableCollateral(userAddress).call()
}

export function currentCollateralizedTokens(optionInfo, userAddress) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.currentCollateralizedTokens(userAddress).call()
}

export function unassignableTokens(optionInfo, userAddress) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.unassignableTokens(userAddress).call()
}

export function assignableTokens(optionInfo, userAddress) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.assignableTokens(userAddress).call()
}

export function getCollateralInfo(option) {
    return option.isCall ? option.underlyingInfo : option.strikeAssetInfo
}

export function getExerciseInfo(option) {
    return option.isCall ? option.strikeAssetInfo : option.underlyingInfo
}

export function getExerciseValue(option, amount, maxExercisedAccounts) {
    var exerciseInfo = getExerciseInfo(option)
    return fromDecimals(toDecimals(option.isCall ? getTokenStrikePriceRelation(option, amount) : amount, exerciseInfo.decimals).add(new Web3Utils.BN(maxExercisedAccounts)), exerciseInfo.decimals, exerciseInfo.decimals)
}

export function getMaxExercisedAccounts(optionInfo) {
    const acoTokenContract = getAcoTokenContract(optionInfo.acoToken)
    return acoTokenContract.methods.maxExercisedAccounts().call()
}

export function getIsCall(acoTokenAddress) {
    const acoTokenContract = getAcoTokenContract(acoTokenAddress)
    return acoTokenContract.methods.isCall().call()
}

export function getTokenAmount(optionInfo, collateralAmount) {
    if (optionInfo.isCall) {
        return collateralAmount;
    } else if (collateralAmount > 0) {
        var value = toDecimals(toDecimals(collateralAmount, getCollateralInfo(optionInfo).decimals), optionInfo.underlyingInfo.decimals).divRound(new Web3Utils.BN(optionInfo.strikePrice))
        return fromDecimals(value, optionInfo.underlyingInfo.decimals)
    } else {
        return 0;
    }
}

export function getCollateralAmount(optionInfo, tokenAmount) {
    if (optionInfo.isCall) {
        return tokenAmount;
    } else if (tokenAmount > 0) {
        var decimalsTokenAmount = toDecimals(tokenAmount, parseInt(optionInfo.underlyingInfo.decimals))
        var decimalsCollateralAmount = getTokenStrikePriceRelation(optionInfo, decimalsTokenAmount)
        return fromDecimals(decimalsCollateralAmount, parseInt(optionInfo.strikeAssetInfo.decimals))
    } else {
        return 0;
    }
}

export function getCollateralAmountInDecimals(optionInfo, tokenAmount) {
    if (optionInfo.isCall) {
        return tokenAmount;
    } else if (tokenAmount > 0) {
        return getTokenStrikePriceRelation(optionInfo, tokenAmount)
    } else {
        return 0;
    }
}

export function getTokenStrikePriceRelation(optionInfo, tokenAmount) {
    if (!tokenAmount || parseFloat(tokenAmount) === 0) {
        return ""
    }
    return fromDecimals(fromDecimals(new Web3Utils.BN(optionInfo.strikePrice).mul(new Web3Utils.BN(toDecimals(tokenAmount, optionInfo.underlyingInfo.decimals))), parseInt(optionInfo.underlyingInfo.decimals), 0, 0), parseInt(optionInfo.underlyingInfo.decimals), 18, 18)
}

export function getOpenPositionAmount(position) {
    return fromDecimals(new Web3Utils.BN(position.balance).sub(new Web3Utils.BN(position.currentCollateralizedTokens)), 0)
}

export function getFormattedOpenPositionAmount(position) {
    var optionInfo = position.option
    return fromDecimals(position.openPosition, optionInfo.underlyingInfo.decimals)
}

export function getOptionFormattedPrice(option) {
    return fromDecimals(option.strikePrice, option.strikeAssetInfo.decimals, 4, 1) + " " + option.strikeAssetInfo.symbol
}

export function getOptionCollateralFormatedValue(value, option) {
    var collateral = getCollateralInfo(option)
    return fromDecimals(value, collateral.decimals) + " " + collateral.symbol
}

export function getOptionTokenAmountFormatedValue(value, option) {
    return fromDecimals(value, option.underlyingInfo.decimals)
}