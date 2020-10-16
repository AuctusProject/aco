const { expect } = require("chai");

describe("ACOVaultUSDCStrategy3CRV", function() {
  let vaultStrategy;
  let mintr;
  let crv;
  let crvPoolToken;
  let coins;
  let controller;
  let assetConverter;
  let owner, addr1;
  let gasSubsidyFee = 5000;
  let uniswapRouter;

  beforeEach(async function () { 
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10, addr11, addr12, addr13, addr14, addr15, ...addrs] = await ethers.getSigners();

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

    tokenName = "USDC";
    tokenSymbol = "USDC";
    tokenDecimals = 6;
    tokenTotalSupply = ethers.utils.bigNumberify("1000000000000");
    _coin2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await _coin2.deployed();

    tokenName = "USDT";
    tokenSymbol = "USDT";
    tokenDecimals = 6;
    tokenTotalSupply = ethers.utils.bigNumberify("1000000000000");
    _coin3 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply);
    await _coin3.deployed();

    coins = [_coin1.address, _coin2.address, _coin3.address];
    _curve = await (await ethers.getContractFactory("Curve3PoolForTest")).deploy(
      coins,
      crvPoolToken.address,
      100, 
      0
    );
    await _curve.deployed();

    controller = await (await ethers.getContractFactory("Controller")).deploy(await owner.getAddress());
    await controller.deployed();

    let uniswapFactory = await (await ethers.getContractFactory("UniswapV2Factory")).deploy(await owner.getAddress());
    await uniswapFactory.deployed();
    let weth = await (await ethers.getContractFactory("WETH9")).deploy();
    await weth.deployed(); 
    uniswapRouter = await (await ethers.getContractFactory("UniswapV2Router02")).deploy(uniswapFactory.address, weth.address);
    await uniswapRouter.deployed();

    assetConverter = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);

    vaultStrategy = await (await ethers.getContractFactory("ACOVaultUSDCStrategy3CRV")).deploy([
      _curve.address,
      _gauge.address,
      mintr.address,
      crv.address,
      crvPoolToken.address,
      controller.address,
      assetConverter.address,
      gasSubsidyFee
    ]);
    await vaultStrategy.deployed();
  });

  afterEach(async function () {    
  });

  describe("Set functions", function () {
    it("Set controller", async function () {
      expect(await vaultStrategy.controller()).to.equal(controller.address);

      let controller2 = await (await ethers.getContractFactory("Controller")).deploy(await owner.getAddress());
      await controller2.deployed();
      await vaultStrategy.setController(controller2.address);
      expect(await vaultStrategy.controller()).to.equal(controller2.address);

      await expect(
        vaultStrategy.setController(await addr1.getAddress())
      ).to.be.revertedWith("ACOVaultUSDCStrategyCurveBase:: Invalid controller");
      expect(await vaultStrategy.controller()).to.equal(controller2.address);

      await expect(
        vaultStrategy.connect(addr1).setController(controller.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vaultStrategy.controller()).to.equal(controller2.address);

      await vaultStrategy.setController(controller.address);
      expect(await vaultStrategy.controller()).to.equal(controller.address);
    });
    it("Set gas subsidy fee", async function () {
      expect(await vaultStrategy.gasSubsidyFee()).to.equal(gasSubsidyFee);
      let newGasSubsidyFee = gasSubsidyFee * 2;
      await vaultStrategy.setGasSubsidyFee(newGasSubsidyFee);
      expect(await vaultStrategy.gasSubsidyFee()).to.equal(newGasSubsidyFee);
  
      await expect(
        vaultStrategy.setGasSubsidyFee(10000000)
      ).to.be.revertedWith("ACOVaultUSDCStrategyCurveBase:: Invalid gas subsidy fee");
      expect(await vaultStrategy.gasSubsidyFee()).to.equal(newGasSubsidyFee);
  
      await expect(
        vaultStrategy.connect(addr1).setGasSubsidyFee(gasSubsidyFee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vaultStrategy.gasSubsidyFee()).to.equal(newGasSubsidyFee);
  
      await vaultStrategy.setGasSubsidyFee(gasSubsidyFee);
      expect(await vaultStrategy.gasSubsidyFee()).to.equal(gasSubsidyFee);
    });
    it("Set asset converter", async function () {
      expect(await vaultStrategy.assetConverter()).to.equal(assetConverter.address);

      let assetConverter2 = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
      await assetConverter2.deployed();
      await vaultStrategy.setAssetConverter(assetConverter2.address);
      expect(await vaultStrategy.assetConverter()).to.equal(assetConverter2.address);

      await expect(
        vaultStrategy.setAssetConverter(await addr1.getAddress())
      ).to.be.revertedWith("ACOVaultUSDCStrategyCurveBase:: Invalid asset converter");
      expect(await vaultStrategy.assetConverter()).to.equal(assetConverter2.address);

      await expect(
        vaultStrategy.connect(addr1).setAssetConverter(assetConverter.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await vaultStrategy.assetConverter()).to.equal(assetConverter2.address);

      await vaultStrategy.setAssetConverter(assetConverter.address);
      expect(await vaultStrategy.assetConverter()).to.equal(assetConverter.address);
    });
  });
});