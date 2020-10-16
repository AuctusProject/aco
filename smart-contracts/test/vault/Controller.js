const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/ACOPoolFactory.json");
const factoryABI = require("../../artifacts/ACOFactory.json");
const { createAcoStrategy1 } = require("../pool/ACOStrategy1.js");
const { AddressZero } = require("ethers/constants");

let started = false;

describe("Controller", function() {
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.utils.bigNumberify("1000000000000000");
  let pairWethToken2;
  let token2Liq = ethers.utils.bigNumberify("5000000000000");
  let wethLiq = ethers.utils.bigNumberify("12500000000000000000000");
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

  let ethToken2Price = ethers.utils.bigNumberify("400000000");
  let expiration;
  let start;
  let ethToken2BaseVolatility = 85000;
  let ACOEthToken2Call;
  let ACOPoolEthToken2Call;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11, addr12, ...addrs] = await ethers.getSigners();
    
    if (!started) {
      let baseTx = {to: await owner.getAddress(), value: ethers.utils.bigNumberify("4500000000000000000000")};
      await addr10.sendTransaction(baseTx);
      await addr11.sendTransaction(baseTx);
      await addr12.sendTransaction(baseTx);
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
    
    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    await token2.connect(owner).transfer(await addr1.getAddress(), ethers.utils.bigNumberify("1000000000000"));
    await token2.connect(owner).transfer(await addr2.getAddress(), ethers.utils.bigNumberify("1000000000000"));
    await token2.connect(owner).transfer(await addr3.getAddress(), ethers.utils.bigNumberify("1000000000000"));

    aggregatorWethToken2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, ethToken2Price.mul(100));
    await aggregatorWethToken2.deployed();

    await uniswapFactory.createPair(token2.address, weth.address);
    
    pairWethToken2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token2.address, weth.address));

    converterHelper = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);

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
    await pairWethToken2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);

    await token2.connect(owner).transfer(pairWethToken2.address, token2Liq);
    await weth.connect(owner).deposit({value: wethLiq});
    await weth.connect(owner).transfer(pairWethToken2.address, wethLiq);
    await pairWethToken2.connect(owner).mint(await owner.getAddress());

    defaultStrategy = await createAcoStrategy1();
    await defaultStrategy.setAgreggator(AddressZero, token2.address, aggregatorWethToken2.address);

    await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);
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
    expiration = current + 3 * 86400;

    let tx4 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, true, ethToken2Price, expiration, maxExercisedAccounts)).wait();
    let result4 = tx4.events[tx4.events.length - 1].args;
    ACOEthToken2Call = await ethers.getContractAt("ACOToken", result4.acoToken);

    current = await getCurrentTimestamp();
    start = current + 180;

    let tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, start, ethers.utils.bigNumberify("300000000"), ethers.utils.bigNumberify("500000000"), start, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
    let result10 = tx10.events[tx10.events.length - 1].args;
    ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool", result10.acoPool);

    let d1 = ethers.utils.bigNumberify("50000000000000000000");
    await ACOPoolEthToken2Call.connect(owner).deposit(d1, await owner.getAddress(), {value: d1});

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

    //TODO SET STRATEGY

    controller = await (await ethers.getContractFactory("Controller")).deploy(await owner.getAddress());
    await controller.deployed();
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
    it("Set vault", async function () {
      expect(await vault.currentAcoToken()).to.equal(ACOEthToken2Call.address);
      expect(await vault.acoPool()).to.equal(ACOPoolEthToken2Call.address);

      await vault.connect(addr3).setAcoToken(ACOEthToken2Put.address, ACOPoolEthToken2Put.address);
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

      await vault.connect(addr2).setAcoToken(ACOToken1Token2Call.address, ACOPoolToken1Token2Call.address);
      expect(await vault.currentAcoToken()).to.equal(ACOToken1Token2Call.address);
      expect(await vault.acoPool()).to.equal(ACOPoolToken1Token2Call.address);
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