import PropTypes from 'prop-types'
import { OrderSet } from "./OrderSet"
import { assetPairKeyToAssets, getKeyForAssetPair, OrderStore } from "./OrderStore"
import { attemptAsync, delayAsync } from "./zrxUtils.js"
import { w3cwebsocket } from "websocket"
import WebSocketOrdersChannel from "./WebSocketOrdersChannel"
import BigNumber from "bignumber.js"
import { getOrders } from "./zrxApi"
import { zrxWSSUrl } from "../constants"
import { Component } from 'react'

const childContextTypes = {
    orders: PropTypes.array
}

class WebsocketOrderProvider extends Component {
    _wsSubscriptions = new Set()
    _orderStore = new OrderStore()
    _perPage = 100
    _isDestroyed = false
    _isConnecting = false
    _ordersChannel
    _websocketEndpoint = zrxWSSUrl

    componentDidMount() {
        if (this.props.makerToken && this.props.takerToken) {
            this.createSubscriptionForAssetPairAsync(this.props.makerToken, this.props.takerToken)
        }        
    }

    componentDidUpdate = (prevProps) => {
        if (this.props.makerToken !== prevProps.makerToken || this.props.takerToken !== prevProps.takerToken) {
            this.componentDidMount()
        }
    }

    async createSubscriptionForAssetPairAsync(makerToken, takerToken) {
        this._isDestroyed = false;
        const assetPairKey = getKeyForAssetPair(makerToken, takerToken);
        if (this._wsSubscriptions.has(assetPairKey)) {
            return;
        }
        return this._fetchAndCreateSubscriptionAsync(makerToken, takerToken);
    }

    async destroyAsync() {
        this._isDestroyed = true;
        this._wsSubscriptions.clear();
        if (this._ordersChannel) {
            this._ordersChannel.close();
            this._ordersChannel = undefined;
        }
    }

    async _createWebsocketSubscriptionAsync(makerToken, takerToken) {
        while (this._isConnecting && !this._ordersChannel) {
            await delayAsync(100);
        }
        if (!this._ordersChannel) {
            this._isConnecting = true;
            try {
                this._ordersChannel = await this._createOrdersChannelAsync();
            } finally {
                this._isConnecting = false;
            }
        }
        const assetPairKey = getKeyForAssetPair(makerToken, takerToken);
        const subscriptionOpts = {
            makerToken,
            takerToken,
        };
        this._wsSubscriptions.add(assetPairKey);
        this._ordersChannel.subscribe(subscriptionOpts);
        this._ordersChannel.subscribe({
            ...subscriptionOpts,
            makerToken: takerToken,
            takerToken: makerToken,
        });
    }

    async _fetchAndCreateSubscriptionAsync(makerToken, takerToken) {
        await this._createWebsocketSubscriptionAsync(makerToken, takerToken)
        const orders = await this._fetchLatestOrdersAsync(makerToken, takerToken);
        const assetPairKey = getKeyForAssetPair(makerToken, takerToken);
        const currentOrders = this._orderStore.getOrderSetForAssetPair(assetPairKey);
        const newOrders = new OrderSet();
        await newOrders.addManyAsync(orders);
        const diff = await currentOrders.diffAsync(newOrders);
        await this._updateStoreAsync({
            added: diff.added,
            removed: diff.removed,
            assetPairKey,
        });
    }

    async _syncOrdersInOrderStoreAsync() {
        for (const assetPairKey of this._orderStore.keys()) {
            const [assetDataA, assetDataB] = assetPairKeyToAssets(assetPairKey);
            await this._fetchAndCreateSubscriptionAsync(assetDataA, assetDataB);
        }
    }

    async _createOrdersChannelAsync() {
        const ordersChannelHandler = {
            onUpdate: async (_channel, _opts, apiOrders) => this._handleOrderUpdatesAsync(apiOrders),
            onError: (_channel, _err) => {},
            onClose: async () => {
                if (this._isDestroyed) {
                    return;
                }
                await attemptAsync(async () => {
                    this._ordersChannel = undefined;
                    await this._syncOrdersInOrderStoreAsync();
                    return true;
                });
            },
        };
        try {
            return await this._createWebSocketOrdersChannelAsync(
                ordersChannelHandler,
            );
        } catch (e) {
            throw new Error(`Creating websocket connection to ${this._websocketEndpoint}`);
        }
    }

    async _createWebSocketOrdersChannelAsync(ordersChannelHandler) {
        return new Promise((resolve, reject) => {
            var client = new w3cwebsocket(this._websocketEndpoint);
            client.onopen = function () {
                var ordersChannel = new WebSocketOrdersChannel(client, ordersChannelHandler);
                resolve(ordersChannel);
            };
            client.onerror = function (err) {
                reject(err);
            };
        })
    }

    async _handleOrderUpdatesAsync(orders) {
        const addedRemovedByKey = {};
        for (const order of orders) {
            const assetPairKey = getKeyForAssetPair(order.order.makerToken, order.order.takerToken);
            if (!addedRemovedByKey[assetPairKey]) {
                addedRemovedByKey[assetPairKey] = { added: [], removed: [], assetPairKey };
            }
            const addedRemoved = addedRemovedByKey[assetPairKey];
            const remainingFillableTakerAssetAmount = order.metaData.remainingFillableTakerAssetAmount;
            if (remainingFillableTakerAssetAmount && new BigNumber(remainingFillableTakerAssetAmount).eq(0)) {
                addedRemoved.removed.push(order);
            } else {
                addedRemoved.added.push(order);
            }
        }

        for (const assetPairKey of Object.keys(addedRemovedByKey)) {
            await this._updateStoreAsync(addedRemovedByKey[assetPairKey]);
        }
    }

    async _updateStoreAsync(addedRemoved) {
        const orderSet = this._orderStore.getOrderSetForAssetPair(addedRemoved.assetPairKey);
        await orderSet.addManyAsync(addedRemoved.added);
        await orderSet.deleteManyAsync(addedRemoved.removed);
    }

    async _fetchLatestOrdersAsync(makerToken, takerToken) {
        const [latestSellOrders, latestBuyOrders] = await Promise.all([
            this._getAllPaginatedOrdersAsync(makerToken, takerToken),
            this._getAllPaginatedOrdersAsync(takerToken, makerToken),
        ]);
        return [...latestSellOrders, ...latestBuyOrders];
    }

    async _getAllPaginatedOrdersAsync(makerToken, takerToken) {
        let recordsToReturn = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const { total, records, perPage } = await attemptAsync(async () =>
                await getOrders(
                    makerToken,
                    takerToken,
                    page
                ),
            );

            recordsToReturn = [...recordsToReturn, ...records];

            page += 1;
            const lastPage = Math.ceil(total / perPage);
            hasMorePages = page <= lastPage;
        }
        return recordsToReturn;
    }
    
    getCurrentPairOrders() {
        const assetPairKey = getKeyForAssetPair(this.props.makerToken, this.props.takerToken)
        return this._orderStore.values(assetPairKey)
    }

    getChildContext() {
        return {
            orders: this.getCurrentPairOrders()
        }
    }

    render() {
        return this.props.children
    }
}
WebsocketOrderProvider.childContextTypes = childContextTypes
export default WebsocketOrderProvider