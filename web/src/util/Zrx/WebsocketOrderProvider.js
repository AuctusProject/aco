import PropTypes from 'prop-types'
import { attemptAsync, delayAsync } from "./zrxUtils.js"
import { w3cwebsocket } from "websocket"
import WebSocketOrdersChannel from "./WebSocketOrdersChannel"
import { Component } from 'react'
import { getOrderbook, getUpdatedOrderbook } from '../acoSwapUtil'
import { getOption } from '../dataController.js'
import { zrxWSSUrl } from '../network.js'

const childContextTypes = {
    orderbook: PropTypes.object
}

class WebsocketOrderProvider extends Component {
    _wsSubscriptions = new Set()
    _perPage = 100
    _isDestroyed = false
    _isConnecting = false
    _ordersChannel
    _websocketEndpoint = zrxWSSUrl()

    constructor(props, context) {
        super(props, context)
        this.state = { 
            orderbooks: {}
        }
    }    

    async destroyAsync() {
        this._isDestroyed = true;
        this._wsSubscriptions.clear();
        if (this._ordersChannel) {
            this._ordersChannel.close();
            this._ordersChannel = undefined;
        }
    }

    componentDidMount() {
        if (this.props.option) {            
            this.subscribeAndGetOrders()
        }
    }

    componentDidUpdate = (prevProps) => {
        if (this.props.option !== prevProps.option) {
            this.componentDidMount()
        }
        if (this.props.slippage !== prevProps.slippage && this.props.option) {
            this.setOrderBook(this.props.option)
        }
    }

    subscribeAndGetOrders = async () => {
        await this.createSubscriptionForAssetPairAsync(this.props.option)
    }

    async createSubscriptionForAssetPairAsync(option) {
        this._isDestroyed = false;
        const wsKey = option.acoToken;
        if (this._wsSubscriptions.has(wsKey)) {
            return;
        }
        return this._fetchAndCreateSubscriptionAsync(option);
    }

    async _fetchAndCreateSubscriptionAsync(option) {
        await this._createWebsocketSubscriptionAsync(option)
        this.setOrderBook(option)
    }

    async setOrderBook(option) {
        const orderBook = await getOrderbook(option, this.props.slippage)
        this.updateOrderbooks(option.acoToken, orderBook)
    }

    async _createWebsocketSubscriptionAsync(option) {
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
        
        var makerToken = this.props.option.acoToken
        var takerToken = this.props.option.strikeAsset
        const subscriptionOpts = {
            makerToken,
            takerToken,
            acoToken: option.acoToken
        };
        this._wsSubscriptions.add(option.acoToken);
        this._ordersChannel.subscribe(subscriptionOpts);
        this._ordersChannel.subscribe({
            ...subscriptionOpts,
            makerToken: takerToken,
            takerToken: makerToken,
        });
    }

    async _handleOrderUpdatesAsync(acoToken, apiOrders) {
        var option = await getOption(acoToken)
        var orderBook = await getUpdatedOrderbook(option, apiOrders, this.props.slippage)
        this.updateOrderbooks(acoToken, orderBook)
    }    

    updateOrderbooks = (acoToken, orderbook) => {
        var orderbooks = this.state.orderbooks
        orderbooks[acoToken] = orderbook
        this.setState({orderbooks: orderbooks})
    }

    async _createOrdersChannelAsync() {
        const ordersChannelHandler = {
            onUpdate: async (_channel, _opts, apiOrders) => this._handleOrderUpdatesAsync(_opts.acoToken, apiOrders),
            onError: (_channel, _err) => {},
            onClose: async () => {
                if (this._isDestroyed) {
                    return;
                }
                await attemptAsync(async () => {
                    this._ordersChannel = undefined;
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
    
    getCurrentOptionOrderbook() {
        var orderbook = this.state.orderbooks[this.props.option.acoToken]
        return orderbook
    }

    getChildContext() {
        return {
            orderbook: this.getCurrentOptionOrderbook()
        }
    }

    render() {
        return this.props.children
    }
}
WebsocketOrderProvider.childContextTypes = childContextTypes
export default WebsocketOrderProvider