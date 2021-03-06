
export const getBestBid = (option, orderbook) => {
    var orders = orderbook.bid.orders
    return getBestOrder(option, 1, orders)
}

export const getBestAsk = (option, orderbook) => {
    var orders = orderbook.ask.orders
    return getBestOrder(option, 0, orders)
}

const getSortedOrders = (orders, side) => {
    return orders.sort((o1, o2) => (side === 0) ? o1.price.comparedTo(o2.price) : o2.price.comparedTo(o1.price))
}

const getBestOrder = (option, side, orders) => {
    var sortedOrders = []
    var bestOrder = null
    if (orders && orders.length > 0) {
        sortedOrders = getSortedOrders(orders, side)
        bestOrder = sortedOrders.length > 0 ? sortedOrders[0] : null
        if (bestOrder) {
            bestOrder.totalSize = bestOrder.acoAmount
            for (let index = 1; index < sortedOrders.length; index++) {
                const order = sortedOrders[index];
                if (order.price.eq(bestOrder.price)) {
                    bestOrder.totalSize = bestOrder.totalSize.plus(order.acoAmount)
                }
            }
        }
    }
    return bestOrder
}

export const mergeByPrice = (sortedOrders) => {
    const orders = []
    if (sortedOrders && sortedOrders.length > 0) {
        var currentOrder = sortedOrders[0]
        currentOrder.totalSize = currentOrder.acoAmount
        orders.push(currentOrder)
        for (let index = 1; index < sortedOrders.length; index++) {
            const order = sortedOrders[index];
            if (order.price.eq(currentOrder.price)) {
                currentOrder.totalSize = currentOrder.totalSize.plus(order.acoAmount)
            }
            else {
                currentOrder = sortedOrders[index]
                currentOrder.totalSize = currentOrder.acoAmount
                orders.push(currentOrder)
            }
        }
    }
    return orders
};