import React from 'react';

import { CheckMetamaskStateModalContainer } from '../../common/check_metamask_state_modal_container';
import { ColumnNarrow } from '../../common/column_narrow';
import { ColumnWide } from '../../common/column_wide';
import { Content } from '../common/content_wrapper';
import { BuySellContainer } from '../marketplace/buy_sell';
import { OrderBookTableContainer } from '../marketplace/order_book';
import { OrderHistoryContainer } from '../marketplace/order_history';
import { TopTradeInfoContainer } from '../marketplace/top_trade_info';
import { themeDimensions } from '../../../themes/commons';

class Marketplace extends React.PureComponent {
    public render = () => {
        return (
            <div>
                <TopTradeInfoContainer />
                <Content>
                    <ColumnNarrow width={themeDimensions.buySellWidth}>
                        <BuySellContainer />
                    </ColumnNarrow>
                    <ColumnNarrow width={themeDimensions.orderBookWidth}>
                        <OrderBookTableContainer />
                    </ColumnNarrow>
                    <ColumnWide>
                        <OrderHistoryContainer />
                    </ColumnWide>
                    <CheckMetamaskStateModalContainer />
                </Content>
            </div>
        );
    };
}

export { Marketplace };
