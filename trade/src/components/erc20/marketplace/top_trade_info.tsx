import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { getCurrencyPair } from '../../../store/selectors';
import { themeDimensions } from '../../../themes/commons';
import { getKnownTokens } from '../../../util/known_tokens';
import { tokenSymbolToDisplayString } from '../../../util/tokens';
import { getDaysHoursAndMinutesToExpiry } from '../../../util/time_utils';
import {
    CurrencyPair,
    StoreState,
} from '../../../util/types';
import { BigNumber } from '@0x/utils';

interface StateProps {
    currencyPair: CurrencyPair;
}

type Props = StateProps;

const TokenInfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${themeDimensions.mainPadding};
    padding-bottom: 0;
`;

const TokenText = styled.span`
    font-size: 14px;
    font-weight: 300;
    font-stretch: normal;
    font-style: normal;
    letter-spacing: 0.35px;
    text-align: left;
    color: #ffffff;
`;
const TokenLabel = (props: { tokenSymbol: string }) => (
    <TokenText>{tokenSymbolToDisplayString(props.tokenSymbol)}</TokenText>
);

const TimeToExpiryContainer = styled.div`
    margin-left: 20px;
    padding-left: 20px;
    border-left: solid 1px #a6a6a6;
`;

const TimeToExpiryLabel = styled.div`
    font-size: 12px;
    font-weight: 300;
    font-stretch: normal;
    font-style: normal;
    letter-spacing: 0.3px;
    text-align: left;
    color: #a6a6a6;
`;

const TimeToExpiryValue = (props: { expiryDaysAndHours: {days:number, hours:number, minutes:number} }) => {
    var label = props.expiryDaysAndHours.days > 0 ? 
        `${props.expiryDaysAndHours.days}d ${props.expiryDaysAndHours.hours}h` :
        `${props.expiryDaysAndHours.hours}h ${props.expiryDaysAndHours.minutes}m`;
    return <TimeToExpiryLabel>{label}</TimeToExpiryLabel>
}

const ExpiryTimeLabel = (props: {expiryTime?: number}) => (
    !props.expiryTime ? null :
    <TimeToExpiryContainer>
        <TimeToExpiryLabel>Time to expiry</TimeToExpiryLabel>
        <TimeToExpiryValue expiryDaysAndHours={getDaysHoursAndMinutesToExpiry(new BigNumber(props.expiryTime))}/>
    </TimeToExpiryContainer>
);

class TopTradeInfo extends React.Component<Props> {
    public render = () => {
        const { currencyPair } = this.props;
        const expiryTime = getKnownTokens().getTokenBySymbol(currencyPair.base).expiryTime;
        return (
            <TokenInfoContainer>
                <TokenLabel tokenSymbol={currencyPair.base}/>
                <ExpiryTimeLabel expiryTime={expiryTime}/>
            </TokenInfoContainer>
        );
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        currencyPair: getCurrencyPair(state),
    };
};

const TopTradeInfoContainer = connect(
    mapStateToProps
)(TopTradeInfo);

export { TopTradeInfo, TopTradeInfoContainer };
