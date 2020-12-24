pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

interface IACOPoolStrategy {
    
    struct OptionQuote {
        uint256 underlyingPrice;
        address underlying;
        address strikeAsset;
        bool isCallOption;
        uint256 strikePrice; 
        uint256 expiryTime;
        uint256 baseVolatility;
        uint256 collateralOrderAmount;
        uint256 collateralAvailable;
    }

    function quote(OptionQuote calldata quoteData) external view returns(uint256 optionPrice, uint256 volatility);
}