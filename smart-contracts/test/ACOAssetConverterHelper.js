const { expect } = require("chai");
const { AddressZero } = require("ethers/constants");

let started = false;

describe("ACOAssetConverterHelper", function() {
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
  let token3;
  let token3Name = "TOKEN3";
  let token3Symbol = "TOK3";
  let token3Decimals = 18;
  let token3TotalSupply = ethers.utils.bigNumberify("1000000000000000000000000000");
  let pairToken1Token2;
  let pairWethToken2;
  let pairWethToken3;
  let token1Liq = ethers.utils.bigNumberify("50000000000");
  let token2Liq = ethers.utils.bigNumberify("5000000000000");
  let wethLiq = ethers.utils.bigNumberify("12500000000000000000000");
  let token3Liq = ethers.utils.bigNumberify("62500000000000000000000");
  let aggregatorToken1Token2;
  let aggregatorWethToken2;
  let uniswapFactory;
  let weth;
  let uniswapRouter;
  let converterHelper;

  let token1Token2Price = ethers.utils.bigNumberify("10000000000");
  let ethToken2Price = ethers.utils.bigNumberify("400000000");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, ...addrs] = await ethers.getSigners();
    
    if (!started) {
        let baseTx = {to: await owner.getAddress(), value: ethers.utils.bigNumberify("5000000000000000000000")};
        await addr1.sendTransaction(baseTx);
        await addr2.sendTransaction(baseTx);
        await addr3.sendTransaction(baseTx);
        await addr4.sendTransaction(baseTx);
        await addr5.sendTransaction(baseTx);
        await addr6.sendTransaction(baseTx);
        started = true;
    }

    uniswapFactory = await (await ethers.getContractFactory("UniswapV2Factory")).deploy(await owner.getAddress());
    await uniswapFactory.deployed();
    weth = await (await ethers.getContractFactory("WETH9")).deploy();
    await weth.deployed(); 
    uniswapRouter = await (await ethers.getContractFactory("UniswapV2Router02")).deploy(uniswapFactory.address, weth.address);
    await uniswapRouter.deployed();
    
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

    token3 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token3Name, token3Symbol, token3Decimals, token3TotalSupply);
    await token3.deployed();
    
    await token3.connect(owner).transfer(await addr1.getAddress(), ethers.utils.bigNumberify("1000000000000000000000000"));
    await token3.connect(owner).transfer(await addr2.getAddress(), ethers.utils.bigNumberify("1000000000000000000000000"));
    await token3.connect(owner).transfer(await addr3.getAddress(), ethers.utils.bigNumberify("1000000000000000000000000"));

    aggregatorToken1Token2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, token1Token2Price.mul(100));
    await aggregatorToken1Token2.deployed();

    aggregatorWethToken2 = await (await ethers.getContractFactory("AggregatorForTest")).deploy(8, ethToken2Price.mul(100));
    await aggregatorWethToken2.deployed();

    await uniswapFactory.createPair(token1.address, token2.address);
    await uniswapFactory.createPair(token2.address, weth.address);
    await uniswapFactory.createPair(token3.address, weth.address);
    
    pairToken1Token2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token1.address, token2.address));
    pairWethToken2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token2.address, weth.address));
    pairWethToken3 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token3.address, weth.address));

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
    await token3.connect(owner).approve(pairWethToken3.address, token3TotalSupply);
    await token3.connect(addr1).approve(pairWethToken3.address, token3TotalSupply);
    await token3.connect(addr2).approve(pairWethToken3.address, token3TotalSupply);
    await token3.connect(addr3).approve(pairWethToken3.address, token3TotalSupply);
    await token3.connect(owner).approve(uniswapRouter.address, token3TotalSupply);
    await token3.connect(addr1).approve(uniswapRouter.address, token3TotalSupply);
    await token3.connect(addr2).approve(uniswapRouter.address, token3TotalSupply);
    await token3.connect(addr3).approve(uniswapRouter.address, token3TotalSupply);
    await pairToken1Token2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);
    await pairWethToken2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);
    await pairWethToken3.connect(owner).approve(uniswapRouter.address, token3TotalSupply);

    await token1.connect(owner).transfer(pairToken1Token2.address, token1Liq);
    await token2.connect(owner).transfer(pairToken1Token2.address, token2Liq);
    await pairToken1Token2.connect(owner).mint(await owner.getAddress());
  
    await token2.connect(owner).transfer(pairWethToken2.address, token2Liq);
    await weth.connect(owner).deposit({value: wethLiq});
    await weth.connect(owner).transfer(pairWethToken2.address, wethLiq);
    await pairWethToken2.connect(owner).mint(await owner.getAddress());

    await token3.connect(owner).transfer(pairWethToken3.address, token3Liq);
    await weth.connect(owner).deposit({value: wethLiq});
    await weth.connect(owner).transfer(pairWethToken3.address, wethLiq);
    await pairWethToken3.connect(owner).mint(await owner.getAddress());

    converterHelper = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
  });

  describe("Set functions", function () {
    it("Set aggregator", async function () {
      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(false);

      await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);

      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(true);
      expect(await converterHelper.hasAggregator(token2.address, token1.address)).to.equal(true);

      let data = await converterHelper.getPairData(token1.address, token2.address);
      expect(data[0]).to.equal(aggregatorToken1Token2.address);
      expect(data[1]).to.equal(ethers.utils.bigNumberify("100000000"));
      expect(data[2]).to.equal(0);
      expect(data[3]).to.equal(0);

      await converterHelper.setAggregator(token2.address, token1.address, aggregatorWethToken2.address);

      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(true);
      expect(await converterHelper.hasAggregator(token2.address, token1.address)).to.equal(true);

      data = await converterHelper.getPairData(token1.address, token2.address);
      expect(data[0]).to.equal(aggregatorWethToken2.address);
      expect(data[1]).to.equal(ethers.utils.bigNumberify("100000000"));
      expect(data[2]).to.equal(0);
      expect(data[3]).to.equal(0);

      await expect(
        converterHelper.connect(addr1).setAggregator(token2.address, token1.address, aggregatorToken1Token2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(data[0]).to.equal(aggregatorWethToken2.address);

      await expect(
        converterHelper.setAggregator(token2.address, token1.address, await addr1.getAddress())
      ).to.be.revertedWith("ACOAssetConverterHelper:: Invalid aggregator");
      expect(data[0]).to.equal(aggregatorWethToken2.address);

      await converterHelper.setAggregator(token2.address, token1.address, aggregatorToken1Token2.address);

      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(true);
      expect(await converterHelper.hasAggregator(token2.address, token1.address)).to.equal(true);

      data = await converterHelper.getPairData(token1.address, token2.address);
      expect(data[0]).to.equal(aggregatorToken1Token2.address);
      expect(data[1]).to.equal(ethers.utils.bigNumberify("100000000"));
      expect(data[2]).to.equal(0);
      expect(data[3]).to.equal(0);

      expect(await converterHelper.assetPrecision(token1.address)).to.equal(ethers.utils.bigNumberify("100000000"));
      expect(await converterHelper.assetPrecision(token2.address)).to.equal(ethers.utils.bigNumberify("1000000"));
      expect(await converterHelper.getPrice(token1.address, token2.address)).to.equal(ethers.utils.bigNumberify("10000000000"));
      expect(await converterHelper.getPrice(token2.address, token1.address)).to.equal(ethers.utils.bigNumberify("10000"));
      expect(await converterHelper.getPriceWithTolerance(token1.address, token2.address, true)).to.equal(ethers.utils.bigNumberify("10000000000"));
      expect(await converterHelper.getPriceWithTolerance(token2.address, token1.address, true)).to.equal(ethers.utils.bigNumberify("10000"));
      expect(await converterHelper.getPriceWithTolerance(token1.address, token2.address, false)).to.equal(ethers.utils.bigNumberify("10000000000"));
      expect(await converterHelper.getPriceWithTolerance(token2.address, token1.address, false)).to.equal(ethers.utils.bigNumberify("10000"));
    });
    it("Set pair tolerance percentage", async function () {
      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(false);

      await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 1000);

      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(false);

      let data = await converterHelper.getPairData(token1.address, token2.address);
      expect(data[0]).to.equal(AddressZero);
      expect(data[1]).to.equal(0);
      expect(data[2]).to.equal(1000);
      expect(data[3]).to.equal(0);

      await expect(
        converterHelper.connect(addr1).setPairTolerancePercentage(token1.address, token2.address, 1500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(data[2]).to.equal(1000);

      await expect(
        converterHelper.setPairTolerancePercentage(token2.address, token1.address, 100001)
      ).to.be.revertedWith("ACOAssetConverterHelper:: Invalid tolerance percentage");
      expect(data[2]).to.equal(1000);

      await converterHelper.setPairTolerancePercentage(token2.address, token1.address, 1500);

      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(false);

      data = await converterHelper.getPairData(token1.address, token2.address);
      expect(data[0]).to.equal(AddressZero);
      expect(data[1]).to.equal(0);
      expect(data[2]).to.equal(1500);
      expect(data[3]).to.equal(0);

      expect(await converterHelper.assetPrecision(token1.address)).to.equal(ethers.utils.bigNumberify("100000000"));
      expect(await converterHelper.assetPrecision(token2.address)).to.equal(ethers.utils.bigNumberify("1000000"));
    });
    it("Set Uniswap middle route", async function () {
      expect(await converterHelper.hasAggregator(token1.address, token3.address)).to.equal(false);

      let tx = await (await converterHelper.setUniswapMiddleRoute(token1.address, token3.address, [weth.address])).wait();
      expect(tx.events[0].args.previousUniswapMiddleRoute.length).to.equal(0);
      expect(tx.events[0].args.newUniswapMiddleRoute.length).to.equal(1);
      expect(tx.events[0].args.newUniswapMiddleRoute[0]).to.equal(weth.address);

      let data = await converterHelper.getPairData(token1.address, token3.address);
      expect(data[0]).to.equal(AddressZero);
      expect(data[1]).to.equal(0);
      expect(data[2]).to.equal(0);
      expect(data[3]).to.equal(1);
      
      expect(await converterHelper.getUniswapMiddleRouteByIndex(token1.address, token3.address, 0)).to.equal(weth.address);

      expect(await converterHelper.assetPrecision(token1.address)).to.equal(ethers.utils.bigNumberify("100000000"));
      expect(await converterHelper.assetPrecision(token3.address)).to.equal(ethers.utils.bigNumberify("1000000000000000000"));
      expect(await converterHelper.hasAggregator(token1.address, token3.address)).to.equal(false);

      await expect(
        converterHelper.connect(addr1).setUniswapMiddleRoute(token1.address, token3.address, [token2.address,weth.address])
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        converterHelper.setUniswapMiddleRoute(token1.address, token3.address, [token3.address])
      ).to.be.revertedWith("ACOAssetConverterHelper:: Invalid middle route");

      await expect(
        converterHelper.setUniswapMiddleRoute(token1.address, token3.address, [token2.address,token2.address])
      ).to.be.revertedWith("ACOAssetConverterHelper:: Invalid middle route");

      tx = await (await converterHelper.setUniswapMiddleRoute(token1.address, token3.address, [])).wait();
      expect(tx.events[0].args.previousUniswapMiddleRoute.length).to.equal(1);
      expect(tx.events[0].args.previousUniswapMiddleRoute[0]).to.equal(weth.address);
      expect(tx.events[0].args.newUniswapMiddleRoute.length).to.equal(0);

      tx = await (await converterHelper.setUniswapMiddleRoute(token1.address, token3.address, [weth.address])).wait();
      expect(tx.events[0].args.previousUniswapMiddleRoute.length).to.equal(0);
      expect(tx.events[0].args.newUniswapMiddleRoute.length).to.equal(1);
      expect(tx.events[0].args.newUniswapMiddleRoute[0]).to.equal(weth.address);

      tx = await (await converterHelper.setUniswapMiddleRoute(token3.address, token1.address, [weth.address,token2.address])).wait();
      expect(tx.events[0].args.previousUniswapMiddleRoute.length).to.equal(1);
      expect(tx.events[0].args.previousUniswapMiddleRoute[0]).to.equal(weth.address);
      expect(tx.events[0].args.newUniswapMiddleRoute.length).to.equal(2);
      expect(tx.events[0].args.newUniswapMiddleRoute[0]).to.equal(token2.address);
      expect(tx.events[0].args.newUniswapMiddleRoute[1]).to.equal(weth.address);

      expect(await converterHelper.hasAggregator(token1.address, token3.address)).to.equal(false);

      data = await converterHelper.getPairData(token3.address, token1.address);
      expect(data[0]).to.equal(AddressZero);
      expect(data[1]).to.equal(0);
      expect(data[2]).to.equal(0);
      expect(data[3]).to.equal(2);
      
      expect(await converterHelper.getUniswapMiddleRouteByIndex(token1.address, token3.address, 0)).to.equal(token2.address);
      expect(await converterHelper.getUniswapMiddleRouteByIndex(token3.address, token1.address, 0)).to.equal(weth.address);
      expect(await converterHelper.getUniswapMiddleRouteByIndex(token1.address, token3.address, 1)).to.equal(weth.address);
      expect(await converterHelper.getUniswapMiddleRouteByIndex(token3.address, token1.address, 1)).to.equal(token2.address);
    });
  });
});