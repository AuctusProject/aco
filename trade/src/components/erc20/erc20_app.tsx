import React from 'react';
import { ThemeProvider } from 'styled-components';

import { GeneralLayout } from '../../components/general_layout';
import { getTheme } from '../../themes/theme_meta_data_utils';

import { Marketplace } from './pages/marketplace';
import { changeMarket } from '../../store/actions';
import { store } from '../../store';
import { initKnownTokens } from '../../util/known_tokens';
import { KNOWN_TOKENS_META_DATA } from '../../common/tokens_meta_data';

const getMarket = (props:any): any => {
    if (props.baseToken && props.quoteToken) {
        return { base: props.baseToken.symbol, quote: props.quoteToken.symbol }
    }
}

export const Erc20App = (props: any) => {
    const themeColor = getTheme();
    if (props && props.baseToken && props.quoteToken) {
        KNOWN_TOKENS_META_DATA.push(props.baseToken)
        KNOWN_TOKENS_META_DATA.push(props.quoteToken)
        initKnownTokens()
        store.dispatch(changeMarket(getMarket(props)) as any)
    }
    return (
        <ThemeProvider theme={themeColor}>
            <GeneralLayout {...props}>
                <Marketplace/>
            </GeneralLayout>
        </ThemeProvider>
    );
};
