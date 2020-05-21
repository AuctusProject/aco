import React, { HTMLAttributes } from 'react';
import styled from 'styled-components';

import { themeBreakPoints, themeDimensions } from '../../themes/commons';

interface Props extends HTMLAttributes<HTMLDivElement>, ColumnProps {
    children: React.ReactNode;
}

interface ColumnProps {
    width?: string;
}

const ColumnNarrowWrapper = styled.div<ColumnProps>`
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    max-width: 100%;
    width: 100%;

    @media (min-width: ${themeBreakPoints.xl}) {
        min-width: ${props => props.width ? props.width : themeDimensions.sidebarWidth};
        width: ${props => props.width ? props.width : themeDimensions.sidebarWidth};
    }

    &:first-child {
        @media (min-width: ${themeBreakPoints.xl}) {
            margin-right: 10px;
        }
    }

    &:last-child {
        @media (min-width: ${themeBreakPoints.xl}) {
            margin-left: 10px;
        }
    }
`;

export const ColumnNarrow: React.FC<Props> = props => {
    const { children, ...restProps } = props;

    return <ColumnNarrowWrapper {...restProps}>{children}</ColumnNarrowWrapper>;
};
