import { Config } from './config';

export interface TokenMetaData {
    addresses: { [key: number]: string };
    symbol: string;
    decimals: number;
    name: string;
    primaryColor: string;
    icon?: string;
    displayDecimals?: number;
    expiryTime?: number;
}
export var KNOWN_TOKENS_META_DATA: TokenMetaData[] = Config.getConfig().tokens;
