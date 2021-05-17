export async function getOrderHashAsync(order) {
    return order.metaData.orderHash
}

export async function delayAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function attemptAsync(fn, opts = { interval: 1000, maxRetries: 10 }) {
    let result;
    let attempt = 0;
    let error;
    let isSuccess = false;
    while (!result && attempt < opts.maxRetries) {
        attempt++;
        try {
            result = await fn();
            isSuccess = true;
            error = undefined;
        } catch (err) {
            error = err;
            await delayAsync(opts.interval);
        }
    }
    if (!isSuccess) {
        throw error;
    }
    return result;
}