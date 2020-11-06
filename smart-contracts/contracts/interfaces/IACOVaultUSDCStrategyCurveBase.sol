pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

interface IACOVaultUSDCStrategyCurveBase {
    struct VaultUSDCStrategyCurveBaseInitData {
        address curve;
        address gauge;
        address mintr;
        address crv;
        address crvPoolToken;
        address controller;
        address assetConverter;        
        uint256 gasSubsidyFee;
    }
}