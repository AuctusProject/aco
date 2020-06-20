import React from 'react';
import { ThemeProvider } from 'styled-components';

import { GeneralLayout } from '../../components/general_layout';
import { getTheme } from '../../themes/theme_meta_data_utils';

import { Marketplace } from './pages/marketplace';

export const Erc20App = (props: any) => {
    const themeColor = getTheme();
    return (
        <ThemeProvider theme={themeColor}>
            <GeneralLayout {...props}>
                <Marketplace/>
            </GeneralLayout>
        </ThemeProvider>
    );
};
