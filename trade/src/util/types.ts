import { SignedOrder } from '@0x/connect';
import { OrderStatus } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { RouterState } from 'connected-react-router';
import { ActionCreator, AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { TokenMetaData } from '../common/tokens_meta_data';
import { ExtraArgument } from '../store/index';
import { ThemeModalStyle, ThemeProperties } from '../themes/commons';

export interface TabItem {
    active: boolean;
    onClick: any;
    text: string;
}

export enum Network {
    Mainnet = 1,
    Rinkeby = 4,
    Kovan = 42,
    Ganache = 50,
}

export interface Token {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    primaryColor: string;
    icon?: string;
    displayDecimals: number;
    expiryTime?: number;
}

export interface TokenBalance {
    balance: BigNumber;
    isUnlocked: boolean;
    token: Token;
}

export interface OrderFeeData {
    makerFee: BigNumber;
    takerFee: BigNumber;
    makerFeeAssetData: string;
    takerFeeAssetData: string;
}

export interface SearchTokenBalanceObject {
    tokenBalances: TokenBalance[];
    tokenToFind: Token | null;
    wethTokenBalance: TokenBalance | null;
}

export enum Web3State {
    Done = 'Done',
    Error = 'Error',
    Loading = 'Loading',
    NotInstalled = 'NotInstalled',
    Locked = 'Locked',
}

export interface BlockchainState {
    readonly ethAccount: string;
    readonly web3State: Web3State;
    readonly tokenBalances: TokenBalance[];
    readonly ethBalance: BigNumber;
    readonly wethTokenBalance: TokenBalance | null;
    readonly gasInfo: GasInfo;
    readonly convertBalanceState: ConvertBalanceState;
}

export interface RelayerState {
    readonly orders: UIOrder[];
    readonly userOrders: UIOrder[];
}

export interface UIState {
    readonly notifications: Notification[];
    readonly hasUnreadNotifications: boolean;
    readonly stepsModal: StepsModalState;
    readonly orderPriceSelected: BigNumber | null;
}

export interface MarketState {
    readonly currencyPair: CurrencyPair;
    readonly baseToken: Token | null;
    readonly quoteToken: Token | null;
    readonly ethInUsd: BigNumber | null;
    readonly markets: Market[] | null;
    readonly makerAddresses: string[] | null;
}

export interface StoreState {
    readonly router: RouterState;
    readonly blockchain: BlockchainState;
    readonly relayer: RelayerState;
    readonly ui: UIState;
    readonly market: MarketState;
}

export enum StepKind {
    WrapEth = 'WrapEth',
    ToggleTokenLock = 'ToggleTokenLock',
    BuySellLimit = 'BuySellLimit',
    BuySellMarket = 'BuySellMarket'
}

export interface StepWrapEth {
    kind: StepKind.WrapEth;
    currentWethBalance: BigNumber;
    newWethBalance: BigNumber;
    context: 'order' | 'standalone';
}

export interface StepToggleTokenLock {
    kind: StepKind.ToggleTokenLock;
    token: Token;
    isUnlocked: boolean;
    context: 'order' | 'standalone';
}

export interface StepBuySellLimitOrder {
    kind: StepKind.BuySellLimit;
    amount: BigNumber;
    price: BigNumber;
    expirationTimeSeconds: BigNumber;
    side: OrderSide;
    token: Token;
}

export interface StepBuySellMarket {
    kind: StepKind.BuySellMarket;
    amount: BigNumber;
    side: OrderSide;
    token: Token;
}

export type Step =
    | StepWrapEth
    | StepToggleTokenLock
    | StepBuySellLimitOrder
    | StepBuySellMarket;

export interface StepsModalState {
    readonly doneSteps: Step[];
    readonly currentStep: Step | null;
    readonly pendingSteps: Step[];
}

export enum OrderSide {
    Sell,
    Buy,
}

export interface UIOrder {
    rawOrder: SignedOrder;
    side: OrderSide;
    size: BigNumber;
    filled: BigNumber | null;
    price: BigNumber;
    status: OrderStatus | null;
}

export interface OrderBookItem {
    side: OrderSide;
    size: BigNumber;
    price: BigNumber;
}

export interface Spread {
    absolute: BigNumber;
    percentage: BigNumber;
}

export interface OrderBook {
    buyOrders: OrderBookItem[];
    sellOrders: OrderBookItem[];
    mySizeOrders: OrderBookItem[];
}

export interface CurrencyPair {
    base: string;
    quote: string;
}

export interface Market {
    currencyPair: CurrencyPair;
    price: BigNumber | null;
}

export enum NotificationKind {
    CancelOrder = 'CancelOrder',
    Market = 'Market',
    Limit = 'Limit',
    OrderFilled = 'OrderFilled',
}

interface BaseNotification {
    id: string;
    kind: NotificationKind;
    timestamp: Date;
}

interface TransactionNotification extends BaseNotification {
    tx: Promise<any>;
}

interface CancelOrderNotification extends TransactionNotification {
    kind: NotificationKind.CancelOrder;
    amount: BigNumber;
    token: Token;
}

interface MarketNotification extends TransactionNotification {
    kind: NotificationKind.Market;
    amount: BigNumber;
    token: Token;
    side: OrderSide;
}

interface LimitNotification extends BaseNotification {
    kind: NotificationKind.Limit;
    amount: BigNumber;
    token: Token;
    side: OrderSide;
}

export interface OrderFilledNotification extends BaseNotification {
    kind: NotificationKind.OrderFilled;
    amount: BigNumber;
    token: Token;
    side: OrderSide;
}

export type Notification = CancelOrderNotification | MarketNotification | LimitNotification | OrderFilledNotification;

export enum OrderType {
    Limit = 'Limit',
    Market = 'Market',
}

export interface GasInfo {
    gasPriceInWei: BigNumber;
    estimatedTimeMs: number;
}

export enum ModalDisplay {
    InstallMetamask = 'INSTALL_METAMASK',
    EnablePermissions = 'ACCEPT_PERMISSIONS',
}

export enum ConvertBalanceState {
    Failure = 'Failure',
    Request = 'Request',
    Success = 'Success',
}

export type ThunkCreator<R = Promise<any>> = ActionCreator<ThunkAction<R, StoreState, ExtraArgument, AnyAction>>;

export enum ButtonVariant {
    Balance = 'balance',
    Buy = 'buy',
    Error = 'error',
    Primary = 'primary',
    Quaternary = 'quaternary',
    Secondary = 'secondary',
    Sell = 'sell',
    Tertiary = 'tertiary',
}

export enum ButtonIcons {
    Warning = 'warning',
}

export interface Filter {
    text: string;
    value: null | string;
}

export interface PartialTheme {
    componentsTheme?: Partial<ThemeProperties>;
    modalTheme?: Partial<ThemeModalStyle>;
}

export interface GeneralConfig {
    title?: string;
    icon?: string;
}

export interface ConfigFile {
    tokens: TokenMetaData[];
    pairs: CurrencyPair[];
    marketFilters?: Filter[];
    theme?: PartialTheme;
    general?: GeneralConfig;
}
