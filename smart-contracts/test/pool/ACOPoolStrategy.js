const { expect } = require("chai");

describe("ACOPoolStrategy", function () {
  let buidlerFactory;
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 8;
  let token1TotalSupply = ethers.BigNumber.from("100000000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.BigNumber.from("1000000000000000");
  let strategy;  
  let percentagePrecision = 100000;
  let token1Token2Price = ethers.BigNumber.from("10000000000");
  let token1Token2BaseVolatility = 70000;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();

    strategy = await createAcoPoolStrategy();
    await strategy.setAssetPrecision(token1.address);
    await strategy.setAssetPrecision(token2.address);
  });
  describe("ACOPoolStrategy transactions", function () {
    it("Check set underlying price adjust percentage", async function () {
      expect(await strategy.underlyingPriceAdjustPercentage()).to.equal(0.005 * percentagePrecision);
      await strategy.setUnderlyingPriceAdjustPercentage(0.1 * percentagePrecision)
      expect(await strategy.underlyingPriceAdjustPercentage()).to.equal(0.1 * percentagePrecision);
    });
    it("Check fail to set underlying price adjust percentage", async function () {
      var originalValue = await strategy.underlyingPriceAdjustPercentage()
      
      await expect(
        strategy.connect(addr1).setUnderlyingPriceAdjustPercentage(0.1 * percentagePrecision)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await strategy.underlyingPriceAdjustPercentage()).to.equal(originalValue);

      await expect(
        strategy.connect(owner).setUnderlyingPriceAdjustPercentage(percentagePrecision + 1)
      ).to.be.revertedWith("ACOPoolStrategy:: Invalid underlying price adjust");
      expect(await strategy.underlyingPriceAdjustPercentage()).to.equal(originalValue);
    });
    it("Check set min option price percentage", async function () {
      expect(await strategy.minOptionPricePercentage()).to.equal(0.0075 * percentagePrecision);
      await strategy.setMinOptionPricePercentage(0.1 * percentagePrecision)
      expect(await strategy.minOptionPricePercentage()).to.equal(0.1 * percentagePrecision);
    });
    it("Check fail to set min option price percentage", async function () {
      var originalValue = await strategy.minOptionPricePercentage()
      
      await expect(
        strategy.connect(addr1).setMinOptionPricePercentage(0.1 * percentagePrecision)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await strategy.minOptionPricePercentage()).to.equal(originalValue);

      await expect(
        strategy.connect(owner).setMinOptionPricePercentage(percentagePrecision)
      ).to.be.revertedWith("ACOPoolStrategy:: Invalid min option price percentage");
      await expect(
        strategy.connect(owner).setMinOptionPricePercentage(0)
      ).to.be.revertedWith("ACOPoolStrategy:: Invalid min option price percentage");
      expect(await strategy.minOptionPricePercentage()).to.equal(originalValue);
    });
    it("Check set order size factors", async function () {
      expect(await strategy.orderSizeMultiplierFactor()).to.equal(50);
      expect(await strategy.orderSizeDividerFactor()).to.equal(1);
      expect(await strategy.orderSizeExponentialFactor()).to.equal(4);
      await strategy.setOrderSizeFactors(40, 3, 2)
      expect(await strategy.orderSizeMultiplierFactor()).to.equal(40);
      expect(await strategy.orderSizeDividerFactor()).to.equal(3);
      expect(await strategy.orderSizeExponentialFactor()).to.equal(2);
    });
    it("Check fail to set order size factors", async function () {
      var orderSizeMultiplierFactor = await strategy.orderSizeMultiplierFactor()
      var orderSizeDividerFactor = await strategy.orderSizeDividerFactor()
      var orderSizeExponentialFactor = await strategy.orderSizeExponentialFactor()
      
      await expect(
        strategy.connect(addr1).setOrderSizeFactors(40, 3, 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await strategy.orderSizeMultiplierFactor()).to.equal(orderSizeMultiplierFactor);
      expect(await strategy.orderSizeDividerFactor()).to.equal(orderSizeDividerFactor);
      expect(await strategy.orderSizeExponentialFactor()).to.equal(orderSizeExponentialFactor);

      await expect(
        strategy.connect(owner).setOrderSizeFactors(40, 1, 20)
      ).to.be.revertedWith("ACOPoolStrategy:: Invalid exponential factor");
      await expect(
        strategy.connect(owner).setOrderSizeFactors(40, 1, 0)
      ).to.be.revertedWith("ACOPoolStrategy:: Invalid exponential factor");
      await expect(
        strategy.connect(owner).setOrderSizeFactors(40, 0, 2)
      ).to.be.revertedWith("ACOPoolStrategy:: Invalid divider factor");
      expect(await strategy.orderSizeMultiplierFactor()).to.equal(orderSizeMultiplierFactor);
      expect(await strategy.orderSizeDividerFactor()).to.equal(orderSizeDividerFactor);
      expect(await strategy.orderSizeExponentialFactor()).to.equal(orderSizeExponentialFactor);
    });
    it("Check quote ITM call option", async function () {
      var expiry = (await getCurrentTimestamp()) + (5 * 86400)

      let optionQuote = {
        underlyingPrice: token1Token2Price,
        underlying: token1.address,
        strikeAsset: token2.address,
        isCallOption: true,
        strikePrice: ethers.BigNumber.from("9000000000"), 
        expiryTime: expiry,
        baseVolatility: token1Token2BaseVolatility,
        collateralOrderAmount: ethers.BigNumber.from("9000000000"),
        collateralAvailable: ethers.BigNumber.from("90000000000")
      }
      await expect((await strategy.quote(optionQuote))[0]).to.gt(ethers.BigNumber.from("1000000000"));

      optionQuote.underlyingPrice = ethers.BigNumber.from("10500000000");
      await expect((await strategy.quote(optionQuote))[0]).to.gt(ethers.BigNumber.from("1500000000"));

      optionQuote.underlyingPrice = ethers.BigNumber.from("15000000000");
      let quote1 = (await strategy.quote(optionQuote));
      await expect(quote1[0]).to.gt(ethers.BigNumber.from("5000000000"));

      optionQuote.collateralAvailable = ethers.BigNumber.from("18000000000");
      let quote2 = (await strategy.quote(optionQuote));
      await expect(quote2[0]).to.gt(quote1[0]);

      optionQuote.baseVolatility = token1Token2BaseVolatility * 2;
      let quote3 = (await strategy.quote(optionQuote));
      await expect(quote3[0]).to.gt(quote2[0]);

      optionQuote.expiryTime = (await getCurrentTimestamp()) + (1 * 86400)
      let quote4 = (await strategy.quote(optionQuote));
      await expect(quote4[0]).to.lt(quote3[0]);
    });
    it("Check quote OTM call option", async function () {
      var expiry = (await getCurrentTimestamp()) + (5 * 86400)

      let optionQuote = {
        underlyingPrice: token1Token2Price,
        underlying: token1.address,
        strikeAsset: token2.address,
        isCallOption: true,
        strikePrice: ethers.BigNumber.from("11000000000"), 
        expiryTime: expiry,
        baseVolatility: token1Token2BaseVolatility,
        collateralOrderAmount: ethers.BigNumber.from("11000000000"),
        collateralAvailable: ethers.BigNumber.from("110000000000")
      }

      let quote1 = (await strategy.quote(optionQuote));
      await expect(quote1[0]).to.gt(ethers.BigNumber.from("0"));

      optionQuote.underlyingPrice = ethers.BigNumber.from("10500000000");

      let quote2 = (await strategy.quote(optionQuote));
      await expect(quote2[0]).to.gt(quote1[0]);

      optionQuote.collateralAvailable = ethers.BigNumber.from("22000000000");
      let quote3 = (await strategy.quote(optionQuote));
      await expect(quote3[0]).to.gt(quote2[0]);

      optionQuote.baseVolatility = token1Token2BaseVolatility * 2;
      let quote4 = (await strategy.quote(optionQuote));
      await expect(quote4[0]).to.gt(quote3[0]);

      optionQuote.expiryTime = (await getCurrentTimestamp()) + (1 * 86400)
      let quote5 = (await strategy.quote(optionQuote));
      await expect(quote5[0]).to.lt(quote4[0]);
    });
    it("Check quote ITM put option", async function () {
      var expiry = (await getCurrentTimestamp()) + (5 * 86400)

      let optionQuote = {
        underlyingPrice: token1Token2Price,
        underlying: token1.address,
        strikeAsset: token2.address,
        isCallOption: false,
        strikePrice: ethers.BigNumber.from("11000000000"), 
        expiryTime: expiry,
        baseVolatility: token1Token2BaseVolatility,
        collateralOrderAmount: ethers.BigNumber.from("11000000000"),
        collateralAvailable: ethers.BigNumber.from("110000000000")
      }
      await expect((await strategy.quote(optionQuote))[0]).to.gt(ethers.BigNumber.from("1000000000"));

      optionQuote.underlyingPrice = ethers.BigNumber.from("9500000000");
      await expect((await strategy.quote(optionQuote))[0]).to.gt(ethers.BigNumber.from("1500000000"));

      optionQuote.underlyingPrice = ethers.BigNumber.from("8000000000");

      let quote1 = (await strategy.quote(optionQuote));
      await expect(quote1[0]).to.gt(ethers.BigNumber.from("3000000000"));

      optionQuote.collateralAvailable = ethers.BigNumber.from("22000000000");
      let quote2 = (await strategy.quote(optionQuote));
      await expect(quote2[0]).to.gt(quote1[0]);

      optionQuote.baseVolatility = token1Token2BaseVolatility * 2;
      let quote3 = (await strategy.quote(optionQuote));
      await expect(quote3[0]).to.gt(quote2[0]);

      optionQuote.expiryTime = (await getCurrentTimestamp()) + (1 * 86400)
      let quote4 = (await strategy.quote(optionQuote));
      await expect(quote4[0]).to.lt(quote3[0]);
    });
    it("Check quote OTM put option", async function () {
      var expiry = (await getCurrentTimestamp()) + (5 * 86400)

      let optionQuote = {
        underlyingPrice: token1Token2Price,
        underlying: token1.address,
        strikeAsset: token2.address,
        isCallOption: false,
        strikePrice: ethers.BigNumber.from("9000000000"), 
        expiryTime: expiry,
        baseVolatility: token1Token2BaseVolatility,
        collateralOrderAmount: ethers.BigNumber.from("9000000000"),
        collateralAvailable: ethers.BigNumber.from("90000000000")
      }

      let quote1 = (await strategy.quote(optionQuote));
      await expect(quote1[0]).to.gt(ethers.BigNumber.from("0"));

      optionQuote.underlyingPrice = ethers.BigNumber.from("9500000000");

      let quote2 = (await strategy.quote(optionQuote));
      await expect(quote2[0]).to.gt(quote1[0]);

      optionQuote.collateralAvailable = ethers.BigNumber.from("18000000000");
      let quote3 = (await strategy.quote(optionQuote));
      await expect(quote3[0]).to.gt(quote2[0]);

      optionQuote.baseVolatility = token1Token2BaseVolatility * 2;
      let quote4 = (await strategy.quote(optionQuote));
      await expect(quote4[0]).to.gt(quote3[0]);

      optionQuote.expiryTime = (await getCurrentTimestamp()) + (1 * 86400)
      let quote5 = (await strategy.quote(optionQuote));
      await expect(quote5[0]).to.lt(quote4[0]);
    });
  });
});

const getCurrentTimestamp = async () => {
  let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
  return parseInt(block.timestamp, 16);
};

const createAcoPoolStrategy = async () => {
  let percentagePrecision = 100000;
  let underlyingPriceAdjustPercentage = 0.005 * percentagePrecision;
  let minOptionPricePercentage = 0.0075 * percentagePrecision;
  let orderSizeMultiplierFactor = 50;
  let orderSizeExponetialFactor = 4;
  let orderSizeDividerFactor = 1;
  let newStrategy = await (await ethers.getContractFactory("ACOPoolStrategy")).deploy(
    underlyingPriceAdjustPercentage,
    minOptionPricePercentage,
    orderSizeMultiplierFactor,
    orderSizeDividerFactor,
    orderSizeExponetialFactor);
  await newStrategy.deployed();
  return newStrategy;
};

exports.createAcoPoolStrategy = createAcoPoolStrategy;