import { getBestPoolQuote } from "./acoPoolMethods"
import { getSwapQuote, isInsufficientLiquidity } from "./Zrx/zrxApi"

export function getBestQuote(option, amount, isBuy) {
    return new Promise(function(resolve,reject){
        let promises = []
        promises.push(getBestPoolQuote(option, amount))
        promises.push(getZrxQuote(option.acoToken, option.strikeAsset, amount, isBuy))
        Promise.all(promises).then(quotes => {
            let poolQuote = quotes[0]
            let zrxQuote = quotes[1]
            if (poolQuote && ((!zrxQuote || !zrxQuote.quote) || poolQuote.price < zrxQuote.quote.price)) {
                resolve(poolQuote)
            }
            else {
                resolve(zrxQuote)
            }
        })
        .catch(err => reject(err))
    })
}

function getZrxQuote(buyToken, sellToken, amount, isBuy) {
    return new Promise(function(resolve,reject){
        let swapQuotePromise = getSwapQuote(buyToken, sellToken, amount, isBuy)
        swapQuotePromise.then(swapQuote => {
            resolve({quote: swapQuote, errorMessage: null})
        })
        .catch((err) => {
            resolve({quote: null, errorMessage: isInsufficientLiquidity(err) ? "Insufficient liquidity" : "Exchange unavailable"})
        })
    })
}