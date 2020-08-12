import { BigNumber } from '@0x/utils';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { ZERO, ONE } from '../../../common/constants';
import { WalletIcon } from '../../common/icons/wallet_icon';
import { initWallet, startBuySellLimitSteps, startBuySellMarketSteps } from '../../../store/actions';
import { fetchTakerAndMakerFee } from '../../../store/relayer/actions';
import { getCurrencyPair, getOrderPriceSelected, getWeb3State, getBaseToken, getQuoteTokenBalance, getBaseTokenBalance } from '../../../store/selectors';
import { themeDimensions } from '../../../themes/commons';
import { getKnownTokens } from '../../../util/known_tokens';
import { tokenSymbolToDisplayString, tokenAmountInUnits } from '../../../util/tokens';
import {
    ButtonIcons,
    ButtonVariant,
    CurrencyPair,
    OrderFeeData,
    OrderSide,
    OrderType,
    StoreState,
    Web3State,
    Token,
    TokenBalance,
} from '../../../util/types';
import { BigNumberInput } from '../../common/big_number_input';
import { Button } from '../../common/button';
import { CardBase } from '../../common/card_base';
import { CardTabSelector } from '../../common/card_tab_selector';
import { ErrorCard, ErrorIcons, FontSize } from '../../common/error_card';

import { OrderDetailsContainer } from './order_details';
import { getExpirationHoursOffsetFromConfig, todayInSeconds } from '../../../util/time_utils';

interface StateProps {
    web3State: Web3State;
    currencyPair: CurrencyPair;
    orderPriceSelected: BigNumber | null;
    baseToken: Token | null;
    baseTokenBalance: TokenBalance | null;
    quoteTokenBalance: TokenBalance | null;
}

interface DispatchProps {
    onSubmitLimitOrder: (
        amount: BigNumber,
        price: BigNumber,
        expirationTimeSeconds: BigNumber,
        side: OrderSide,
        orderFeeData: OrderFeeData,
    ) => Promise<any>;
    onSubmitMarketOrder: (amount: BigNumber, side: OrderSide, orderFeeData: OrderFeeData) => Promise<any>;
    onConnectWallet: () => any;
    onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, expirationTimeSeconds: BigNumber, side: OrderSide) => Promise<OrderFeeData>;
}

type Props = StateProps & DispatchProps;

interface State {
    makerAmount: BigNumber | null;
    orderType: OrderType;
    price: BigNumber | null;
    expiration: BigNumber | null,
    tab: OrderSide;
    error: {
        btnMsg: string | null;
        cardMsg: string | null;
    };
}

const BuySellWrapper = styled(CardBase)`
    margin-bottom: ${themeDimensions.verticalSeparationSm};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px ${themeDimensions.horizontalPadding};
    border: solid 1px #4c4c4c;
    background-color: #1f1f1f;
`;

const TabsContainer = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 0 30px 20px;
`;

const TabButton = styled.div<{ isSelected: boolean; side: OrderSide }>`
    align-items: center;
    color: ${props =>
        props.isSelected
            ? props.side === OrderSide.Buy
                ? props.theme.componentsTheme.green
                : props.theme.componentsTheme.red
            : props.theme.componentsTheme.textLight};
    cursor: ${props => (props.isSelected ? 'default' : 'pointer')};
    display: flex;
    font-weight: 600;
    height: 30px;
    justify-content: center;
    width: 50%;
    font-size: 10px;
    font-weight: 500;
    font-stretch: normal;
    font-style: normal;
    line-height: 7;
    letter-spacing: 0.5px;
    text-align: center;
    color: ${props => (props.isSelected ? '#ffffff' : '#666666')};

    &:first-child {
        border-top-left-radius: ${themeDimensions.borderRadius};
        border-bottom-left-radius: ${themeDimensions.borderRadius};
        background-color: ${props => props.isSelected ? '#0ec812' : '#2e2e2e'};
    }

    &:last-child {
        border-top-right-radius: ${themeDimensions.borderRadius};
        border-bottom-right-radius: ${themeDimensions.borderRadius};
        background-color: ${props => props.isSelected ? '#ed2e2e' : '#2e2e2e'};
    }
`;

const LabelContainer = styled.div`
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    flex-shrink: 0;
    margin-right: 16px;
`;

const LabelFieldContainer = styled.div`
    display: flex;    
    align-items: center;    
    justify-content: space-between;
    margin-bottom: 12px;
`;

const Label = styled.label<{ color?: string }>`
    font-size: 12px;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    line-height: 1.17;
    letter-spacing: 0.6px;
    text-align: left;
    color: #e6e6e6;
`;

const InnerTabs = styled(CardTabSelector)`
    font-size: 14px;
    height: 45px;
    margin-bottom: -2px;
`;

const FieldContainer = styled.div`
    height: ${themeDimensions.fieldHeight};
    position: relative;
    width: 150px;
    max-width: 150px;
`;

const BigInputNumberStyled = styled<any>(BigNumberInput)`
    background-color: ${props => props.theme.componentsTheme.textInputBackgroundColor};
    border: 1px solid ${props => props.theme.componentsTheme.textInputBorderColor};
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-feature-settings: 'tnum' 1;
    height: 100%;
    padding-left: 8px;
    padding-right: 40px;
    position: absolute;
    width: 100%;
    z-index: 1;
    font-size: 12px;
    font-weight: 300;
    font-stretch: normal;
    font-style: normal;
    letter-spacing: 0.3px;
`;

const TokenContainer = styled.div`
    display: flex;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 12;
`;

const TokenText = styled.span`
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-size: 12px;
    font-weight: normal;
    line-height: 12px;
    text-align: right;
`;

const Separator = styled.div`
    border-top: 1px solid #737373;
    padding-top: 12px;
`;

const BalanceContainer = styled.div`
    display: flex;
    letter-spacing: 0.6px;
    text-align: left;
    color: #e6e6e6;
    font-size: 12px;
    margin-bottom: 12px;    
    align-items: center;

    svg {
        height: 14px;
        color: #e6e6e6;
        margin-right: 6px;
    }

    span {
        margin-left: 6px;
        color: white;
        a {
            color: white;
        }
    }
`;

const BigInputNumberTokenLabel = (props: { tokenSymbol: string }) => (
    <TokenContainer>
        <TokenText>{tokenSymbolToDisplayString(props.tokenSymbol)}</TokenText>
    </TokenContainer>
);

const TIMEOUT_BTN_ERROR = 2000;
const TIMEOUT_CARD_ERROR = 4000;

class BuySell extends React.Component<Props, State> {
    public state: State = {
        makerAmount: null,
        price: null,
        expiration: getExpirationHoursOffsetFromConfig(),
        orderType: OrderType.Limit,
        tab: OrderSide.Buy,
        error: {
            btnMsg: null,
            cardMsg: null,
        },
    };

    public componentDidUpdate = async (prevProps: Readonly<Props>) => {
        const newProps = this.props;
        if (newProps.orderPriceSelected !== prevProps.orderPriceSelected && this.state.orderType === OrderType.Limit) {
            this.setState({
                price: newProps.orderPriceSelected,
            });
        }
    };

    public render = () => {
        const { currencyPair, web3State, baseToken, quoteTokenBalance, baseTokenBalance } = this.props;
        const { makerAmount, price, expiration, tab, orderType, error } = this.state;

        const buySellInnerTabs = [
            {
                active: orderType === OrderType.Limit,
                onClick: this._switchToLimit,
                text: 'Limit',
            },
            {
                active: orderType === OrderType.Market,
                onClick: this._switchToMarket,
                text: 'Market',
            }            
        ];

        const isMakerAmountEmpty = makerAmount === null || makerAmount.isZero();
        const isPriceEmpty = price === null || price.isZero();
        const isExpirationEmpty = expiration === null || expiration.isZero();

        const orderTypeLimitIsEmpty = orderType === OrderType.Limit && (isMakerAmountEmpty || isPriceEmpty || isExpirationEmpty);
        const orderTypeMarketIsEmpty = orderType === OrderType.Market && isMakerAmountEmpty;

        const btnNonErrorText = `Place ${orderType} Order`;
        const btnText = error && error.btnMsg ? 'Error' : btnNonErrorText;

        const decimals = getKnownTokens().getTokenBySymbol(currencyPair.base).decimals;

        const expiryTime = !!baseToken && !!baseToken.expiryTime ? new BigNumber(baseToken.expiryTime) : ZERO;
        const today = new BigNumber(todayInSeconds());
        let maxExpiration = expiryTime > today ? expiryTime.plus(today.negated()).dividedBy(3600).decimalPlaces(0, BigNumber.ROUND_HALF_EVEN) : new BigNumber(720);
        if (maxExpiration < ONE) {
            maxExpiration = ONE;
        }

        let balance = ""
        let mintLink = null
        if (tab === OrderSide.Buy && quoteTokenBalance) {
            balance += tokenAmountInUnits(quoteTokenBalance.balance, quoteTokenBalance.token.decimals, quoteTokenBalance.token.displayDecimals)
            balance += " " + tokenSymbolToDisplayString(quoteTokenBalance.token.symbol)
        }
        else if (baseTokenBalance){
            balance += tokenAmountInUnits(baseTokenBalance.balance, baseTokenBalance.token.decimals, baseTokenBalance.token.displayDecimals)
            balance += " ACO";
            if (quoteTokenBalance) {
                var symbolStart = baseTokenBalance.token.symbol.split("-")[0];
                symbolStart = symbolStart.length >= 4 ? symbolStart.substring(4) : "";
                let pair = symbolStart + "_" + quoteTokenBalance.token.symbol + "/";
                mintLink = <span>(<a href={"/advanced/mint/"+pair + baseTokenBalance.token.address}>Mint</a>)</span>
            }
        }
        else {
            balance = "-"
        }

        return (
            <>
                <BuySellWrapper>
                    <TabsContainer>
                        <TabButton
                            isSelected={tab === OrderSide.Buy}
                            onClick={this.changeTab(OrderSide.Buy)}
                            side={OrderSide.Buy}
                        >
                            Buy
                        </TabButton>
                        <TabButton
                            isSelected={tab === OrderSide.Sell}
                            onClick={this.changeTab(OrderSide.Sell)}
                            side={OrderSide.Sell}
                        >
                            Sell
                        </TabButton>
                    </TabsContainer>
                    <InnerTabs tabs={buySellInnerTabs} />
                    <Content>
                        <BalanceContainer><WalletIcon/>{balance}{mintLink}</BalanceContainer>
                        <LabelFieldContainer>
                            <LabelContainer>
                                <Label>Amount</Label>    
                            </LabelContainer>
                            <FieldContainer>
                                <BigInputNumberStyled
                                    decimals={decimals}
                                    min={ZERO}
                                    onChange={this.updateMakerAmount}
                                    value={makerAmount}
                                    placeholder={'0.00'}
                                />
                            </FieldContainer>
                        </LabelFieldContainer>
                        {orderType === OrderType.Limit && (
                            <>
                                <LabelFieldContainer>
                                    <LabelContainer>
                                        <Label>Price</Label>
                                    </LabelContainer>
                                    <FieldContainer>
                                        <BigInputNumberStyled
                                            decimals={0}
                                            min={ZERO}
                                            onChange={this.updatePrice}
                                            value={price}
                                            placeholder={'0.00'}
                                        />
                                        <BigInputNumberTokenLabel tokenSymbol={currencyPair.quote} />
                                    </FieldContainer>
                                </LabelFieldContainer>
                                <Separator/>
                                <LabelFieldContainer>
                                    <LabelContainer>
                                        <Label>Order Expiration</Label>
                                    </LabelContainer>
                                    <FieldContainer>
                                        <BigInputNumberStyled
                                            decimals={0}
                                            valueFixedDecimals={0}
                                            step={0}
                                            min={ZERO}
                                            max={maxExpiration}
                                            onChange={this.updateExpiration}
                                            value={expiration}
                                            placeholder={'24'}
                                        />
                                        <BigInputNumberTokenLabel tokenSymbol={"H"} />
                                    </FieldContainer>
                                </LabelFieldContainer>
                            </>
                        )}
                        <Separator/>
                        <OrderDetailsContainer
                            orderType={orderType}
                            orderSide={tab}
                            tokenAmount={makerAmount || ZERO}
                            tokenPrice={price || ZERO}
                            currencyPair={currencyPair}
                        />
                        <Button
                            disabled={web3State !== Web3State.Done || orderTypeLimitIsEmpty || orderTypeMarketIsEmpty}
                            icon={error && error.btnMsg ? ButtonIcons.Warning : undefined}
                            onClick={this.submit}
                            variant={
                                error && error.btnMsg
                                    ? ButtonVariant.Error
                                    : tab === OrderSide.Buy
                                    ? ButtonVariant.Buy
                                    : ButtonVariant.Sell
                            }
                        >
                            {btnText}
                        </Button>
                    </Content>
                </BuySellWrapper>
                {error && error.cardMsg ? (
                    <ErrorCard fontSize={FontSize.Large} text={error.cardMsg} icon={ErrorIcons.Sad} />
                ) : null}
            </>
        );
    };

    public changeTab = (tab: OrderSide) => () => this.setState({ tab });

    public updateMakerAmount = (newValue: BigNumber) => {
        this.setState({
            makerAmount: newValue,
        });
    };

    public updatePrice = (price: BigNumber) => {
        this.setState({ price });
    };

    public updateExpiration = (expiration: BigNumber) => {
        this.setState({ expiration });
    };

    public submit = async () => {
        const orderSide = this.state.tab;
        const makerAmount = this.state.makerAmount || ZERO;
        const price = this.state.price || ZERO;
        const expirationTimeSeconds = (this.state.expiration || getExpirationHoursOffsetFromConfig()).multipliedBy(3600).plus(todayInSeconds()).decimalPlaces(0, BigNumber.ROUND_HALF_EVEN);

        const orderFeeData = await this.props.onFetchTakerAndMakerFee(makerAmount, price, expirationTimeSeconds, this.state.tab);
        try {
            if (this.state.orderType === OrderType.Limit) {
                await this.props.onSubmitLimitOrder(makerAmount, price, expirationTimeSeconds, orderSide, orderFeeData);
            } else {
                await this.props.onSubmitMarketOrder(makerAmount, orderSide, orderFeeData);
            }
        } catch (error) {
            this.setState(
                {
                    error: {
                        btnMsg: 'Error',
                        cardMsg: error.message,
                    },
                },
                () => {
                    // After a timeout both error message and button gets cleared
                    setTimeout(() => {
                        this.setState({
                            error: {
                                ...this.state.error,
                                btnMsg: null,
                            },
                        });
                    }, TIMEOUT_BTN_ERROR);
                    setTimeout(() => {
                        this.setState({
                            error: {
                                ...this.state.error,
                                cardMsg: null,
                            },
                        });
                    }, TIMEOUT_CARD_ERROR);
                },
            );
        }
        this._reset();
    };

    private readonly _reset = () => {
        this.setState({
            makerAmount: null,
            price: null,
            expiration: getExpirationHoursOffsetFromConfig()
        });
    };

    private readonly _switchToMarket = () => {
        this.setState({
            orderType: OrderType.Market,
        });
    };

    private readonly _switchToLimit = () => {
        this.setState({
            orderType: OrderType.Limit,
        });
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        web3State: getWeb3State(state),
        currencyPair: getCurrencyPair(state),
        orderPriceSelected: getOrderPriceSelected(state),
        baseToken: getBaseToken(state),
        quoteTokenBalance: getQuoteTokenBalance(state),
        baseTokenBalance: getBaseTokenBalance(state)
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onSubmitLimitOrder: (amount: BigNumber, price: BigNumber, expirationTimeSeconds: BigNumber, side: OrderSide, orderFeeData: OrderFeeData) =>
            dispatch(startBuySellLimitSteps(amount, price, expirationTimeSeconds, side, orderFeeData)),
        onSubmitMarketOrder: (amount: BigNumber, side: OrderSide, orderFeeData: OrderFeeData) =>
            dispatch(startBuySellMarketSteps(amount, side, orderFeeData)),
        onConnectWallet: () => dispatch(initWallet()),
        onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, expirationTimeSeconds: BigNumber, side: OrderSide) =>
            dispatch(fetchTakerAndMakerFee(amount, price, expirationTimeSeconds, side)),
    };
};

const BuySellContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuySell);

export { BuySell, BuySellContainer };
