pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

interface IACOVaultStrategy {
    struct VaultStrategyInitData {
        address curve;
        address gauge;
        address mintr;
        address crv;
        address ycrv;
        address controller;
        address assetConverter;        
        uint256 gasSubsidyFee;
    }
}