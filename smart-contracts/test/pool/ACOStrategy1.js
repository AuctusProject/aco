const { expect } = require("chai");
const strategy1ABI = require("../../artifacts/ACOStrategy1.json");

describe("ACOStrategy1", function() {
});

exports.createAcoStrategy1 = async () => {
    let percentagePrecision = 100000;
    let underlyingPriceAdjustPercentage = 0.05 * percentagePrecision;
    let minOptionPricePercentage = 0.05 * percentagePrecision;
    let tolerancePercentageToOraclePrice = 0.05 * percentagePrecision;
    let orderSizePenaltyFactor = 50;
    let orderSizeDampingFactor = 4;
    let newStrategy = await (await ethers.getContractFactory("ACOStrategy1")).deploy(
      underlyingPriceAdjustPercentage,
      minOptionPricePercentage,
      tolerancePercentageToOraclePrice,
      orderSizePenaltyFactor,
      orderSizeDampingFactor);
    await newStrategy.deployed();
    return newStrategy;
  }