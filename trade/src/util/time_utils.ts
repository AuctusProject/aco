import { BigNumber } from '@0x/utils';

import { DEFAULT_ORDER_EXPIRY_SECONDS } from '../common/constants';

export const tomorrow = () => {
    return new BigNumber(Math.floor(new Date().valueOf() / 1000) + 3600 * 24);
};

export const todayInSeconds = () => {
    return Math.floor(Date.now() / 1000);
};

export const convertTimeInSecondsToDaysHoursAndMinutes = (timeInSeconds: BigNumber) => {
    let seconds = timeInSeconds.toNumber();
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    return {
        days,
        hours,
        minutes
    };
};

export const getExpirationTimeOrdersFromConfig = () => {
    return new BigNumber(todayInSeconds()).plus(DEFAULT_ORDER_EXPIRY_SECONDS);
};

export const getExpirationHoursOffsetFromConfig = () => {
    return new BigNumber(DEFAULT_ORDER_EXPIRY_SECONDS).dividedBy(3600).decimalPlaces(0, BigNumber.ROUND_HALF_EVEN);
};

export const getEndDateStringFromTimeInSeconds = (timeInSeconds: BigNumber) => {
    const currentDate = new Date(timeInSeconds.toNumber() * 1000);
    return currentDate.toLocaleString('en-us');
};

export const getDaysHoursAndMinutesToExpiry = (expiryTimeInSeconds: BigNumber) => {
    return convertTimeInSecondsToDaysHoursAndMinutes(expiryTimeInSeconds.minus(todayInSeconds()))
}
