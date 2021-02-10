const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/contracts/periphery/pool/ACOPoolFactory2.sol/ACOPoolFactory2.json");
const factoryABI = require("../../artifacts/contracts/core/ACOFactory.sol/ACOFactory.json");
const { createAcoPoolStrategy } = require("../pool/ACOPoolStrategy.js");
const AddressZero = "0x0000000000000000000000000000000000000000";

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
  let token1TotalSupply = ethers.BigNumber.from("100000000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.BigNumber.from("1000000000000000");
  let pairToken1Token2;
  let pairWethToken2;
  let token1Liq = ethers.BigNumber.from("50000000000");
  let token2Liq = ethers.BigNumber.from("5000000000000");
  let wethLiq = ethers.BigNumber.from("12500000000000000000000");
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
  let fee = ethers.BigNumber.from("100");
  let maxExercisedAccounts = 120;
  let minToKeep = 5000;
  let withdrawFee = 500;
  let tolerance = 10000;
  let minTimeToExercise = 43200;

  let token1Token2Price = ethers.BigNumber.from("10000000000");
  let ethToken2Price = ethers.BigNumber.from("400000000");
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
  let _gauge;
  let crv;
  let crvPoolToken;
  let coins;
  let gasSubsidyFee = 5000;

  const createVaultStrategy = async () => {
    let tokenName = "Curve DAO Token";
    let tokenSymbol = "CRV";
    let tokenDecimals = 18;
    let tokenTotalSupply = ethers.BigNumber.from("10000000000000000000000000");
    crv = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await crv.deployed();

    tokenName = "Curve Pool Token";
    tokenSymbol = "CRV Pool";
    tokenDecimals = 18;
    tokenTotalSupply = ethers.BigNumber.from("0");
    crvPoolToken = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await crvPoolToken.deployed();

    mintr = await (await ethers.getContractFactory("MintrForTest")).deploy(crv.address);
    await mintr.deployed();

    _gauge = await (await ethers.getContractFactory("GaugeForTest")).deploy(crvPoolToken.address);
    await _gauge.deployed();

    tokenName = "DAI";
    tokenSymbol = "DAI";
    tokenDecimals = 18;
    tokenTotalSupply = ethers.BigNumber.from("1000000000000000000000000");
    _coin1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await _coin1.deployed();

    tokenName = "USDT";
    tokenSymbol = "USDT";
    tokenDecimals = 6;
    tokenTotalSupply = ethers.BigNumber.from("1000000000000");
    _coin3 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await _coin3.deployed();

    coins = [_coin1.address, token2.address, _coin3.address];
    _curve = await (await ethers.getContractFactory("Curve3PoolForTest")).deploy(
      coins,
      crvPoolToken.address,
      200, 
      0
    );
    await _curve.deployed();

    await _coin1.connect(owner).approve(_curve.address, ethers.BigNumber.from("50000000000000000000000"));
    await token2.connect(owner).approve(_curve.address, 50000 * 1000000);
    await _coin3.connect(owner).approve(_curve.address, 50000 * 1000000);
    await _curve.add_liquidity([ethers.BigNumber.from("50000000000000000000000"), 50000 * 1000000, 50000 * 1000000], 0);

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

    await uniswapFactory.createPair(crv.address, token2.address);
    let pairCrvToken2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(crv.address, token2.address));
    await token2.connect(owner).transfer(pairCrvToken2.address, token2Liq);
    await crv.connect(owner).transfer(pairCrvToken2.address, ethers.BigNumber.from("5000000000000000000000000"));
    await pairCrvToken2.connect(owner).mint(await owner.getAddress());
  };

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11, addr12, addr13, addr14, addr15, ...addrs] = await ethers.getSigners();
    
    if (!started) {
      let baseTx = {to: await owner.getAddress(), value: ethers.BigNumber.from("4500000000000000000000")};
      await addr10.sendTransaction(baseTx);
      await addr11.sendTransaction(baseTx);
      await addr12.sendTransaction(baseTx);
      await addr13.sendTransaction(baseTx);
      await addr14.sendTransaction(baseTx);
      await addr15.sendTransaction(baseTx);
      started = true;
    }

    let ACOFactoryTemp = await (await ethers.getContractFactory("ACOFactoryV3")).deploy();
    await ACOFactoryTemp.deployed();

    let ACOTokenTemp = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOTokenTemp.deployed();

    let factoryInterface = new ethers.utils.Interface(factoryABI.abi);
    let factoryInitData = factoryInterface.encodeFunctionData("init", [await owner.getAddress(), ACOTokenTemp.address, 0, await addr3.getAddress()]);
    let buidlerACOFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOFactoryTemp.address, factoryInitData);
    await buidlerACOFactoryProxy.deployed();
    ACOFactory = await ethers.getContractAt("ACOFactoryV3", buidlerACOFactoryProxy.address);
    await ACOFactory.setOperator(await owner.getAddress(), true);

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

    await token1.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("100000000000000"));
    await token1.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("100000000000000"));
    await token1.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("100000000000000"));

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    await token2.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("1000000000000"));
    await token2.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("1000000000000"));
    await token2.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("1000000000000"));

    aggregatorToken1Token2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, token1Token2Price.mul(95));
    await aggregatorToken1Token2.deployed();

    aggregatorWethToken2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, ethToken2Price.mul(95));
    await aggregatorWethToken2.deployed();

    await uniswapFactory.createPair(token1.address, token2.address);
    await uniswapFactory.createPair(token2.address, weth.address);
    
    pairToken1Token2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token1.address, token2.address));
    pairWethToken2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token2.address, weth.address));

    converterHelper = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
    await converterHelper.deployed();

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

    defaultStrategy = await createAcoPoolStrategy();
    await defaultStrategy.setAssetPrecision(token2.address);

    await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);
    await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);
    await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 1250);
    await converterHelper.setPairTolerancePercentage(AddressZero, token2.address, 1250);

    let poolLib = await (await ethers.getContractFactory("ACOPoolLib")).deploy();
    await poolLib.deployed();
    let ACOPoolTemp = await (await ethers.getContractFactory("ACOPool2", {libraries:{ACOPoolLib:poolLib.address}})).deploy();
    await ACOPoolTemp.deployed();

    let ACOPoolFactoryTemp = await (await ethers.getContractFactory("ACOPoolFactory2V3")).deploy();
    await ACOPoolFactoryTemp.deployed();
    
    let poolFactoryInterface = new ethers.utils.Interface(poolFactoryABI.abi);
    let poolFactoryInitData = poolFactoryInterface.encodeFunctionData("init", [await owner.getAddress(), ACOPoolTemp.address, buidlerACOFactoryProxy.address, converterHelper.address, chiToken.address, fee, await addr3.getAddress(), 10000, 500, 50]);
    let buidlerACOPoolFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOPoolFactoryTemp.address, poolFactoryInitData);
    await buidlerACOPoolFactoryProxy.deployed();
    ACOPoolFactory = await ethers.getContractAt("ACOPoolFactory2V3", buidlerACOPoolFactoryProxy.address);
    
    await ACOPoolFactory.setAuthorizedAcoCreator(await owner.getAddress(), true);
    await ACOPoolFactory.setOperator(await owner.getAddress(), true);
    await ACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);

    let lendingPool = await (await ethers.getContractFactory("LendingPoolForTest")).deploy(ethers.BigNumber.from("3000000000000000000000"));
    await lendingPool.deployed();
    await token2.approve(lendingPool.address, token2TotalSupply);
    await lendingPool.setAsset(token2.address, token2TotalSupply.div(4));
    await ACOPoolFactory.setAcoPoolLendingPool(lendingPool.address);

    let current = await getCurrentTimestamp();
    expiration = current + 4 * 86400;

    let tx4 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, true, ethToken2Price.mul(95).div(100), expiration, maxExercisedAccounts)).wait();
    let result4 = tx4.events[tx4.events.length - 1].args;
    ACOEthToken2Call = await ethers.getContractAt("ACOToken", result4.acoToken);

    let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, token1Token2Price.mul(95).div(100), expiration+minTimeToExercise, maxExercisedAccounts)).wait();
    let result0 = tx.events[tx.events.length - 1].args;
    ACOToken1Token2Call = await ethers.getContractAt("ACOToken", result0.acoToken);

    let tx6 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, ethToken2Price.mul(105).div(100), expiration+2*minTimeToExercise, maxExercisedAccounts)).wait();
    let result6 = tx6.events[tx6.events.length - 1].args;
    ACOEthToken2Put = await ethers.getContractAt("ACOToken", result6.acoToken);

    let tx2 = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, token1Token2Price.mul(105).div(100), expiration+3*minTimeToExercise, maxExercisedAccounts)).wait();
    let result2 = tx2.events[tx2.events.length - 1].args;
    ACOToken1Token2Put = await ethers.getContractAt("ACOToken", result2.acoToken);

    current = await getCurrentTimestamp();
    start = current + 180;

    let tx8 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, 30000, 30000, 0, expiration+4*minTimeToExercise, token1Token2BaseVolatility, await owner.getAddress(), defaultStrategy.address)).wait();
    let result8 = tx8.events[tx8.events.length - 1].args;
    ACOPoolToken1Token2Call = await ethers.getContractAt("ACOPool2", result8.acoPool);

    let tx9 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, 30000, 30000, 0, expiration+4*minTimeToExercise, token1Token2BaseVolatility, await owner.getAddress(), defaultStrategy.address)).wait();
    let result9 = tx9.events[tx9.events.length - 1].args;
    ACOPoolToken1Token2Put = await ethers.getContractAt("ACOPool2", result9.acoPool);
    
    let tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, 30000, 30000, 0, expiration+4*minTimeToExercise, ethToken2BaseVolatility, await owner.getAddress(), defaultStrategy.address)).wait();
    let result10 = tx10.events[tx10.events.length - 1].args;
    ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool2", result10.acoPool);

    let tx11 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, 30000, 30000, 0, expiration+4*minTimeToExercise, ethToken2BaseVolatility, await owner.getAddress(), defaultStrategy.address)).wait();
    let result11 = tx11.events[tx11.events.length - 1].args;
    ACOPoolEthToken2Put = await ethers.getContractAt("ACOPool2", result11.acoPool);

    let d1 = ethers.BigNumber.from("50000000000000000000");
    await ACOPoolEthToken2Call.connect(owner).deposit(d1, 1, await owner.getAddress(), false, {value: d1});

    await token1.connect(owner).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
    let d2 = ethers.BigNumber.from("1000000000000");
    await ACOPoolToken1Token2Call.connect(owner).deposit(d2, 1, await owner.getAddress(), false);
    
    await token2.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
    let d3 = ethers.BigNumber.from("1000000000000");
    await ACOPoolEthToken2Put.connect(owner).deposit(d3, 1, await owner.getAddress(), false);
    
    await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
    let d4 = ethers.BigNumber.from("1000000000000");
    await ACOPoolToken1Token2Put.connect(owner).deposit(d4, 1, await owner.getAddress(), false);

    await jumpUntilStart(start);

    vault = await (await ethers.getContractFactory("ACOVault")).deploy([
      ACOFactory.address,
      ACOPoolFactory.address,
      token2.address,
      converterHelper.address,
      flashExercise.address,
      minToKeep,
      ACOEthToken2Call.address,
      tolerance,
      tolerance,
      86400,
      86400 * 5,
      minTimeToExercise,
      2000,
      withdrawFee
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
      expect(await vault.tolerancePriceAbove()).to.equal(tolerance);

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
      expect(await vault.tolerancePriceBelow()).to.equal(tolerance);

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
      expect(await vault.minTimeToExercise()).to.equal(minTimeToExercise);

      await vault.setMinTimeToExercise(minTimeToExercise*2);
      expect(await vault.minTimeToExercise()).to.equal(minTimeToExercise*2);

      await expect(
        vault.setMinTimeToExercise(3500)
      ).to.be.revertedWith("ACOVault:: Invalid min time to exercise");
      expect(await vault.minTimeToExercise()).to.equal(minTimeToExercise*2);

      await expect(
        vault.connect(addr1).setMinTimeToExercise(86400 * 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.minTimeToExercise()).to.equal(minTimeToExercise*2);

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
    it("Set ACO token", async function () {
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Call.address);

      await vault.setAcoToken(ACOEthToken2Put.address);
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);

      await expect(
        vault.connect(addr3).setAcoToken(ACOToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid sender");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);

      let ACOTokenTemp = await (await ethers.getContractFactory("ACOToken")).deploy();
      await ACOTokenTemp.deployed();
      await expect(
        vault.setAcoToken(ACOTokenTemp.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO token");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);

      await vault.setMinExpiration(86400 * 5);
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO expiry time");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);

      await vault.setMinExpiration(86400);
      await vault.setMaxExpiration(86400 * 3);
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO expiry time");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);

      await vault.setMaxExpiration(86400 * 5);
      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(95).mul(100000+tolerance).div(100000).add(100));
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO strike price");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);

      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(95).mul(100000-tolerance).div(100000).sub(100));
      await expect(
        vault.setAcoToken(ACOToken1Token2Call.address)
      ).to.be.revertedWith("ACOVault:: Invalid ACO strike price");
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Put.address);

      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(100));

      await vault.setOperator(await addr3.getAddress(), true);
      await vault.connect(addr3).setAcoToken(ACOToken1Token2Call.address);
      expect(await vault.currentAcoToken()).to.equal(ACOToken1Token2Call.address);
    });
    it("Set Operator", async function () {
      expect(await vault.operators(await owner.getAddress())).to.equal(true);

      await expect(
        vault.connect(addr1).setOperator(await owner.getAddress(), false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vault.operators(await owner.getAddress())).to.equal(true);

      expect(await vault.operators(await addr2.getAddress())).to.equal(false);
      await vault.setOperator(await addr2.getAddress(), true);
      expect(await vault.operators(await addr2.getAddress())).to.equal(true);

      await vault.setOperator(await addr2.getAddress(), false);
      expect(await vault.operators(await addr2.getAddress())).to.equal(false);
    });
  });

  describe("Vault transactions", function () {
    it("Vault Deposit", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);
      
      let depositValue = 100 * 1000000;
      await vault.connect(addr1).deposit(depositValue);      
      await expect(await vault.balance()).to.equal(depositValue);
      let shares = await vault.balanceOf(await addr1.getAddress());
      [accountBalance1, fee1, acos, acosAmount] = await vault.getAccountSituation(await addr1.getAddress(), shares);
      await expect(accountBalance1.add(fee1)).to.equal(depositValue);
      
      await vault.connect(addr2).deposit(depositValue);
      await expect(await vault.balance()).to.equal(2*depositValue);
      shares = await vault.balanceOf(await addr2.getAddress());
      [accountBalance2, fee2, acos, acosAmount] = await vault.getAccountSituation(await addr2.getAddress(), shares);
      await expect(accountBalance2.add(fee2)).to.equal(depositValue);

      await vault.connect(addr3).deposit(depositValue);
      await expect(await vault.balance()).to.equal(3*depositValue);
      shares = await vault.balanceOf(await addr3.getAddress());
      [accountBalance3, fee3, acos, acosAmount] = await vault.getAccountSituation(await addr3.getAddress(), shares);
      await expect(accountBalance3.add(fee3)).to.equal(depositValue);

      await vault.connect(addr3).deposit(depositValue);
      await expect(await vault.balance()).to.equal(4*depositValue);
      shares = await vault.balanceOf(await addr3.getAddress());
      [accountBalance3, fee3, acos, acosAmount] = await vault.getAccountSituation(await addr3.getAddress(), shares);
      await expect(accountBalance3.add(fee3)).to.equal(2*depositValue);

      await vault.earn();
    });
    it("Vault earn", async function () {
      let deposit = ethers.BigNumber.from("10000000000");
      let remain = deposit.mul(minToKeep).div(100000);
      await token2.connect(owner).approve(vault.address, token2TotalSupply);
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);

      await expect(
        vault.connect(addr3).earn()
      ).to.be.revertedWith("ACOVault:: Invalid sender");

      await vault.setOperator(await addr3.getAddress(), true);
      await vault.connect(addr3).earn();

      expect(await token2.balanceOf(vault.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.equal(0);

      await vault.connect(owner).deposit(deposit); 

      expect(await token2.balanceOf(vault.address)).to.equal(deposit);
      expect(await vaultStrategy.balanceOf()).to.equal(0);

      await vault.connect(addr3).earn();

      let bal = await vaultStrategy.balanceOf();
      expect(await token2.balanceOf(vault.address)).to.equal(remain);
      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(bal).to.be.above(0);
      
      await vault.earn();

      remain = remain.mul(minToKeep).div(100000);
      expect(await token2.balanceOf(vault.address)).to.equal(remain);
      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.be.above(bal);
      
      bal = await vaultStrategy.balanceOf();
      let deposit2 = ethers.BigNumber.from("1000000000000");

      await vault.connect(addr1).deposit(deposit2); 

      expect(await token2.balanceOf(vault.address)).to.equal(remain.add(deposit2));
      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.equal(bal);

      await vault.earn();

      expect(await token2.balanceOf(vault.address)).to.equal(remain.add(deposit2).mul(minToKeep).div(100000));
      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.be.above(bal);
    });
    it("Vault Withdraw", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);
      
      let depositValue = ethers.BigNumber.from("10000000000");
      await vault.connect(addr1).deposit(depositValue);
      await vault.connect(addr2).deposit(depositValue);

      await expect(
        vault.connect(addr1).withdraw(0)
      ).to.be.revertedWith("ACOVault:: Invalid shares");

      let shares = await vault.connect(addr1).balanceOf(await addr1.getAddress());
      await vault.connect(addr1).withdraw(shares);
      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);

      shares = await vault.balanceOf(await addr2.getAddress());
      await expect(
        vault.connect(addr2).withdraw(shares.add(1))
      ).to.be.revertedWith("SafeMath: subtraction overflow");
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(shares);

      await vault.connect(addr2).withdraw(shares);
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(await token2.balanceOf(vault.address)).to.equal(0);

      await vault.connect(addr1).deposit(depositValue);
      await vault.connect(addr3).deposit(depositValue.div(2));
      let shares1 = await vault.balanceOf(await addr1.getAddress());
      let shares3 = await vault.balanceOf(await addr3.getAddress());
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal = ethers.BigNumber.from("6000000000000000000");
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr2).deposit(depositValue);
      await vault.earn();
      let shares2 = await vault.balanceOf(await addr2.getAddress());
      let aco = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      expect(await aco.balanceOf(vault.address)).to.equal(acoBal);

      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1.div(2));
      expect(acosAmount1[0]).to.equal(acoBal.div(3));

      let buffBal = await token2.balanceOf(vault.address);
      let stgyBal = await vaultStrategy.balanceOf();
      let ownerBal = await token2.balanceOf(await owner.getAddress());
      let addr1Bal = await token2.balanceOf(await addr1.getAddress());
      let addr2Bal = await token2.balanceOf(await addr2.getAddress());
      let addr3Bal = await token2.balanceOf(await addr3.getAddress());

      await vault.connect(addr1).withdraw(shares1.div(2));

      expect(await token2.balanceOf(vault.address)).to.equal(0);
      validateRangeValue((await token2.balanceOf(await addr1.getAddress())).sub(addr1Bal), accountBalance1);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(addr2Bal);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(addr3Bal);
      validateRangeValue((await token2.balanceOf(await owner.getAddress())).sub(ownerBal), fee1);
      validateRangeValue(await vaultStrategy.balanceOf(), stgyBal.add(buffBal).sub(accountBalance1).sub(fee1));

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(shares1.div(2));
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(shares2);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(shares3);
      expect(await vault.totalSupply()).to.equal(shares2.add(shares3).add(shares1.div(2)));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0]);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.balanceOf(vault.address)).to.equal(acoBal.sub(acosAmount1[0]));

      [accountBalance3, fee3, acos3, acosAmount3] = await vault.getAccountSituation(await addr3.getAddress(), shares3);
      expect(acosAmount3[0]).to.equal(acoBal.div(3));

      await vault.connect(addr3).withdraw(shares3);

      expect(await token2.balanceOf(vault.address)).to.equal(0);
      validateRangeValue((await token2.balanceOf(await addr1.getAddress())).sub(addr1Bal), accountBalance1);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(addr2Bal);
      validateRangeValue((await token2.balanceOf(await addr3.getAddress())).sub(addr3Bal), accountBalance3);
      validateRangeValue((await token2.balanceOf(await owner.getAddress())).sub(ownerBal), fee1.add(fee3));
      validateRangeValue(await vaultStrategy.balanceOf(), stgyBal.add(buffBal).sub(accountBalance1).sub(fee1).sub(accountBalance3).sub(fee3));

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(shares1.div(2));
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(shares2);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(shares2.add(shares1.div(2)));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0]);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[0]);
      expect(await aco.balanceOf(vault.address)).to.equal(acoBal.sub(acosAmount1[0]).sub(acosAmount3[0]));
 
      [accountBalance2, fee2, acos2, acosAmount2] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      expect(acos2.length).to.equal(0);

      await vault.connect(addr2).withdraw(shares2);

      expect(await token2.balanceOf(vault.address)).to.equal(0);
      validateRangeValue((await token2.balanceOf(await addr1.getAddress())).sub(addr1Bal), accountBalance1);
      validateRangeValue((await token2.balanceOf(await addr2.getAddress())).sub(addr2Bal), accountBalance2);
      validateRangeValue((await token2.balanceOf(await addr3.getAddress())).sub(addr3Bal), accountBalance3);
      validateRangeValue((await token2.balanceOf(await owner.getAddress())).sub(ownerBal), fee1.add(fee3).add(fee2));
      validateRangeValue(await vaultStrategy.balanceOf(), stgyBal.add(buffBal).sub(accountBalance1).sub(fee1).sub(accountBalance3).sub(fee3).sub(accountBalance2).sub(fee2));

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(shares1.div(2));
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(shares1.div(2));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0]);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[0]);
      expect(await aco.balanceOf(vault.address)).to.equal(acoBal.sub(acosAmount1[0]).sub(acosAmount3[0]));

      [accountBalance12, fee12, acos12, acosAmount12] = await vault.getAccountSituation(await addr1.getAddress(), shares1.div(2));
      expect(acosAmount12[0]).to.equal(acoBal.div(3));

      await vault.connect(addr1).withdraw(shares1.div(2));

      expect(await token2.balanceOf(vault.address)).to.equal(0);
      validateRangeValue((await token2.balanceOf(await addr1.getAddress())).sub(addr1Bal), accountBalance1.add(accountBalance12));
      validateRangeValue((await token2.balanceOf(await addr2.getAddress())).sub(addr2Bal), accountBalance2);
      validateRangeValue((await token2.balanceOf(await addr3.getAddress())).sub(addr3Bal), accountBalance3);
      validateRangeValue((await token2.balanceOf(await owner.getAddress())).sub(ownerBal), fee1.add(fee3).add(fee2).add(fee12));

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0].add(acosAmount12[0]));
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[0]);
      expect(parseInt((await aco.balanceOf(vault.address)).toString())).to.be.closeTo(0, 1);
      expect(parseInt((await vault.balance()).toString())).to.be.closeTo(0, 1);
      expect(parseInt((await vaultStrategy.balanceOf()).toString())).to.closeTo(0, 1);
    });
    it("Vault exercise", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);
      
      let depositValue = ethers.BigNumber.from("10000000000");
      await vault.connect(addr1).deposit(depositValue);
      await vault.connect(addr3).deposit(depositValue.div(2));
      let shares1 = await vault.balanceOf(await addr1.getAddress());
      let shares3 = await vault.balanceOf(await addr3.getAddress());
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal = ethers.BigNumber.from("6000000000000000000");
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr2).deposit(depositValue);
      let shares2 = await vault.balanceOf(await addr2.getAddress());
      await vault.earn();
      let aco = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());

      await expect(
        vault.connect(addr3).exerciseAco(aco.address, acoBal)
      ).to.be.revertedWith("ACOVault:: Invalid time to exercise");

      await network.provider.send("evm_setNextBlockTimestamp", [expiration - minTimeToExercise]);

      await expect(
        vault.connect(addr3).exerciseAco(ACOPoolToken1Token2Put.address, acoBal)
      ).to.be.revertedWith("ACOVault:: Invalid ACO amount");

      await expect(
        vault.connect(addr3).exerciseAco(aco.address, acoBal)
      ).to.be.revertedWith("ACOVault:: It's not ITM");

      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      [accountBalance2, fee2, acos2, acosAmount2] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      [accountBalance3, fee3, acos3, acosAmount3] = await vault.getAccountSituation(await addr3.getAddress(), shares3);
      expect(acos1.length).to.equal(1);
      expect(acos2.length).to.equal(0);
      expect(acos3.length).to.equal(1);
      expect(accountBalance1.add(fee1)).to.be.below(depositValue);
      expect(accountBalance2.add(fee2)).to.be.below(depositValue);
      expect(accountBalance3.add(fee3)).to.be.below(depositValue.div(2));

      await aggregatorWethToken2.updateAnswer(ethToken2Price.mul(100));
      let balVault = await token2.balanceOf(vault.address);
      await vault.connect(addr3).exerciseAco(aco.address, acoBal);
      validateAboveMinValue((await token2.balanceOf(vault.address)).sub(balVault), ethToken2Price.mul(5).mul(acoBal).div(ethers.BigNumber.from("100000000000000000000")), 7000);
      
      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      [accountBalance2, fee2, acos2, acosAmount2] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      [accountBalance3, fee3, acos3, acosAmount3] = await vault.getAccountSituation(await addr3.getAddress(), shares3);

      expect(acos1.length).to.equal(0);
      expect(acos2.length).to.equal(0);
      expect(acos3.length).to.equal(0);
      expect(accountBalance1.add(fee1)).to.be.above(depositValue);
      expect(accountBalance2.add(fee2)).to.be.below(depositValue);
      expect(accountBalance3.add(fee3)).to.be.above(depositValue.div(2));

      await vault.earn();
      await vault.setMinExpiration(1);
      await vault.setAcoToken(ACOToken1Token2Call.address);
      aco = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("110000000000000000000"));  
      await vaultStrategy.harvest();
      acoBal = ethers.BigNumber.from("60000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      
      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      [accountBalance2, fee2, acos2, acosAmount2] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      [accountBalance3, fee3, acos3, acosAmount3] = await vault.getAccountSituation(await addr3.getAddress(), shares3);
      expect(acos1.length).to.equal(1);
      expect(acos2.length).to.equal(1);
      expect(acos3.length).to.equal(1);
      expect(accountBalance1.add(fee1)).to.be.above(depositValue);
      expect(accountBalance2.add(fee2)).to.be.below(depositValue);
      expect(accountBalance3.add(fee3)).to.be.above(depositValue.div(2));

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(100));
      balVault = await token2.balanceOf(vault.address);
      await vault.connect(addr3).exerciseAco(aco.address, acoBal.div(2));
      validateAboveMinValue((await token2.balanceOf(vault.address)).sub(balVault), token1Token2Price.mul(5).mul(acoBal.div(2)).div(ethers.BigNumber.from("10000000000")), 8000);
      expect(await token1.balanceOf(vault.address)).to.equal(0);

      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      [accountBalance2, fee2, acos2, acosAmount2] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      [accountBalance3, fee3, acos3, acosAmount3] = await vault.getAccountSituation(await addr3.getAddress(), shares3);
      expect(acos1.length).to.equal(1);
      expect(acos2.length).to.equal(1);
      expect(acos3.length).to.equal(1);
      expect(accountBalance1.add(fee1)).to.be.above(depositValue);
      expect(accountBalance2.add(fee2)).to.be.above(depositValue);
      expect(accountBalance3.add(fee3)).to.be.above(depositValue.div(2));

      await vault.connect(addr1).withdraw(shares1);
      await vault.connect(addr2).withdraw(shares2);
      await vault.connect(addr3).withdraw(shares3);

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0]);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(acosAmount2[0]);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[0]);
      expect(parseInt((await aco.balanceOf(vault.address)).toString())).to.be.closeTo(1, 1);
      expect(parseInt((await vault.balance()).toString())).to.be.closeTo(0, 1);
      expect(parseInt((await vaultStrategy.balanceOf()).toString())).to.closeTo(0, 1);
    });
    it("Vault skim", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      
      let depositValue = ethers.BigNumber.from("10000000000");
      await vault.connect(addr2).deposit(depositValue);
      let shares2 = await vault.balanceOf(await addr2.getAddress());
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal = ethers.BigNumber.from("6000000000000000000");
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr1).deposit(depositValue);
      let shares1 = await vault.balanceOf(await addr1.getAddress());
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      let aco = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());

      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      expect(acos1.length).to.equal(1);
      expect(await vault.getAccountAcoDataCount(await addr1.getAddress())).to.equal(1);
      expect((await vault.getAccountAcoDataByIndex(await addr1.getAddress(), 0))[0]).to.equal(aco.address);
      expect((await vault.getAccountAcoDataByAco(await addr1.getAddress(), aco.address))[3]).to.equal(true);
      
      await vault.setMinExpiration(1);
      await vault.setMaxExpiration(86400*6);
      await vault.setAcoToken(ACOToken1Token2Put.address);
      let aco2 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("110000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal2 = ethers.BigNumber.from("6000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Put.address, acoBal2, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr1).deposit(depositValue);
      shares1 = await vault.balanceOf(await addr1.getAddress());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("110000000000000000000"));  
      await vaultStrategy.harvest();
      await controller.buyAco(vault.address, ACOPoolToken1Token2Put.address, acoBal2, await token2.balanceOf(vaultStrategy.address));

      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      expect(acos1.length).to.equal(2);
      expect(await vault.getAccountAcoDataCount(await addr1.getAddress())).to.equal(2);
      expect((await vault.getAccountAcoDataByIndex(await addr1.getAddress(), 0))[0]).to.equal(aco.address);
      expect((await vault.getAccountAcoDataByIndex(await addr1.getAddress(), 1))[0]).to.equal(aco2.address);
      expect((await vault.getAccountAcoDataByAco(await addr1.getAddress(), aco.address))[3]).to.equal(true);
      expect((await vault.getAccountAcoDataByAco(await addr1.getAddress(), aco2.address))[3]).to.equal(true);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration+minTimeToExercise]);
      await network.provider.send("evm_mine");

      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      expect(acos1.length).to.equal(1);
      expect(await vault.getAccountAcoDataCount(await addr1.getAddress())).to.equal(2);
      expect((await vault.getAccountAcoDataByIndex(await addr1.getAddress(), 0))[0]).to.equal(aco.address);
      expect((await vault.getAccountAcoDataByIndex(await addr1.getAddress(), 1))[0]).to.equal(aco2.address);
      expect((await vault.getAccountAcoDataByAco(await addr1.getAddress(), aco.address))[3]).to.equal(true);
      expect((await vault.getAccountAcoDataByAco(await addr1.getAddress(), aco2.address))[3]).to.equal(true);

      await vault.connect(addr3).skim(await addr1.getAddress());

      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      expect(acos1.length).to.equal(1);
      expect(await vault.getAccountAcoDataCount(await addr1.getAddress())).to.equal(1);
      expect((await vault.getAccountAcoDataByIndex(await addr1.getAddress(), 0))[0]).to.equal(aco2.address);
      expect((await vault.getAccountAcoDataByAco(await addr1.getAddress(), aco.address))[3]).to.equal(false);
      expect((await vault.getAccountAcoDataByAco(await addr1.getAddress(), aco2.address))[3]).to.equal(true);

      await vault.connect(addr1).withdraw(shares1);
      await vault.connect(addr2).withdraw(shares2);

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0]);
      expect(await aco.balanceOf(vault.address)).to.equal(acoBal.mul(2));
      expect(parseInt((await aco2.balanceOf(vault.address)).toString())).to.be.closeTo(1, 1);
      expect(parseInt((await vault.balance()).toString())).to.be.closeTo(0, 1);
      expect(parseInt((await vaultStrategy.balanceOf()).toString())).to.closeTo(0, 1);
    });
    it("Set valid ACOS", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      
      let depositValue = ethers.BigNumber.from("10000000000");
      await vault.connect(addr1).deposit(depositValue);
      let shares1 = await vault.balanceOf(await addr1.getAddress());
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal = ethers.BigNumber.from("6000000000000000000");
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.earn();
      let aco = await ethers.getContractAt("ACOToken", await vault.currentAcoToken()); 
      
      expect(await vault.numberOfValidAcoTokens()).to.equal(1);
      expect(await vault.validAcos(0)).to.equal(aco.address);
      expect(await vault.numberOfAcoTokensNegotiated()).to.equal(1);
      expect(await vault.acoTokens(0)).to.equal(aco.address);
      
      await vault.setMinExpiration(1);
      await vault.setMaxExpiration(86400*6);
      await vault.setAcoToken(ACOToken1Token2Call.address);
      let aco2 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("110000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal2 = ethers.BigNumber.from("7000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Call.address, acoBal2, await token2.balanceOf(vaultStrategy.address));
      
      expect(await vault.numberOfValidAcoTokens()).to.equal(2);
      expect(await vault.validAcos(0)).to.equal(aco.address);
      expect(await vault.validAcos(1)).to.equal(aco2.address);
      expect(await vault.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await vault.acoTokens(0)).to.equal(aco.address);
      expect(await vault.validAcos(1)).to.equal(aco2.address);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await network.provider.send("evm_mine");

      expect(await vault.numberOfValidAcoTokens()).to.equal(2);
      expect(await vault.validAcos(0)).to.equal(aco.address);
      expect(await vault.validAcos(1)).to.equal(aco2.address);
      expect(await vault.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await vault.acoTokens(0)).to.equal(aco.address);
      expect(await vault.acoTokens(1)).to.equal(aco2.address);

      await vault.connect(addr3).setValidAcoTokens();

      expect(await vault.numberOfValidAcoTokens()).to.equal(1);
      expect(await vault.validAcos(0)).to.equal(aco2.address);
      expect(await vault.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await vault.acoTokens(0)).to.equal(aco.address);
      expect(await vault.acoTokens(1)).to.equal(aco2.address);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration+minTimeToExercise]);
      await network.provider.send("evm_mine");

      await vault.setAcoToken(ACOToken1Token2Put.address);
      let aco3 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());

      expect(await vault.numberOfValidAcoTokens()).to.equal(1);
      expect(await vault.validAcos(0)).to.equal(aco3.address);
      expect(await vault.numberOfAcoTokensNegotiated()).to.equal(3);
      expect(await vault.acoTokens(0)).to.equal(aco.address);
      expect(await vault.acoTokens(1)).to.equal(aco2.address);
      expect(await vault.acoTokens(2)).to.equal(aco3.address);
      
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("110000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal3 = ethers.BigNumber.from("6000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Put.address, acoBal3, await token2.balanceOf(vaultStrategy.address));

      await vault.connect(addr1).withdraw(shares1);

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(await addr1.getAddress())).to.equal(acoBal3);
      expect(await aco.balanceOf(vault.address)).to.equal(acoBal);
      expect(await aco2.balanceOf(vault.address)).to.equal(acoBal2);
      expect(await aco3.balanceOf(vault.address)).to.equal(0);
      expect(await vault.balance()).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.equal(0);
    });
  });

  describe("Vault's complex flows", function () {
    it("Vault flow1", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);
      
      let depAddr1 = 0;
      let depAddr2 = 0;
      let depAddr3 = 0;
      let depositValue = ethers.BigNumber.from("10000000000");
      await vault.connect(addr1).deposit(depositValue);
      await vault.connect(addr3).deposit(depositValue.div(2));
      depAddr1 = depositValue.add(depAddr1);
      depAddr3 = depositValue.div(2).add(depAddr3);
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal = ethers.BigNumber.from("6000000000000000000");
      let aco = await vault.currentAcoToken();
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr2).deposit(depositValue);
      depAddr2 = depositValue.add(depAddr2);
      await vault.earn();
      await vault.setMinExpiration(1);
      await vault.setMaxExpiration(6*86400);
      await vault.setAcoToken(ACOToken1Token2Call.address);
      await network.provider.send("evm_setNextBlockTimestamp", [expiration-minTimeToExercise]);
      await aggregatorWethToken2.updateAnswer(ethToken2Price.mul(100));
      await vault.connect(addr3).exerciseAco(aco, acoBal);
      aco = ACOToken1Token2Call.address;
      await vault.connect(addr1).deposit(depositValue.div(4));
      await vault.connect(addr2).deposit(depositValue.div(2));
      depAddr1 = depositValue.div(4).add(depAddr1);
      depAddr2 = depositValue.div(2).add(depAddr2);
      await vault.earn();
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      acoBal = ethers.BigNumber.from("50000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Call.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr1).deposit(depositValue.div(4));
      await vault.connect(addr2).deposit(depositValue.div(2));
      depAddr1 = depositValue.div(4).add(depAddr1);
      depAddr2 = depositValue.div(2).add(depAddr2);
      await vault.earn();
      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(100));
      await vault.connect(addr3).exerciseAco(aco, acoBal.div(3));
      await vault.earn();
      await vault.earn();
      await vault.setAcoToken(ACOEthToken2Put.address);
      aco = ACOEthToken2Put.address;
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      await vault.connect(addr1).deposit(depositValue.div(4));
      await vault.connect(addr2).deposit(depositValue.div(2));
      depAddr1 = depositValue.div(4).add(depAddr1);
      depAddr2 = depositValue.div(2).add(depAddr2);
      acoBal = ethers.BigNumber.from("2000000000000000000");
      await controller.buyAco(vault.address, ACOPoolEthToken2Put.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      await vault.connect(addr2).deposit(depositValue.div(2));
      depAddr2 = depositValue.div(2).add(depAddr2);
      await controller.buyAco(vault.address, ACOPoolEthToken2Put.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr1).deposit(depositValue);
      depAddr1 = depositValue.add(depAddr1);
      await vault.setAcoToken(ACOToken1Token2Put.address);
      await vault.connect(addr1).deposit(depositValue.div(3));
      depAddr1 = depositValue.div(3).add(depAddr1);
      await vault.earn();
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+minTimeToExercise]);
      await vault.connect(addr1).exerciseAco(aco, acoBal.mul(2));
      await vault.connect(addr2).deposit(depositValue.div(2));
      depAddr2 = depositValue.div(2).add(depAddr2);
      aco = ACOToken1Token2Put.address;
      await vault.earn();
      await vault.connect(addr1).deposit(depositValue);
      depAddr1 = depositValue.add(depAddr1);
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      acoBal = ethers.BigNumber.from("10000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Put.address, acoBal, await token2.balanceOf(vaultStrategy.address));
      await vault.earn();
      await vault.earn();
      await vault.earn();

      let shares1 = await vault.balanceOf(await addr1.getAddress());
      let shares2 = await vault.balanceOf(await addr2.getAddress());
      let shares3 = await vault.balanceOf(await addr3.getAddress());
      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      [accountBalance2, fee2, acos2, acosAmount2] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      [accountBalance3, fee3, acos3, acosAmount3] = await vault.getAccountSituation(await addr3.getAddress(), shares3);
      expect(acos1.length).to.equal(1);
      expect(acos2.length).to.equal(1);
      expect(acos3.length).to.equal(1);
      expect(accountBalance1.add(fee1)).to.be.above(depAddr1);
      expect(accountBalance2.add(fee2)).to.be.above(depAddr2);
      expect(accountBalance3.add(fee3)).to.be.above(depAddr3);

      await vault.connect(addr1).withdraw(shares1);
      await vault.connect(addr2).withdraw(shares2);
      await vault.connect(addr3).withdraw(shares3);

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(parseInt((await vault.balance()).toString())).to.be.closeTo(0, 1);
      expect(parseInt((await vaultStrategy.balanceOf()).toString())).to.closeTo(0, 1);
    });
    it("Vault flow2", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);
      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(100));
      await aggregatorWethToken2.updateAnswer(ethToken2Price.mul(100));
      
      let depAddr1 = 0;
      let depAddr2 = 0;
      let depAddr3 = 0;
      let depositValue = ethers.BigNumber.from("10000000000");
      await vault.connect(addr1).deposit(depositValue);
      await vault.connect(addr3).deposit(depositValue.div(2));
      depAddr1 = depositValue.add(depAddr1);
      depAddr3 = depositValue.div(2).add(depAddr3);
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal1 = ethers.BigNumber.from("3400000000000000000");
      let aco1 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal1, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr2).deposit(depositValue);
      depAddr2 = depositValue.add(depAddr2);
      await vault.earn();
      await vault.setMinExpiration(1);
      await vault.setMaxExpiration(6*86400);
      await vault.setAcoToken(ACOToken1Token2Call.address);
      let aco2 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal2 = ethers.BigNumber.from("14000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Call.address, acoBal2, await token2.balanceOf(vaultStrategy.address));
      await vault.earn();
      await vault.earn();

      let shares1 = await vault.balanceOf(await addr1.getAddress());
      let shares2 = await vault.balanceOf(await addr2.getAddress());
      let shares3 = await vault.balanceOf(await addr3.getAddress());
      [accountBalance1, fee1, acos1, acosAmount1] = await vault.getAccountSituation(await addr1.getAddress(), shares1.div(2));
      [accountBalance2, fee2, acos2, acosAmount2] = await vault.getAccountSituation(await addr2.getAddress(), shares2.div(2));
      [accountBalance3, fee3, acos3, acosAmount3] = await vault.getAccountSituation(await addr3.getAddress(), shares3.div(2));
      expect(acos1.length).to.equal(2);
      expect(acos2.length).to.equal(1);
      expect(acos3.length).to.equal(2);
      expect(accountBalance1.add(fee1)).to.be.below(depAddr1.div(2));
      expect(accountBalance2.add(fee2)).to.be.below(depAddr2.div(2));
      expect(accountBalance3.add(fee3)).to.be.below(depAddr3.div(2));

      await vault.connect(addr1).withdraw(shares1.div(2));
      await vault.connect(addr2).withdraw(shares2.div(2));
      await vault.connect(addr3).withdraw(shares3.div(2));

      expect(await aco1.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0]);
      expect(await aco1.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco1.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[0]);
      expect(await aco1.balanceOf(vault.address)).to.equal(acoBal1.sub(acosAmount1[0].add(acosAmount3[0])));
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[1]);
      expect(await aco2.balanceOf(await addr2.getAddress())).to.equal(acosAmount2[0]);
      expect(await aco2.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[1]);
      expect(await aco2.balanceOf(vault.address)).to.equal(acoBal2.sub(acosAmount1[1].add(acosAmount2[0]).add(acosAmount3[1])));

      await vault.setAcoToken(ACOToken1Token2Put.address);
      let aco3 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("100000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal3 = ethers.BigNumber.from("13000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Put.address, acoBal3, await token2.balanceOf(vaultStrategy.address));
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+2*minTimeToExercise]);
      await vault.connect(addr3).exerciseAco(aco3.address, acoBal3);
      
      [accountBalance11, fee11, acos11, acosAmount11] = await vault.getAccountSituation(await addr1.getAddress(), shares1.div(2));
      [accountBalance21, fee21, acos21, acosAmount21] = await vault.getAccountSituation(await addr2.getAddress(), shares2.div(2));
      [accountBalance31, fee31, acos31, acosAmount31] = await vault.getAccountSituation(await addr3.getAddress(), shares3.div(2));
      expect(acos11.length).to.equal(0);
      expect(acos21.length).to.equal(0);
      expect(acos31.length).to.equal(0);
      expect(accountBalance11.add(fee11)).to.be.above(depAddr1.div(2));
      expect(accountBalance21.add(fee21)).to.be.above(depAddr2.div(2));
      expect(accountBalance31.add(fee31)).to.be.above(depAddr3.div(2));

      await vault.connect(addr1).withdraw(shares1.div(2));
      await vault.connect(addr2).withdraw(shares2.div(2));
      await vault.connect(addr3).withdraw(shares3.div(2));

      expect(await aco1.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[0]);
      expect(await aco1.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco1.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[0]);
      expect(await aco1.balanceOf(vault.address)).to.equal(acoBal1.sub(acosAmount1[0].add(acosAmount3[0])));
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(acosAmount1[1]);
      expect(await aco2.balanceOf(await addr2.getAddress())).to.equal(acosAmount2[0]);
      expect(await aco2.balanceOf(await addr3.getAddress())).to.equal(acosAmount3[1]);
      expect(await aco2.balanceOf(vault.address)).to.equal(acoBal2.sub(acosAmount1[1].add(acosAmount2[0]).add(acosAmount3[1])));
      expect(await aco3.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(vault.address)).to.equal(0);

      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(parseInt((await vault.balance()).toString())).to.be.closeTo(0, 1);
      expect(parseInt((await vaultStrategy.balanceOf()).toString())).to.closeTo(0, 1);
    });
    it("Vault flow3", async function () {
      await token2.connect(addr1).approve(vault.address, token2TotalSupply);
      await token2.connect(addr2).approve(vault.address, token2TotalSupply);
      await token2.connect(addr3).approve(vault.address, token2TotalSupply);
      await aggregatorToken1Token2.updateAnswer(token1Token2Price.mul(100));
      await aggregatorWethToken2.updateAnswer(ethToken2Price.mul(100));
      await vault.setMinExpiration(1);
      await vault.setMaxExpiration(6*86400);
      
      let depAddr1 = 0;
      let depAddr2 = 0;
      let depAddr3 = 0;
      let shares1 = 0;
      let shares2 = 0;
      let shares3 = 0;
      let depositValue = ethers.BigNumber.from("10000000000");
      await vault.connect(addr1).deposit(depositValue);
      await vault.connect(addr2).deposit(depositValue.div(3));
      await vault.connect(addr3).deposit(depositValue.div(2));
      depAddr1 = depositValue.add(depAddr1);
      shares1 = await vault.balanceOf(await addr1.getAddress());
      depAddr2 = depositValue.div(3).add(depAddr2);
      shares2 = await vault.balanceOf(await addr2.getAddress());
      depAddr3 = depositValue.div(2).add(depAddr3);
      shares3 = await vault.balanceOf(await addr3.getAddress());
      await vault.earn();
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("500000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal1 = ethers.BigNumber.from("14700000000000000000");
      let aco1 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await controller.buyAco(vault.address, ACOPoolEthToken2Call.address, acoBal1, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr2).deposit(depositValue);
      depAddr2 = depositValue.add(depAddr2);
      shares2 = await vault.balanceOf(await addr2.getAddress());

      [accountBalance11, fee11, acos11, acosAmount11] = await vault.getAccountSituation(await addr1.getAddress(), shares1.div(3));
      await vault.connect(addr1).withdraw(shares1.div(3));
      shares1 = await vault.balanceOf(await addr1.getAddress());
      await vault.earn();
      await vault.earn();
      [accountBalance21, fee21, acos21, acosAmount21] = await vault.getAccountSituation(await addr2.getAddress(), shares2.div(2));
      await vault.connect(addr2).withdraw(shares2.div(2));
      shares2 = await vault.balanceOf(await addr2.getAddress());

      expect(await aco1.balanceOf(await addr1.getAddress())).to.equal(acosAmount11[0]);
      expect(await aco1.balanceOf(await addr2.getAddress())).to.equal(acosAmount21[0]);
      expect(await aco1.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco1.balanceOf(vault.address)).to.equal(acoBal1.sub(acosAmount11[0].add(acosAmount21[0])));

      await network.provider.send("evm_setNextBlockTimestamp", [expiration-minTimeToExercise]);
      await vault.connect(addr1).exerciseAco(aco1.address, acoBal1.sub(acosAmount11[0].add(acosAmount21[0])));
      await vault.setAcoToken(ACOToken1Token2Call.address);
      let aco2 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await vault.connect(addr3).deposit(depositValue.div(4));
      depAddr3 = depositValue.div(4).add(depAddr3);
      shares3 = await vault.balanceOf(await addr3.getAddress());
      await vault.earn();
      await vault.earn();
      
      [accountBalance12, fee12, acos12, acosAmount12] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      await vault.connect(addr1).withdraw(shares1);
      shares1 = await vault.balanceOf(await addr1.getAddress());
      expect(shares1).to.equal(0);

      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("400000000000000000000"));  
      await vaultStrategy.harvest();

      [accountBalance22, fee22, acos22, acosAmount22] = await vault.getAccountSituation(await addr2.getAddress(), shares2.div(4));
      await vault.connect(addr2).withdraw(shares2.div(4));
      shares2 = await vault.balanceOf(await addr2.getAddress());

      expect(await aco1.balanceOf(await addr1.getAddress())).to.equal(acosAmount11[0]);
      expect(await aco1.balanceOf(await addr2.getAddress())).to.equal(acosAmount21[0]);
      expect(await aco1.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco1.balanceOf(vault.address)).to.equal(0);
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(vault.address)).to.equal(0);

      let acoBal2 = ethers.BigNumber.from("67000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Call.address, acoBal2, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr1).deposit(depositValue.mul(2));
      depAddr1 = depositValue.mul(2).add(depAddr1);
      shares1 = await vault.balanceOf(await addr1.getAddress());
      await vault.earn();
      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await vault.connect(addr3).exerciseAco(aco2.address, acoBal2.div(2));
      await vault.earn();
      await vault.connect(addr3).deposit(depositValue);
      depAddr3 = depositValue.add(depAddr3);
      shares3 = await vault.balanceOf(await addr3.getAddress());

      [accountBalance23, fee23, acos23, acosAmount23] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      await vault.connect(addr2).withdraw(shares2);
      shares2 = await vault.balanceOf(await addr2.getAddress());
      expect(shares2).to.equal(0);

      expect(await aco1.balanceOf(await addr1.getAddress())).to.equal(acosAmount11[0]);
      expect(await aco1.balanceOf(await addr2.getAddress())).to.equal(acosAmount21[0]);
      expect(await aco1.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco1.balanceOf(vault.address)).to.equal(0);
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(await addr2.getAddress())).to.equal(acosAmount23[0]);
      expect(await aco2.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(vault.address)).to.equal(acoBal2.div(2).sub(acosAmount23[0]));

      await vault.setAcoToken(ACOEthToken2Put.address);
      let aco3 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("1000000000000000000000"));  
      await vaultStrategy.harvest();
      await vault.connect(addr2).deposit(depositValue.mul(4));
      depAddr2 = depositValue.mul(4).add(depAddr2);
      shares2 = await vault.balanceOf(await addr2.getAddress());
      let acoBal3 = ethers.BigNumber.from("41050000000000000000");
      await controller.buyAco(vault.address, ACOPoolEthToken2Put.address, acoBal3, await token2.balanceOf(vaultStrategy.address));
      await vault.connect(addr1).deposit(depositValue);
      depAddr1 = depositValue.add(depAddr1);
      shares1 = await vault.balanceOf(await addr1.getAddress());
      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("1000000000000000000000"));  
      await vaultStrategy.harvest();
      await controller.buyAco(vault.address, ACOPoolEthToken2Put.address, acoBal3, await token2.balanceOf(vaultStrategy.address));
      await vault.setAcoToken(ACOToken1Token2Put.address);
      let aco4 = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+minTimeToExercise]);
      await vault.connect(addr1).exerciseAco(aco3.address, acoBal3.mul(2));
      await vault.earn();
      
      [accountBalance34, fee34, acos34, acosAmount34] = await vault.getAccountSituation(await addr3.getAddress(), shares3);
      await vault.connect(addr3).withdraw(shares3);
      shares3 = await vault.balanceOf(await addr3.getAddress());
      expect(shares3).to.equal(0);

      expect(await aco1.balanceOf(await addr1.getAddress())).to.equal(acosAmount11[0]);
      expect(await aco1.balanceOf(await addr2.getAddress())).to.equal(acosAmount21[0]);
      expect(await aco1.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco1.balanceOf(vault.address)).to.equal(0);
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(await addr2.getAddress())).to.equal(acosAmount23[0]);
      expect(await aco2.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(vault.address)).to.equal(acoBal2.div(2).sub(acosAmount23[0]));
      expect(await aco3.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(vault.address)).to.equal(0);

      await mintr.setBalanceToMint(_gauge.address, ethers.BigNumber.from("800000000000000000000"));  
      await vaultStrategy.harvest();
      let acoBal4 = ethers.BigNumber.from("134000000");
      await controller.buyAco(vault.address, ACOPoolToken1Token2Put.address, acoBal4, await token2.balanceOf(vaultStrategy.address));
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+2*minTimeToExercise]);
      await vault.connect(addr2).exerciseAco(aco4.address, acoBal4.div(10000));
      await vault.earn();

      [accountBalance15, fee15, acos15, acosAmount15] = await vault.getAccountSituation(await addr1.getAddress(), shares1);
      await vault.connect(addr1).withdraw(shares1);
      [accountBalance25, fee25, acos25, acosAmount25] = await vault.getAccountSituation(await addr2.getAddress(), shares2);
      await vault.connect(addr2).withdraw(shares2);

      expect(await aco1.balanceOf(await addr1.getAddress())).to.equal(acosAmount11[0]);
      expect(await aco1.balanceOf(await addr2.getAddress())).to.equal(acosAmount21[0]);
      expect(await aco1.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco1.balanceOf(vault.address)).to.equal(0);
      expect(await aco2.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(await addr2.getAddress())).to.equal(acosAmount23[0]);
      expect(await aco2.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco2.balanceOf(vault.address)).to.equal(acoBal2.div(2).sub(acosAmount23[0]));
      expect(await aco3.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco3.balanceOf(vault.address)).to.equal(0);
      expect(await aco4.balanceOf(await addr1.getAddress())).to.equal(acosAmount15[0]);
      expect(await aco4.balanceOf(await addr2.getAddress())).to.equal(acosAmount25[0]);
      expect(await aco4.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco4.balanceOf(vault.address)).to.equal(acoBal4.sub(acosAmount15[0].add(acosAmount25[0]).add(acoBal4.div(10000))));

      expect(await token2.balanceOf(await addr1.getAddress())).to.be.above(depAddr1);
      expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(depAddr2);
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.above(depAddr3);
      
      expect(await vault.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await vault.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await vault.totalSupply()).to.equal(0);
      expect(parseInt((await vault.balance()).toString())).to.be.closeTo(0, 1);
      expect(parseInt((await vaultStrategy.balanceOf()).toString())).to.closeTo(0, 1);
    });
  });
});

const validateRangeValue = (expected, actual, tolerancePercentage = 500) => {
  validateBelowMaxValue(expected, actual, tolerancePercentage);
  validateAboveMinValue(expected, actual, tolerancePercentage);
};

const validateBelowMaxValue = (expected, actual, tolerancePercentage = 500) => {
  const precision = 100000;
  expect(expected).to.be.below(actual.mul(precision + tolerancePercentage).div(precision));
};

const validateAboveMinValue = (expected, actual, tolerancePercentage = 500) => {
  const precision = 100000;
  expect(expected).to.be.above(actual.mul(precision - tolerancePercentage).div(precision));
};

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