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
  let pairCrvToken2;
  let token2Liq = ethers.utils.bigNumberify("5000000000000");
  let crvLiq = ethers.utils.bigNumberify("5000000000000000000000000");
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
    let tokenTotalSupply = ethers.utils.bigNumberify("1000000000000000000000000000000");
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
    tokenTotalSupply = ethers.utils.bigNumberify("10000000000000000000000000000");
    _coin1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await _coin1.deployed();

    tokenName = "USDT";
    tokenSymbol = "USDT";
    tokenDecimals = 6;
    tokenTotalSupply = ethers.utils.bigNumberify("100000000000000000");
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
    await token2.connect(owner).approve(_curve.address, ethers.utils.bigNumberify("1000000"));
    await _coin3.connect(owner).approve(_curve.address, ethers.utils.bigNumberify("100000000"));
    await _curve.add_liquidity([ethers.utils.bigNumberify("1000000000000000000"), ethers.utils.bigNumberify("1000000"), ethers.utils.bigNumberify("100000000")], 0);

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
    
    controller = await (await ethers.getContractFactory("Controller")).deploy(await owner.getAddress());
    await controller.deployed();

    await createVaultStrategy();

    await vault.setController(controller.address);
    await token2.connect(owner).approve(vault.address, token2TotalSupply);
    await token2.connect(addr1).approve(vault.address, token2TotalSupply);
    await token2.connect(addr2).approve(vault.address, token2TotalSupply);
    await token2.connect(addr3).approve(vault.address, token2TotalSupply);

    await uniswapFactory.createPair(crv.address, token2.address);
    pairCrvToken2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(crv.address, token2.address));
    await token2.connect(owner).transfer(pairCrvToken2.address, token2Liq);
    await crv.connect(owner).transfer(pairCrvToken2.address, crvLiq);
    await pairCrvToken2.connect(owner).mint(await owner.getAddress());
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
      await expect(
        controller.setVault(await addr1.getAddress(), vaultStrategy.address)
      ).to.be.revertedWith("Controller:: Invalid vault");
      
      await expect(
        controller.setVault(vault.address, await addr1.getAddress())
      ).to.be.revertedWith("Controller:: Invalid strategy");

      await expect(
        controller.connect(addr1).setVault(vault.address, vaultStrategy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      let vault2 = await (await ethers.getContractFactory("ACOVault")).deploy([
        ACOFactory.address,
        ACOPoolFactory.address,
        crv.address,
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
      await vault2.deployed();

      await expect(
        controller.setVault(vault2.address, vaultStrategy.address)
      ).to.be.revertedWith("Controller:: Asset does not match");

      await controller.setVault(vault.address, vaultStrategy.address);
      expect(await controller.strategiesOfVault(vault.address)).to.equal(vaultStrategy.address);
      expect(await controller.vaultsOfStrategy(vaultStrategy.address)).to.equal(vault.address);

      await expect(
        controller.setVault(vault.address, vaultStrategy.address)
      ).to.be.revertedWith("Controller:: Vault already exists");

      await expect(
        controller.setVault(vault2.address, vaultStrategy.address)
      ).to.be.revertedWith("Controller:: Strategy already exists");
    });
    it("Set fee destination", async function () {
      expect(await controller.feeDestination()).to.equal(await owner.getAddress());

      await controller.setFeeDestination(await addr1.getAddress());
      expect(await controller.feeDestination()).to.equal(await addr1.getAddress());

      await expect(
        controller.setFeeDestination(AddressZero)
      ).to.be.revertedWith("Controller:: Invalid fee destination");
      expect(await controller.feeDestination()).to.equal(await addr1.getAddress());

      await expect(
        controller.connect(addr1).setFeeDestination(controller.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await controller.feeDestination()).to.equal(await addr1.getAddress());

      await controller.setFeeDestination(await addr2.getAddress());
      expect(await controller.feeDestination()).to.equal(await addr2.getAddress());
    });
    it("Set operator", async function () {
      expect(await controller.operators(await owner.getAddress())).to.equal(true);
      expect(await controller.operators(await addr1.getAddress())).to.equal(false);
      expect(await controller.operators(await addr2.getAddress())).to.equal(false);

      await expect(
        controller.connect(addr1).setOperator(await addr1.getAddress(), true)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await controller.operators(await owner.getAddress())).to.equal(true);
      expect(await controller.operators(await addr1.getAddress())).to.equal(false);
      expect(await controller.operators(await addr2.getAddress())).to.equal(false);

      await controller.setOperator(await addr1.getAddress(), true);

      expect(await controller.operators(await owner.getAddress())).to.equal(true);
      expect(await controller.operators(await addr1.getAddress())).to.equal(true);
      expect(await controller.operators(await addr2.getAddress())).to.equal(false);

      await controller.setOperator(await addr2.getAddress(), true);

      expect(await controller.operators(await owner.getAddress())).to.equal(true);
      expect(await controller.operators(await addr1.getAddress())).to.equal(true);
      expect(await controller.operators(await addr2.getAddress())).to.equal(true);

      await controller.setOperator(await addr1.getAddress(), false);

      expect(await controller.operators(await owner.getAddress())).to.equal(true);
      expect(await controller.operators(await addr1.getAddress())).to.equal(false);
      expect(await controller.operators(await addr2.getAddress())).to.equal(true);
    });
  });

  describe("Controller transactions", function () {
    it("Withdraw stuck asset", async function () {
      await controller.setVault(vault.address, vaultStrategy.address);

      let tokenX = await (await ethers.getContractFactory("ERC20ForTest")).deploy("X", "X", 18, ethers.utils.bigNumberify("1000000000000000000000000"));
      await tokenX.deployed();

      let amount = ethers.utils.bigNumberify("10000000");
      await tokenX.transfer(vault.address, amount);
      await tokenX.transfer(vaultStrategy.address, amount);
      await tokenX.transfer(controller.address, amount);

      await expect(
        controller.connect(addr2).withdrawStuckTokenOnControlled(vault.address, tokenX.address, await addr2.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        controller.withdrawStuckTokenOnControlled(vault.address, token2.address, await addr2.getAddress())
      ).to.be.revertedWith("ACOVault:: Invalid token");

      expect(await tokenX.balanceOf(await addr2.getAddress())).to.equal(0);
      await controller.withdrawStuckTokenOnControlled(vault.address, tokenX.address, await addr2.getAddress());
      expect(await tokenX.balanceOf(await addr2.getAddress())).to.equal(amount);

      await expect(
        controller.withdrawStuckTokenOnControlled(vaultStrategy.address, token2.address, await addr1.getAddress())
      ).to.be.revertedWith("ACOVaultUSDCStrategyCurveBase:: Invalid token");

      await expect(
        controller.withdrawStuckTokenOnControlled(vaultStrategy.address, crv.address, await addr1.getAddress())
      ).to.be.revertedWith("ACOVaultUSDCStrategyCurveBase:: Invalid token");
      
      await expect(
        controller.withdrawStuckTokenOnControlled(vaultStrategy.address, crvPoolToken.address, await addr1.getAddress())
      ).to.be.revertedWith("ACOVaultUSDCStrategyCurveBase:: Invalid token");

      expect(await tokenX.balanceOf(await addr1.getAddress())).to.equal(0);
      await controller.withdrawStuckTokenOnControlled(vaultStrategy.address, tokenX.address, await addr1.getAddress());
      expect(await tokenX.balanceOf(await addr1.getAddress())).to.equal(amount);

      await expect(
        controller.connect(addr3).withdrawStuckToken(tokenX.address, await addr3.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await tokenX.balanceOf(await addr3.getAddress())).to.equal(0);
      await controller.withdrawStuckToken(tokenX.address, await addr3.getAddress());
      expect(await tokenX.balanceOf(await addr3.getAddress())).to.equal(amount);
    });
    it("Buy aco", async function () {
      await controller.setVault(vault.address, vaultStrategy.address);
      let deposit = ethers.utils.bigNumberify("1000000000000");
      let remain = ethers.utils.bigNumberify("50000000000");
      await vault.connect(owner).deposit(deposit); 

      expect(await token2.balanceOf(vault.address)).to.equal(deposit);
      expect(await _gauge.balanceOf(vaultStrategy.address)).to.equal(0);

      await vault.connect(addr2).earn();

      expect(await token2.balanceOf(vault.address)).to.equal(remain);
      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.be.above(0);
      let gBal = await _gauge.balanceOf(vaultStrategy.address);
      gBal = gBal.div(ethers.utils.bigNumberify("1000000000000"));
      expect(await vaultStrategy.balanceOf()).to.equal(gBal);

      let bal = ethers.utils.bigNumberify("1000000000000000000000");
      await mintr.setBalanceToMint(_gauge.address, bal);

      let expected = ethers.utils.bigNumberify("1000000000");
      let expectedFee = expected.mul(gasSubsidyFee).div(ethers.utils.bigNumberify("100000"));
      let previous = await token2.balanceOf(await owner.getAddress());
      
      await expect(
        vaultStrategy.connect(addr2).harvest()
      ).to.be.revertedWith("ACOVaultUSDCStrategyCurveBase:: Invalid sender");

      await vaultStrategy.setOperator(await addr2.getAddress(), true);

      await vaultStrategy.connect(addr2).harvest();
      
      expect(await token2.balanceOf(vault.address)).to.equal(remain);
      expect(await token2.balanceOf(await owner.getAddress())).to.be.above(previous);
      expect(await token2.balanceOf(await owner.getAddress())).to.be.below(previous.add(expectedFee));
      expect(await token2.balanceOf(vaultStrategy.address)).to.be.below(expected.sub(expectedFee));
      expect(await token2.balanceOf(vaultStrategy.address)).to.be.above(expected.sub(expectedFee.mul(2)));
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.equal(gBal);

      let reward = await token2.balanceOf(vaultStrategy.address);
      let amount = ethers.utils.bigNumberify("23040000000000000000");
      let aco = await ethers.getContractAt("ACOToken", await vault.currentAcoToken());

      await expect(
        controller.connect(addr2).buyAco(vault.address, amount, reward)
      ).to.be.revertedWith("Controller:: Invalid sender");

      await controller.setOperator(await addr2.getAddress(), true);

      await expect(
        controller.connect(addr2).buyAco(controller.address, amount, reward)
      ).to.be.revertedWith("Controller:: Invalid vault");
      
      await controller.connect(addr2).buyAco(vault.address, amount, reward);
      
      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.equal(gBal);
      expect(await aco.balanceOf(vault.address)).to.equal(amount);
      expect(await token2.balanceOf(vault.address)).to.be.above(remain);
    });
    it("Change strategy", async function () {
      await controller.setVault(vault.address, vaultStrategy.address);
      let deposit = ethers.utils.bigNumberify("1000000000000");
      let remain = ethers.utils.bigNumberify("50000000000");
      await vault.connect(owner).deposit(deposit); 
      await vault.connect(addr2).earn();

      let vaultStrategy2 = await (await ethers.getContractFactory("ACOVaultUSDCStrategy3CRV")).deploy([
        _curve.address,
        _gauge.address,
        mintr.address,
        crv.address,
        crvPoolToken.address,
        controller.address,
        converterHelper.address,
        gasSubsidyFee
      ]);
      await vaultStrategy2.deployed();

      await expect(
        controller.connect(addr2).changeStrategy(vault.address, vaultStrategy2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        controller.changeStrategy(controller.address, vaultStrategy2.address)
      ).to.be.revertedWith("Controller:: Invalid vault");

      await expect(
        controller.changeStrategy(vault.address, await addr1.getAddress())
      ).to.be.revertedWith("Controller:: Invalid strategy");

      await expect(
        controller.changeStrategy(vault.address, vaultStrategy.address)
      ).to.be.revertedWith("Controller:: Strategy already exists");

      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      let gBal = await _gauge.balanceOf(vaultStrategy.address);
      expect(await vaultStrategy.balanceOf()).to.equal(gBal.div(ethers.utils.bigNumberify("1000000000000")));
      expect(await token2.balanceOf(vault.address)).to.equal(remain);

      await controller.changeStrategy(vault.address, vaultStrategy2.address);

      expect(await token2.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy.address)).to.equal(0);
      expect(await vaultStrategy.balanceOf()).to.equal(0);
      expect(await token2.balanceOf(vaultStrategy2.address)).to.equal(0);
      expect(await crvPoolToken.balanceOf(vaultStrategy2.address)).to.equal(0);
      expect(await crv.balanceOf(vaultStrategy2.address)).to.equal(0);
      expect(await vaultStrategy2.balanceOf()).to.equal(0);
      expect(await token2.balanceOf(vault.address)).to.be.above(deposit.sub(remain));
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