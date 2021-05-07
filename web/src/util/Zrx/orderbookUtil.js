import { toDecimals, fromDecimals } from "../constants"
import { TradeOptionsListLayoutMode } from "../../partials/TradeOptionsList"

export const getBestBid = (option, orders, mode) => {
    return getBestOrder(option, 1, orders, mode)
}

export const getBestAsk = (option, orders, mode) => {
    return getBestOrder(option, 0, orders, mode)
}

const getFilteredOrders = (orders, side, mode) => {
    return orders.filter(order => order.side === side && 
        (mode === TradeOptionsListLayoutMode.Home || order.status === 3)).sort((o1, o2) => (side === 0) ? o1.price.comparedTo(o2.price) : o2.price.comparedTo(o1.price))
}

const getBestOrder = (option, side, orders, mode) => {
    var sortedOrders = []
    var bestOrder = null
    if (orders && orders.length > 0) {
        sortedOrders = getFilteredOrders(orders, side, mode)
        bestOrder = sortedOrders.length > 0 ? sortedOrders[0] : null
        if (bestOrder) {
            bestOrder.totalSize = bestOrder.size
            if (bestOrder.filled) {
                bestOrder.totalSize = bestOrder.totalSize.minus(bestOrder.filled)
            }
            for (let index = 1; index < sortedOrders.length; index++) {
                const order = sortedOrders[index];
                if (order.price.eq(bestOrder.price)) {
                    bestOrder.totalSize = bestOrder.totalSize.plus(order.size)
                    if (order.filled) {
                        bestOrder.totalSize = bestOrder.totalSize.minus(order.filled)
                    }
                }
            }
            if (mode === TradeOptionsListLayoutMode.Home) {
                formatPrice(bestOrder, option)
            }
        }
    }
    return bestOrder
}

const formatPrice = (order, option) => {
    order.formatedPrice = order.status === null ? parseFloat(fromDecimals(toDecimals(order.price, option.underlyingInfo.decimals), option.strikeAssetInfo.decimals)) : order.price
}