import { Filter } from '../util/types';

import { Config } from './config';

export var availableMarkets = Config.getConfig().pairs;

const allFilter = {
    text: 'ALL',
    value: null,
};
const suppliedMarketFilters = Config.getConfig().marketFilters;
export const marketFilters: Filter[] = suppliedMarketFilters ? [allFilter, ...suppliedMarketFilters] : [];
