import { BigNumber } from '@0x/utils';

const ETH_MARKET_PRICE_API_ENDPOINT = 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDC';

export const getMarketPriceEther = async (): Promise<BigNumber> => {
    const promisePriceEtherResolved = await fetch(ETH_MARKET_PRICE_API_ENDPOINT);
    if (promisePriceEtherResolved.status === 200) {
        const data = await promisePriceEtherResolved.json();
        if (data) {
            const priceTokenUSD = new BigNumber(data.price);
            return priceTokenUSD;
        }
    }

    return Promise.reject('Could not get ETH price');
};
