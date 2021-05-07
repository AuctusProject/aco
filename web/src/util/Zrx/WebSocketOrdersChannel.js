import { v4 as uuidv4 } from 'uuid';

class WebSocketOrdersChannel {
    constructor(client, handler) {
        var _this = this;
        this._subscriptionOptsMap = {};
        this._client = client;
        this._handler = handler;
        
        this._client.onerror = function (err) {
            _this._handler.onError(_this, err);
        };
        this._client.onclose = function () {
            _this._handler.onClose(_this);
        };
        this._client.onmessage = function (message) {
            _this._handleWebSocketMessage(message);
        };
    }
    
    subscribe = function (subscriptionOpts) {
        var requestId = uuidv4()
        this._subscriptionOptsMap[requestId] = subscriptionOpts;
        var subscribeMessage = {
            type: 'subscribe',
            channel: 'orders',
            requestId: requestId,
            payload: subscriptionOpts,
        }
        this._client.send(JSON.stringify(subscribeMessage))
    }

    close = function () {
        this._client.close();
    }

    _handleWebSocketMessage = function (message) {
        if (message.data === undefined) {
            this._handler.onError(this, new Error("Message does not contain data. Url: " + this._client.url));
            return;
        }
        try {
            var data = message.data;
            var subscriptionOpts = this._subscriptionOptsMap[data.requestId];
            if (subscriptionOpts === undefined) {
                this._handler.onError(this, new Error("Message has unknown requestId. Url: " + this._client.url + " Message: " + data));
                return;
            }
            switch (data.type) {
                case "update": {
                    this._handler.onUpdate(this, subscriptionOpts, data.payload);
                    break;
                }
                default: {
                    this._handler.onError(this, new Error("Message has unknown type parameter. Url: " + this._client.url + " Message: " + data), subscriptionOpts);
                }
            }
        }
        catch (error) {
            this._handler.onError(this, error);
        }
    }
}
export default WebSocketOrdersChannel;