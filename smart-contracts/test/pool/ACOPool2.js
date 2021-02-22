const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/contracts/periphery/pool/ACOPoolFactory2.sol/ACOPoolFactory2.json");
const factoryABI = require("../../artifacts/contracts/core/ACOFactory.sol/ACOFactory.json");
const { createAcoPoolStrategy } = require("./ACOPoolStrategy.js");
const AddressZero = "0x0000000000000000000000000000000000000000";

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
  let maxOpenAco = 50;
  let maxExercisedAccounts = 120;
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
  let defaultStrategy;
  let aggregatorToken1Token2;
  let aggregatorWethToken2;
  let flashExercise;
  let uniswapFactory;
  let weth;
  let uniswapRouter;
  let chiToken;
  let converterHelper;
  let toleranceBelowMax = 5000;
  let toleranceAboveMax = 5000;
  let minExpiration = 0;
  let maxExpiration = (30*86400);

  let token1Token2Price = ethers.BigNumber.from("10000000000");
  let ethToken2Price = ethers.BigNumber.from("400000000");
  let expiration;
  let acoEthToken2CallPrice = ethers.BigNumber.from("400000000");
  let acoEthToken2CallPrice2 = ethers.BigNumber.from("500000000");
  let acoEthToken2PutPrice = ethers.BigNumber.from("400000000");
  let acoEthToken2PutPrice2 = ethers.BigNumber.from("300000000");
  let acoToken1Token2CallPrice = ethers.BigNumber.from("10000000000");
  let acoToken1Token2CallPrice2 = ethers.BigNumber.from("12000000000");
  let acoToken1Token2PutPrice = ethers.BigNumber.from("10000000000");
  let acoToken1Token2PutPrice2 = ethers.BigNumber.from("9000000000");
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
  let atoken;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10,...addrs] = await ethers.getSigners();
    
    if (!started) {
      let baseTx = {to: await owner.getAddress(), value: ethers.BigNumber.from("2200000000000000000000")};
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
    let factoryInitData = factoryInterface.encodeFunctionData("init", [await owner.getAddress(), ACOTokenTemp.address, fee, await addr3.getAddress()]);
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

    await token1.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("100000000000000"));
    await token1.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("100000000000000"));
    await token1.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("100000000000000"));

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    await token2.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("1000000000000"));
    await token2.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("1000000000000"));
    await token2.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("1000000000000"));

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

    let poolLib = await (await ethers.getContractFactory("ACOPoolLib")).deploy();
    await poolLib.deployed();
    ACOPoolTemp = await (await ethers.getContractFactory("ACOPool2", {libraries:{ACOPoolLib:poolLib.address}})).deploy();
    await ACOPoolTemp.deployed();

    let ACOPoolFactoryTemp = await (await ethers.getContractFactory("ACOPoolFactory2V4")).deploy();
    await ACOPoolFactoryTemp.deployed();
    
    let poolFactoryInterface = new ethers.utils.Interface(poolFactoryABI.abi);
    let poolFactoryInitData = poolFactoryInterface.encodeFunctionData("init", [await owner.getAddress(), ACOPoolTemp.address, buidlerACOFactoryProxy.address, converterHelper.address, chiToken.address, poolFee, await addr3.getAddress(), withdrawOpenPositionPenalty, underlyingPriceAdjustPercentage, maxOpenAco]);
    let buidlerACOPoolFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOPoolFactoryTemp.address, poolFactoryInitData);
    await buidlerACOPoolFactoryProxy.deployed();
    ACOPoolFactory = await ethers.getContractAt("ACOPoolFactory2V4", buidlerACOPoolFactoryProxy.address);

    await ACOPoolFactory.setAuthorizedAcoCreator(AddressZero, true);
    await ACOPoolFactory.setOperator(await owner.getAddress(), true);
    await ACOPoolFactory.setPoolProxyAdmin(await owner.getAddress());
    await ACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);

    let lendingPool = await (await ethers.getContractFactory("LendingPoolForTest")).deploy(ethers.BigNumber.from("3000000000000000000000"));
    await lendingPool.deployed();
    await token2.approve(lendingPool.address, token2TotalSupply);
    await lendingPool.setAsset(token2.address, token2TotalSupply.div(4));
    await ACOPoolFactory.setAcoPoolLendingPool(lendingPool.address);
    await lendingPool.deposit(token2.address, token2TotalSupply.div(10), await owner.getAddress(), 0);
    atoken = await ethers.getContractAt("ERC20ForTest", (await lendingPool.getReserveData(token2.address)).aTokenAddress);

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

    let tx8 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, token1Token2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceAboveMax, minExpiration, maxExpiration])).wait();
    let result8 = tx8.events[tx8.events.length - 1].args;
    ACOPoolToken1Token2Call = await ethers.getContractAt("ACOPool2", result8.acoPool);

    let tx9 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, token1Token2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceAboveMax, minExpiration, maxExpiration])).wait();
    let result9 = tx9.events[tx9.events.length - 1].args;
    ACOPoolToken1Token2Put = await ethers.getContractAt("ACOPool2", result9.acoPool);
    
    let tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, ethToken2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceAboveMax, minExpiration, maxExpiration])).wait();
    let result10 = tx10.events[tx10.events.length - 1].args;
    ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool2", result10.acoPool);

    let tx11 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, ethToken2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceAboveMax, minExpiration, maxExpiration])).wait();
    let result11 = tx11.events[tx11.events.length - 1].args;
    ACOPoolEthToken2Put = await ethers.getContractAt("ACOPool2", result11.acoPool);
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
      let val1 = ethers.BigNumber.from("100000000");
      let val2 = ethers.BigNumber.from("500000000");

      await expect(
        ACOPoolToken1Token2Call.deposit(0, 1, await owner.getAddress(), false)
      ).to.be.revertedWith("E10");
      
      await expect(
        ACOPoolToken1Token2Call.deposit(val1, 1, AddressZero, false)
      ).to.be.revertedWith("E11");

      await expect(
        ACOPoolToken1Token2Call.deposit(val1, 1, await owner.getAddress(), false, {value: 1})
      ).to.be.revertedWith("No payable");
      
      await expect(
        ACOPoolToken1Token2Call.deposit(val1, 1, await owner.getAddress(), false)
      ).to.be.revertedWith("transferFrom");

      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr3).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      let d1 = await ACOPoolToken1Token2Call.getDepositShares(val1);
      expect(d1).to.equal(val1);
      await expect(
        ACOPoolToken1Token2Call.deposit(val1, d1.add(1), await addr1.getAddress(), false)
      ).to.be.revertedWith("E13");
      await expect(
        ACOPoolToken1Token2Call.deposit(val1, d1, await addr1.getAddress(), true)
      ).to.be.revertedWith("E12");

      await ACOPoolToken1Token2Call.deposit(val1, d1, await addr1.getAddress(), false);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);

      let d2 = await ACOPoolToken1Token2Call.getDepositShares(val2);
      expect(d2).to.equal(val2);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, d2, await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1.div(2), 0);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let d3 = await ACOPoolToken1Token2Call.getDepositShares(val1);
      await expect(
        ACOPoolToken1Token2Call.connect(addr3).depositWithGasToken(val1, d3.add(100), await addr3.getAddress(), false)
      ).to.be.revertedWith("E13");

      let addr3bal = ethers.BigNumber.from("99000000");
      await ACOPoolToken1Token2Call.connect(addr3).depositWithGasToken(val1, d3.sub(100), await addr3.getAddress(), false);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.be.lt(val1);
    });
    it("Check deposit for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await expect(
        ACOPoolToken1Token2Put.deposit(0, 1, await owner.getAddress(), false)
      ).to.be.revertedWith("E10");
      
      await expect(
        ACOPoolToken1Token2Put.deposit(val1, 1, AddressZero, false)
      ).to.be.revertedWith("E11");

      await expect(
        ACOPoolToken1Token2Put.deposit(val1, 1, await owner.getAddress(), false, {value: 1})
      ).to.be.revertedWith("No payable");
      
      await expect(
        ACOPoolToken1Token2Put.deposit(val1, 1, await owner.getAddress(), false)
      ).to.be.revertedWith("transferFrom");

      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      let d1 = await ACOPoolToken1Token2Put.getDepositShares(val1);
      expect(d1).to.equal(val1);
      await expect(
        ACOPoolToken1Token2Put.deposit(val1, d1.add(1), await addr1.getAddress(), false)
      ).to.be.revertedWith("E13");

      await ACOPoolToken1Token2Put.deposit(val1, d1, await addr1.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);

      let d2 = await ACOPoolToken1Token2Put.getDepositShares(val2.div(2));
      expect(d2).to.equal(val2.div(2));
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2.div(2), d2.mul(99).div(100), await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.lt(val1.add(val2.div(2)));
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.gt(val1.add(val2.div(2)).mul(99).div(100));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2.div(2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.div(2).mul(99).div(100));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);

      d2 = await ACOPoolToken1Token2Put.getDepositShares(val2.div(2));
      expect(d2).to.be.lt(val2.div(2));
      expect(d2).to.be.gt(val2.div(2).mul(99).div(100));
      await atoken.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await ACOPoolToken1Token2Put.deposit(val2.div(2), d2.mul(99).div(100), await addr2.getAddress(), true);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.lt(val1.add(val2));
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.gt(val1.add(val2).mul(99).div(100));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);

      await token1.approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.lt(val1.add(val2));
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.gt(val1.add(val2).mul(99).div(100));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);

      let d3 = await ACOPoolToken1Token2Put.getDepositShares(val1);
      await expect(
        ACOPoolToken1Token2Put.connect(addr3).depositWithGasToken(val1, d3.add(1000), await addr3.getAddress(), false)
      ).to.be.revertedWith("E13");

      let addr3bal = ethers.BigNumber.from("9900000000");
      await ACOPoolToken1Token2Put.connect(addr3).depositWithGasToken(val1, d3.mul(99).div(100), await addr3.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.be.lt(val1);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
     });
    it("Check deposit for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.BigNumber.from("1000000000000000000");
      let val2 = ethers.BigNumber.from("5000000000000000000");

      await expect(
        ACOPoolEthToken2Call.deposit(0, 1, await owner.getAddress(), false, {value: 0})
      ).to.be.revertedWith("E10");
      
      await expect(
        ACOPoolEthToken2Call.deposit(val1, 1, AddressZero, false)
      ).to.be.revertedWith("E11");

      await expect(
        ACOPoolEthToken2Call.deposit(val1, 1, await owner.getAddress(), false, {value: 1})
      ).to.be.revertedWith("Invalid ETH amount");
      
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);

      let d1 = await ACOPoolEthToken2Call.getDepositShares(val1);
      expect(d1).to.equal(val1);
      await expect(
        ACOPoolEthToken2Call.deposit(val1, d1.add(1), await addr1.getAddress(), false, {value: val1})
      ).to.be.revertedWith("E13");
      await expect(
        ACOPoolEthToken2Call.deposit(val1, d1, await addr1.getAddress(), true, {value: val1})
      ).to.be.revertedWith("E12");

      await ACOPoolEthToken2Call.deposit(val1, d1, await addr1.getAddress(), false, {value: val1});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);

      let d2 = await ACOPoolEthToken2Call.getDepositShares(val2);
      expect(d2).to.equal(val2);
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, d2, await addr2.getAddress(), false, {value: val2});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let d3 = await ACOPoolEthToken2Call.getDepositShares(val1);
      await expect(
        ACOPoolEthToken2Call.connect(addr3).depositWithGasToken(val1, d3.add(ethers.BigNumber.from("2500000000000")), await addr3.getAddress(), false, {value: val1})
      ).to.be.revertedWith("E13");

      let addr3bal = ethers.BigNumber.from("990000000000000000");
      await ACOPoolEthToken2Call.connect(addr3).depositWithGasToken(val1, d3.mul(99).div(100), await addr3.getAddress(), false, {value: val1});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolEthToken2Call.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.be.lt(val1);
    });
    it("Check deposit for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await expect(
        ACOPoolEthToken2Put.deposit(0, 1, await owner.getAddress(), false)
      ).to.be.revertedWith("E10");
      
      await expect(
        ACOPoolEthToken2Put.deposit(val1, 1, AddressZero, false)
      ).to.be.revertedWith("E11");

      await expect(
        ACOPoolEthToken2Put.deposit(val1, 1, await owner.getAddress(), false, {value: 1})
      ).to.be.revertedWith("No payable");
      
      await expect(
        ACOPoolEthToken2Put.deposit(val1, 1, await owner.getAddress(), false)
      ).to.be.revertedWith("transferFrom");

      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      let d1 = await ACOPoolEthToken2Put.getDepositShares(val1);
      expect(d1).to.equal(val1);
      await expect(
        ACOPoolEthToken2Put.deposit(val1, d1.add(1), await addr1.getAddress(), false, {value: val1})
      ).to.be.revertedWith("E13");

      await ACOPoolEthToken2Put.deposit(val1, d1, await addr1.getAddress(), false);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);

      d2 = await ACOPoolEthToken2Put.getDepositShares(val2.div(2));
      expect(d2).to.equal(val2.div(2));
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2.div(2), d2.mul(99).div(100), await addr2.getAddress(), false);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val1.add(val2.div(2)));
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val1.add(val2.div(2)).mul(99).div(100));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2.div(2));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.div(2).mul(99).div(100));
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);

      await atoken.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      d2 = await ACOPoolEthToken2Put.getDepositShares(val2.div(2));
      expect(d2).to.be.lt(val2.div(2));
      expect(d2).to.be.gt(val2.div(2).mul(99).div(100));
      await atoken.transfer(await addr2.getAddress(), val2);
      await ACOPoolEthToken2Put.connect(addr2).depositWithGasToken(val2.div(2), d2.mul(99).div(100), await addr2.getAddress(), true);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val1.add(val2));
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val1.add(val2).mul(99).div(100));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(50000000), 0, {value: val1.mul(50000000).add(maxExercisedAccounts)});
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val1.add(val2));
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val1.add(val2).mul(99).div(100));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);

      let d3 = await ACOPoolEthToken2Put.getDepositShares(val1);
      await expect(
        ACOPoolEthToken2Put.connect(addr3).depositWithGasToken(val1, d3.add(1000), await addr3.getAddress(), false)
      ).to.be.revertedWith("E13");

      let addr3bal = ethers.BigNumber.from("9900000000");
      await ACOPoolEthToken2Put.connect(addr3).depositWithGasToken(val1, d3.mul(99).div(100), await addr3.getAddress(), false);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val1.add(val2).add(addr3bal));
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val1.add(val2).add(val1));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.be.gt(addr3bal);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.be.lt(val1);
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);
    });
    it("Check swap for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.BigNumber.from("100000000");
      let val2 = ethers.BigNumber.from("500000000");
      let tol = ethers.BigNumber.from("10000");

      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Call.address);
      let swapAmount = val1; 

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("transferFrom");

      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      let quote = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call.address, swapAmount);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await addr3.getAddress(), 1999999999);
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
      await ACOPoolToken1Token2Call.swapWithGasToken(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Call.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.lte(prevPoolBal.add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.gt(prevPoolBal.add(quote2[0].sub(quote2[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("E40");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("E41");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, 0, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E50");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E51");

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,toleranceBelowMax,toleranceAboveMax,0,minExpiration,maxExpiration]);

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,10]);

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token expiration");

      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,(30*86400)]);

      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount.mul(5), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Insufficient liquidity");

      let quote3 = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call.address, swapAmount);
      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, swapAmount, quote3[0].sub(tol), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E42");
      
      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,0,toleranceAboveMax,0,minExpiration,maxExpiration]);

      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,1,await addr3.getAddress(),converterHelper.address,[ACOPoolToken1Token2Call.address]);
      
      await expect(
        ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E45");

      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,2,await addr3.getAddress(),converterHelper.address,[ACOPoolToken1Token2Call.address]);

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolToken1Token2Call.address);
      let quote4 = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call2.address, swapAmount);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Call2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.lte(prevPoolBal.add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.gt(prevPoolBal.add(quote4[0].sub(quote4[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolToken1Token2Call.acoData(ACOToken1Token2Call2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
    });
    it("Check swap for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");
      let tol = ethers.BigNumber.from("10000");

      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token1TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.lt(val1.add(val2));
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.be.gt(val1.add(val2).mul(99).div(100));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await atoken.balanceOf(ACOPoolToken1Token2Put.address);
      let swapAmount = val1.div(100); 

      await expect(
        ACOPoolToken1Token2Put.connect(addr3).swap(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("transferFrom");

      let quote = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put.address, swapAmount);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await addr3.getAddress(), 1999999999);
      expect(await ACOToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(swapAmount);
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gte(prevPoolBal.sub(val1).add(quote[0].sub(quote[1])));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote[1]).sub(tol));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.lte(quote[0].sub(quote[1]));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.gt(quote[0].sub(quote[1]).sub(tol));

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await atoken.balanceOf(ACOPoolToken1Token2Put.address);
      let quote2 = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put.address, swapAmount);
      await ACOPoolToken1Token2Put.swapWithGasToken(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Put.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gte(prevPoolBal.sub(val1).add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("E40");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("E41");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, 0, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E50");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E51");

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolToken1Token2Put.setAcoPermissionConfig([toleranceBelowMax,0,0,toleranceAboveMax,minExpiration,maxExpiration]);

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolToken1Token2Put.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,10]);

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token expiration");

      await ACOPoolToken1Token2Put.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,(30*86400)]);

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount.mul(5), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Insufficient liquidity");

      let quote3 = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put.address, swapAmount);
      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, swapAmount, quote3[0].mul(99).div(100), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E42");

      await ACOPoolToken1Token2Put.setAcoPermissionConfig([toleranceBelowMax,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,1,await addr3.getAddress(),converterHelper.address,[ACOPoolToken1Token2Put.address]);

      await expect(
        ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E45");
      
      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,2,await addr3.getAddress(),converterHelper.address,[ACOPoolToken1Token2Put.address]);
      
      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await atoken.balanceOf(ACOPoolToken1Token2Put.address);
      let quote4 = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put2.address, swapAmount);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOToken1Token2Put2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gte(prevPoolBal.sub(acoToken1Token2PutPrice2).add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolToken1Token2Put.acoData(ACOToken1Token2Put2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
    });
    it("Check swap for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.BigNumber.from("1000000000000000000");
      let val2 = ethers.BigNumber.from("5000000000000000000");
      let tol = ethers.BigNumber.from("10000");

      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);

      await ACOPoolEthToken2Call.deposit(val1, 1, await addr1.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false, {value: val2});
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.add(val2));
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val2);

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Call.address);
      let swapAmount = val1; 

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("transferFrom");

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      let quote = await ACOPoolEthToken2Call.quote(ACOEthToken2Call.address, swapAmount);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await addr3.getAddress(), 1999999999);
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
      await ACOPoolEthToken2Call.swapWithGasToken(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Call.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.lte(prevPoolBal.add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.gt(prevPoolBal.add(quote2[0].sub(quote2[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("E40");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("E41");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, 0, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E50");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E51");

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,toleranceBelowMax,toleranceAboveMax,0,minExpiration,maxExpiration]);

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,10]);

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token expiration");

      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,(30*86400)]);

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount.mul(5), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Insufficient liquidity");

      let quote3 = await ACOPoolEthToken2Call.quote(ACOEthToken2Call.address, swapAmount);
      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, swapAmount, quote3[0].sub(tol), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E42");

      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,0,toleranceAboveMax,0,minExpiration,maxExpiration]);

      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,1,await addr3.getAddress(),converterHelper.address,[ACOPoolEthToken2Call.address]);

      await expect(
        ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E45");

      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,2,await addr3.getAddress(),converterHelper.address,[ACOPoolEthToken2Call.address]);

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await token2.balanceOf(ACOPoolEthToken2Call.address);
      let quote4 = await ACOPoolEthToken2Call.quote(ACOEthToken2Call2.address, swapAmount);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Call2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.lte(prevPoolBal.add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.gt(prevPoolBal.add(quote4[0].sub(quote4[1]).sub(tol)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolEthToken2Call.acoData(ACOEthToken2Call2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
    });
    it("Check swap for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");
      let tol = ethers.BigNumber.from("10000");

      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);

      await token2.approve(ACOPoolEthToken2Put.address, token1TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token1TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val1.add(val2));
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val1.add(val2).mul(99).div(100));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(val1);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.mul(99).div(100));

      let prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      let prevPoolBal = await atoken.balanceOf(ACOPoolEthToken2Put.address);
      let swapAmount = val1.mul(ethers.BigNumber.from("100000000")); 

      await expect(
        ACOPoolEthToken2Put.connect(addr3).swap(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("transferFrom");

      let quote = await ACOPoolEthToken2Put.quote(ACOEthToken2Put.address, swapAmount);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await addr3.getAddress(), 1999999999);
      expect(await ACOEthToken2Put.balanceOf(await addr3.getAddress())).to.equal(swapAmount);
      expect(await atoken.balanceOf(ACOPoolEthToken2Put.address)).to.be.gte(prevPoolBal.sub(acoEthToken2PutPrice).add(quote[0].sub(quote[1])));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote[1]).sub(tol));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.lte(quote[0].sub(quote[1]));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.gt(quote[0].sub(quote[1]).sub(tol));

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await atoken.balanceOf(ACOPoolEthToken2Put.address);
      let quote2 = await ACOPoolEthToken2Put.quote(ACOEthToken2Put.address, swapAmount);
      await ACOPoolEthToken2Put.swapWithGasToken(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Put.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await atoken.balanceOf(ACOPoolEthToken2Put.address)).to.be.gte(prevPoolBal.sub(acoEthToken2PutPrice).add(quote2[0].sub(quote2[1])));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote2[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote2[1]).sub(tol));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.lte(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put.address)).valueSold).to.be.gt(quote2[0].sub(quote2[1]).add(quote[0].sub(quote[1])).sub(tol).sub(tol));

      let current = await getCurrentTimestamp();
      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), current)
      ).to.be.revertedWith("E40");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), AddressZero, 1999999999)
      ).to.be.revertedWith("E41");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, 0, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E50");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Call.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E51");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolEthToken2Put.setAcoPermissionConfig([toleranceBelowMax,0,0,toleranceAboveMax,minExpiration,maxExpiration]);

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token strike price");

      await ACOPoolEthToken2Put.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,10]);

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Invalid ACO token expiration");

      await ACOPoolEthToken2Put.setAcoPermissionConfig([0,toleranceBelowMax,0,toleranceAboveMax,minExpiration,(30*86400)]);

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount.mul(1000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: Insufficient liquidity");

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, 1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("ACOPoolLib: The token amount is too small");

      let quote3 = await ACOPoolEthToken2Put.quote(ACOEthToken2Put.address, swapAmount);
      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, swapAmount, quote3[0].mul(99).div(100), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E42");

      await ACOPoolEthToken2Put.setAcoPermissionConfig([toleranceBelowMax,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,1,await addr3.getAddress(),converterHelper.address,[ACOPoolEthToken2Put.address]);

      await expect(
        ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999)
      ).to.be.revertedWith("E45");

      await ACOPoolFactory.setProtocolConfigOnAcoPool(0,withdrawOpenPositionPenalty,underlyingPriceAdjustPercentage,poolFee,2,await addr3.getAddress(),converterHelper.address,[ACOPoolEthToken2Put.address]);

      prevAddr3Bal = await token2.balanceOf(await addr3.getAddress());
      prevPoolBal = await atoken.balanceOf(ACOPoolEthToken2Put.address);
      let quote4 = await ACOPoolEthToken2Put.quote(ACOEthToken2Put2.address, swapAmount);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, swapAmount, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      expect(await ACOEthToken2Put2.balanceOf(await owner.getAddress())).to.equal(swapAmount);
      expect(await atoken.balanceOf(ACOPoolEthToken2Put.address)).to.be.gte(prevPoolBal.sub(acoEthToken2PutPrice2).add(quote4[0].sub(quote4[1])));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.lte(prevAddr3Bal.add(quote4[1]));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gt(prevAddr3Bal.add(quote4[1]).sub(tol));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put2.address)).valueSold).to.be.lte(quote4[0].sub(quote4[1]));
      expect((await ACOPoolEthToken2Put.acoData(ACOEthToken2Put2.address)).valueSold).to.be.gt(quote4[0].sub(quote4[1]).sub(tol));
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);
    });
    it("Check restore ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.BigNumber.from("100000000");
      let val2 = ethers.BigNumber.from("500000000");

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      
      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1.div(2), 0);

      await expect(
        ACOPoolToken1Token2Call.connect(addr1).restoreCollateral()
      ).to.be.revertedWith("E98");

      await aggregatorToken1Token2.updateAnswer("900000000000");
      await expect(ACOPoolToken1Token2Call.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorToken1Token2.updateAnswer("1000000000000");

      let poolBal = await token1.balanceOf(ACOPoolToken1Token2Call.address);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.be.gt(0);

      let tx = await (await ACOPoolToken1Token2Call.restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(poolBal.add(result.collateralRestored));

      await expect(ACOPoolToken1Token2Call.restoreCollateral()).to.be.revertedWith("E60");
    });
    it("Check restore ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);

      await expect(
        ACOPoolToken1Token2Put.connect(addr1).restoreCollateral()
      ).to.be.revertedWith("E98");

      await aggregatorToken1Token2.updateAnswer("1100000000000");
      await expect(ACOPoolToken1Token2Put.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorToken1Token2.updateAnswer("1000000000000");

      let poolBal = await atoken.balanceOf(ACOPoolToken1Token2Put.address);
      expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gt(0);

      let tx = await (await ACOPoolToken1Token2Put.restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.be.equal(0);
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gte(poolBal.add(result.collateralRestored));

      await expect(ACOPoolToken1Token2Put.restoreCollateral()).to.be.revertedWith("E60");
    });
    it("Check restore ACOPoolEthToken2Call", async function () {
      let val1 = ethers.BigNumber.from("1000000000000000000");
      let val2 = ethers.BigNumber.from("5000000000000000000");

      await ACOPoolEthToken2Call.deposit(val1, 1, await addr1.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false, {value: val2});

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);

      await expect(
        ACOPoolEthToken2Call.connect(addr1).restoreCollateral()
      ).to.be.revertedWith("E98");

      await aggregatorWethToken2.updateAnswer("35000000000");
      await expect(ACOPoolEthToken2Call.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorWethToken2.updateAnswer("40000000000");

      let poolBal = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.be.gt(0);

      let tx = await (await ACOPoolEthToken2Call.restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(poolBal.add(result.collateralRestored));

      await expect(ACOPoolEthToken2Call.restoreCollateral()).to.be.revertedWith("E60");
    });
    it("Check restore ACOPoolEthToken2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(50000000), 0, {value: val1.mul(50000000).add(maxExercisedAccounts)});

      await expect(
        ACOPoolEthToken2Put.connect(addr1).restoreCollateral()
      ).to.be.revertedWith("E98");

      await aggregatorWethToken2.updateAnswer("42000000000");
      await expect(ACOPoolEthToken2Put.restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
      await aggregatorWethToken2.updateAnswer("40000000000");

      let poolBal = await atoken.balanceOf(ACOPoolEthToken2Put.address);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.be.gt(0);

      let tx = await (await ACOPoolEthToken2Put.restoreCollateral()).wait();
      let result = tx.events[tx.events.length - 1].args;
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.be.equal(0);
      expect(await atoken.balanceOf(ACOPoolEthToken2Put.address)).to.be.gte(poolBal.add(result.collateralRestored));
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);

      await expect(ACOPoolEthToken2Put.restoreCollateral()).to.be.revertedWith("E60");
    });
    it("Check redeem ACO tokens for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.BigNumber.from("100000000");
      let val2 = ethers.BigNumber.from("500000000");

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      
      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1, 0);

      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolToken1Token2Call.connect(addr3).redeemACOTokens();
      await ACOPoolToken1Token2Call.connect(addr3).redeemACOTokens();

      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO tokens for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);

        await ACOPoolToken1Token2Put.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolToken1Token2Put.connect(addr3).redeemACOTokens();
      await ACOPoolToken1Token2Put.connect(addr3).redeemACOTokens();

      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(0);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
    });
    it("Check redeem ACO tokens for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.BigNumber.from("1000000000000000000");
      let val2 = ethers.BigNumber.from("5000000000000000000");

      await ACOPoolEthToken2Call.deposit(val1, 1, await addr1.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false, {value: val2});

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);

      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolEthToken2Call.connect(addr3).redeemACOTokens();
      await ACOPoolEthToken2Call.connect(addr3).redeemACOTokens();

      expect(await ACOPoolEthToken2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Call.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check redeem ACO tokens for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(100000000), 0, {value: val1.mul(100000000).add(maxExercisedAccounts)});

      await ACOPoolEthToken2Put.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(2);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOPoolEthToken2Put.connect(addr3).redeemACOTokens();
      await ACOPoolEthToken2Put.connect(addr3).redeemACOTokens();

      expect(await ACOPoolEthToken2Put.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(0);
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);
    });
    it("Check redeem ACO token for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.BigNumber.from("100000000");
      let val2 = ethers.BigNumber.from("500000000");

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      
      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1, 0);

      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
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
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Put.exercise(val1.div(200), 0);

      await ACOPoolToken1Token2Put.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
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
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
    });
    it("Check redeem ACO token for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.BigNumber.from("1000000000000000000");
      let val2 = ethers.BigNumber.from("5000000000000000000");

      await ACOPoolEthToken2Call.deposit(val1, 1, await addr1.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false, {value: val2});

      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Call.exercise(val1.div(2), 0);
      
      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
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
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOEthToken2Put.exercise(val1.mul(100000000), 0, {value: val1.mul(100000000).add(maxExercisedAccounts)});

      await ACOPoolEthToken2Put.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
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
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);
    });
    it("Check withdraw for ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.BigNumber.from("100000000");
      let val2 = ethers.BigNumber.from("500000000");

      await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

      await ACOPoolToken1Token2Call.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      
      await token2.approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call.exercise(val1, 0);

      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await ACOPoolToken1Token2Call.swap(ACOToken1Token2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);

      await expect(
        ACOPoolToken1Token2Call.connect(addr1).withdrawNoLocked(0, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("E30");

      await expect(
        ACOPoolToken1Token2Call.connect(addr1).withdrawWithLocked(0, await addr1.getAddress(), false)
      ).to.be.revertedWith("E20");

      await expect(
        ACOPoolToken1Token2Call.withdrawNoLocked(val1, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await ACOPoolToken1Token2Call.connect(addr1).approve(await owner.getAddress(), val2);

      await expect(
        ACOPoolToken1Token2Call.withdrawNoLocked(val1.add(1), 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolToken1Token2Call.connect(addr2).withdrawWithLocked(val2.add(1), await addr2.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolToken1Token2Call.connect(addr2).withdrawNoLocked(val2, 1, await addr2.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: Collateral balance is not sufficient");
     
      let bo1 = await token1.balanceOf(await owner.getAddress());
      let bo2 = await token2.balanceOf(await owner.getAddress());
      let ba1 = await token1.balanceOf(await addr1.getAddress());
      let ba2 = await token2.balanceOf(await addr1.getAddress());
      let w1 = await ACOPoolToken1Token2Call.getWithdrawNoLockedData(val1);

      await expect(
        ACOPoolToken1Token2Call.withdrawNoLocked(val1, w1.underlyingWithdrawn.sub(100), await addr1.getAddress(), true)
      ).to.be.revertedWith("E31");
      await expect(
        ACOPoolToken1Token2Call.connect(addr1).withdrawWithLocked(val1, await addr1.getAddress(), true)
      ).to.be.revertedWith("E21");
      await expect(
        ACOPoolToken1Token2Call.withdrawNoLocked(val1, w1.underlyingWithdrawn.add(100), await addr1.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: The minimum collateral was not satisfied");

      await ACOPoolToken1Token2Call.withdrawNoLocked(val1, w1.underlyingWithdrawn.sub(100), await addr1.getAddress(), false);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(val2);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(ba1);
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(w1.underlyingWithdrawn.add(bo1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(ba2);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(w1.strikeAssetWithdrawn.add(bo2));
      expect(await ACOToken1Token2Call.currentCollateral(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(ACOPoolToken1Token2Call.address)).to.equal(val1);
      expect(await ACOToken1Token2Call2.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(await addr1.getAddress())).to.equal(0);

      ba1 = await token1.balanceOf(await addr2.getAddress());
      ba2 = await token2.balanceOf(await addr2.getAddress());
      let w2 = await ACOPoolToken1Token2Call.getWithdrawWithLocked(val2);
      await ACOPoolToken1Token2Call.connect(addr2).withdrawWithLocked(val2, await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(w2.underlyingWithdrawn.add(ba1));
      expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(w2.strikeAssetWithdrawn.add(ba2));
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(await addr2.getAddress())).to.equal(val1);

      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

      await ACOToken1Token2Call2.connect(addr2).redeem();
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(w2.underlyingWithdrawn.add(ba1).add(val1));
    });
    it("Check withdraw for ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.BigNumber.from("40000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      await ACOPoolToken1Token2Put.deposit(val1, 1, await addr1.getAddress(), false);

      await token1.approve(ACOToken1Token2Put.address, token1TotalSupply);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(200), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      
      await expect(
        ACOPoolToken1Token2Put.connect(addr1).withdrawNoLocked(0, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("E30");

      await expect(
        ACOPoolToken1Token2Put.connect(addr1).withdrawWithLocked(0, await addr1.getAddress(), false)
      ).to.be.revertedWith("E20");

      await expect(
        ACOPoolToken1Token2Put.withdrawNoLocked(val1, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolToken1Token2Put.connect(addr1).withdrawNoLocked(val1.add(1), 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolToken1Token2Put.connect(addr1).withdrawWithLocked(val1.add(1), await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolToken1Token2Put.connect(addr1).withdrawNoLocked(val1, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: Collateral balance is not sufficient");

      let ba1 = await token1.balanceOf(await addr1.getAddress());
      let ba2 = await token2.balanceOf(await addr1.getAddress());
      let p2 = await atoken.balanceOf(ACOPoolToken1Token2Put.address);
      let p1 = await token1.balanceOf(ACOPoolToken1Token2Put.address);
      await ACOPoolToken1Token2Put.connect(addr1).withdrawWithLocked(val1.div(2), await addr1.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(val1.div(2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1.div(2));
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(ba1);
      expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(p1);
      expect(await token2.balanceOf(await addr1.getAddress())).to.be.gte(p2.div(2).add(ba2));
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gte(p2.div(2));
      expect(await ACOToken1Token2Put.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(val1.div(4));
      expect(await ACOToken1Token2Put.currentCollateral(await addr1.getAddress())).to.equal(val1.div(4));
      
      await ACOToken1Token2Put.exercise(val1.div(800), 0);
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      ba1 = await token1.balanceOf(await addr2.getAddress());
      ba2 = await token2.balanceOf(await addr2.getAddress());
      let bal = await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress());
      let w1 = await ACOPoolToken1Token2Put.getWithdrawNoLockedData(bal);

      await expect(
        ACOPoolToken1Token2Put.connect(addr2).withdrawNoLocked(bal, w1.strikeAssetWithdrawn.mul(101).div(100), await addr2.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: The minimum collateral was not satisfied");

      await ACOPoolToken1Token2Put.connect(addr2).withdrawNoLocked(bal, w1.strikeAssetWithdrawn.sub(1000), await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(val1.div(2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1.div(2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(ba1.add(w1.underlyingWithdrawn));
      expect(await token2.balanceOf(await addr2.getAddress())).to.be.gte(ba2.add(w1.strikeAssetWithdrawn));
      expect(await ACOToken1Token2Put.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(val1.div(8));
      expect(await ACOToken1Token2Put.currentCollateral(await addr2.getAddress())).to.equal(0);

      let ba31 = await token1.balanceOf(await addr3.getAddress());
      let ba32 = await token2.balanceOf(await addr3.getAddress());
      await ACOPoolToken1Token2Put.deposit(val2, 1, await addr3.getAddress(), false);
      let pba3 = await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress());
      let pa3 = await atoken.balanceOf(ACOPoolToken1Token2Put.address); 
      w1 = await ACOPoolToken1Token2Put.getWithdrawWithLocked(pba3);
      await ACOPoolToken1Token2Put.connect(addr3).withdrawWithLocked(pba3, await addr3.getAddress(), true);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1.div(2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(ba31.add(w1.underlyingWithdrawn));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(ba32);
      expect(await atoken.balanceOf(await addr3.getAddress())).to.be.gte(w1.strikeAssetWithdrawn.mul(99).div(100));
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.be.gte(pa3.sub(w1.strikeAssetWithdrawn));
      expect(await ACOToken1Token2Put.currentCollateralizedTokens(await addr3.getAddress())).to.equal(w1.acosAmount[0]);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);

      await ACOPoolToken1Token2Put.deposit(val2, 1, await owner.getAddress(), false);
      let balo = await ACOPoolToken1Token2Put.balanceOf(await owner.getAddress());
      let bo1 = await token1.balanceOf(await owner.getAddress());
      let bo2 = await token2.balanceOf(await owner.getAddress());
      let bao = await atoken.balanceOf(await owner.getAddress());
      w1 = await ACOPoolToken1Token2Put.getWithdrawNoLockedData(balo);
      await ACOPoolToken1Token2Put.withdrawNoLocked(balo, w1.strikeAssetWithdrawn, await owner.getAddress(), true);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(val1.div(2));
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(bo1.add(w1.underlyingWithdrawn));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(bo2);
      expect(await atoken.balanceOf(await owner.getAddress())).to.be.gte(bao.add(w1.strikeAssetWithdrawn.mul(99).div(100)));
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);

      await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      await ACOToken1Token2Put.exercise(val1.div(800), 0);
      await ACOPoolToken1Token2Put.setAcoPermissionConfig([toleranceBelowMax,0,0,0,minExpiration,maxExpiration]);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put2.address, val1.div(1000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      let col = await ACOToken1Token2Put2.currentCollateral(ACOPoolToken1Token2Put.address);

      ba1 = await token1.balanceOf(await addr1.getAddress());
      ba2 = await token2.balanceOf(await addr1.getAddress());
      bal = await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress());
      w1 = await ACOPoolToken1Token2Put.getWithdrawNoLockedData(val1.div(2));

      await expect(
        ACOPoolToken1Token2Put.connect(addr1).withdrawNoLocked(val1.div(2), w1.strikeAssetWithdrawn.mul(101).div(100), await addr1.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: The minimum collateral was not satisfied");

      await ACOPoolToken1Token2Put.connect(addr1).withdrawNoLocked(val1.div(2), w1.strikeAssetWithdrawn.sub(1000), await addr1.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(bal);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(ba1.add(w1.underlyingWithdrawn));
      expect(await token2.balanceOf(await addr1.getAddress())).to.be.gte(ba2.add(w1.strikeAssetWithdrawn));
      expect(await ACOToken1Token2Put.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await ACOToken1Token2Put2.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(col);
      expect(await ACOToken1Token2Put.currentCollateral(await addr1.getAddress())).to.be.lte(val1.div(4));
      expect(await ACOToken1Token2Put2.currentCollateral(await addr1.getAddress())).to.equal(0);

      await ACOPoolToken1Token2Put.connect(addr2).approve(await addr3.getAddress(), bal);

      await expect(
        ACOPoolToken1Token2Put.connect(addr3).withdrawNoLocked(bal, 1, await addr2.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: Collateral balance is not sufficient");

      ba1 = await token1.balanceOf(await addr2.getAddress());
      ba2 = await token2.balanceOf(await addr2.getAddress());
      ba31 = await token1.balanceOf(await addr3.getAddress());
      ba32 = await token2.balanceOf(await addr3.getAddress());
      w1 = await ACOPoolToken1Token2Put.getWithdrawWithLocked(bal);
      await ACOPoolToken1Token2Put.connect(addr3).withdrawWithLocked(bal, await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(ba31.add(w1.underlyingWithdrawn));
      expect(await token2.balanceOf(await addr3.getAddress())).to.be.gte(ba32.add(w1.strikeAssetWithdrawn));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(ba1);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(ba2);
      expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.be.lte(1);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await ACOToken1Token2Put.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await ACOToken1Token2Put2.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await ACOToken1Token2Put.currentCollateral(await addr3.getAddress())).to.be.gt(0);
      expect(await ACOToken1Token2Put2.currentCollateral(await addr3.getAddress())).to.equal(col);
      expect(await ACOToken1Token2Put.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Put2.currentCollateral(await addr2.getAddress())).to.equal(0);
    });
    it("Check withdraw for ACOPoolEthToken2Call", async function () {
      let val1 = ethers.BigNumber.from("1000000000000000000");
      let val2 = ethers.BigNumber.from("5000000000000000000");

      await ACOPoolEthToken2Call.deposit(val1, 1, await addr1.getAddress(), false, {value: val1});

      await expect(
        ACOPoolEthToken2Call.connect(addr1).withdrawNoLockedWithGasToken(0, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("E30");

      await expect(
        ACOPoolEthToken2Call.connect(addr1).withdrawWithLockedWithGasToken(0, await addr1.getAddress(), false)
      ).to.be.revertedWith("E20");

      await expect(
        ACOPoolEthToken2Call.withdrawNoLockedWithGasToken(val1, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolEthToken2Call.connect(addr1).withdrawNoLockedWithGasToken(val1.add(1), 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolEthToken2Call.connect(addr1).withdrawWithLockedWithGasToken(val1.add(1), await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      let ba2 = await token2.balanceOf(await addr1.getAddress());
      let ba1 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr1.getAddress(),"latest"]));
      let p2 = await token2.balanceOf(ACOPoolEthToken2Call.address);
      let p1 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]));
      let w1 = await ACOPoolEthToken2Call.getWithdrawWithLocked(val1);

      await expect(
        ACOPoolEthToken2Call.connect(addr1).withdrawNoLockedWithGasToken(val1, w1.underlyingWithdrawn.sub(ethers.BigNumber.from("2500000000000")), await addr1.getAddress(), true)
      ).to.be.revertedWith("E31");
      await expect(
        ACOPoolEthToken2Call.connect(addr1).withdrawWithLocked(val1, await addr1.getAddress(), true)
      ).to.be.revertedWith("E21");
      await expect(
        ACOPoolEthToken2Call.connect(addr1).withdrawNoLockedWithGasToken(val1, w1.underlyingWithdrawn.add(ethers.BigNumber.from("2500000000000")), await addr1.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: The minimum collateral was not satisfied");

      await ACOPoolEthToken2Call.connect(addr1).withdrawNoLockedWithGasToken(val1, w1.underlyingWithdrawn.sub(ethers.BigNumber.from("2500000000000")), await addr1.getAddress(), false);
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr1.getAddress(),"latest"]))).to.be.gt(ba1);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr1.getAddress(),"latest"]))).to.be.lt(ba1.add(p1));
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(p2.add(ba2));
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);

      await ACOPoolEthToken2Call.deposit(val1, 1, await addr1.getAddress(), false, {value: val1});
      await token2.approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call.address, token2TotalSupply);
      await token2.approve(ACOEthToken2Call2.address, token2TotalSupply);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val1.div(4), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,0,toleranceAboveMax,0,minExpiration,maxExpiration]);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1.div(4), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.deposit(val2, 1, await addr2.getAddress(), false, {value: val2});
      let bal = await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress());
      
      await expect(
        ACOPoolEthToken2Call.connect(addr3).withdrawWithLockedWithGasToken(bal, await addr2.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await ACOPoolEthToken2Call.connect(addr2).approve(await addr3.getAddress(), bal);

      ba2 = await token2.balanceOf(await addr2.getAddress());
      ba1 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr2.getAddress(),"latest"]));
      let ba32 = await token2.balanceOf(await addr3.getAddress());
      let ba31 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr3.getAddress(),"latest"]));
      w1 = await ACOPoolEthToken2Call.getWithdrawWithLocked(bal);
      await ACOPoolEthToken2Call.connect(addr3).withdrawWithLockedWithGasToken(bal, await addr2.getAddress(), false);
      let col = val1.div(4).mul(bal).div(bal.add(val1));

      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr2.getAddress(),"latest"]))).to.equal(ba1);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr3.getAddress(),"latest"]))).to.be.gt(ba31);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr3.getAddress(),"latest"]))).to.be.lt(ba31.add(w1.underlyingWithdrawn));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(ba2);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(ba32.add(w1.strikeAssetWithdrawn));
      expect(await ACOEthToken2Call.currentCollateral(ACOPoolEthToken2Call.address)).to.equal(val1.div(4).sub(col));
      expect(await ACOEthToken2Call.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(await addr3.getAddress())).to.equal(col);
      expect(await ACOEthToken2Call2.currentCollateral(ACOPoolEthToken2Call.address)).to.equal(val1.div(4).sub(col));
      expect(await ACOEthToken2Call2.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(await addr3.getAddress())).to.equal(col);

      await ACOEthToken2Call.exercise(val1.div(4), 0);
      await ACOEthToken2Call2.exercise(val1.div(4), 0);
      
      await expect(
        ACOPoolEthToken2Call.connect(addr3).withdrawNoLockedWithGasToken(val1, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await ACOPoolEthToken2Call.connect(addr1).approve(await addr3.getAddress(), val1);

      ba2 = await token2.balanceOf(await addr1.getAddress());
      ba1 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr1.getAddress(),"latest"]));
      ba32 = await token2.balanceOf(await addr3.getAddress());
      ba31 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr3.getAddress(),"latest"]));
      w1 = await ACOPoolEthToken2Call.getWithdrawWithLocked(val1);
      let w2 = await ACOPoolEthToken2Call.getWithdrawNoLockedData(val1);
      expect(w1.underlyingWithdrawn).to.equal(w2.underlyingWithdrawn);
      expect(w1.strikeAssetWithdrawn).to.equal(w2.strikeAssetWithdrawn);
      expect(w1[3][0]).to.equal(0);
      expect(w1[3][1]).to.equal(0);

      await expect(
        ACOPoolEthToken2Call.connect(addr3).withdrawNoLockedWithGasToken(val1, w1.underlyingWithdrawn.add(ethers.BigNumber.from("2500000000000")), await addr1.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: The minimum collateral was not satisfied");

      await ACOPoolEthToken2Call.connect(addr3).withdrawNoLockedWithGasToken(val1, w1.underlyingWithdrawn.sub(ethers.BigNumber.from("2500000000000")), await addr1.getAddress(), false);
      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr1.getAddress(),"latest"]))).to.equal(ba1);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr3.getAddress(),"latest"]))).to.be.gt(ba31);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr3.getAddress(),"latest"]))).to.be.lt(ba31.add(w1.underlyingWithdrawn));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(ba2);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(ba32.add(w1.strikeAssetWithdrawn));
      expect(await ACOEthToken2Call.currentCollateral(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(await addr3.getAddress())).to.equal(0);
    });
    it("Check withdraw for ACOPoolEthToken2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("50000000000");

      await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await ACOPoolEthToken2Put.deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);

      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.setAcoPermissionConfig([toleranceBelowMax,0,0,0,minExpiration,maxExpiration]);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
    
      await expect(
        ACOPoolEthToken2Put.connect(addr1).withdrawNoLocked(0, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("E30");

      await expect(
        ACOPoolEthToken2Put.connect(addr1).withdrawWithLocked(0, await addr1.getAddress(), false)
      ).to.be.revertedWith("E20");

      await expect(
        ACOPoolEthToken2Put.withdrawNoLocked(val1, 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolEthToken2Put.connect(addr1).withdrawNoLocked(val1.add(1), 1, await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        ACOPoolEthToken2Put.connect(addr1).withdrawWithLocked(val1.add(1), await addr1.getAddress(), false)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      let ba2 = await token2.balanceOf(await addr1.getAddress());
      let w1 = await ACOPoolEthToken2Put.getWithdrawNoLockedData(val1);

      await expect(
        ACOPoolEthToken2Put.connect(addr1).withdrawNoLocked(val1, w1.strikeAssetWithdrawn.mul(101).div(100), await addr1.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: The minimum collateral was not satisfied");

      await ACOPoolEthToken2Put.connect(addr1).withdrawNoLocked(val1, w1.strikeAssetWithdrawn.sub(1000), await addr1.getAddress(), true);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val2);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val2.mul(99).div(100));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(ba2);
      expect(await atoken.balanceOf(await addr1.getAddress())).to.lte(w1.strikeAssetWithdrawn);
      expect(await atoken.balanceOf(await addr1.getAddress())).to.gt(w1.strikeAssetWithdrawn.mul(99).div(100));
      expect(await ACOEthToken2Put.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(acoEthToken2PutPrice);
      expect(await ACOEthToken2Put.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(acoEthToken2PutPrice2);
      expect(await ACOEthToken2Put2.currentCollateral(await addr1.getAddress())).to.equal(0);

      ba2 = await token2.balanceOf(await addr2.getAddress());
      w1 = await ACOPoolEthToken2Put.getWithdrawWithLocked(val2.div(2));
      await ACOPoolEthToken2Put.connect(addr2).withdrawWithLocked(val2.div(2), await addr2.getAddress(), true);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.lt(val2.div(2));
      expect(await ACOPoolEthToken2Put.totalSupply()).to.be.gt(val2.div(2).mul(99).div(100));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.lt(val2.div(2));
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.be.gt(val2.div(2).mul(99).div(100));
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(ba2);
      expect(await atoken.balanceOf(await addr2.getAddress())).to.lte(w1.strikeAssetWithdrawn);
      expect(await atoken.balanceOf(await addr2.getAddress())).to.gt(w1.strikeAssetWithdrawn.mul(99).div(100));
      expect(await ACOEthToken2Put.currentCollateral(ACOPoolEthToken2Put.address)).to.be.lt(acoEthToken2PutPrice.div(2));
      expect(await ACOEthToken2Put.currentCollateral(ACOPoolEthToken2Put.address)).to.be.gt(acoEthToken2PutPrice.div(2).mul(99).div(100));
      expect(await ACOEthToken2Put.currentCollateral(await addr2.getAddress())).to.be.gte(acoEthToken2PutPrice.div(2));
      expect(await ACOEthToken2Put2.currentCollateral(ACOPoolEthToken2Put.address)).to.be.lt(acoEthToken2PutPrice2.div(2));
      expect(await ACOEthToken2Put2.currentCollateral(ACOPoolEthToken2Put.address)).to.be.gt(acoEthToken2PutPrice2.div(2).mul(99).div(100));
      expect(await ACOEthToken2Put2.currentCollateral(await addr2.getAddress())).to.be.gte(acoEthToken2PutPrice2.div(2));

      await ACOEthToken2Put.exercise(val1.mul(100000000), 0, {value: val1.mul(100000000).add(maxExercisedAccounts)});
      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await network.provider.send("evm_mine");
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(2);

      ba2 = await token2.balanceOf(await addr2.getAddress());
      let p2 = await atoken.balanceOf(ACOPoolEthToken2Put.address);
      let ba1 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr2.getAddress(),"latest"]));
      let b2 = await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress());
      w1 = await ACOPoolEthToken2Put.getWithdrawNoLockedData(b2);
      expect(w1.strikeAssetWithdrawn).to.be.lt(p2.add(acoEthToken2PutPrice2.div(2)));
      
      await expect(
        ACOPoolEthToken2Put.connect(addr2).withdrawNoLocked(b2, w1.strikeAssetWithdrawn.mul(101).div(100), await addr2.getAddress(), false)
      ).to.be.revertedWith("ACOPoolLib: The minimum collateral was not satisfied");

      await ACOPoolEthToken2Put.connect(addr2).withdrawNoLocked(b2, w1.strikeAssetWithdrawn.sub(1000), await addr2.getAddress(), false);
      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr2.getAddress())).to.be.gte(ba2.add(p2).add(acoEthToken2PutPrice2.div(2)));
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [await addr2.getAddress(),"latest"]))).to.be.gt(ba1);
      expect(await ACOEthToken2Put.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(0);
      expect(await ACOEthToken2Put.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(await addr2.getAddress())).to.be.gte(acoEthToken2PutPrice2.div(2));
      expect(await ACOPoolEthToken2Put.numberOfOpenAcoTokens()).to.equal(0);
    });
    it("Check complex flow ACOPoolToken1Token2Call", async function () {
      let val1 = ethers.BigNumber.from("100000000");
      let val2 = ethers.BigNumber.from("200000000");
      let val3 = ethers.BigNumber.from("300000000");
      let val5 = ethers.BigNumber.from("500000000");
      let val8 = ethers.BigNumber.from("800000000");
      
      await ACOPoolToken1Token2Call.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await token1.connect(owner).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr1).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token1.connect(addr3).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
      await token2.connect(owner).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.connect(addr1).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);

      await ACOPoolToken1Token2Call.connect(addr1).deposit(val8, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr2).swap(ACOToken1Token2Call.address, val1.div(2), ethers.BigNumber.from("9999999999"), await addr2.getAddress(), 1999999999);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call.address, val1.div(3), ethers.BigNumber.from("9999999999"), await addr2.getAddress(), 1999999999);
      await ACOPoolToken1Token2Call.connect(owner).deposit(val5, 1, await addr2.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call2.address, val2, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Call.connect(addr3).deposit(val3, 1, await addr3.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr1).deposit(val2, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call2.address, val3, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await token2.connect(owner).approve(ACOToken1Token2Call.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOToken1Token2Call.address, token2TotalSupply);
      await ACOToken1Token2Call.connect(addr2).exercise(await ACOToken1Token2Call.balanceOf(await addr2.getAddress()), 0);
      await ACOToken1Token2Call.connect(owner).exercise(await ACOToken1Token2Call.balanceOf(await owner.getAddress()), 0);
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(2);
      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await ACOPoolToken1Token2Call.connect(addr2).withdrawNoLocked(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress()), 1, await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(2);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(0);
      await ACOPoolToken1Token2Call.connect(owner).restoreCollateral();
      let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice2, expiration+86400, maxExercisedAccounts)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let ACOToken1Token2Call3 = await ethers.getContractAt("ACOToken", result.acoToken);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call3.address, val3, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Call.connect(addr1).withdrawWithLocked((await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).div(2), await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr2).deposit(val5, 1, await addr2.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call3.address, val2, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Call.connect(addr1).deposit(val2, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call3.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await token2.connect(owner).approve(ACOToken1Token2Call3.address, token2TotalSupply);
      await ACOToken1Token2Call3.connect(owner).exercise((await ACOToken1Token2Call3.balanceOf(await owner.getAddress())).div(3), 0);
      await ACOPoolToken1Token2Call.connect(owner).swap(ACOToken1Token2Call3.address, val1.div(3), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOToken1Token2Call3.connect(owner).exercise((await ACOToken1Token2Call3.balanceOf(await owner.getAddress())).div(2), 0);
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(3);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(1);
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+86400]);
      await ACOPoolToken1Token2Call.connect(addr1).redeemACOTokens();
      await ACOToken1Token2Call3.connect(addr1).redeem();
      expect(await ACOPoolToken1Token2Call.numberOfAcoTokensNegotiated()).to.equal(3);
      expect(await ACOPoolToken1Token2Call.numberOfOpenAcoTokens()).to.equal(0);
      await ACOPoolToken1Token2Call.connect(addr2).withdrawWithLocked(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress()), await addr2.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr3).withdrawNoLocked(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress()), 1, await addr3.getAddress(), false);
      await ACOPoolToken1Token2Call.connect(addr1).withdrawWithLocked(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress()), await addr1.getAddress(), false);
      
      expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Call.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call2.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call3.currentCollateral(ACOPoolToken1Token2Call.address)).to.equal(0);
      expect(await ACOToken1Token2Call3.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call3.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call3.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Call3.currentCollateral(await owner.getAddress())).to.equal(0);
    });
    it("Check complex flow ACOPoolToken1Token2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val4 = ethers.BigNumber.from("40000000000");
      let val7 = ethers.BigNumber.from("70000000000");
      let val10 = ethers.BigNumber.from("100000000000");

      await token1.connect(owner).approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token1.connect(addr1).approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token1.connect(addr2).approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token1.connect(addr3).approve(ACOPoolToken1Token2Put.address, token1TotalSupply);
      await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
      await atoken.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

      let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice, expiration, maxExercisedAccounts)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco2 = await ethers.getContractAt("ACOToken", result.acoToken);
      tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice, expiration+86400, maxExercisedAccounts)).wait();
      result = tx.events[tx.events.length - 1].args;
      let aco3 = await ethers.getContractAt("ACOToken", result.acoToken);
      tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice, expiration+86400, maxExercisedAccounts)).wait();
      result = tx.events[tx.events.length - 1].args;
      let aco4 = await ethers.getContractAt("ACOToken", result.acoToken);
      tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice, expiration+2*86400, maxExercisedAccounts)).wait();
      result = tx.events[tx.events.length - 1].args;
      let aco5 = await ethers.getContractAt("ACOToken", result.acoToken);

      await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);
      await token1.connect(owner).approve(aco2.address, token1TotalSupply);
      await token1.connect(owner).approve(aco3.address, token1TotalSupply);
      await token1.connect(owner).approve(aco4.address, token1TotalSupply);
      await token1.connect(owner).approve(aco5.address, token1TotalSupply);

      await ACOPoolToken1Token2Put.connect(addr1).deposit(val7, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(200), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(aco2.address, val1.div(400), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(aco3.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(300), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.connect(owner).deposit(val4, 1, await addr1.getAddress(), true);
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val1, 1, await addr2.getAddress(), false);
      await ACOPoolToken1Token2Put.swap(aco4.address, val4.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(aco3.address, val1.div(200), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.connect(addr2).deposit(val1, 1, await addr2.getAddress(), false);
      await ACOPoolToken1Token2Put.swap(aco2.address, val1.div(400), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.connect(addr3).deposit(val10, 1, await addr3.getAddress(), false);
      await ACOPoolToken1Token2Put.connect(addr1).withdrawNoLocked((await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).div(3), 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.swap(aco3.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(aco5.address, val4.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.connect(owner).deposit(val1, 1, await addr2.getAddress(), true);
      await ACOPoolToken1Token2Put.swap(ACOToken1Token2Put.address, val4.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(aco3.address, val4.div(200), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await aco2.exercise(await aco2.balanceOf(await owner.getAddress()), 0);
      await ACOPoolToken1Token2Put.connect(owner).restoreCollateral();
      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await ACOPoolToken1Token2Put.swap(aco4.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.swap(aco3.address, val4.div(200), ethers.BigNumber.from("99999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.connect(addr2).withdrawNoLocked(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress()), 1, await addr2.getAddress(), false);
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(5);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(3);
      await ACOPoolToken1Token2Put.redeemACOTokens();
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(5);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(3);
      await ACOPoolToken1Token2Put.swap(aco3.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.connect(addr1).deposit(val4, 1, await addr1.getAddress(), false);
      await ACOPoolToken1Token2Put.connect(owner).deposit(val7, 1, await addr2.getAddress(), true);
      await ACOPoolToken1Token2Put.connect(addr3).withdrawNoLocked(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress()), 1, await addr3.getAddress(), true);
      await ACOPoolToken1Token2Put.swap(aco5.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await aco3.exercise((await aco3.balanceOf(await owner.getAddress())).div(2), 0);
      await aco4.exercise((await aco4.balanceOf(await owner.getAddress())).div(2), 0);
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+86400]);
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(5);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(3);
      await ACOPoolToken1Token2Put.redeemACOTokens();
      expect(await ACOPoolToken1Token2Put.numberOfAcoTokensNegotiated()).to.equal(5);
      expect(await ACOPoolToken1Token2Put.numberOfOpenAcoTokens()).to.equal(1);
      await ACOPoolToken1Token2Put.swap(aco5.address, val4.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolToken1Token2Put.connect(addr1).withdrawWithLocked(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress()), await addr1.getAddress(), true);
      await ACOPoolToken1Token2Put.swap(aco5.address, val1.div(100), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+2*86400]);
      await ACOPoolToken1Token2Put.connect(addr2).withdrawNoLocked(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress()), 1, await addr2.getAddress(), false);

      await aco5.connect(addr1).redeem();

      expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await ACOPoolToken1Token2Put.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await atoken.balanceOf(ACOPoolToken1Token2Put.address)).to.lte(10);
      expect(await ACOToken1Token2Put.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await ACOToken1Token2Put.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Put.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Put.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOToken1Token2Put.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await aco2.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await aco2.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco2.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco2.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco2.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await aco3.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await aco4.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await aco5.currentCollateral(ACOPoolToken1Token2Put.address)).to.equal(0);
      expect(await aco5.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco5.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco5.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco5.currentCollateral(await owner.getAddress())).to.equal(0);
    });
    it("Check complex flow ACOPoolEthToken2Call", async function () {
      let val1 = ethers.BigNumber.from("100000000000000000");
      let val2 = ethers.BigNumber.from("200000000000000000");
      let val3 = ethers.BigNumber.from("300000000000000000");
      let val5 = ethers.BigNumber.from("500000000000000000");

      await ACOPoolEthToken2Call.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.connect(addr1).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolEthToken2Call.address, token2TotalSupply);

      await token2.connect(owner).approve(ACOEthToken2Call.address, token2TotalSupply);
      await token2.connect(owner).approve(ACOEthToken2Call2.address, token2TotalSupply);

      await ACOPoolEthToken2Call.connect(addr1).deposit(val5, 1, await addr1.getAddress(), false, {value: val5});
      await ACOPoolEthToken2Call.connect(addr1).withdrawNoLocked((await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).div(3), 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Call.connect(addr1).withdrawWithLocked((await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).div(2), await addr1.getAddress(), false);
      await ACOPoolEthToken2Call.connect(addr1).deposit(val2, 1, await addr1.getAddress(), false, {value: val2});
      await ACOPoolEthToken2Call.connect(addr1).deposit(val1, 1, await addr1.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val2, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false, {value: val2});
      await ACOPoolEthToken2Call.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false, {value: val2});
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.connect(addr2).withdrawNoLocked((await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).div(2), 1, await addr2.getAddress(), false);
      await ACOPoolEthToken2Call.connect(addr2).withdrawWithLocked((await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())), await addr2.getAddress(), false);
      await ACOPoolEthToken2Call.connect(addr3).deposit(val3, 1, await addr3.getAddress(), false, {value: val3});
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call.address, val2, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.connect(addr3).deposit(val1, 1, await addr3.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.connect(addr1).withdrawNoLocked((await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).div(3), 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Call.connect(addr3).withdrawWithLocked((await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).div(2), await addr3.getAddress(), false);
      await ACOEthToken2Call.exercise(await ACOEthToken2Call.balanceOf(await owner.getAddress()), 0);
      await ACOPoolEthToken2Call.connect(addr3).deposit(val1, 1, await addr3.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val1, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.connect(addr1).deposit(val1, 1, await addr1.getAddress(), false, {value: val1});
      await ACOPoolEthToken2Call.swap(ACOEthToken2Call2.address, val2, ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Call.restoreCollateral();
      await ACOEthToken2Call2.exercise((await ACOEthToken2Call2.balanceOf(await owner.getAddress())).div(2), 0);
      await ACOPoolEthToken2Call.connect(addr3).withdrawNoLocked((await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())), 1, await addr3.getAddress(), false);
      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await ACOPoolEthToken2Call.redeemACOTokens();
      await ACOPoolEthToken2Call.connect(addr1).withdrawWithLocked((await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())), await addr1.getAddress(), false);
    
      await ACOEthToken2Call2.connect(addr2).redeem();
      await ACOEthToken2Call2.connect(addr3).redeem();

      expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await ACOPoolEthToken2Call.balanceOf(await owner.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(0);
      expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(ACOPoolEthToken2Call.address)).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOEthToken2Call2.currentCollateral(await owner.getAddress())).to.equal(0);
    });
    it("Check complex flow ACOPoolEthToken2Put", async function () {
      let val1 = ethers.BigNumber.from("10000000000");
      let val2 = ethers.BigNumber.from("20000000000");
      let val5 = ethers.BigNumber.from("50000000000");

      await ACOPoolEthToken2Put.setAcoPermissionConfig([0,0,0,0,minExpiration,maxExpiration]);

      await token2.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await token2.connect(addr3).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
      await atoken.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

      await token2.connect(owner).approve(ACOEthToken2Put.address, token2TotalSupply);
      await token2.connect(owner).approve(ACOEthToken2Put2.address, token2TotalSupply);

      let tx = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, acoEthToken2PutPrice, expiration+86400, maxExercisedAccounts)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco3 = await ethers.getContractAt("ACOToken", result.acoToken);
      tx = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, acoEthToken2PutPrice2, expiration+86400, maxExercisedAccounts)).wait();
      result = tx.events[tx.events.length - 1].args;
      let aco4 = await ethers.getContractAt("ACOToken", result.acoToken);

      await token2.connect(owner).approve(aco3.address, token2TotalSupply);
      await token2.connect(owner).approve(aco4.address, token2TotalSupply);

      await ACOPoolEthToken2Put.connect(addr1).deposit(val5, 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val2.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.connect(owner).deposit(val1, 1, await addr3.getAddress(), true);
      await ACOPoolEthToken2Put.swap(aco3.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.connect(addr2).deposit(val2, 1, await addr2.getAddress(), false);
      await ACOPoolEthToken2Put.swap(aco3.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put.address, val2.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.connect(addr1).withdrawNoLocked((await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).div(4), 1, await addr1.getAddress(), false);
      await ACOPoolEthToken2Put.connect(addr3).deposit(val1, 1, await addr3.getAddress(), false);
      await ACOPoolEthToken2Put.swap(ACOEthToken2Put2.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.connect(addr2).withdrawNoLocked((await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).div(5), 1, await addr2.getAddress(), true);
      let bal = (await ACOEthToken2Put.balanceOf(await owner.getAddress()));
      let exec = (await ACOEthToken2Put.getBaseExerciseData(bal))[1];
      await ACOEthToken2Put.exercise(bal, 0, {value: exec.add(maxExercisedAccounts)});
      await ACOPoolEthToken2Put.restoreCollateral();
      await network.provider.send("evm_setNextBlockTimestamp", [expiration]);
      await ACOPoolEthToken2Put.swap(aco3.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.connect(addr2).withdrawWithLocked((await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())), await addr2.getAddress(), false);
      await ACOPoolEthToken2Put.swap(aco4.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      await ACOPoolEthToken2Put.connect(addr3).deposit(val1, 1, await addr3.getAddress(), false);
      await ACOPoolEthToken2Put.swap(aco3.address, val1.mul(100000000), ethers.BigNumber.from("9999999999"), await owner.getAddress(), 1999999999);
      bal = (await aco3.balanceOf(await owner.getAddress()));
      exec = (await aco3.getBaseExerciseData(bal))[1];
      await aco3.exercise(bal, 0, {value: exec.add(maxExercisedAccounts)});
      bal = (await aco4.balanceOf(await owner.getAddress())).div(4);
      exec = (await aco4.getBaseExerciseData(bal))[1];
      await aco4.exercise(bal, 0, {value: exec.add(maxExercisedAccounts)});
      await network.provider.send("evm_setNextBlockTimestamp", [expiration+86400]);
      await ACOPoolEthToken2Put.connect(addr1).withdrawWithLocked((await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())), await addr1.getAddress(), true);
      await ACOPoolEthToken2Put.connect(addr3).withdrawWithLocked((await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())), await addr3.getAddress(), false);
      
      expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await ACOPoolEthToken2Put.balanceOf(await owner.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);
      expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);
      expect(await atoken.balanceOf(ACOPoolEthToken2Put.address)).to.be.lte(30);
      expect(await ACOEthToken2Put.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(0);
      expect(await ACOEthToken2Put.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await ACOEthToken2Put2.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(0);
      expect(await aco3.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco3.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(ACOPoolEthToken2Put.address)).to.equal(0);
      expect(await aco4.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco4.currentCollateral(await owner.getAddress())).to.equal(0);
    });
  });
});

const getCurrentTimestamp = async () => {
  let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
  return parseInt(block.timestamp, 16);
};