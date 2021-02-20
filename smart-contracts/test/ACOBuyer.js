const { expect } = require("chai");
const poolFactoryABI = require("../artifacts/contracts/periphery/pool/ACOPoolFactory2.sol/ACOPoolFactory2.json");
const factoryABI = require("../artifacts/contracts/core/ACOFactory.sol/ACOFactory.json");
const { createAcoPoolStrategy } = require("./pool/ACOPoolStrategy.js");
const AddressZero = "0x0000000000000000000000000000000000000000";

describe("ACOBuyer", function() {
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
  let acoBuyer;
  let toleranceBelowMax = 5000;
  let toleranceAboveMax = 5000;
  let minExpiration = 0;
  let maxExpiration = (30*86400);

  let token1Token2Price = ethers.BigNumber.from("10000000000");
  let ethToken2Price = ethers.BigNumber.from("400000000");
  let expiration;
  let acoEthToken2CallPrice = ethers.BigNumber.from("400000000");
  let acoEthToken2PutPrice = ethers.BigNumber.from("400000000");
  let acoToken1Token2CallPrice = ethers.BigNumber.from("10000000000");
  let acoToken1Token2PutPrice = ethers.BigNumber.from("10000000000");
  let acoToken1EthCallPrice = ethers.BigNumber.from("25000000");
  let acoToken1EthPutPrice = ethers.BigNumber.from("25000000");
  let ethToken2BaseVolatility = 85000;
  let ethToken2BaseVolatility2 = 105000;
  let token1Token2BaseVolatility = 70000;
  let token1Token2BaseVolatility2 = 90000;
  let token1EthBaseVolatility = 170000;
  let token1EthBaseVolatility2 = 190000;
  let ACOEthToken2Call;
  let ACOEthToken2Put;
  let ACOToken1Token2Call;
  let ACOToken1Token2Put;
  let ACOToken1EthCall;
  let ACOToken1EthPut;
  let ACOPoolEthToken2Call;
  let ACOPoolEthToken2Call2;
  let ACOPoolEthToken2Put;
  let ACOPoolEthToken2Put2;
  let ACOPoolToken1Token2Call;
  let ACOPoolToken1Token2Call2;
  let ACOPoolToken1Token2Put;
  let ACOPoolToken1Token2Put2;
  let ACOPoolToken1EthCall;
  let ACOPoolToken1EthCall2;
  let ACOPoolToken1EthPut;
  let ACOPoolToken1EthPut2;
  let atoken;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3,...addrs] = await ethers.getSigners();

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

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    await token2.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("1000000000000"));
    await token2.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("1000000000000"));

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
    ACOPoolFactory = await ethers.getContractAt("ACOPoolFactory2V3", buidlerACOPoolFactoryProxy.address);

    await ACOPoolFactory.setAuthorizedAcoCreator(await owner.getAddress(), true);
    await ACOPoolFactory.setOperator(await owner.getAddress(), true);
    await ACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);

    let lendingPool = await (await ethers.getContractFactory("LendingPoolForTest")).deploy(ethers.BigNumber.from("3000000000000000000000"));
    await lendingPool.deployed();
    await token2.approve(lendingPool.address, token2TotalSupply);
    await lendingPool.setAsset(token2.address, token2TotalSupply.div(4));
    await ACOPoolFactory.setAcoPoolLendingPool(lendingPool.address);
    await lendingPool.deposit(token2.address, token2TotalSupply.div(10), await owner.getAddress(), 0);
    atoken = await ethers.getContractAt("ERC20ForTest", (await lendingPool.getReserveData(token2.address)).aTokenAddress);

    let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
    let current = parseInt(block.timestamp, 16);
    expiration = current + 3 * 86400;

    let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice, expiration, maxExercisedAccounts)).wait();
    let result0 = tx.events[tx.events.length - 1].args;
    ACOToken1Token2Call = await ethers.getContractAt("ACOToken", result0.acoToken);

    let tx2 = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice, expiration, maxExercisedAccounts)).wait();
    let result2 = tx2.events[tx2.events.length - 1].args;
    ACOToken1Token2Put = await ethers.getContractAt("ACOToken", result2.acoToken);

    let tx4 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, true, acoEthToken2CallPrice, expiration, maxExercisedAccounts)).wait();
    let result4 = tx4.events[tx4.events.length - 1].args;
    ACOEthToken2Call = await ethers.getContractAt("ACOToken", result4.acoToken);

    let tx6 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, acoEthToken2PutPrice, expiration, maxExercisedAccounts)).wait();
    let result6 = tx6.events[tx6.events.length - 1].args;
    ACOEthToken2Put = await ethers.getContractAt("ACOToken", result6.acoToken);

    let tx3 = await (await ACOFactory.createAcoToken(token1.address, AddressZero, true, acoToken1EthCallPrice, expiration, maxExercisedAccounts)).wait();
    let result3 = tx3.events[tx3.events.length - 1].args;
    ACOToken1EthCall = await ethers.getContractAt("ACOToken", result3.acoToken);

    let tx5 = await (await ACOFactory.createAcoToken(token1.address, AddressZero, false, acoToken1EthPutPrice, expiration, maxExercisedAccounts)).wait();
    let result5 = tx5.events[tx5.events.length - 1].args;
    ACOToken1EthPut = await ethers.getContractAt("ACOToken", result5.acoToken);

    let tx8 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, token1Token2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    let result8 = tx8.events[tx8.events.length - 1].args;
    ACOPoolToken1Token2Call = await ethers.getContractAt("ACOPool2", result8.acoPool);
    tx8 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, token1Token2BaseVolatility2, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    result8 = tx8.events[tx8.events.length - 1].args;
    ACOPoolToken1Token2Call2 = await ethers.getContractAt("ACOPool2", result8.acoPool);

    let tx9 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, token1Token2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    let result9 = tx9.events[tx9.events.length - 1].args;
    ACOPoolToken1Token2Put = await ethers.getContractAt("ACOPool2", result9.acoPool);
    tx9 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, token1Token2BaseVolatility2, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    result9 = tx9.events[tx9.events.length - 1].args;
    ACOPoolToken1Token2Put2 = await ethers.getContractAt("ACOPool2", result9.acoPool);
    
    let tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, ethToken2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    let result10 = tx10.events[tx10.events.length - 1].args;
    ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool2", result10.acoPool);
    tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, ethToken2BaseVolatility2, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    result10 = tx10.events[tx10.events.length - 1].args;
    ACOPoolEthToken2Call2 = await ethers.getContractAt("ACOPool2", result10.acoPool);

    let tx11 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, ethToken2BaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    let result11 = tx11.events[tx11.events.length - 1].args;
    ACOPoolEthToken2Put = await ethers.getContractAt("ACOPool2", result11.acoPool);
    tx11 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, ethToken2BaseVolatility2, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    result11 = tx11.events[tx11.events.length - 1].args;
    ACOPoolEthToken2Put2 = await ethers.getContractAt("ACOPool2", result11.acoPool);

    let tx12 = await (await ACOPoolFactory.createAcoPool(token1.address, AddressZero, false, token1EthBaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    let result12 = tx12.events[tx12.events.length - 1].args;
    ACOPoolToken1EthPut = await ethers.getContractAt("ACOPool2", result12.acoPool);
    tx12 = await (await ACOPoolFactory.createAcoPool(token1.address, AddressZero, false, token1EthBaseVolatility2, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    result12 = tx12.events[tx12.events.length - 1].args;
    ACOPoolToken1EthPut2 = await ethers.getContractAt("ACOPool2", result12.acoPool);

    let tx13 = await (await ACOPoolFactory.createAcoPool(token1.address, AddressZero, true, token1EthBaseVolatility, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    let result13 = tx13.events[tx13.events.length - 1].args;
    ACOPoolToken1EthCall = await ethers.getContractAt("ACOPool2", result13.acoPool);
    tx13 = await (await ACOPoolFactory.createAcoPool(token1.address, AddressZero, true, token1EthBaseVolatility2, await owner.getAddress(), defaultStrategy.address, [0, toleranceBelowMax, 0, toleranceBelowMax, minExpiration, maxExpiration])).wait();
    result13 = tx13.events[tx13.events.length - 1].args;
    ACOPoolToken1EthCall2 = await ethers.getContractAt("ACOPool2", result13.acoPool);

    await token1.approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
    await token1.approve(ACOPoolToken1Token2Call2.address, token1TotalSupply);
    await token1.approve(ACOPoolToken1EthCall.address, token1TotalSupply);
    await token1.approve(ACOPoolToken1EthCall2.address, token1TotalSupply);
    await token2.approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
    await token2.approve(ACOPoolToken1Token2Put2.address, token2TotalSupply);
    await token2.approve(ACOPoolEthToken2Put.address, token2TotalSupply);
    await token2.approve(ACOPoolEthToken2Put2.address, token2TotalSupply);

    await token2.connect(addr1).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
    await token2.connect(addr1).approve(ACOPoolToken1Token2Call2.address, token2TotalSupply);
    await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
    await token2.connect(addr1).approve(ACOPoolToken1Token2Put2.address, token2TotalSupply);
    await token2.connect(addr1).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
    await token2.connect(addr1).approve(ACOPoolEthToken2Call2.address, token2TotalSupply);
    await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
    await token2.connect(addr1).approve(ACOPoolEthToken2Put2.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolToken1Token2Call2.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolToken1Token2Put2.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolEthToken2Call2.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
    await token2.connect(addr2).approve(ACOPoolEthToken2Put2.address, token2TotalSupply);

    await ACOPoolToken1Token2Call.deposit(ethers.BigNumber.from("10000000000"), 1, await owner.getAddress(), false);
    await ACOPoolToken1Token2Call2.deposit(ethers.BigNumber.from("10000000000"), 1, await owner.getAddress(), false);
    await ACOPoolToken1Token2Put.deposit(ethers.BigNumber.from("1000000000000"), 1, await owner.getAddress(), false);
    await ACOPoolToken1Token2Put2.deposit(ethers.BigNumber.from("1000000000000"), 1, await owner.getAddress(), false);
    await ACOPoolEthToken2Call.deposit(ethers.BigNumber.from("100000000000000000000"), 1, await owner.getAddress(), false, {value: ethers.BigNumber.from("100000000000000000000")});
    await ACOPoolEthToken2Call2.deposit(ethers.BigNumber.from("100000000000000000000"), 1, await owner.getAddress(), false, {value: ethers.BigNumber.from("100000000000000000000")});
    await ACOPoolEthToken2Put.deposit(ethers.BigNumber.from("1000000000000"), 1, await owner.getAddress(), false);
    await ACOPoolEthToken2Put2.deposit(ethers.BigNumber.from("1000000000000"), 1, await owner.getAddress(), false);
    await ACOPoolToken1EthPut.deposit(ethers.BigNumber.from("100000000000000000000"), 1, await owner.getAddress(), false, {value: ethers.BigNumber.from("100000000000000000000")});
    await ACOPoolToken1EthPut2.deposit(ethers.BigNumber.from("100000000000000000000"), 1, await owner.getAddress(), false, {value: ethers.BigNumber.from("100000000000000000000")});
    await ACOPoolToken1EthCall.deposit(ethers.BigNumber.from("10000000000"), 1, await owner.getAddress(), false);
    await ACOPoolToken1EthCall2.deposit(ethers.BigNumber.from("10000000000"), 1, await owner.getAddress(), false);

    acoBuyer = await (await ethers.getContractFactory("ACOBuyer")).deploy(ACOFactory.address, chiToken.address);
    await acoBuyer.deployed();
  });

  describe("ACOBuyer transactions", function () {
    it("Check buy", async function () {
      let t1Val = ethers.BigNumber.from("100000000");
      let ethVal = ethers.BigNumber.from("100000000000000000");
      let t2Val = ethers.BigNumber.from("1000000000");
      
      await expect(
        acoBuyer.buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address], [t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("transferFrom");
      await expect(
        acoBuyer.buyWithGasToken(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address], [t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("transferFrom");
      await expect(
        acoBuyer.buy(ACOEthToken2Put.address, await addr1.getAddress(), 1999999999, [ACOPoolEthToken2Put.address], [t2Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("transferFrom");
      await expect(
        acoBuyer.buyWithGasToken(ACOEthToken2Put.address, await addr1.getAddress(), 1999999999, [ACOPoolEthToken2Put.address], [t2Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("transferFrom");

      await token2.connect(owner).approve(acoBuyer.address, token2TotalSupply);
      await token2.connect(addr1).approve(acoBuyer.address, token2TotalSupply);
      await token2.connect(addr2).approve(acoBuyer.address, token2TotalSupply);

      await expect(
        acoBuyer.buy(AddressZero, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address], [t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid ACO token");
      await expect(
        acoBuyer.buyWithGasToken(AddressZero, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address], [t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid ACO token");
      await expect(
        acoBuyer.buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [], [t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid pools");
      await expect(
        acoBuyer.buyWithGasToken(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [], [t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid pools");
      await expect(
        acoBuyer.buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid arguments");
      await expect(
        acoBuyer.buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid arguments");
      await expect(
        acoBuyer.buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid arguments");
      await expect(
        acoBuyer.buyWithGasToken(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid arguments");
      await expect(
        acoBuyer.buyWithGasToken(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid arguments");
      await expect(
        acoBuyer.buyWithGasToken(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid arguments");
      await expect(
        acoBuyer.buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val,0], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid amount");
      await expect(
        acoBuyer.buyWithGasToken(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val,0], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid amount");
      await expect(
        acoBuyer.buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("0")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid restriction");
      await expect(
        acoBuyer.buyWithGasToken(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("0")])
      ).to.be.revertedWith("ACOBuyer::buy: Invalid restriction");
          
      let acoBal = await ACOToken1Token2Call.balanceOf(await addr1.getAddress());
      let tBal = await token2.balanceOf(await addr1.getAddress());
      expect(acoBal).to.be.equal(0);
      let quote1 = await ACOPoolToken1Token2Call.quote(ACOToken1Token2Call.address, t1Val);
      let quote2 = await ACOPoolToken1Token2Call2.quote(ACOToken1Token2Call.address, t1Val);
      await acoBuyer.connect(addr1).buy(ACOToken1Token2Call.address, await addr1.getAddress(), 1999999999, [ACOPoolToken1Token2Call.address,ACOPoolToken1Token2Call2.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")]);
      expect(await ACOToken1Token2Call.balanceOf(await addr1.getAddress())).to.be.equal(t1Val.add(t1Val));
      expect(await token2.balanceOf(await addr1.getAddress())).to.be.gt(tBal.sub(quote1[0].add(quote2[0])));
      expect(await token2.balanceOf(await addr1.getAddress())).to.be.lte(tBal.sub(quote1[0].add(quote2[0]).mul(99).div(100)));

      acoBal = await ACOEthToken2Call.balanceOf(await addr2.getAddress());
      tBal = await token2.balanceOf(await owner.getAddress());
      let tBal2 = await token2.balanceOf(await addr2.getAddress());
      expect(acoBal).to.be.equal(0);
      quote1 = await ACOPoolEthToken2Call.quote(ACOEthToken2Call.address, ethVal);
      quote2 = await ACOPoolEthToken2Call2.quote(ACOEthToken2Call.address, ethVal);
      await acoBuyer.connect(owner).buyWithGasToken(ACOEthToken2Call.address, await addr2.getAddress(), 1999999999, [ACOPoolEthToken2Call.address,ACOPoolEthToken2Call2.address], [ethVal,ethVal], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")]);
      expect(await ACOEthToken2Call.balanceOf(await addr2.getAddress())).to.be.equal(ethVal.add(ethVal));
      expect(await ACOEthToken2Call.balanceOf(await owner.getAddress())).to.be.equal(0);
      expect(await token2.balanceOf(await addr2.getAddress())).to.be.equal(tBal2);
      expect(await token2.balanceOf(await owner.getAddress())).to.be.gt(tBal.sub(quote1[0].add(quote2[0])));
      expect(await token2.balanceOf(await owner.getAddress())).to.be.lte(tBal.sub(quote1[0].add(quote2[0]).mul(99).div(100)));

      acoBal = await ACOEthToken2Put.balanceOf(await addr1.getAddress());
      tBal = await token2.balanceOf(await addr1.getAddress());
      expect(acoBal).to.be.equal(0);
      quote1 = await ACOPoolEthToken2Put.quote(ACOEthToken2Put.address, ethVal);
      await acoBuyer.connect(addr1).buy(ACOEthToken2Put.address, await addr1.getAddress(), 1999999999, [ACOPoolEthToken2Put.address], [ethVal], [ethers.BigNumber.from("99999999999")]);
      expect(await ACOEthToken2Put.balanceOf(await addr1.getAddress())).to.be.equal(ethVal);
      expect(await token2.balanceOf(await addr2.getAddress())).to.be.equal(tBal2);
      expect(await token2.balanceOf(await addr1.getAddress())).to.be.gt(tBal.sub(quote1[0]));
      expect(await token2.balanceOf(await addr1.getAddress())).to.be.lte(tBal.sub(quote1[0].mul(99).div(100)));

      acoBal = await ACOToken1Token2Put.balanceOf(await addr2.getAddress());
      tBal = await token2.balanceOf(await owner.getAddress());
      tBal2 = await token2.balanceOf(await addr2.getAddress());
      expect(acoBal).to.be.equal(0);
      quote1 = await ACOPoolToken1Token2Put.quote(ACOToken1Token2Put.address, t1Val);
      quote2 = await ACOPoolToken1Token2Put2.quote(ACOToken1Token2Put.address, t1Val);
      await acoBuyer.connect(owner).buyWithGasToken(ACOToken1Token2Put.address, await addr2.getAddress(), 1999999999, [ACOPoolToken1Token2Put.address,ACOPoolToken1Token2Put2.address], [t1Val,t1Val], [ethers.BigNumber.from("99999999999"),ethers.BigNumber.from("99999999999")]);
      expect(await ACOToken1Token2Put.balanceOf(await addr2.getAddress())).to.be.equal(t1Val.add(t1Val));
      expect(await ACOToken1Token2Put.balanceOf(await owner.getAddress())).to.be.equal(0);
      expect(await token2.balanceOf(await addr2.getAddress())).to.be.equal(tBal2);
      expect(await token2.balanceOf(await owner.getAddress())).to.be.gt(tBal.sub(quote1[0].add(quote2[0])));
      expect(await token2.balanceOf(await owner.getAddress())).to.be.lte(tBal.sub(quote1[0].add(quote2[0]).mul(99).div(100)));

      expect(await ACOToken1Token2Call.balanceOf(acoBuyer.address)).to.be.equal(0);
      expect(await ACOToken1Token2Put.balanceOf(acoBuyer.address)).to.be.equal(0);
      expect(await ACOEthToken2Call.balanceOf(acoBuyer.address)).to.be.equal(0);
      expect(await ACOEthToken2Put.balanceOf(acoBuyer.address)).to.be.equal(0);
      expect(await token1.balanceOf(acoBuyer.address)).to.be.equal(0);
      expect(await token2.balanceOf(acoBuyer.address)).to.be.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [acoBuyer.address,"latest"]))).to.equal(0);
    });
  });
});