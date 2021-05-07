import { getOrderHashAsync } from "./zrxUtils";

export class OrderSet {
    _map;
    constructor() {
        this._map = new Map();
        (this)[Symbol.iterator] = this.values;
    }

    size() {
        return this._map.size;
    }

    async addAsync(item) {
        const orderHash = await getOrderHashAsync(item);
        item.metaData.orderHash = orderHash;
        this._map.set(orderHash, item);
    }

    async addManyAsync(items) {
        for (const item of items) {
            await this.addAsync(item);
        }
    }

    async hasAsync(order) {
        return this._map.has(await getOrderHashAsync(order));
    }

    async diffAsync(other) {
        const added = [];
        const removed = [];
        for (const otherItem of other.values()) {
            const doesContainItem = this._map.has(await getOrderHashAsync(otherItem));
            if (!doesContainItem) {
                added.push(otherItem);
            }
        }
        for (const item of this.values()) {
            const doesContainItem = other._map.has(await getOrderHashAsync(item));
            if (!doesContainItem) {
                removed.push(item);
            }
        }
        return { added, removed };
    }

    values() {
        return this._map.values();
    }

    async deleteAsync(item) {
        return this._map.delete(await getOrderHashAsync(item));
    }

    async deleteManyAsync(items) {
        for (const item of items) {
            await this.deleteAsync(item);
        }
    }
}