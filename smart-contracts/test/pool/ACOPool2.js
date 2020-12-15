const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/ACOPoolFactory2.json");
const factoryABI = require("../../artifacts/ACOFactory.json");
const { createAcoPoolStrategy } = require("./ACOPoolStrategy.js");
const { AddressZero } = require("ethers/constants");
const { getCurrentTimestamp } = require("./ACOPool");

let started = false;

describe("ACOPool2", function() {
  let ACOFactory;
  let ACOPoolFactory;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let fee = 30;
  let poolFee = 5000;
  let withdrawOpenPositionPenalty = 10000;
  let underlyingPriceAdjustPercentage = 500;
  let maxExercisedAccounts = 120;
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
  let defaultStrategy;
  let aggregatorToken1Token2;
  let aggregatorWethToken2;
  let flashExercise;
  let uniswapFactory;
  let weth;
  let uniswapRouter;
  let chiToken;
  let converterHelper;

  let token1Token2Price = ethers.utils.bigNumberify("10000000000");
  let ethToken2Price = ethers.utils.bigNumberify("400000000");
  let expiration;
  let acoEthToken2CallPrice = ethers.utils.bigNumberify("400000000");
  let acoEthToken2CallPrice2 = ethers.utils.bigNumberify("500000000");
  let acoEthToken2PutPrice = ethers.utils.bigNumberify("400000000");
  let acoEthToken2PutPrice2 = ethers.utils.bigNumberify("300000000");
  let acoToken1Token2CallPrice = ethers.utils.bigNumberify("10000000000");
  let acoToken1Token2CallPrice2 = ethers.utils.bigNumberify("12000000000");
  let acoToken1Token2PutPrice = ethers.utils.bigNumberify("10000000000");
  let acoToken1Token2PutPrice2 = ethers.utils.bigNumberify("9000000000");
  let ethToken2BaseVolatility = 85000;
  let token1Token2BaseVolatility = 70000;
  let ACOEthToken2Call;
  let ACOEthToken2Call2;
  let ACOEthToken2Put;
  let ACOEthToken2Put2;
  let ACOToken1Token2Call;
  let ACOToken1Token2Call2;
  let ACOToken1Token2Put;
  let ACOToken1Token2Put2;
  let ACOPoolEthToken2Call;
  let ACOPoolEthToken2Put;
  let ACOPoolToken1Token2Call;
  let ACOPoolToken1Token2Put;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10,...addrs] = await ethers.getSigners();
    
    if (!started) {
      let baseTx = {to: await owner.getAddress(), value: ethers.utils.bigNumberify("2200000000000000000000")};
      await addr4.sendTransaction(baseTx);
      await addr5.sendTransaction(baseTx);
      await addr6.sendTransaction(baseTx);
      await addr7.sendTransaction(baseTx);
      await addr8.sendTransaction(baseTx);
      await addr9.sendTransaction(baseTx);
      await addr10.sendTransaction(baseTx);
      started = true;
    }

    let ACOFactoryTemp = await (await ethers.getContractFactory("ACOFactoryV3")).deploy();
    await ACOFactoryTemp.deployed();

    let ACOTokenTemp = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOTokenTemp.deployed();

    let factoryInterface = new ethers.utils.Interface(factoryABI.abi);
    let factoryInitData = factoryInterface.functions.init.encode([await owner.getAddress(), ACOTokenTemp.address, fee, await addr3.getAddress()]);
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
    converterHelper = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
    await converterHelper.deployed();
    
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

    defaultStrategy = await createAcoPoolStrategy();
    await defaultStrategy.setAssetPrecision(token2.address);

    await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);
    await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);
    await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 1250);
    await converterHelper.setPairTolerancePercentage(AddressZero, token2.address, 1250);

    let ACOPoolTemp = await (await ethers.getContractFactory("ACOPool2")).deploy();
    await ACOPoolTemp.deployed();

    let ACOPoolFactoryTemp = await (await ethers.getContractFactory("ACOPoolFactory2")).deploy();
    await ACOPoolFactoryTemp.deployed();
    
    let poolFactoryInterface = new ethers.utils.Interface(poolFactoryABI.abi);
    let poolFactoryInitData = poolFactoryInterface.functions.init.encode([await owner.getAddress(), ACOPoolTemp.address, buidlerACOFactoryProxy.address, converterHelper.address, chiToken.address, poolFee, await addr3.getAddress(), withdrawOpenPositionPenalty, underlyingPriceAdjustPercentage]);
    let buidlerACOPoolFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOPoolFactoryTemp.address, poolFactoryInitData);
    await buidlerACOPoolFactoryProxy.deployed();
    ACOPoolFactory = await ethers.getContractAt("ACOPoolFactory2", buidlerACOPoolFactoryProxy.address);

    await ACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);

    await uniswapFactory.createPair(token1.address, token2.address);
    await uniswapFactory.createPair(token2.address, weth.address);
    
    pairToken1Token2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token1.address, token2.address));
    pairWethToken2 =  await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token2.address, weth.address));

    await token1.connect(owner).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr1).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr2).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr3).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(owner).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr1).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr2).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr3).approve(uniswapRouter.address, token1TotalSupply);
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
    await pairToken1Token2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);
    await pairWethToken2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);

    await token1.connect(owner).transfer(pairToken1Token2.address, token1Liq);
    await token2.connect(owner).transfer(pairToken1Token2.address, token2Liq);
    await pairToken1Token2.connect(owner).mint(await owner.getAddress());
  
    await token2.connect(owner).transfer(pairWethToken2.address, token2Liq);
    await weth.connect(owner).deposit({value: wethLiq});
    await weth.connect(owner).transfer(pairWethToken2.address, wethLiq);
    await pairWethToken2.connect(owner).mint(await owner.getAddress());

    let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
    let current = parseInt(block.timestamp, 16);
    expiration = current + 3 * 86400;

    let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice, expiration, maxExercisedAccounts)).wait();
    let result0 = tx.events[tx.events.length - 1].args;
    ACOToken1Token2Call = await ethers.getContractAt("ACOToken", result0.acoToken);

    let tx1 = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice2, expiration, maxExercisedAccounts)).wait();
    let result1 = tx1.events[tx1.events.length - 1].args;
    ACOToken1Token2Call2 = await ethers.getContractAt("ACOToken", result1.acoToken);

    let tx2 = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice, expiration, maxExercisedAccounts)).wait();
    let result2 = tx2.events[tx2.events.length - 1].args;
    ACOToken1Token2Put = await ethers.getContractAt("ACOToken", result2.acoToken);

    let tx3 = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice2, expiration, maxExercisedAccounts)).wait();
    let result3 = tx3.events[tx3.events.length - 1].args;
    ACOToken1Token2Put2 = await ethers.getContractAt("ACOToken", result3.acoToken);

    let tx4 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, true, acoEthToken2CallPrice, expiration, maxExercisedAccounts)).wait();
    let result4 = tx4.events[tx4.events.length - 1].args;
    ACOEthToken2Call = await ethers.getContractAt("ACOToken", result4.acoToken);

    let tx5 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, true, acoEthToken2CallPrice2, expiration, maxExercisedAccounts)).wait();
    let result5 = tx5.events[tx5.events.length - 1].args;
    ACOEthToken2Call2 = await ethers.getContractAt("ACOToken", result5.acoToken);

    let tx6 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, acoEthToken2PutPrice, expiration, maxExercisedAccounts)).wait();
    let result6 = tx6.events[tx6.events.length - 1].args;
    ACOEthToken2Put = await ethers.getContractAt("ACOToken", result6.acoToken);

    let tx7 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, acoEthToken2PutPrice2, expiration, maxExercisedAccounts)).wait();
    let result7 = tx7.events[tx7.events.length - 1].args;
    ACOEthToken2Put2 = await ethers.getContractAt("ACOToken", result7.acoToken);

    let tx8 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, 5000, 5000, 0, (30*86400), defaultStrategy.address, token1Token2BaseVolatility)).wait();
    let result8 = tx8.events[tx8.events.length - 1].args;
    ACOPoolToken1Token2Call = await ethers.getContractAt("ACOPool2", result8.acoPool);

    let tx9 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, 5000, 5000, 0, (30*86400), defaultStrategy.address, token1Token2BaseVolatility)).wait();
    let result9 = tx9.events[tx9.events.length - 1].args;
    ACOPoolToken1Token2Put = await ethers.getContractAt("ACOPool2", result9.acoPool);
    
    let tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, 5000, 5000, 0, (30*86400), defaultStrategy.address, ethToken2BaseVolatility)).wait();
    let result10 = tx10.events[tx10.events.length - 1].args;
    ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool2", result10.acoPool);

    let tx11 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, 5000, 5000, 0, (30*86400), defaultStrategy.address, ethToken2BaseVolatility)).wait();
    let result11 = tx11.events[tx11.events.length - 1].args;
    ACOPoolEthToken2Put = await ethers.getContractAt("ACOPool2", result11.acoPool);

    await ACOPoolFactory.setValidAcoCreatorOnAcoPool(await owner.getAddress(), true, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Put.address,ACOPoolEthToken2Call.address,ACOPoolEthToken2Put.address]);
  });

  afterEach(async function () {
    let balLP = await pairWethToken2.balanceOf(await owner.getAddress());
    let addr = await owner.getAddress();
    await pairWethToken2.connect(owner).transfer(pairWethToken2.address, balLP);
    await pairWethToken2.connect(owner).burn(addr);
    let balWETH = await weth.balanceOf(addr);
    await weth.connect(owner).withdraw(balWETH);
  });

  describe("ACOPool2 transactions", function () {
    it("Check deposit for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.utils.bigNumberify("100000000");
      let val2 = ethers.utils.bigNumberify("500000000");

      await expect(
        ACOPoolToken1Token2Call.deposit(0, await owner.getAddress())
      ).to.be.revertedWith("Invalid amount");
      
      await expect(
        ACOPoolToken1Token2Call.deposit(val1, AddressZero)
      ).to.be.revertedWith("Invalid to");

      await expect(
        ACOPoolToken1Token2Call.deposit(val1, await owner.getAddress(), {value: 1})
      ).to.be.revertedWith("ACOAssetHelper:: Ether is not expected");
      
      await expect(
        ACOPoolToken1Token2Call.deposit(val1, await owner.getAddress())
      ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");

      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr3).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, await addr1.getAddress());
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);

      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1.div(2), 0);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let addr3bal = ethers.utils.bigNumberify("99000000");
      await ACOPoolToken1Token2Call.connect(addr3).depositWithGasToken(val1, await addr3.getAddress());
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.be.lt(val1);
    });
    it("Check deposit for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await expect(
        ACOPoolToken1Token2Put.deposit(0, await owner.getAddress())
      ).to.be.revertedWith("Invalid amount");
      
      await expect(
        ACOPoolToken1Token2Put.deposit(val1, AddressZero)
      ).to.be.revertedWith("Invalid to");

      await expect(
        ACOPoolToken1Token2Put.deposit(val1, await owner.getAddress(), {value: 1})
      ).to.be.revertedWith("ACOAssetHelper:: Ether is not expected");
      
      await expect(
        ACOPoolToken1Token2Put.deposit(val1, await owner.getAddress())
      ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");

      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, await addr1.getAddress());
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);

      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(val2);

      await token1.approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(val2);

      let addr3bal = ethers.utils.bigNumberify("9900000000");
      await ACOPoolToken1Token2Put.connect(addr3).depositWithGasToken(val1, await addr3.getAddress());
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.be.lt(val1);
    });
    it("Check deposit for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.utils.bigNumberify("1000000000000000000");
      let val2 = ethers.utils.bigNumberify("5000000000000000000");

      await expect(
        ACOPoolEthToken2Call.deposit(0, await owner.getAddress(), {value: 0})
      ).to.be.revertedWith("Invalid amount");
      
      await expect(
        ACOPoolEthToken2Call.deposit(val1, AddressZero)
      ).to.be.revertedWith("Invalid to");

      await expect(
        ACOPoolEthToken2Call.deposit(val1, await owner.getAddress(), {value: 1})
      ).to.be.revertedWith("ACOAssetHelper:: Invalid ETH amount");
      
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);

      await ACOPoolEthToken2Call.deposit(val1, await addr1.getAddress(), {value: val1});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);

      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let addr3bal = ethers.utils.bigNumberify("990000000000000000");
      await ACOPoolEthToken2Call.connect(addr3).depositWithGasToken(val1, await addr3.getAddress(), {value: val1});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolEthToken2Call.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.be.lt(val1);
    });
    it("Check deposit for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await expect(
        ACOPoolEthToken2Put.deposit(0, await owner.getAddress())
      ).to.be.revertedWith("Invalid amount");
      
      await expect(
        ACOPoolEthToken2Put.deposit(val1, AddressZero)
      ).to.be.revertedWith("Invalid to");

      await expect(
        ACOPoolEthToken2Put.deposit(val1, await owner.getAddress(), {value: 1})
      ).to.be.revertedWith("ACOAssetHelper:: Ether is not expected");
      
      await expect(
        ACOPoolEthToken2Put.deposit(val1, await owner.getAddress())
      ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");

      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, await addr1.getAddress());
      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);

      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());
      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(val2);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(50000000), 0, {value: val1.mul(50000000).add(maxExercisedAccounts)});
      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(val2);

      let addr3bal = ethers.utils.bigNumberify("9900000000");
      await ACOPoolEthToken2Put.connect(addr3).depositWithGasToken(val1, await addr3.getAddress());
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.be.lt(val1);
    });
    it("Check swap for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.utils.bigNumberify("100000000");
      let val2 = ethers.utils.bigNumberify("500000000");
      let tol = ethers.utils.bigNumberify("10000");

      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Call.address);
      let swapAmount = val1; 

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");

      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      let quote = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call.address, swapAmount);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await addr3.getAddress(), 1999999999);
      expect(await ACOToken1Token2Call.balanceOf(await addr3.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.lte(prevPoolBal.add(quote[0].sub(quote[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.gt(prevPoolBal.add(quote[0].sub(quote[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote[1]).sub(tol));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call.address)).valueSold).to.be.lte(quote[0].sub(quote[1]));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call.address)).valueSold).to.be.gt(quote[0].sub(quote[1]).sub(tol));

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Call.address);
      let quote2 = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call.address, swapAmount);
      await ACOPoolToken1Token2Call.swapWithGasToken(ACOToken1Token2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Call.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.lte(prevPoolBal.add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.gt(prevPoolBal.add(quote2[0].sub(quote2[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("Swap deadline");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("Invalid destination");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, 0, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid token amount");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token strike price");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([10], [ACOPoolToken1Token2Call.address]);

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token expiration");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([(30*86400)], [ACOPoolToken1Token2Call.address]);

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount.mul(5), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Insufficient liquidity");

      let quote3 = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call.address, swapAmount);
      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, quote3[0].sub(tol), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Swap restriction");

      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolToken1Token2Call.address]);

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Call.address);
      let quote4 = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call2.address, swapAmount);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Call2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.lte(prevPoolBal.add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.gt(prevPoolBal.add(quote4[0].sub(quote4[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
    });
    it("Check swap for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");
      let tol = ethers.utils.bigNumberify("10000");

      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token1TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(val2);

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Put.address);
      let swapAmount = val1.div(100); 

      await expect(
        ACOPoolToken1Token2Put.connect(addr3).swap(ACOToken1Token2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");

      let quote = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put.address, swapAmount);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await addr3.getAddress(), 1999999999);
      expect(await ACOToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.be.lte(prevPoolBal.sub(val1).add(quote[0].sub(quote[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gt(prevPoolBal.sub(val1).add(quote[0].sub(quote[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote[1]).sub(tol));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.lte(quote[0].sub(quote[1]));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.gt(quote[0].sub(quote[1]).sub(tol));

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Put.address);
      let quote2 = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put.address, swapAmount);
      await ACOPoolToken1Token2Put.swapWithGasToken(ACOToken1Token2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Put.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.be.lte(prevPoolBal.sub(val1).add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gt(prevPoolBal.sub(val1).add(quote2[0].sub(quote2[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("Swap deadline");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("Invalid destination");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, 0, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid token amount");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token strike price");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([10], [ACOPoolToken1Token2Put.address]);

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token expiration");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([(30*86400)], [ACOPoolToken1Token2Put.address]);

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount.mul(5), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Insufficient liquidity");

      let quote3 = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put.address, swapAmount);
      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, quote3[0].sub(tol), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Swap restriction");

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolToken1Token2Put.address]);

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Put.address);
      let quote4 = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put2.address, swapAmount);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Put2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.be.lte(prevPoolBal.sub(acoToken1Token2PutPrice2).add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gt(prevPoolBal.sub(acoToken1Token2PutPrice2).add(quote4[0].sub(quote4[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
    });
    it("Check swap for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.utils.bigNumberify("1000000000000000000");
      let val2 = ethers.utils.bigNumberify("5000000000000000000");
      let tol = ethers.utils.bigNumberify("10000");

      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);

      await ACOPoolEthToken2Call.deposit(val1, await addr1.getAddress(), {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Call.address);
      let swapAmount = val1; 

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      let quote = await ACOPoolEthToken2Call.quote(ACOEthToken2Call.address, swapAmount);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await addr3.getAddress(), 1999999999);
      expect(await ACOEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.lte(prevPoolBal.add(quote[0].sub(quote[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.gt(prevPoolBal.add(quote[0].sub(quote[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote[1]).sub(tol));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call.address)).valueSold).to.be.lte(quote[0].sub(quote[1]));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call.address)).valueSold).to.be.gt(quote[0].sub(quote[1]).sub(tol));

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Call.address);
      let quote2 = await ACOPoolEthToken2Call.quote(ACOEthToken2Call.address, swapAmount);
      await ACOPoolEthToken2Call.swapWithGasToken(ACOEthToken2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Call.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.lte(prevPoolBal.add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.gt(prevPoolBal.add(quote2[0].sub(quote2[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("Swap deadline");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("Invalid destination");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, 0, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid token amount");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token strike price");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([10], [ACOPoolEthToken2Call.address]);

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token expiration");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([(30*86400)], [ACOPoolEthToken2Call.address]);

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount.mul(5), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Insufficient liquidity");

      let quote3 = await ACOPoolEthToken2Call.quote(ACOEthToken2Call.address, swapAmount);
      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, quote3[0].sub(tol), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Swap restriction");

      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolEthToken2Call.address]);

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Call.address);
      let quote4 = await ACOPoolEthToken2Call.quote(ACOEthToken2Call2.address, swapAmount);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Call2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.lte(prevPoolBal.add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.gt(prevPoolBal.add(quote4[0].sub(quote4[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
    });
    it("Check swap for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");
      let tol = ethers.utils.bigNumberify("10000");

      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolEthToken2Put.address, token1TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token1TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());
      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(val2);

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Put.address);
      let swapAmount = val1.mul(ethers.utils.bigNumberify("100000000")); 

      await expect(
        ACOPoolEthToken2Put.connect(addr3).swap(ACOEthToken2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");

      let quote = await ACOPoolEthToken2Put.quote(ACOEthToken2Put.address, swapAmount);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await addr3.getAddress(), 1999999999);
      expect(await ACOEthToken2Put.balanceOf(await addr3.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.be.lte(prevPoolBal.sub(acoEthToken2PutPrice).add(quote[0].sub(quote[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.be.gt(prevPoolBal.sub(acoEthToken2PutPrice).add(quote[0].sub(quote[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote[1]).sub(tol));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.lte(quote[0].sub(quote[1]));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.gt(quote[0].sub(quote[1]).sub(tol));

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Put.address);
      let quote2 = await ACOPoolEthToken2Put.quote(ACOEthToken2Put.address, swapAmount);
      await ACOPoolEthToken2Put.swapWithGasToken(ACOEthToken2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Put.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.be.lte(prevPoolBal.sub(acoEthToken2PutPrice).add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.be.gt(prevPoolBal.sub(acoEthToken2PutPrice).add(quote2[0].sub(quote2[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("Swap deadline");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("Invalid destination");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, 0, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid token amount");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Call.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token strike price");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([10], [ACOPoolEthToken2Put.address]);

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Invalid ACO token expiration");

      await ACOPoolFactory.setMaxExpirationOnAcoPool([(30*86400)], [ACOPoolEthToken2Put.address]);

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount.mul(1000), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Insufficient liquidity");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, 1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Token amount is too small");

      let quote3 = await ACOPoolEthToken2Put.quote(ACOEthToken2Put.address, swapAmount);
      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, quote3[0].sub(tol), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("Swap restriction");

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolEthToken2Put.address]);

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Put.address);
      let quote4 = await ACOPoolEthToken2Put.quote(ACOEthToken2Put2.address, swapAmount);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, swapAmount, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Put2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.be.lte(prevPoolBal.sub(acoEthToken2PutPrice2).add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.be.gt(prevPoolBal.sub(acoEthToken2PutPrice2).add(quote4[0].sub(quote4[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
    });
    it("Check restore ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.utils.bigNumberify("100000000");
      let val2 = ethers.utils.bigNumberify("500000000");

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
      
      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1.div(2), 0);

      await aggregatorToken1Token2.updateAnswer("900000000000");
      await expect(ACOPoolToken1Token2Call.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorToken1Token2.updateAnswer("1000000000000");

      let poolBal = await token1.balanceOf(ACOPoolToken1Token2Call.address);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.gt(0);

      let tx = await (await ACOPoolToken1Token2Call.connect(addr3).restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(poolBal.add(result.collateralRestored));

      await expect(ACOPoolToken1Token2Call.restoreCollateral()).to.be.revertedWith("No balance");
    });
    it("Check restore ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());

      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);

      await aggregatorToken1Token2.updateAnswer("1100000000000");
      await expect(ACOPoolToken1Token2Put.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorToken1Token2.updateAnswer("1000000000000");

      let poolBal = await token2.balanceOf(ACOPoolToken1Token2Put.address);
      expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gt(0);

      let tx = await (await ACOPoolToken1Token2Put.connect(addr3).restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(poolBal.add(result.collateralRestored));

      await expect(ACOPoolToken1Token2Put.restoreCollateral()).to.be.revertedWith("No balance");
    });
    it("Check restore ACOPoolEthToken2Call", async function () {
      let val1 = ethers.utils.bigNumberify("1000000000000000000");
      let val2 = ethers.utils.bigNumberify("5000000000000000000");

      await ACOPoolEthToken2Call.deposit(val1, await addr1.getAddress(), {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);

      await aggregatorWethToken2.updateAnswer("35000000000");
      await expect(ACOPoolEthToken2Call.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorWethToken2.updateAnswer("40000000000");

      let poolBal = ethers.utils.bigNumberify(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.gt(0);

      let tx = await (await ACOPoolEthToken2Call.connect(addr3).restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(ethers.utils.bigNumberify(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(poolBal.add(result.collateralRestored));

      await expect(ACOPoolEthToken2Call.restoreCollateral()).to.be.revertedWith("No balance");
    });
    it("Check restore ACOPoolEthToken2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(50000000), 0, {value: val1.mul(50000000).add(maxExercisedAccounts)});

      await aggregatorWethToken2.updateAnswer("42000000000");
      await expect(ACOPoolEthToken2Put.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorWethToken2.updateAnswer("40000000000");

      let poolBal = await token2.balanceOf(ACOPoolEthToken2Put.address);
      expect(ethers.utils.bigNumberify(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.be.gt(0);

      let tx = await (await ACOPoolEthToken2Put.connect(addr3).restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(poolBal.add(result.collateralRestored));
      expect(ethers.utils.bigNumberify(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);

      await expect(ACOPoolEthToken2Put.restoreCollateral()).to.be.revertedWith("No balance");
    });
    it("Check redeem ACO tokens for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.utils.bigNumberify("100000000");
      let val2 = ethers.utils.bigNumberify("500000000");

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
      
      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1, 0);

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolToken1Token2Call.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolToken1Token2Call.address]);

      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolToken1Token2Call.connect(addr3).redeemACOTokens();
      await ACOPoolToken1Token2Call.connect(addr3).redeemACOTokens();

      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO tokens for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());

      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolToken1Token2Put.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolToken1Token2Put.address]);

      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, val1.div(100), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolToken1Token2Put.connect(addr3).redeemACOTokens();
      await ACOPoolToken1Token2Put.connect(addr3).redeemACOTokens();

      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO tokens for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.utils.bigNumberify("1000000000000000000");
      let val2 = ethers.utils.bigNumberify("5000000000000000000");

      await ACOPoolEthToken2Call.deposit(val1, await addr1.getAddress(), {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolEthToken2Call.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolEthToken2Call.address]);

      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolEthToken2Call.connect(addr3).redeemACOTokens();
      await ACOPoolEthToken2Call.connect(addr3).redeemACOTokens();

      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO tokens for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(100000000), 0, {value: val1.mul(100000000).add(maxExercisedAccounts)});

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolEthToken2Put.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolEthToken2Put.address]);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, val1.mul(100000000), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolEthToken2Put.connect(addr3).redeemACOTokens();
      await ACOPoolEthToken2Put.connect(addr3).redeemACOTokens();

      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO token for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.utils.bigNumberify("100000000");
      let val2 = ethers.utils.bigNumberify("500000000");

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
      
      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1, 0);

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolToken1Token2Call.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolToken1Token2Call.address]);

      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(2);

      await ACOPoolToken1Token2Call.connect(addr3).redeemACOToken(ACOToken1Token2Call.address);
      await ACOPoolToken1Token2Call.connect(addr3).redeemACOToken(ACOToken1Token2Call2.address);

      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolToken1Token2Call.connect(addr3).redeemACOToken(ACOToken1Token2Call.address);
      await ACOPoolToken1Token2Call.connect(addr3).redeemACOToken(ACOToken1Token2Call.address);
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(1);

      await ACOPoolToken1Token2Call.connect(addr3).redeemACOToken(ACOToken1Token2Call2.address);
      await ACOPoolToken1Token2Call.connect(addr3).redeemACOToken(ACOToken1Token2Call2.address);
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO token for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());

      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolToken1Token2Put.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolToken1Token2Put.address]);

      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, val1.div(100), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(2);

      await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put2.address);
      await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put.address);

      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put2.address);
      await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put2.address);
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(1);
      
      await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put.address);
      await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put.address);
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO token for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.utils.bigNumberify("1000000000000000000");
      let val2 = ethers.utils.bigNumberify("5000000000000000000");

      await ACOPoolEthToken2Call.deposit(val1, await addr1.getAddress(), {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolEthToken2Call.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolEthToken2Call.address]);

      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1, ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(2);

      await ACOPoolEthToken2Call.connect(addr1).redeemACOToken(ACOEthToken2Call.address);
      await ACOPoolEthToken2Call.connect(addr1).redeemACOToken(ACOEthToken2Call2.address);

      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolEthToken2Call.connect(addr1).redeemACOToken(ACOEthToken2Call2.address);
      await ACOPoolEthToken2Call.connect(addr1).redeemACOToken(ACOEthToken2Call2.address);
      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(1);

      await ACOPoolEthToken2Call.connect(addr2).redeemACOToken(ACOEthToken2Call.address);
      await ACOPoolEthToken2Call.connect(addr2).redeemACOToken(ACOEthToken2Call.address);
      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO token for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.utils.bigNumberify("10000000000");
      let val2 = ethers.utils.bigNumberify("50000000000");

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, await addr1.getAddress());
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(100000000), 0, {value: val1.mul(100000000).add(maxExercisedAccounts)});

      await ACOPoolFactory.setTolerancePriceAboveOnAcoPool([0],[ACOPoolEthToken2Put.address]);
      await ACOPoolFactory.setTolerancePriceBelowOnAcoPool([0],[ACOPoolEthToken2Put.address]);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, val1.mul(100000000), ethers.utils.bigNumberify("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(2);

      await ACOPoolEthToken2Put.connect(addr1).redeemACOToken(ACOEthToken2Put2.address);
      await ACOPoolEthToken2Put.connect(addr1).redeemACOToken(ACOEthToken2Put.address);

      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolEthToken2Put.connect(addr3).redeemACOToken(ACOEthToken2Put.address);
      await ACOPoolEthToken2Put.connect(addr1).redeemACOToken(ACOEthToken2Put.address);
      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(1);

      await ACOPoolEthToken2Put.connect(addr2).redeemACOToken(ACOEthToken2Put2.address);
      await ACOPoolEthToken2Put.connect(addr2).redeemACOToken(ACOEthToken2Put2.address);
      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check withdraw for ACOPoolToken1Token2Call", async function () {

    });
    it("Check withdraw for ACOPoolToken1Token2Put", async function () {

    });
    it("Check withdraw for ACOPoolEthToken2Call", async function () {

    });
    it("Check withdraw for ACOPoolEthToken2Put", async function () {

    });
    it("Check complex flow ACOPoolToken1Token2Call", async function () {

    });
    it("Check complex flow ACOPoolToken1Token2Put", async function () {

    });
    it("Check complex flow ACOPoolEthToken2Call", async function () {

    });
    it("Check complex flow ACOPoolEthToken2Put", async function () {

    });
  });
});