import { OrderSet } from "./OrderSet";
import { getOrderHashAsync } from "./zrxUtils";

export const getKeyForAssetPair = (makerToken, takerToken) => {
    return [makerToken, takerToken].sort().join('-');
}

export const assetPairKeyToAssets = (assetPairKey) => {
    return assetPairKey.split('-');
}

export class OrderStore {
    _orders = new Map();      

    getOrderSetForAssets(makerToken, takerToken) {
        const assetPairKey = getKeyForAssetPair(makerToken, takerToken);
        return this.getOrderSetForAssetPair(assetPairKey);
    }

    getOrderSetForAssetPair(assetPairKey) {
        const orderSet = this._orders.get(assetPairKey);
        if (!orderSet) {
            const newOrderSet = new OrderSet();
            this._orders.set(assetPairKey, newOrderSet);
            return newOrderSet;
        }
        return orderSet;
    }

    async updateAsync(addedRemoved) {
        const { added, removed, assetPairKey } = addedRemoved;
        const orders = this.getOrderSetForAssetPair(assetPairKey);
        await orders.addManyAsync(added);
        await orders.deleteManyAsync(removed);
    }
    
    has(assetPairKey) {
        return this._orders.has(assetPairKey);
    }
    
    values(assetPairKey) {
        return Array.from(this.getOrderSetForAssetPair(assetPairKey).values());
    }
    
    keys() {
        return this._orders.keys();
    }
}
