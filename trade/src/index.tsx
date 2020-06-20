import { ConnectedRouter } from 'connected-react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactModal from 'react-modal';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';
import 'sanitize.css';

import { LOGGER_ID, setNetwork } from './common/constants';
import { AppContainer } from './components/app';
import { Erc20App } from './components/erc20/erc20_app';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { history, store } from './store';
import { initWalletBeginCommon } from './store/blockchain/actions';
import { Token, OrderSide } from './util/types';
import { getAllOrdersAsUIOrdersWithoutOrdersInfo, getAllOrdersAsUIOrders } from './services/orders';
import { buildMarketOrders, BuildMarketOrderParams } from './util/orders';
import { BigNumber } from '@0x/utils';
import { changeMarket } from './store/actions';
import { addTokensAndInit } from './util/known_tokens';

if (['development', 'production'].includes(process.env.NODE_ENV) && !window.localStorage.debug) {
    // Log only the app constant id to the console
    window.localStorage.debug = `${LOGGER_ID}*`;
}
const Web3WrappedApp = (props:any) => (
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <AppContainer>
                <Switch>
                    <Route render={routeProps => <Erc20App {...routeProps} {...props}/>}/>
                </Switch>
            </AppContainer>
        </ConnectedRouter>
    </Provider>
);

declare global {
    interface Window { TradeApp: any; }
}

const getMarket = (props:any): any => {
    if (props.baseToken && props.quoteToken) {
        return { base: props.baseToken.symbol, quote: props.quoteToken.symbol }
    }
}

window.TradeApp = {
    setNetwork: (networkId:number) => {
        setNetwork(networkId)
    },
    getAllOrdersAsUIOrdersWithoutOrdersInfo: (baseToken: Token, quoteToken: Token) => {
        return getAllOrdersAsUIOrdersWithoutOrdersInfo(baseToken, quoteToken, null)
    },
    getAllOrdersAsUIOrders: async (baseToken: Token, quoteToken: Token) => {
        await store.dispatch(initWalletBeginCommon() as any)
        return getAllOrdersAsUIOrders(baseToken, quoteToken, null)
    },
    buildMarketOrders: (params: BuildMarketOrderParams, side: OrderSide, price?: BigNumber) => {
        return buildMarketOrders(params, side, price)
    },
    changeMarket: (props: any) => {
        if (props && props.baseToken && props.quoteToken) {
            addTokensAndInit([props.baseToken, props.quoteToken])
            store.dispatch(changeMarket(getMarket(props)) as any)
        }
    },
    mount: (props: any) => {
        ReactModal.setAppElement('#trade-app');
        window.TradeApp.changeMarket(props)
        const el = document.getElementById('trade-app');
        ReactDOM.render(Web3WrappedApp(props), el);
    },
    unmount: () => {
        const el = document.getElementById('trade-app');
        if (el) {
            ReactDOM.unmountComponentAtNode(el as Element);
        }
    }
}
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
