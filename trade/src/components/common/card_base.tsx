import React, { HTMLAttributes } from 'react';
import styled from 'styled-components';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const CardWrapper = styled.div``;

export const CardBase: React.FC<Props> = props => {
    const { children, ...restProps } = props;

    return <CardWrapper {...restProps}>{children}</CardWrapper>;
};
