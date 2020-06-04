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
import { Token } from './util/types';
import { getAllOrdersAsUIOrdersWithoutOrdersInfo } from './services/orders';

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

window.TradeApp = {
    setNetwork: (networkId:number) => {
        setNetwork(networkId)
    },
    getAllOrdersAsUIOrdersWithoutOrdersInfo: (baseToken: Token, quoteToken: Token) => {
        return getAllOrdersAsUIOrdersWithoutOrdersInfo(baseToken, quoteToken, null)
    },
    mount: (props: any) => {
        ReactModal.setAppElement('#trade-app');
        const el = document.getElementById('trade-app');
        ReactDOM.render(Web3WrappedApp(props), el);
    },
    unmount: () => {
        const el = document.getElementById('trade-app');
        ReactDOM.unmountComponentAtNode(el as Element);
    }
}
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
