pragma solidity ^0.6.6;

import './BokkyPooBahsDateTimeLibrary.sol';
import './Strings.sol';

library ACONameFormatter {
    
    /**
     * @dev Function to get the `value` formatted.
	 * The function returns a string for the `value` with a point (character '.') in the proper position considering the `decimals`.
	 * Beyond that, the string returned presents only representative digits.
	 * For example, a `value` with 18 decimals:
	 *  - For 100000000000000000000 the return is "100"
	 *  - For 100100000000000000000 the return is "100.1"
	 *  - For 100000000000000000 the return is "0.1"
	 *  - For 100000000000000 the return is "0.0001"
	 *  - For 100000000000000000001 the return is "100.000000000000000001"
	 * @param value The number to be formatted.
	 * @param decimals The respective number decimals.
     * @return The value formatted on a string.
     */
    function formatNumber(uint256 value, uint8 decimals) internal pure returns(string memory) {
        uint256 digits;
        uint256 count;
        bool foundRepresentativeDigit = false;
        uint256 addPointAt = 0;
        uint256 temp = value;
        uint256 number = value;
        while (temp != 0) {
            if (!foundRepresentativeDigit && (temp % 10 != 0 || count == uint256(decimals))) {
                foundRepresentativeDigit = true;
                number = temp;
            }
            if (foundRepresentativeDigit) {
                if (count == uint256(decimals)) {
                    addPointAt = digits;
                }
                digits++;
            }
            temp /= 10;
            count++;
        }
        if (count <= uint256(decimals)) {
            digits = digits + 2 + uint256(decimals) - count;
            addPointAt = digits - 2;
        } else if (addPointAt > 0) {
            digits++;
        }
        bytes memory buffer = new bytes(digits);
        uint256 index = digits - 1;
        temp = number;
        for (uint256 i = 0; i < digits; ++i) {
            if (i > 0 && i == addPointAt) {
                buffer[index--] = byte(".");
            } else if (number == 0) {
                buffer[index--] = byte("0");
            } else {
                buffer[index--] = byte(uint8(48 + number % 10));
                number /= 10;
            }
        }
        return string(buffer);
    }
    
    /**
     * @dev Function to get the `unixTime` formatted.
     * @param unixTime The UNIX time to be formatted.
     * @return The unix time formatted on a string.
     */
    function formatTime(uint256 unixTime) internal pure returns(string memory) {
        (uint256 year, uint256 month, uint256 day, uint256 hour, uint256 minute,) = BokkyPooBahsDateTimeLibrary.timestampToDateTime(unixTime); 
        return string(abi.encodePacked(
            _getDateNumberWithTwoCharacters(day),
            _getMonthFormatted(month),
            _getYearFormatted(year),
            "-",
            _getDateNumberWithTwoCharacters(hour),
            _getDateNumberWithTwoCharacters(minute),
            "UTC"
            )); 
    }
    
    /**
     * @dev Function to get the token type description.
     * @return The token type description.
     */
    function formatType(bool isCall) internal pure returns(string memory) {
        if (isCall) {
            return "C";
        } else {
            return "P";
        }
    }
    
    /**
     * @dev Function to get the year formatted with 2 characters.
     * @return The year formatted.
     */
    function _getYearFormatted(uint256 year) private pure returns(string memory) {
        bytes memory yearBytes = bytes(Strings.toString(year));
        bytes memory result = new bytes(2);
        uint256 startIndex = yearBytes.length - 2;
        for (uint256 i = startIndex; i < yearBytes.length; i++) {
            result[i - startIndex] = yearBytes[i];
        }
        return string(result);
    }
    
    /**
     * @dev Function to get the month abbreviation.
     * @return The month abbreviation.
     */
    function _getMonthFormatted(uint256 month) private pure returns(string memory) {
        if (month == 1) {
            return "JAN";
        } else if (month == 2) {
            return "FEB";
        } else if (month == 3) {
            return "MAR";
        } else if (month == 4) {
            return "APR";
        } else if (month == 5) {
            return "MAY";
        } else if (month == 6) {
            return "JUN";
        } else if (month == 7) {
            return "JUL";
        } else if (month == 8) {
            return "AUG";
        } else if (month == 9) {
            return "SEP";
        } else if (month == 10) {
            return "OCT";
        } else if (month == 11) {
            return "NOV";
        } else if (month == 12) {
            return "DEC";
        } else {
            return "INVALID";
        }
    }
    
    /**
     * @dev Function to get the date number with 2 characters.
     * @return The 2 characters for the number.
     */
    function _getDateNumberWithTwoCharacters(uint256 number) private pure returns(string memory) {
        string memory _string = Strings.toString(number);
        if (number < 10) {
            return string(abi.encodePacked("0", _string));
        } else {
            return _string;
        }
    }
}