const { expect } = require("chai");
const strategy1ABI = require("../../artifacts/ACOStrategy1.json");
describe("ACOStrategy1", function () {
  let buidlerFactory;
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 4;
  let token1TotalSupply = 20000000;
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 8;
  let token2TotalSupply = 100000000000;
  let defaultAggregator;
  let strategy1;  
  let percentagePrecision = 100000;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();

    defaultAggregator = await (await ethers.getContractFactory("AggregatorForTest")).deploy(token2Decimals, 200000000);
    await defaultAggregator.deployed();

    strategy1 = await createAcoStrategy1()
  });
  describe("ACOStrategy1 transactions", function () {
    it("Check set underlying price adjust percentage", async function () {
      await strategy1.setUnderlyingPriceAdjustPercentage(0.1 * percentagePrecision)
      expect(await strategy1.underlyingPriceAdjustPercentage()).to.equal(0.1 * percentagePrecision);
    });
    it("Check fail to set underlying price adjust percentage", async function () {
      var originalValue = await strategy1.underlyingPriceAdjustPercentage()
      
      await expect(
        strategy1.connect(addr1).setUnderlyingPriceAdjustPercentage(0.1 * percentagePrecision)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await strategy1.underlyingPriceAdjustPercentage()).to.equal(originalValue);

      await expect(
        strategy1.connect(owner).setUnderlyingPriceAdjustPercentage(percentagePrecision + 1)
      ).to.be.revertedWith("ACOStrategy1:: Invalid underlying price adjust");
      expect(await strategy1.underlyingPriceAdjustPercentage()).to.equal(originalValue);
    });
    it("Check set min option price percentage", async function () {
      await strategy1.setMinOptionPricePercentage(0.1 * percentagePrecision)
      expect(await strategy1.minOptionPricePercentage()).to.equal(0.1 * percentagePrecision);
    });
    it("Check fail to set min option price percentage", async function () {
      var originalValue = await strategy1.minOptionPricePercentage()
      
      await expect(
        strategy1.connect(addr1).setMinOptionPricePercentage(0.1 * percentagePrecision)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await strategy1.minOptionPricePercentage()).to.equal(originalValue);

      await expect(
        strategy1.connect(owner).setMinOptionPricePercentage(percentagePrecision)
      ).to.be.revertedWith("ACOStrategy1:: Invalid min option price percentage");
      await expect(
        strategy1.connect(owner).setMinOptionPricePercentage(0)
      ).to.be.revertedWith("ACOStrategy1:: Invalid min option price percentage");
      expect(await strategy1.minOptionPricePercentage()).to.equal(originalValue);
    });
    it("Check set tolerance percentage to oracle price", async function () {
      await strategy1.setTolerancePercentageToOraclePrice(0.1 * percentagePrecision)
      expect(await strategy1.tolerancePercentageToOraclePrice()).to.equal(0.1 * percentagePrecision);
    });
    it("Check fail to set tolerance percentage to oracle price", async function () {
      var originalValue = await strategy1.tolerancePercentageToOraclePrice()
      
      await expect(
        strategy1.connect(addr1).setTolerancePercentageToOraclePrice(0.1 * percentagePrecision)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await strategy1.tolerancePercentageToOraclePrice()).to.equal(originalValue);

      await expect(
        strategy1.connect(owner).setTolerancePercentageToOraclePrice(percentagePrecision + 1)
      ).to.be.revertedWith("ACOStrategy1:: Invalid tolerance percentage");
      expect(await strategy1.tolerancePercentageToOraclePrice()).to.equal(originalValue);
    });
    it("Check set order size factors", async function () {
      await strategy1.setOrderSizeFactors(40, 2)
      expect(await strategy1.orderSizePenaltyFactor()).to.equal(40);
      expect(await strategy1.orderSizeDampingFactor()).to.equal(2);
    });
    it("Check fail to set order size factors", async function () {
      var originalPenaltyFactor = await strategy1.orderSizePenaltyFactor()
      var originalDampingFactor = await strategy1.orderSizeDampingFactor()
      
      await expect(
        strategy1.connect(addr1).setOrderSizeFactors(40, 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await strategy1.orderSizePenaltyFactor()).to.equal(originalPenaltyFactor);
      expect(await strategy1.orderSizeDampingFactor()).to.equal(originalDampingFactor);

      await expect(
        strategy1.connect(owner).setOrderSizeFactors(1000001, 2)
      ).to.be.revertedWith("ACOStrategy1:: Invalid penalty factor");
      await expect(
        strategy1.connect(owner).setOrderSizeFactors(40, 20)
      ).to.be.revertedWith("ACOStrategy1:: Invalid damping factor");
      
      expect(await strategy1.orderSizePenaltyFactor()).to.equal(originalPenaltyFactor);
      expect(await strategy1.orderSizeDampingFactor()).to.equal(originalDampingFactor);
    });
    it("Check set agreggator", async function () {
      var aggregator = await (await ethers.getContractFactory("AggregatorForTest")).deploy(token2Decimals, 200000000);
      await aggregator.deployed();
      await strategy1.setAgreggator(token1.address, token2.address, aggregator.address);
      expect(await strategy1.getUnderlyingPrice(token1.address, token2.address)).to.equal(200000000);
      await aggregator.updateAnswer(250000000);
      expect(await strategy1.getUnderlyingPrice(token1.address, token2.address)).to.equal(250000000);
      expect(await strategy1.getAcceptableUnderlyingPriceToSwapAssets(token1.address, token2.address, true)).to.equal(0.95*250000000);
      expect(await strategy1.getAcceptableUnderlyingPriceToSwapAssets(token1.address, token2.address, false)).to.equal(1.05*250000000);
    });
    it("Check fail to set agreggator", async function () {
      var aggregator = await (await ethers.getContractFactory("AggregatorForTest")).deploy(token2Decimals, 200000000);
      await aggregator.deployed();

      await expect(
        strategy1.connect(addr1).setAgreggator(token1.address, token2.address, aggregator.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        strategy1.connect(owner).setAgreggator(token1.address, token1.address, aggregator.address)
      ).to.be.revertedWith("ACOStrategy1:: Invalid assets");

      await expect(
        strategy1.connect(owner).setAgreggator(await addr1.getAddress(), token2.address, aggregator.address)
      ).to.be.revertedWith("ACOStrategy1:: Invalid underlying");

      await expect(
        strategy1.connect(owner).setAgreggator(token1.address, await addr1.getAddress(), aggregator.address)
      ).to.be.revertedWith("ACOStrategy1:: Invalid strike asset");
      
      await expect(
        strategy1.connect(owner).setAgreggator(token1.address, token2.address, await addr1.getAddress())
      ).to.be.revertedWith("ACOStrategy1:: Invalid aggregator");
    });
    it("Check fail to exercise", async function () {
      let checkExercise = {
        underlying: token1.address,
        strikeAsset: token2.address,
        isCallOption: true,
        strikePrice: 0,
        expiryTime: 0,
        collateralAmount: 0,
        collateralAvailable: 0,
        amountPurchased: 0,
        amountSold: 0
      }
      await expect(
        strategy1.checkExercise(checkExercise)
      ).to.be.revertedWith("ACOStrategy1:: Strategy only for sell");
    })
  });
});

const createAcoStrategy1 = async () => {
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

exports.createAcoStrategy1 = createAcoStrategy1;