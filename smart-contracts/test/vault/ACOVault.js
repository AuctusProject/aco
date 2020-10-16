const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/ACOPoolFactory.json");
const factoryABI = require("../../artifacts/ACOFactory.json");
const { createAcoStrategy1 } = require("../pool/ACOStrategy1.js");
const { AddressZero } = require("ethers/constants");

let started = false;

describe("ACOVault", function() {
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 8;
  let token1TotalSupply = ethers.utils.bigNumberify("100000000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.utils.bigNumberify("1000000000000000");
  let pairToken1Token2;
  let pairWethToken2;
  let token1Liq = ethers.utils.bigNumberify("50000000000");
  let token2Liq = ethers.utils.bigNumberify("5000000000000");
  let wethLiq = ethers.utils.bigNumberify("12500000000000000000000");
  let aggregatorToken1Token2;
  let aggregatorWethToken2;
  let ACOFactory;
  let ACOPoolFactory;
  let defaultStrategy;
  let uniswapFactory;
  let weth;
  let uniswapRouter;
  let chiToken;
  let flashExercise;
  let converterHelper;
  let vault;
  let controller;
  let fee = ethers.utils.bigNumberify("100");
  let maxExercisedAccounts = 120;

  let token1Token2Price = ethers.utils.bigNumberify("10000000000");
  let ethToken2Price = ethers.utils.bigNumberify("400000000");
  let expiration;
  let start;
  let ethToken2BaseVolatility = 85000;
  let token1Token2BaseVolatility = 70000;
  let ACOEthToken2Call;
  let ACOEthToken2Put;
  let ACOToken1Token2Call;
  let ACOToken1Token2Put;
  let ACOPoolEthToken2Call;
  let ACOPoolEthToken2Put;
  let ACOPoolToken1Token2Call;
  let ACOPoolToken1Token2Put;
  let vaultStrategy;
  let mintr;
  let crv;
  let crvPoolToken;
  let coins;
  let gasSubsidyFee = 5000;

  const createVaultStrategy = async () => {
    let tokenName = "Curve DAO Token";
    let tokenSymbol = "CRV";
    let tokenDecimals = 18;
    let tokenTotalSupply = ethers.utils.bigNumberify("10000000000000000000000000");
    crv = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await crv.deployed();

    tokenName = "Curve Pool Token";
    tokenSymbol = "CRV Pool";
    tokenDecimals = 18;
    tokenTotalSupply = ethers.utils.bigNumberify("0");
    crvPoolToken = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await crvPoolToken.deployed();

    mintr = await (await ethers.getContractFactory("MintrForTest")).deploy(crv.address);
    await mintr.deployed();

    _gauge = await (await ethers.getContractFactory("GaugeForTest")).deploy(crvPoolToken.address);
    await _gauge.deployed();

    tokenName = "DAI";
    tokenSymbol = "DAI";
    tokenDecimals = 18;
    tokenTotalSupply = ethers.utils.bigNumberify("1000000000000000000000000");
    _coin1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await _coin1.deployed();

    tokenName = "USDT";
    tokenSymbol = "USDT";
    tokenDecimals = 6;
    tokenTotalSupply = ethers.utils.bigNumberify("1000000000000");
    _coin3 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await _coin3.deployed();

    coins = [_coin1.address, token2.address, _coin3.address];
    _curve = await (await ethers.getContractFactory("Curve3PoolForTest")).deploy(
      coins,
      crvPoolToken.address,
      100, 
      0
    );
    await _curve.deployed();

    await _coin1.connect(owner).approve(_curve.address, ethers.utils.bigNumberify("1000000000000000000"));
    await token2.connect(owner).approve(_curve.address, 1000000);
    await _coin3.connect(owner).approve(_curve.address, 1000000);
    await _curve.add_liquidity([ethers.utils.bigNumberify("1000000000000000000"), 1000000, 1000000], 0);

    vaultStrategy = await (await ethers.getContractFactory("ACOVaultUSDCStrategy3CRV")).deploy([
      _curve.address,
      _gauge.address,
      mintr.address,
      crv.address,
      crvPoolToken.address,
      controller.address,
      converterHelper.address,
      gasSubsidyFee
    ]);
    await vaultStrategy.deployed();
  }

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11, addr12, addr13, addr14, addr15, ...addrs] = await ethers.getSigners();
    
    if (!started) {
      let baseTx = {to: await owner.getAddress(), value: ethers.utils.bigNumberify("4500000000000000000000")};
      await addr10.sendTransaction(baseTx);
      await addr11.sendTransaction(baseTx);
      await addr12.sendTransaction(baseTx);
      await addr13.sendTransaction(baseTx);
      await addr14.sendTransaction(baseTx);
      await addr15.sendTransaction(baseTx);
      started = true;
    }

    let ACOFactoryTemp = await (await ethers.getContractFactory("ACOFactoryV2")).deploy();
    await ACOFactoryTemp.deployed();

    let ACOTokenTemp = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOTokenTemp.deployed();

    let factoryInterface = new ethers.utils.Interface(factoryABI.abi);
    let factoryInitData = factoryInterface.functions.init.encode([await owner.getAddress(), ACOTokenTemp.address, 0, await addr3.getAddress()]);
    let buidlerACOFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOFactoryTemp.address, factoryInitData);
    await buidlerACOFactoryProxy.deployed();
    ACOFactory = await ethers.getContractAt("ACOFactoryV2", buidlerACOFactoryProxy.address);

    uniswapFactory = await (await ethers.getContractFactory("UniswapV2Factory")).deploy(await owner.getAddress());
    await uniswapFactory.deployed();
    weth = await (await ethers.getContractFactory("WETH9")).deploy();
    await weth.deployed(); 
    uniswapRouter = await (await ethers.getContractFactory("UniswapV2Router02")).deploy(uniswapFactory.address, weth.address);
    await uniswapRouter.deployed();
    flashExercise = await (await ethers.getContractFactory("ACOFlashExercise")).deploy(uniswapRouter.address);
    await flashExercise.deployed();
    chiToken = await (await ethers.getContractFactory("ChiToken")).deploy();
    await chiToken.deployed();
    
    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    await token1.connect(owner).transfer(await addr1.getAddress(), ethers.utils.bigNumberify("100000000000000"));
    await token1.connect(owner).transfer(await addr2.getAddress(), ethers.utils.bigNumberify("100000000000000"));
    await token1.connect(owner).transfer(await addr3.getAddress(), ethers.utils.bigNumberify("100000000000000"));

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    await token2.connect(owner).transfer(await addr1.getAddress(), ethers.utils.bigNumberify("1000000000000"));
    await token2.connect(owner).transfer(await addr2.getAddress(), ethers.utils.bigNumberify("1000000000000"));
    await token2.connect(owner).transfer(await addr3.getAddress(), ethers.utils.bigNumberify("1000000000000"));

    aggregatorToken1Token2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, token1Token2Price.mul(100));
    await aggregatorToken1Token2.deployed();

    aggregatorWethToken2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, ethToken2Price.mul(100));
    await aggregatorWethToken2.deployed();

    await uniswapFactory.createPair(token1.address, token2.address);
    await uniswapFactory.createPair(token2.address, weth.address);
    
    pairToken1Token2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token1.address, token2.address));
    pairWethToken2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token2.address, weth.address));

    converterHelper = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);

    await token1.connect(owner).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr1).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr2).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr3).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(owner).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr1).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr2).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr3).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(owner).approve(converterHelper.address, token1TotalSupply);
    await token1.connect(addr1).approve(converterHelper.address, token1TotalSupply);
    await token1.connect(addr2).approve(converterHelper.address, token1TotalSupply);
    await token1.connect(addr3).approve(converterHelper.address, token1TotalSupply);
    await token2.connect(owner).approve(pairWethToken2.address, token2TotalSupply);
    await token2.connect(addr1).approve(pairWethToken2.address, token2TotalSupply);
    await token2.connect(addr2).approve(pairWethToken2.address, token2TotalSupply);
    await token2.connect(addr3).approve(pairWethToken2.address, token2TotalSupply);
    await token2.connect(owner).approve(pairToken1Token2.address, token2TotalSupply);
    await token2.connect(addr1).approve(pairToken1Token2.address, token2TotalSupply);
    await token2.connect(addr2).approve(pairToken1Token2.address, token2TotalSupply);
    await token2.connect(addr3).approve(pairToken1Token2.address, token2TotalSupply);
    await token2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);
    await token2.connect(addr1).approve(uniswapRouter.address, token2TotalSupply);
    await token2.connect(addr2).approve(uniswapRouter.address, token2TotalSupply);
    await token2.connect(addr3).approve(uniswapRouter.address, token2TotalSupply);
    await token2.connect(owner).approve(converterHelper.address, token2TotalSupply);
    await token2.connect(addr1).approve(converterHelper.address, token2TotalSupply);
    await token2.connect(addr2).approve(converterHelper.address, token2TotalSupply);
    await token2.connect(addr3).approve(converterHelper.address, token2TotalSupply);
    await pairToken1Token2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);
    await pairWethToken2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);

    await token1.connect(owner).transfer(pairToken1Token2.address, token1Liq);
    await token2.connect(owner).transfer(pairToken1Token2.address, token2Liq);
    await pairToken1Token2.connect(owner).mint(await owner.getAddress());
  
    await token2.connect(owner).transfer(pairWethToken2.address, token2Liq);
    await weth.connect(owner).deposit({value: wethLiq});
    await weth.connect(owner).transfer(pairWethToken2.address, wethLiq);
    await pairWethToken2.connect(owner).mint(await owner.getAddress());

    defaultStrategy = await createAcoStrategy1();
    await defaultStrategy.setAgreggator(token1.address, token2.address, aggregatorToken1Token2.address);
    await defaultStrategy.setAgreggator(AddressZero, token2.address, aggregatorWethToken2.address);

    await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);
    await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);
    await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 1250);
    await converterHelper.setPairTolerancePercentage(AddressZero, token2.address, 1250);

    let ACOPoolTemp = await (await ethers.getContractFactory("ACOPool")).deploy();
    await ACOPoolTemp.deployed();

    let ACOPoolFactoryTemp = await (await ethers.getContractFactory("ACOPoolFactory")).deploy();
    await ACOPoolFactoryTemp.deployed();
    
    let poolFactoryInterface = new ethers.utils.Interface(poolFactoryABI.abi);
    let poolFactoryInitData = poolFactoryInterface.functions.init.encode([await owner.getAddress(), ACOPoolTemp.address, buidlerACOFactoryProxy.address, flashExercise.address, chiToken.address, fee, await addr3.getAddress()]);
    let buidlerACOPoolFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOPoolFactoryTemp.address, poolFactoryInitData);
    await buidlerACOPoolFactoryProxy.deployed();
    ACOPoolFactory = await ethers.getContractAt("ACOPoolFactory", buidlerACOPoolFactoryProxy.address);

    await ACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);

    let current = await getCurrentTimestamp();
    expiration = current + 4 * 86400;

    let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, token1Token2Price, expiration, maxExercisedAccounts)).wait();
    let result0 = tx.events[tx.events.length - 1].args;
    ACOToken1Token2Call = await ethers.getContractAt("ACOToken", result0.acoToken);

    let tx2 = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, token1Token2Price, expiration, maxExercisedAccounts)).wait();
    let result2 = tx2.events[tx2.events.length - 1].args;
    ACOToken1Token2Put = await ethers.getContractAt("ACOToken", result2.acoToken);

    let tx4 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, true, ethToken2Price, expiration, maxExercisedAccounts)).wait();
    let result4 = tx4.events[tx4.events.length - 1].args;
    ACOEthToken2Call = await ethers.getContractAt("ACOToken", result4.acoToken);

    let tx6 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, ethToken2Price, expiration, maxExercisedAccounts)).wait();
    let result6 = tx6.events[tx6.events.length - 1].args;
    ACOEthToken2Put = await ethers.getContractAt("ACOToken", result6.acoToken);

    current = await getCurrentTimestamp();
    start = current + 180;

    let tx8 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, start, ethers.utils.bigNumberify("9000000000"), ethers.utils.bigNumberify("12000000000"), start, expiration, false, defaultStrategy.address, token1Token2BaseVolatility)).wait();
    let result8 = tx8.events[tx8.events.length - 1].args;
    ACOPoolToken1Token2Call = await ethers.getContractAt("ACOPool", result8.acoPool);

    let tx9 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, start, ethers.utils.bigNumberify("9000000000"), ethers.utils.bigNumberify("12000000000"), start, expiration, false, defaultStrategy.address, token1Token2BaseVolatility)).wait();
    let result9 = tx9.events[tx9.events.length - 1].args;
    ACOPoolToken1Token2Put = await ethers.getContractAt("ACOPool", result9.acoPool);
    
    let tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, start, ethers.utils.bigNumberify("300000000"), ethers.utils.bigNumberify("500000000"), start, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
    let result10 = tx10.events[tx10.events.length - 1].args;
    ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool", result10.acoPool);

    let tx11 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, start, ethers.utils.bigNumberify("300000000"), ethers.utils.bigNumberify("500000000"), start, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
    let result11 = tx11.events[tx11.events.length - 1].args;
    ACOPoolEthToken2Put = await ethers.getContractAt("ACOPool", result11.acoPool);

    let d1 = ethers.utils.bigNumberify("50000000000000000000");
    await ACOPoolEthToken2Call.connect(owner).deposit(d1, await owner.getAddress(), {value: d1});
    
    await token1.connect(owner).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
    let d2 = ethers.utils.bigNumberify("1000000000000");
    await ACOPoolToken1Token2Call.connect(owner).deposit(d2, await owner.getAddress());
    
    await token2.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
    let d3 = ethers.utils.bigNumberify("1000000000000");
    await ACOPoolEthToken2Put.connect(owner).deposit(d3, await owner.getAddress());
    
    await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
    let d4 = ethers.utils.bigNumberify("1000000000000");
    await ACOPoolToken1Token2Put.connect(owner).deposit(d4, await owner.getAddress());

    await jumpUntilStart(start);

    vault = await (await ethers.getContractFactory("ACOVault")).deploy([
      ACOFactory.address,
      ACOPoolFactory.address,
      token2.address,
      converterHelper.address,
      flashExercise.address,
      5000,
      ACOEthToken2Call.address,
      ACOPoolEthToken2Call.address,
      4000,
      4000,
      86400,
      86400 * 5,
      86400,
      2000,
      500
    ]);
    await vault.deployed();

    controller = await (await ethers.getContractFactory("Controller")).deploy(await owner.getAddress());
    await controller.deployed();

    await createVaultStrategy();

    await controller.setVault(vault.address, vaultStrategy.address);
    
    await vault.setController(controller.address);
  });

  afterEach(async function () {
    let addr = await owner.getAddress();
    let balLP2 = await pairWethToken2.balanceOf(addr);
    await pairWethToken2.connect(owner).transfer(pairWethToken2.address, balLP2);
    await pairWethToken2.connect(owner).burn(addr);
    let balWETH = await weth.balanceOf(addr);
    await weth.connect(owner).withdraw(balWETH);
  });

  describe("Set functions", function () {
    it("Set controller", async function () {
      expect(await vault.controller()).to.equal(controller.address);

      let controller2 = await (await ethers.getContractFactory("Controller")).deploy(await owner.getAddress());
      await controller2.deployed();
      await vault.setController(controller2.address);
      expect(await vault.controller()).to.equal(controller2.address);

      await expect(
        vault.setController(await addr1.getAddress())
      ).to.be.revertedWith("ACOVault:: Invalid controller");
      expect(await vault.controller()).to.equal(controller2.address);

      await expect(
        vault.connect(addr1).setController(controller.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.controller()).to.equal(controller2.address);

      await vault.setController(controller.address);
      expect(await vault.controller()).to.equal(controller.address);
    });
    it("Set asset converter", async function () {
      expect(await vault.assetConverter()).to.equal(converterHelper.address);

      let converterHelper2 = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
      await converterHelper2.deployed();
      await vault.setAssetConverter(converterHelper2.address);
      expect(await vault.assetConverter()).to.equal(converterHelper2.address);

      await expect(
        vault.setAssetConverter(await addr1.getAddress())
      ).to.be.revertedWith("ACOVault:: Invalid asset converter");
      expect(await vault.assetConverter()).to.equal(converterHelper2.address);

      await expect(
        vault.connect(addr1).setAssetConverter(converterHelper.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.assetConverter()).to.equal(converterHelper2.address);

      await vault.setAssetConverter(converterHelper.address);
      expect(await vault.assetConverter()).to.equal(converterHelper.address);
    });
    it("Set flash exercise", async function () {
      expect(await vault.acoFlashExercise()).to.equal(flashExercise.address);

      let flashExercise2 = await (await ethers.getContractFactory("ACOFlashExercise")).deploy(uniswapRouter.address);
      await flashExercise2.deployed();
      await vault.setAcoFlashExercise(flashExercise2.address);
      expect(await vault.acoFlashExercise()).to.equal(flashExercise2.address);

      await expect(
        vault.setAcoFlashExercise(await addr1.getAddress())
      ).to.be.revertedWith("ACOVault:: Invalid ACO flash exercise");
      expect(await vault.acoFlashExercise()).to.equal(flashExercise2.address);

      await expect(
        vault.connect(addr1).setAcoFlashExercise(flashExercise.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.acoFlashExercise()).to.equal(flashExercise2.address);

      await vault.setAcoFlashExercise(flashExercise.address);
      expect(await vault.acoFlashExercise()).to.equal(flashExercise.address);
    });
    it("Set minimum percentage to keep", async function () {
      expect(await vault.minPercentageToKeep()).to.equal(5000);

      await vault.setMinPercentageToKeep(0);
      expect(await vault.minPercentageToKeep()).to.equal(0);

      await expect(
        vault.setMinPercentageToKeep(100000)
      ).to.be.revertedWith("ACOVault:: Invalid percentage");
      expect(await vault.minPercentageToKeep()).to.equal(0);

      await expect(
        vault.connect(addr1).setMinPercentageToKeep(10000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.minPercentageToKeep()).to.equal(0);

      await vault.setMinPercentageToKeep(10000);
      expect(await vault.minPercentageToKeep()).to.equal(10000);
    });
    it("Set price tolerance percentage above", async function () {
      expect(await vault.tolerancePriceAbove()).to.equal(4000);

      await vault.setTolerancePriceAbove(0);
      expect(await vault.tolerancePriceAbove()).to.equal(0);

      await expect(
        vault.setTolerancePriceAbove(100000)
      ).to.be.revertedWith("ACOVault:: Invalid tolerance");
      expect(await vault.tolerancePriceAbove()).to.equal(0);

      await expect(
        vault.connect(addr1).setTolerancePriceAbove(10000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.tolerancePriceAbove()).to.equal(0);

      await vault.setTolerancePriceAbove(10000);
      expect(await vault.tolerancePriceAbove()).to.equal(10000);
    });
    it("Set price tolerance percentage below", async function () {
      expect(await vault.tolerancePriceBelow()).to.equal(4000);

      await vault.setTolerancePriceBelow(0);
      expect(await vault.tolerancePriceBelow()).to.equal(0);

      await expect(
        vault.setTolerancePriceBelow(100000)
      ).to.be.revertedWith("ACOVault:: Invalid tolerance");
      expect(await vault.tolerancePriceBelow()).to.equal(0);

      await expect(
        vault.connect(addr1).setTolerancePriceBelow(10000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.tolerancePriceBelow()).to.equal(0);

      await vault.setTolerancePriceBelow(10000);
      expect(await vault.tolerancePriceBelow()).to.equal(10000);
    });
    it("Set minimum expiration", async function () {
      expect(await vault.minExpiration()).to.equal(86400);

      await vault.setMinExpiration(86400 * 3);
      expect(await vault.minExpiration()).to.equal(86400 * 3);

      await expect(
        vault.setMinExpiration((await vault.maxExpiration()) + 1)
      ).to.be.revertedWith("ACOVault:: Invalid min expiration");
      expect(await vault.minExpiration()).to.equal(86400 * 3);

      await expect(
        vault.connect(addr1).setMinExpiration(86400 * 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.minExpiration()).to.equal(86400 * 3);

      await vault.setMinExpiration(86400 * 2);
      expect(await vault.minExpiration()).to.equal(86400 * 2);
    });
    it("Set maximum expiration", async function () {
      expect(await vault.maxExpiration()).to.equal(86400 * 5);

      await vault.setMaxExpiration(86400);
      expect(await vault.maxExpiration()).to.equal(86400);

      await expect(
        vault.setMaxExpiration((await vault.minExpiration()) - 1)
      ).to.be.revertedWith("ACOVault:: Invalid max expiration");
      expect(await vault.maxExpiration()).to.equal(86400);

      await expect(
        vault.connect(addr1).setMaxExpiration(86400 * 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.maxExpiration()).to.equal(86400);

      await vault.setMaxExpiration(86400 * 2);
      expect(await vault.maxExpiration()).to.equal(86400 * 2);
    });
    it("Set minimum time to exercise", async function () {
      expect(await vault.minTimeToExercise()).to.equal(86400);

      await vault.setMinTimeToExercise(43200);
      expect(await vault.minTimeToExercise()).to.equal(43200);

      await expect(
        vault.setMinTimeToExercise(3500)
      ).to.be.revertedWith("ACOVault:: Invalid min time to exercise");
      expect(await vault.minTimeToExercise()).to.equal(43200);

      await expect(
        vault.connect(addr1).setMinTimeToExercise(86400 * 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.minTimeToExercise()).to.equal(43200);

      await vault.setMinTimeToExercise(86400 * 2);
      expect(await vault.minTimeToExercise()).to.equal(86400 * 2);
    });
    it("Set exercise slippage", async function () {
      expect(await vault.exerciseSlippage()).to.equal(2000);

      await vault.setExerciseSlippage(0);
      expect(await vault.exerciseSlippage()).to.equal(0);

      await expect(
        vault.setExerciseSlippage(100000)
      ).to.be.revertedWith("ACOVault:: Invalid exercise slippage");
      expect(await vault.exerciseSlippage()).to.equal(0);

      await expect(
        vault.connect(addr1).setExerciseSlippage(10000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.exerciseSlippage()).to.equal(0);

      await vault.setExerciseSlippage(10000);
      expect(await vault.exerciseSlippage()).to.equal(10000);
    });
    it("Set withdraw fee", async function () {
      expect(await vault.withdrawFee()).to.equal(500);

      await vault.setWithdrawFee(0);
      expect(await vault.withdrawFee()).to.equal(0);

      await expect(
        vault.setWithdrawFee(1001)
      ).to.be.revertedWith("ACOVault:: Invalid withdraw fee");
      expect(await vault.withdrawFee()).to.equal(0);

      await expect(
        vault.connect(addr1).setWithdrawFee(10000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.withdrawFee()).to.equal(0);

      await vault.setWithdrawFee(1000);
      expect(await vault.withdrawFee()).to.equal(1000);
    });
    it("Set ACO pool", async function () {
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Call.address);

      let start2 = (await getCurrentTimestamp()) + 20;
      let tx = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, start2, ethers.utils.bigNumberify("390000000"), ethers.utils.bigNumberify("410000000"), start2, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let ACOPoolEthToken2Call2 = await ethers.getContractAt("ACOPool", result.acoPool);
      await jumpUntilStart(start2);

      await vault.setAcoPool(ACOPoolEthToken2Call2.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Call2.address);

      await expect(
        vault.connect(addr3).setAcoPool(ACOPoolEthToken2Call.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Call2.address);

      await expect(
        vault.setAcoPool(ACOPoolEthToken2Put.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO pool");
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Call2.address);

      await vault.setAcoPool(ACOPoolEthToken2Call.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Call.address);
    });
    it("Set ACO token", async function () {
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Call.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Call.address);

      await vault.setAcoToken(ACOEthToken2Put.address, ACOPoolEthToken2Put.address);
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      await expect(
        vault.connect(addr3).setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Call.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      let ACOTokenTemp = await (await ethers.getContractFactory("ACOToken")).deploy();
      await ACOTokenTemp.deployed();
      await expect(
        vault.setAcoToken(ACOTokenTemp.address, ACOPoolToken1Token2Put.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO token");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      await vault.setMinExpiration(86400 * 5);
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO expiry time");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      await vault.setMinExpiration(86400);
      await vault.setMaxExpiration(86400 * 2);
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO expiry time");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      await vault.setMaxExpiration(86400 * 5);
      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(104).add(100));
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO strike price");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(96).sub(100));
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO strike price");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(100));
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Put.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO pool");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Put.address);

      await vault.setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Call.address);
      expect(await vault.currentAcoToken()).to.equal(ACOToken1Token2Call.address);
      expect(await vault.acoPool()).to.equal(ACOPoolToken1Token2Call.address);
    });
  });

  describe("Vault transactions", function () {
    it("Vault Deposit", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);
      
      let depositValue = 10000 * 1000000;
      await vault.connect(addr1).deposit(depositValue);      
      await expect(await vault.balance()).to.equal(depositValue);
      let shares = await vault.balanceOf(await addr1.getAddress());
      [accountBalance, fee, acos, acosAmount] = await vault.getAccountSituation(await addr1.getAddress(), shares);
      await expect(accountBalance.add(fee)).to.equal(depositValue);
      
      await vault.connect(addr2).deposit(depositValue);
      await expect(await vault.balance()).to.equal(2*depositValue);
      shares = await vault.balanceOf(await addr2.getAddress());
      [accountBalance, fee, acos, acosAmount] = await vault.getAccountSituation(await addr2.getAddress(), shares);
      await expect(accountBalance.add(fee)).to.equal(depositValue);

      await vault.connect(addr3).deposit(depositValue);
      await expect(await vault.balance()).to.equal(3*depositValue);
      shares = await vault.balanceOf(await addr3.getAddress());
      [accountBalance, fee, acos, acosAmount] = await vault.getAccountSituation(await addr3.getAddress(), shares);
      await expect(accountBalance.add(fee)).to.equal(depositValue);

      await vault.connect(addr3).deposit(depositValue);
      await expect(await vault.balance()).to.equal(4*depositValue);
      shares = await vault.balanceOf(await addr3.getAddress());
      [accountBalance, fee, acos, acosAmount] = await vault.getAccountSituation(await addr3.getAddress(), shares);
      await expect(accountBalance.add(fee)).to.equal(2*depositValue);
    });
  });
});

const getCurrentTimestamp = async () => {
  let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
  return parseInt(block.timestamp, 16);
};

const jumpUntilStart = async (start) => {
  let time = await getCurrentTimestamp();
  while (time < start) {
    await network.provider.send("evm_mine");
    time = await getCurrentTimestamp();
  } 
};