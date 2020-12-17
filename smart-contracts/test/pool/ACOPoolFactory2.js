const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/ACOPoolFactory2.json");
const factoryABI = require("../../artifacts/ACOFactory.json");
const { createAcoPoolStrategy } = require("./ACOPoolStrategy.js");
const { AddressZero } = require("ethers/constants");

describe("ACOPoolFactory2", function() {
  let buidlerACOFactoryProxy;
  let buidlerACOPoolFactoryProxy;
  let buidlerACOPoolFactory;
  let poolFactoryInterface;
  let ACOPool;
  let ACOPoolFactory;
  let owner;
  let addr1;
  let addr2;
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 4;
  let token1TotalSupply = 9999990000;
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 8;
  let token2TotalSupply = 100000000000;
  let uniswapFactory;
  let weth;
  let uniswapRouter;
  let defaultStrategy;
  let chiToken;
  let fee = 100;
  let withdrawOpenPositionPenalty = 10000;
  let underlyingPriceAdjustPercentage = 500;
  let maxOpenAco = 50;
  let converterHelper;
  let aggregatorToken1Token2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    ACOPool = await (await ethers.getContractFactory("ACOPool2")).deploy();
    await ACOPool.deployed();

    let ACOFactory = await (await ethers.getContractFactory("ACOFactoryV3")).deploy();
    await ACOFactory.deployed();
    
    factoryInterface = new ethers.utils.Interface(factoryABI.abi);

    ACOToken = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOToken.deployed();

    let ownerAddr = await owner.getAddress();
    let addr2Addr = await addr2.getAddress();
    let fee = 100
    let factoryInitData = factoryInterface.functions.init.encode([ownerAddr, ACOToken.address, fee, addr2Addr]);
    buidlerACOFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOFactory.address, factoryInitData);
    await buidlerACOFactoryProxy.deployed();
    let buidlerFactory = await ethers.getContractAt("ACOFactoryV3", buidlerACOFactoryProxy.address);
    await buidlerFactory.setOperator(await owner.getAddress(), true);

    uniswapFactory = await (await ethers.getContractFactory("UniswapV2Factory")).deploy(await owner.getAddress());
    await uniswapFactory.deployed();
    weth = await (await ethers.getContractFactory("WETH9")).deploy();
    await weth.deployed(); 
    uniswapRouter = await (await ethers.getContractFactory("UniswapV2Router02")).deploy(uniswapFactory.address, weth.address);
    await uniswapRouter.deployed();
    chiToken = await (await ethers.getContractFactory("ChiToken")).deploy();
    await chiToken.deployed();
    converterHelper = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
    await converterHelper.deployed();
    
    ACOPoolFactory = await (await ethers.getContractFactory("ACOPoolFactory2")).deploy();
    await ACOPoolFactory.deployed();

    poolFactoryInterface = new ethers.utils.Interface(poolFactoryABI.abi);
    let poolFactoryInitData = poolFactoryInterface.functions.init.encode([ownerAddr, ACOPool.address, buidlerACOFactoryProxy.address, converterHelper.address, chiToken.address, fee, ownerAddr, withdrawOpenPositionPenalty, underlyingPriceAdjustPercentage, maxOpenAco]);
    buidlerACOPoolFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOPoolFactory.address, poolFactoryInitData);
    await buidlerACOPoolFactoryProxy.deployed();
    buidlerACOPoolFactory = await ethers.getContractAt("ACOPoolFactory2", buidlerACOPoolFactoryProxy.address);

    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();

    aggregatorToken1Token2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, 10000000000);
    await aggregatorToken1Token2.deployed();
    await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);

    defaultStrategy = await createAcoPoolStrategy();
    await defaultStrategy.setAssetPrecision(token2.address);
    await buidlerACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);
  });
  
  describe("Proxy Deployment", function () {
    it("Should set the right proxy admin", async function () {
      expect(await buidlerACOPoolFactoryProxy.admin()).to.equal(await owner.getAddress());
    });
    it("Should set the right proxy implementation", async function () {
      expect(await buidlerACOPoolFactoryProxy.implementation()).to.equal(ACOPoolFactory.address);
    });
    it("Should set the right factory admin", async function () {
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());
    });
    it("Should set the right ACO Pool implementation", async function () {
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(ACOPool.address);
    });
    it("Should set the right ACO Factory", async function () {
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(buidlerACOFactoryProxy.address);
    });
    it("Should set the right asset converter helper", async function () {
      expect(await buidlerACOPoolFactory.assetConverterHelper()).to.equal(converterHelper.address);
    });
    it("Should set the right Chi Token", async function () {
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);
    });
    it("Should set the right ACO pool fee destination", async function () {
      expect(await buidlerACOPoolFactory.acoPoolFeeDestination()).to.equal(await owner.getAddress());
    });
    it("Should set the right ACO pool fee", async function () {
      expect(await buidlerACOPoolFactory.acoPoolFee()).to.equal(fee);
    });
    it("Should set the right ACO pool withdraw open position penalty", async function () {
      expect(await buidlerACOPoolFactory.acoPoolWithdrawOpenPositionPenalty()).to.equal(withdrawOpenPositionPenalty);
    });
    it("Should set the right ACO pool underlying price adjust", async function () {
      expect(await buidlerACOPoolFactory.acoPoolUnderlyingPriceAdjustPercentage()).to.equal(underlyingPriceAdjustPercentage);
    });
    it("Should set the right ACO pool maximum open ACO", async function () {
      expect(await buidlerACOPoolFactory.acoPoolMaximumOpenAco()).to.equal(maxOpenAco);
    });
  });

  describe("ACOPoolFactory transactions", function () {
    it("Check create ACO pool", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool( token1.address, token2.address, true, 20000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result1 = tx.events[tx.events.length - 1].args;

      let buidlerPool = await ethers.getContractAt("ACOPool2", result1.acoPool);
      expect(await buidlerPool.underlying()).to.equal(token1.address);    
      expect(await buidlerPool.strikeAsset()).to.equal(token2.address);    
      expect(await buidlerPool.isCall()).to.equal(true); 
      expect(await buidlerPool.assetConverter()).to.equal(converterHelper.address);
      expect(await buidlerPool.acoFactory()).to.equal(buidlerACOFactoryProxy.address);
      expect(await buidlerPool.tolerancePriceBelow()).to.equal(20000);
      expect(await buidlerPool.tolerancePriceAbove()).to.equal(30000);
      expect(await buidlerPool.minExpiration()).to.equal(0);
      expect(await buidlerPool.maxExpiration()).to.equal((30*86400));
      expect(await buidlerPool.strategy()).to.equal(defaultStrategy.address);
      expect(await buidlerPool.baseVolatility()).to.equal(100000);
      expect(await buidlerPool.chiToken()).to.equal(chiToken.address);
      expect(await buidlerPool.fee()).to.equal(fee);
      expect(await buidlerPool.feeDestination()).to.equal(await owner.getAddress());
      expect(await buidlerPool.withdrawOpenPositionPenalty()).to.equal(withdrawOpenPositionPenalty);
      expect(await buidlerPool.underlyingPriceAdjustPercentage()).to.equal(underlyingPriceAdjustPercentage);
      expect(await buidlerPool.maximumOpenAco()).to.equal(maxOpenAco);
    });
    it("Check fail to create ACO pool", async function () { 
      await expect(
        buidlerACOPoolFactory.connect(addr1).createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");

      let newStrategy = await createAcoPoolStrategy();
      await expect(
        buidlerACOPoolFactory.connect(owner).createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), newStrategy.address, 100000)
      ).to.be.revertedWith("ACOPoolFactory::_validateStrategy: Invalid strategy");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, (31*86400), (30*86400), defaultStrategy.address, 100000)
      ).to.be.revertedWith("E87");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 100000, 30000, 0, (30*86400), defaultStrategy.address, 100000)
      ).to.be.revertedWith("E86");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 100000, 0, (30*86400), defaultStrategy.address, 100000)
      ).to.be.revertedWith("E85");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token1.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)
      ).to.be.revertedWith("E03");

      await expect(
        buidlerACOPoolFactory.createAcoPool(await addr1.getAddress(), token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)
      ).to.be.revertedWith("E04");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, await addr1.getAddress(), true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)
      ).to.be.revertedWith("E05");
      
      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 0)
      ).to.be.revertedWith("E82");
    });
    it("Check set pool factory admin", async function () {
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());
      await buidlerACOPoolFactory.setFactoryAdmin(await addr1.getAddress());
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await addr1.getAddress());
    });
    it("Check fail to set pool factory admin", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setFactoryAdmin(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setFactoryAdmin: Invalid factory admin");
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());

      await expect(
        buidlerACOPoolFactory.connect(addr1).setFactoryAdmin(await addr1.getAddress())
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());
    });
    it("Check set ACO pool implementation", async function () {
      let newACOPool = await (await ethers.getContractFactory("ACOPool2")).deploy();
      await newACOPool.deployed();

      await buidlerACOPoolFactory.setAcoPoolImplementation(newACOPool.address);
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(newACOPool.address);
    });
    it("Check fail to set ACO pool implementation", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setAcoPoolImplementation(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolImplementation: Invalid ACO pool implementation");
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(ACOPool.address);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolImplementation(ACOToken.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(ACOPool.address);
    });
    it("Check set ACO factory", async function () {
      let newACOFactory = await (await ethers.getContractFactory("ACOFactoryV3")).deploy();
      await newACOFactory.deployed();

      await buidlerACOPoolFactory.setAcoFactory(newACOFactory.address);
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(newACOFactory.address);
    });
    it("Check fail to set ACO factory", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setAcoFactory(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setAcoFactory: Invalid ACO factory");
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(buidlerACOFactoryProxy.address);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoFactory(buidlerACOFactoryProxy.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(buidlerACOFactoryProxy.address);
    });
    it("Check set asset converter helper", async function () {
      expect(await buidlerACOPoolFactory.assetConverterHelper()).to.equal(converterHelper.address);

      let converterHelper2 = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
      await converterHelper2.deployed();
      
      await buidlerACOPoolFactory.setAssetConverterHelper(converterHelper2.address);
      expect(await buidlerACOPoolFactory.assetConverterHelper()).to.equal(converterHelper2.address);
    });
    it("Check fail to set asset converter helper", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setAssetConverterHelper(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setAssetConverterHelper: Invalid asset converter helper");
      expect(await buidlerACOPoolFactory.assetConverterHelper()).to.equal(converterHelper.address);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAssetConverterHelper(converterHelper.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.assetConverterHelper()).to.equal(converterHelper.address);
    });
    it("Check set CHI Token", async function () {
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);
      
      let newChiToken = await (await ethers.getContractFactory("ChiToken")).deploy();
      await newChiToken.deployed();
      
      await buidlerACOPoolFactory.setChiToken(newChiToken.address);
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(newChiToken.address);
    });
    it("Check fail to set CHI Token", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setChiToken(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setChiToken: Invalid Chi Token");
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);

      let newChiToken = await (await ethers.getContractFactory("ChiToken")).deploy();
      await newChiToken.deployed();

      await expect(
        buidlerACOPoolFactory.connect(addr1).setChiToken(newChiToken.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);
    });
    it("Check set fee", async function () {
      expect(await buidlerACOPoolFactory.acoPoolFee()).to.equal(fee);
      await buidlerACOPoolFactory.setAcoPoolFee(200);
      expect(await buidlerACOPoolFactory.acoPoolFee()).to.equal(200);
    });
    it("Check fail to set fee", async function () {
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolFee(200)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoPoolFee()).to.equal(fee);
    });
    it("Check set fee destination", async function () {
      expect(await buidlerACOPoolFactory.acoPoolFeeDestination()).to.equal(await owner.getAddress());
      await buidlerACOPoolFactory.setAcoPoolFeeDestination(await addr1.getAddress());
      expect(await buidlerACOPoolFactory.acoPoolFeeDestination()).to.equal(await addr1.getAddress());
    });
    it("Check fail to set fee destination", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setAcoPoolFeeDestination(AddressZero)
      ).to.be.revertedWith("ACOFactory::_setAcoPoolFeeDestination: Invalid ACO Pool fee destination");
      expect(await buidlerACOPoolFactory.acoPoolFeeDestination()).to.equal(await owner.getAddress());

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolFeeDestination(await addr1.getAddress())
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoPoolFeeDestination()).to.equal(await owner.getAddress());
    });
    it("Check set withdraw open position penalty", async function () {
      expect(await buidlerACOPoolFactory.acoPoolWithdrawOpenPositionPenalty()).to.equal(withdrawOpenPositionPenalty);
      await buidlerACOPoolFactory.setAcoPoolWithdrawOpenPositionPenalty(200);
      expect(await buidlerACOPoolFactory.acoPoolWithdrawOpenPositionPenalty()).to.equal(200);
    });
    it("Check fail to set withdraw open position penalty", async function () {
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolWithdrawOpenPositionPenalty(200)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoPoolWithdrawOpenPositionPenalty()).to.equal(withdrawOpenPositionPenalty);
    });
    it("Check set underlying price adjust", async function () {
      expect(await buidlerACOPoolFactory.acoPoolUnderlyingPriceAdjustPercentage()).to.equal(underlyingPriceAdjustPercentage);
      await buidlerACOPoolFactory.setAcoPoolUnderlyingPriceAdjustPercentage(200);
      expect(await buidlerACOPoolFactory.acoPoolUnderlyingPriceAdjustPercentage()).to.equal(200);
    });
    it("Check fail to set underlying price adjust", async function () {
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolUnderlyingPriceAdjustPercentage(200)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoPoolUnderlyingPriceAdjustPercentage()).to.equal(underlyingPriceAdjustPercentage);
    });
    it("Check set maximum open ACO", async function () {
      expect(await buidlerACOPoolFactory.acoPoolMaximumOpenAco()).to.equal(maxOpenAco);
      await buidlerACOPoolFactory.setAcoPoolMaximumOpenAco(1);
      expect(await buidlerACOPoolFactory.acoPoolMaximumOpenAco()).to.equal(1);
    });
    it("Check fail to set maximum open ACO", async function () {
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolMaximumOpenAco(100)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoPoolMaximumOpenAco()).to.equal(maxOpenAco);
    });
    it("Check set ACO pool permission", async function () {
      let ownerAddress = await owner.getAddress()
      let addr1Address = await addr1.getAddress()
      expect(await buidlerACOPoolFactory.poolAdminPermission(ownerAddress)).to.equal(true);
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);

      await buidlerACOPoolFactory.setAcoPoolPermission(addr1Address, true);
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(true);
      await buidlerACOPoolFactory.setAcoPoolPermission(addr1Address, false);
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);
    });
    it("Check fail to set ACO pool permission", async function () {
      let addr1Address = await addr1.getAddress();
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolPermission(addr1Address, true)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);
    });
    it("Check set ACO pool strategy permission", async function () {
      let newStrategy = await createAcoPoolStrategy();
      
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(false);
      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, true);
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(true);
      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, false);
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(false);
    });
    it("Check fail to set ACO pool strategy permission", async function () {
      let addr1Address = await addr1.getAddress()
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolPermission(addr1Address, true)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);
    });
    it("Check set pool strategy on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let acoPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      let newStrategy = await createAcoPoolStrategy();      
      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, true);
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(true);

      expect(await acoPool.strategy()).to.equal(defaultStrategy.address);
      await buidlerACOPoolFactory.setStrategyOnAcoPool(newStrategy.address, [result.acoPool]);
      expect(await acoPool.strategy()).to.equal(newStrategy.address);
    });
    it("Check fail to set pool strategy on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);

      let newStrategy = await createAcoPoolStrategy();    
      await expect(
        buidlerACOPoolFactory.connect(owner).setStrategyOnAcoPool(newStrategy.address, [])
      ).to.be.revertedWith("ACOPoolFactory::_validateStrategy: Invalid strategy");

      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, true);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setStrategyOnAcoPool(newStrategy.address, [buidlerPool.address])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setStrategy(newStrategy.address)
      ).to.be.revertedWith("E90");
    });
    it("Check set pool base volatility on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.baseVolatility()).to.equal(100000);

      await buidlerACOPoolFactory.setBaseVolatilityOnAcoPool([200000], [result.acoPool]);
      
      expect(await buidlerPool.baseVolatility()).to.equal(200000);
    });
    it("Check fail to set pool base volatility on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setBaseVolatilityOnAcoPool([100000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.baseVolatility()).to.equal(100000);

      await expect(
        buidlerACOPoolFactory.setBaseVolatilityOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setBaseVolatilityOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setBaseVolatility(70000)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.baseVolatility()).to.equal(100000);
    });
    it("Check set pool withdraw open position penalty on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.withdrawOpenPositionPenalty()).to.equal(withdrawOpenPositionPenalty);

      await buidlerACOPoolFactory.setWithdrawOpenPositionPenaltyOnAcoPool([20000], [result.acoPool]);

      expect(await buidlerPool.withdrawOpenPositionPenalty()).to.equal(20000);
    });
    it("Check fail to set pool withdraw open position penalty on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setWithdrawOpenPositionPenaltyOnAcoPool([100000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.withdrawOpenPositionPenalty()).to.equal(withdrawOpenPositionPenalty);

      await expect(
        buidlerACOPoolFactory.setWithdrawOpenPositionPenaltyOnAcoPool([100001], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setWithdrawOpenPositionPenaltyOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setWithdrawOpenPositionPenalty(9000)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.withdrawOpenPositionPenalty()).to.equal(withdrawOpenPositionPenalty);
    });
    it("Check set pool underlying price adjust on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.underlyingPriceAdjustPercentage()).to.equal(underlyingPriceAdjustPercentage);

      await buidlerACOPoolFactory.setUnderlyingPriceAdjustPercentageOnAcoPool([2000], [result.acoPool]);

      expect(await buidlerPool.underlyingPriceAdjustPercentage()).to.equal(2000);
    });
    it("Check fail to set pool underlying price adjust on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setUnderlyingPriceAdjustPercentageOnAcoPool([9000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.underlyingPriceAdjustPercentage()).to.equal(underlyingPriceAdjustPercentage);

      await expect(
        buidlerACOPoolFactory.setUnderlyingPriceAdjustPercentageOnAcoPool([100000], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setUnderlyingPriceAdjustPercentageOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setUnderlyingPriceAdjustPercentage(1000)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.underlyingPriceAdjustPercentage()).to.equal(underlyingPriceAdjustPercentage);
    });
    it("Check set pool maximum open ACO on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.maximumOpenAco()).to.equal(maxOpenAco);

      await buidlerACOPoolFactory.setMaximumOpenAcoOnAcoPool([200], [result.acoPool]);

      expect(await buidlerPool.maximumOpenAco()).to.equal(200);
    });
    it("Check fail to set pool maximum open ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setMaximumOpenAcoOnAcoPool([100], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.maximumOpenAco()).to.equal(maxOpenAco);

      await expect(
        buidlerACOPoolFactory.setMaximumOpenAcoOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setMaximumOpenAcoOnAcoPool([10], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setMaximumOpenAco(10)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.maximumOpenAco()).to.equal(maxOpenAco);
    });
    it("Check set pool tolerance price above on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.tolerancePriceAbove()).to.equal(30000);

      await buidlerACOPoolFactory.setTolerancePriceAboveOnAcoPool([20000], [result.acoPool]);

      expect(await buidlerPool.tolerancePriceAbove()).to.equal(20000);
    });
    it("Check fail to set pool tolerance price above on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setTolerancePriceAboveOnAcoPool([9000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.tolerancePriceAbove()).to.equal(30000);

      await expect(
        buidlerACOPoolFactory.setTolerancePriceAboveOnAcoPool([100000], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setTolerancePriceAboveOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setTolerancePriceAbove(1000)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.tolerancePriceAbove()).to.equal(30000);
    });
    it("Check set pool tolerance price below on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.tolerancePriceBelow()).to.equal(30000);

      await buidlerACOPoolFactory.setTolerancePriceBelowOnAcoPool([20000], [result.acoPool]);

      expect(await buidlerPool.tolerancePriceBelow()).to.equal(20000);
    });
    it("Check fail to set pool tolerance price below on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setTolerancePriceBelowOnAcoPool([9000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.tolerancePriceBelow()).to.equal(30000);

      await expect(
        buidlerACOPoolFactory.setTolerancePriceBelowOnAcoPool([100000], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setTolerancePriceBelowOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setTolerancePriceBelow(1000)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.tolerancePriceBelow()).to.equal(30000);
    });
    it("Check set pool min expiration on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.minExpiration()).to.equal(0);

      await buidlerACOPoolFactory.setMinExpirationOnAcoPool([1000], [result.acoPool]);

      expect(await buidlerPool.minExpiration()).to.equal(1000);
    });
    it("Check fail to set pool min expiration on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setMinExpirationOnAcoPool([1000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.minExpiration()).to.equal(0);

      await expect(
        buidlerACOPoolFactory.setMinExpirationOnAcoPool([(30*86400+1)], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setMinExpirationOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setMinExpiration(1)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.minExpiration()).to.equal(0);
    });
    it("Check set pool max expiration on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.maxExpiration()).to.equal((30*86400));

      await buidlerACOPoolFactory.setMaxExpirationOnAcoPool([(60*86400)], [result.acoPool]);

      expect(await buidlerPool.maxExpiration()).to.equal((60*86400));
    });
    it("Check fail to set pool max expiration on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setMaxExpirationOnAcoPool([1000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 10000, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.maxExpiration()).to.equal((30*86400));

      await expect(
        buidlerACOPoolFactory.setMaxExpirationOnAcoPool([9999], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setMaxExpirationOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setMaxExpiration((31*86400))
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.maxExpiration()).to.equal((30*86400));
    });
    it("Check set pool fee on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.fee()).to.equal(fee);

      await buidlerACOPoolFactory.setFeeOnAcoPool([5000], [result.acoPool]);

      expect(await buidlerPool.fee()).to.equal(5000);
    });
    it("Check fail to set pool fee on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setFeeOnAcoPool([1000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 10000, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.fee()).to.equal(fee);

      await expect(
        buidlerACOPoolFactory.setFeeOnAcoPool([12501], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolUint256Data");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setFeeOnAcoPool([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setFee(1000)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.fee()).to.equal(fee);
    });
    it("Check set pool fee destination on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.feeDestination()).to.equal(await owner.getAddress());

      await buidlerACOPoolFactory.setFeeDestinationOnAcoPool([await addr1.getAddress()], [result.acoPool]);

      expect(await buidlerPool.feeDestination()).to.equal(await addr1.getAddress());
    });
    it("Check fail to set pool fee destination on ACO", async function () {
      await expect(
        buidlerACOPoolFactory.setFeeDestinationOnAcoPool([await addr1.getAddress()], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolAddressData: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 10000, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.feeDestination()).to.equal(await owner.getAddress());

      await expect(
        buidlerACOPoolFactory.setFeeDestinationOnAcoPool([AddressZero], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolAddressData");

      await expect(
        buidlerACOPoolFactory.connect(addr1).setFeeDestinationOnAcoPool([await addr1.getAddress()], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setFeeDestination(await addr1.getAddress())
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.feeDestination()).to.equal(await owner.getAddress());
    });
    it("Check set pool asset converter helper on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.assetConverter()).to.equal(converterHelper.address);
   
      let converterHelper2 = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
      await converterHelper2.deployed();
      await converterHelper2.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);
      await buidlerACOPoolFactory.setAssetConverterOnAcoPool([converterHelper2.address], [result.acoPool]);

      expect(await buidlerPool.assetConverter()).to.equal(converterHelper2.address);
    });
    it("Check fail to set pool asset converter helper on ACO", async function () {
      let converterHelper2 = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);

      await expect(
        buidlerACOPoolFactory.setAssetConverterOnAcoPool([converterHelper2.address], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolAddressData: Invalid arguments");

      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 10000, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.assetConverter()).to.equal(converterHelper.address);

      await expect(
        buidlerACOPoolFactory.setAssetConverterOnAcoPool([AddressZero], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolAddressData");
      await expect(
        buidlerACOPoolFactory.setAssetConverterOnAcoPool([converterHelper2.address], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolAddressData");

      await converterHelper2.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAssetConverterOnAcoPool([converterHelper2.address], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setAssetConverter(converterHelper2.address)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.assetConverter()).to.equal(converterHelper.address);
    });
    it("Check set pool valid creator permission on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      expect(await buidlerPool.validAcoCreators(await owner.getAddress())).to.equal(false);
   
      await buidlerACOPoolFactory.setValidAcoCreatorOnAcoPool(await owner.getAddress(), true, [result.acoPool]);

      expect(await buidlerPool.validAcoCreators(await owner.getAddress())).to.equal(true);

      await buidlerACOPoolFactory.setValidAcoCreatorOnAcoPool(await addr1.getAddress(), true, [result.acoPool]);
      
      expect(await buidlerPool.validAcoCreators(await owner.getAddress())).to.equal(true);
      expect(await buidlerPool.validAcoCreators(await addr1.getAddress())).to.equal(true);

      await buidlerACOPoolFactory.setValidAcoCreatorOnAcoPool(await addr1.getAddress(), false, [result.acoPool]);
      
      expect(await buidlerPool.validAcoCreators(await owner.getAddress())).to.equal(true);
      expect(await buidlerPool.validAcoCreators(await addr1.getAddress())).to.equal(false);
    });
    it("Check fail to set pool valid creator permission on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 10000, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      expect(await buidlerPool.validAcoCreators(await owner.getAddress())).to.equal(false);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setValidAcoCreatorOnAcoPool(await owner.getAddress(), true, [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).setValidAcoCreator(await owner.getAddress(), true)
      ).to.be.revertedWith("E90");

      expect(await buidlerPool.validAcoCreators(await owner.getAddress())).to.equal(false);
    });
    it("Check withdraw stuck asset on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      let token3 = await (await ethers.getContractFactory("ERC20ForTest")).deploy("token3", "TK3", 6, token2TotalSupply);
      await token3.deployed();

      await token3.transfer(buidlerPool.address, 500000);
      expect(await token3.balanceOf(buidlerPool.address)).to.equal(500000);
      expect(await token3.balanceOf(await addr1.getAddress())).to.equal(0);

      await buidlerACOPoolFactory.withdrawStuckAssetOnAcoPool(token3.address, await addr1.getAddress(), [result.acoPool]);

      expect(await token3.balanceOf(buidlerPool.address)).to.equal(0);
      expect(await token3.balanceOf(await addr1.getAddress())).to.equal(500000);
    });
    it("Check fail to withdraw stuck asset on ACO", async function () {
      let tx = await (await buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 10000, (30*86400), defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool2", result.acoPool);
      
      let token3 = await (await ethers.getContractFactory("ERC20ForTest")).deploy("token3", "TK3", 6, token2TotalSupply);
      await token3.deployed();

      await token3.transfer(buidlerPool.address, 500000);
      await token1.transfer(buidlerPool.address, 500000);
      await token2.transfer(buidlerPool.address, 500000);
      expect(await token1.balanceOf(buidlerPool.address)).to.equal(500000);
      expect(await token2.balanceOf(buidlerPool.address)).to.equal(500000);
      expect(await token3.balanceOf(buidlerPool.address)).to.equal(500000);

      await expect(
        buidlerACOPoolFactory.connect(owner).withdrawStuckAssetOnAcoPool(token1.address, await owner.getAddress(), [result.acoPool])
      ).to.be.revertedWith("E80");
      await expect(
        buidlerACOPoolFactory.connect(owner).withdrawStuckAssetOnAcoPool(token2.address, await owner.getAddress(), [result.acoPool])
      ).to.be.revertedWith("E80");

      await expect(
        buidlerACOPoolFactory.connect(addr1).withdrawStuckAssetOnAcoPool(token3.address, await owner.getAddress(), [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
      await expect(
        buidlerPool.connect(owner).withdrawStuckToken(token3.address, await owner.getAddress())
      ).to.be.revertedWith("E90");

      expect(await token1.balanceOf(buidlerPool.address)).to.equal(500000);
      expect(await token2.balanceOf(buidlerPool.address)).to.equal(500000);
      expect(await token3.balanceOf(buidlerPool.address)).to.equal(500000);
    });
  });
});

