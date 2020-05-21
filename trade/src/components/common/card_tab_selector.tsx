import React, { HTMLAttributes } from 'react';
import styled from 'styled-components';

import { TabItem } from '../../util/types';

interface Props extends HTMLAttributes<HTMLDivElement> {
    tabs: TabItem[];
}

interface ItemProps {
    active?: boolean;
}

const CardTabSelectorWrapper = styled.div`
    align-items: center;
    color: ${props => props.theme.componentsTheme.lightGray};
    display: flex;
    font-size: 14px;
    font-weight: 500;
    justify-content: space-between;
    line-height: 1.2;
`;

const CardTabSelectorItem = styled.span<ItemProps>`
    color: ${props =>
        props.active ? props.theme.componentsTheme.textColorCommon : props.theme.componentsTheme.lightGray};
    cursor: ${props => (props.active ? 'default' : 'pointer')};
    user-select: none;
    width: 50%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: -2px;
    border: 1px solid;
    border-top-color: ${props => props.active ? '#4c4c4c' : 'transparent'};
    border-bottom-color: ${props => props.active ? '#1f1f1f' : 'transparent'};
    border-left-color: ${props => props.active ? '#4c4c4c' : 'transparent'};
    border-right-color: ${props => props.active ? '#4c4c4c' : 'transparent'};
    background: ${props => props.active ? '#1f1f1f' : 'transparent'};
`;

export const CardTabSelector: React.FC<Props> = props => {
    const { tabs, ...restProps } = props;

    return (
        <CardTabSelectorWrapper {...restProps}>
            {tabs.map((item, index) => {
                return (
                    <React.Fragment key={index}>
                        <CardTabSelectorItem onClick={item.onClick} active={item.active}>
                            {item.text}
                        </CardTabSelectorItem>
                    </React.Fragment>
                );
            })}
        </CardTabSelectorWrapper>
    );
};
