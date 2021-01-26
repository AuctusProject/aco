const { expect } = require("chai");
const AddressZero = "0x0000000000000000000000000000000000000000";

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
  let token1TotalSupply = ethers.BigNumber.from("100000000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.BigNumber.from("1000000000000000");
  let token3;
  let token3Name = "TOKEN3";
  let token3Symbol = "TOK3";
  let token3Decimals = 18;
  let token3TotalSupply = ethers.BigNumber.from("1000000000000000000000000000");
  let pairToken1Token2;
  let pairWethToken2;
  let pairWethToken3;
  let token1Liq = ethers.BigNumber.from("50000000000");
  let token2Liq = ethers.BigNumber.from("5000000000000");
  let wethLiq = ethers.BigNumber.from("12500000000000000000000");
  let token3Liq = ethers.BigNumber.from("62500000000000000000000");
  let aggregatorToken1Token2;
  let aggregatorWethToken2;
  let uniswapFactory;
  let weth;
  let uniswapRouter;
  let converterHelper;

  let token1Token2Price = ethers.BigNumber.from("10000000000");
  let ethToken2Price = ethers.BigNumber.from("400000000");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, ...addrs] = await ethers.getSigners();
    
    if (!started) {
        let baseTx = {to: await owner.getAddress(), value: ethers.BigNumber.from("5000000000000000000000")};
        await addr4.sendTransaction(baseTx);
        await addr5.sendTransaction(baseTx);
        await addr6.sendTransaction(baseTx);
        await addr7.sendTransaction(baseTx);
        await addr8.sendTransaction(baseTx);
        await addr9.sendTransaction(baseTx);
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

    await token1.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("100000000000000"));
    await token1.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("100000000000000"));
    await token1.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("100000000000000"));

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    await token2.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("1000000000000"));
    await token2.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("1000000000000"));
    await token2.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("1000000000000"));

    token3 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token3Name, token3Symbol, token3Decimals, token3TotalSupply);
    await token3.deployed();
    
    await token3.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("1000000000000000000000000"));
    await token3.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("1000000000000000000000000"));
    await token3.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("1000000000000000000000000"));

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
    await converterHelper.deployed();
  });

  afterEach(async function () {
    let addr = await owner.getAddress();
    let balLP2 = await pairWethToken2.balanceOf(addr);
    let balLP3 = await pairWethToken3.balanceOf(addr);
    await pairWethToken2.connect(owner).transfer(pairWethToken2.address, balLP2);
    await pairWethToken2.connect(owner).burn(addr);
    await pairWethToken3.connect(owner).transfer(pairWethToken3.address, balLP3);
    await pairWethToken3.connect(owner).burn(addr);
    let balWETH = await weth.balanceOf(addr);
    await weth.connect(owner).withdraw(balWETH);
  });

  describe("Set functions", function () {
    it("Set aggregator", async function () {
      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(false);

      await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);

      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(true);
      expect(await converterHelper.hasAggregator(token2.address, token1.address)).to.equal(true);

      let data = await converterHelper.getPairData(token1.address, token2.address);
      expect(data[0]).to.equal(aggregatorToken1Token2.address);
      expect(data[1]).to.equal(ethers.BigNumber.from("100000000"));
      expect(data[2]).to.equal(0);
      expect(data[3]).to.equal(0);

      await converterHelper.setAggregator(token2.address, token1.address, aggregatorWethToken2.address);

      expect(await converterHelper.hasAggregator(token1.address, token2.address)).to.equal(true);
      expect(await converterHelper.hasAggregator(token2.address, token1.address)).to.equal(true);

      data = await converterHelper.getPairData(token1.address, token2.address);
      expect(data[0]).to.equal(aggregatorWethToken2.address);
      expect(data[1]).to.equal(ethers.BigNumber.from("100000000"));
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
      expect(data[1]).to.equal(ethers.BigNumber.from("100000000"));
      expect(data[2]).to.equal(0);
      expect(data[3]).to.equal(0);

      expect(await converterHelper.assetPrecision(token1.address)).to.equal(ethers.BigNumber.from("100000000"));
      expect(await converterHelper.assetPrecision(token2.address)).to.equal(ethers.BigNumber.from("1000000"));
      expect(await converterHelper.getPrice(token1.address, token2.address)).to.equal(ethers.BigNumber.from("10000000000"));
      expect(await converterHelper.getPrice(token2.address, token1.address)).to.equal(ethers.BigNumber.from("10000"));
      expect(await converterHelper.getPriceWithTolerance(token1.address, token2.address, true)).to.equal(ethers.BigNumber.from("10000000000"));
      expect(await converterHelper.getPriceWithTolerance(token2.address, token1.address, true)).to.equal(ethers.BigNumber.from("10000"));
      expect(await converterHelper.getPriceWithTolerance(token1.address, token2.address, false)).to.equal(ethers.BigNumber.from("10000000000"));
      expect(await converterHelper.getPriceWithTolerance(token2.address, token1.address, false)).to.equal(ethers.BigNumber.from("10000"));
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

      expect(await converterHelper.assetPrecision(token1.address)).to.equal(ethers.BigNumber.from("100000000"));
      expect(await converterHelper.assetPrecision(token2.address)).to.equal(ethers.BigNumber.from("1000000"));
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

      expect(await converterHelper.assetPrecision(token1.address)).to.equal(ethers.BigNumber.from("100000000"));
      expect(await converterHelper.assetPrecision(token3.address)).to.equal(ethers.BigNumber.from("1000000000000000000"));
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

  describe("Swap with aggregator functions", function () {
    it("Swap exact amount out", async function () {
      let val11 = ethers.BigNumber.from("100000000");

      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(token1.address, token2.address, val11)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);
      await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 1000);

      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(token1.address, token2.address, val11)
      ).to.be.revertedWith("transferFrom");

      await token1.connect(addr2).approve(converterHelper.address, val11);
      let bal11 = await token1.balanceOf(await addr2.getAddress());
      let bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOut(token1.address, token2.address, val11);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal11.sub(val11));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal12);

      let val12 = ethers.BigNumber.from("10000000000");
      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(token2.address, token1.address, val12)
      ).to.be.revertedWith("transferFrom");

      await token2.connect(addr2).approve(converterHelper.address, val12);
      bal11 = await token1.balanceOf(await addr2.getAddress());
      bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOut(token2.address, token1.address, val12);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(val12));
      await expect(await token1.balanceOf(await addr2.getAddress())).to.be.above(bal11);

      await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 0);
      
      await token1.connect(addr2).approve(converterHelper.address, val11);
      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(token1.address, token2.address, val11)
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      await token2.connect(addr2).approve(converterHelper.address, val12);
      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(token2.address, token1.address, val12)
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      let val21 = ethers.BigNumber.from("1000000000000000000");

      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(AddressZero, token2.address, val21)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);
      await converterHelper.setPairTolerancePercentage(AddressZero, token2.address, 1000);

      let bal21 = await addr2.getBalance();
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOut(AddressZero, token2.address, val21, {value: val21});
      await expect(await addr2.getBalance()).to.be.below(bal21.sub(val21));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal22);

      let val22 = ethers.BigNumber.from("400000000");
      bal21 = await addr2.getBalance();
      bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOut(token2.address, AddressZero, val22);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(val22));
      await expect(await addr2.getBalance()).to.be.above(bal21);

      await converterHelper.setPairTolerancePercentage(token2.address, AddressZero, 0);
      
      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(AddressZero, token2.address, val21, {value: val21})
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      await token2.connect(addr2).approve(converterHelper.address, val22);
      await expect(
        converterHelper.connect(addr2).swapExactAmountOut(token2.address, AddressZero, val22)
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    });
    it("Swap exact amount out with specific tolerance", async function () {
      let val11 = ethers.BigNumber.from("100000000");

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token1.address, token2.address, val11, 1000)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token1.address, token2.address, val11, 100001)
      ).to.be.revertedWith("ACOAssetConverterHelper:: Invalid tolerance percentage");

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token1.address, token2.address, val11, 1000)
      ).to.be.revertedWith("transferFrom");

      await token1.connect(addr2).approve(converterHelper.address, val11);
      let bal11 = await token1.balanceOf(await addr2.getAddress());
      let bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token1.address, token2.address, val11, 1000);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal11.sub(val11));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal12);

      let val12 = ethers.BigNumber.from("10000000000");
      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token2.address, token1.address, val12, 1000)
      ).to.be.revertedWith("transferFrom");

      await token2.connect(addr2).approve(converterHelper.address, val12);
      bal11 = await token1.balanceOf(await addr2.getAddress());
      bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token2.address, token1.address, val12, 1000);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(val12));
      await expect(await token1.balanceOf(await addr2.getAddress())).to.be.above(bal11);

      await token1.connect(addr2).approve(converterHelper.address, val11);
      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token1.address, token2.address, val11, 0)
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      await token2.connect(addr2).approve(converterHelper.address, val12);
      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token2.address, token1.address, val12, 0)
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      let val21 = ethers.BigNumber.from("1000000000000000000");

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(AddressZero, token2.address, val21, 1000)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(AddressZero, token2.address, val11, 100001)
      ).to.be.revertedWith("ACOAssetConverterHelper:: Invalid tolerance percentage");

      let bal21 = await addr2.getBalance();
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(AddressZero, token2.address, val21, 1000, {value: val21});
      await expect(await addr2.getBalance()).to.be.below(bal21.sub(val21));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal22);

      let val22 = ethers.BigNumber.from("400000000");
      bal21 = await addr2.getBalance();
      bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token2.address, AddressZero, val22, 1000);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(val22));
      await expect(await addr2.getBalance()).to.be.above(bal21);

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(AddressZero, token2.address, val21, 0, {value: val21})
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      await token2.connect(addr2).approve(converterHelper.address, val22);
      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithSpecificTolerance(token2.address, AddressZero, val22, 0)
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    });
    it("Swap exact amount in", async function () {
      let val11 = ethers.BigNumber.from("10000000000");

      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(token1.address, token2.address, val11)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);
      await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 1000);

      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(token1.address, token2.address, val11)
      ).to.be.revertedWith("transferFrom");

      let pt11 = await converterHelper.getExpectedAmountOutToSwapExactAmountIn(token1.address, token2.address, val11);
      await token1.connect(addr2).approve(converterHelper.address, pt11);
      let bal11 = await token1.balanceOf(await addr2.getAddress());
      let bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountIn(token1.address, token2.address, val11);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.be.above(bal11.sub(pt11));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal12.add(val11));

      let val12 = ethers.BigNumber.from("100000000");
      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(token2.address, token1.address, val12)
      ).to.be.revertedWith("transferFrom");

      let pt12 = await converterHelper.getExpectedAmountOutToSwapExactAmountIn(token2.address, token1.address, val12);
      await token2.connect(addr2).approve(converterHelper.address, pt12);
      bal11 = await token1.balanceOf(await addr2.getAddress());
      bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountIn(token2.address, token1.address, val12);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal12.sub(pt12));
      await expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal11.add(val12));

      await converterHelper.setPairTolerancePercentage(token1.address, token2.address, 0);
      
      await token1.connect(addr2).approve(converterHelper.address, pt11);
      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(token1.address, token2.address, val11)
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      await token2.connect(addr2).approve(converterHelper.address, pt12);
      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(token2.address, token1.address, val12)
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      let val21 = ethers.BigNumber.from("10000000000");

      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(AddressZero, token2.address, val21)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);
      await converterHelper.setPairTolerancePercentage(AddressZero, token2.address, 1000);

      let pt21 = await converterHelper.getExpectedAmountOutToSwapExactAmountIn(AddressZero, token2.address, val21);
      let bal21 = await addr2.getBalance();
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountIn(AddressZero, token2.address, val21, {value: pt21});
      await expect(await addr2.getBalance()).to.be.above(bal21.sub(pt21));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(val21));

      let val22 = ethers.BigNumber.from("1000000000000000000");
      let pt22 = await converterHelper.getExpectedAmountOutToSwapExactAmountIn(token2.address, AddressZero, val22);
      bal21 = await addr2.getBalance();
      bal22 = await token2.balanceOf(await addr2.getAddress());
      await token2.connect(addr2).approve(converterHelper.address, pt22);
      await converterHelper.connect(addr2).swapExactAmountIn(token2.address, AddressZero, val22);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal22.sub(pt22));
      await expect(await addr2.getBalance()).to.be.above(bal21);

      await converterHelper.setPairTolerancePercentage(token2.address, AddressZero, 0);
      
      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(AddressZero, token2.address, val21, {value: pt21})
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      let val23 = ethers.BigNumber.from("100000000000000000000");
      let pt23 = await converterHelper.getExpectedAmountOutToSwapExactAmountIn(token2.address, AddressZero, val23);
      
      await token2.connect(addr2).approve(converterHelper.address, pt23);
      await expect(
        converterHelper.connect(addr2).swapExactAmountIn(token2.address, AddressZero, val23)
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    });
    it("Swap exact amount in with specific tolerance", async function () {
      let val11 = ethers.BigNumber.from("10000000000");
      let tolerance = 1000;

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token1.address, token2.address, val11, tolerance)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(token1.address, token2.address, aggregatorToken1Token2.address);

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token1.address, token2.address, val11, tolerance)
      ).to.be.revertedWith("transferFrom");

      let pt11 = await converterHelper.getExpectedAmountOutToSwapExactAmountInWithSpecificTolerance(token1.address, token2.address, val11, tolerance);
      await token1.connect(addr2).approve(converterHelper.address, pt11);
      let bal11 = await token1.balanceOf(await addr2.getAddress());
      let bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token1.address, token2.address, val11, tolerance);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.be.above(bal11.sub(pt11));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal12.add(val11));

      let val12 = ethers.BigNumber.from("100000000");
      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token2.address, token1.address, val12, tolerance)
      ).to.be.revertedWith("transferFrom");

      let pt12 = await converterHelper.getExpectedAmountOutToSwapExactAmountInWithSpecificTolerance(token2.address, token1.address, val12, tolerance);
      await token2.connect(addr2).approve(converterHelper.address, pt12);
      bal11 = await token1.balanceOf(await addr2.getAddress());
      bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token2.address, token1.address, val12, tolerance);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal12.sub(pt12));
      await expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal11.add(val12));

      await token1.connect(addr2).approve(converterHelper.address, pt11);
      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token1.address, token2.address, val11, 0)
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      await token2.connect(addr2).approve(converterHelper.address, pt12);
      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token2.address, token1.address, val12, 0)
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      let val21 = ethers.BigNumber.from("10000000000");

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(AddressZero, token2.address, val21, tolerance)
      ).to.be.revertedWith("ACOAssetConverterHelper:: No aggregator");

      await converterHelper.setAggregator(AddressZero, token2.address, aggregatorWethToken2.address);

      let pt21 = await converterHelper.getExpectedAmountOutToSwapExactAmountInWithSpecificTolerance(AddressZero, token2.address, val21, tolerance);
      let bal21 = await addr2.getBalance();
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(AddressZero, token2.address, val21, tolerance, {value: pt21});
      await expect(await addr2.getBalance()).to.be.above(bal21.sub(pt21));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(val21));

      let val22 = ethers.BigNumber.from("1000000000000000000");
      let pt22 = await converterHelper.getExpectedAmountOutToSwapExactAmountInWithSpecificTolerance(token2.address, AddressZero, val22, tolerance);
      bal21 = await addr2.getBalance();
      bal22 = await token2.balanceOf(await addr2.getAddress());
      await token2.connect(addr2).approve(converterHelper.address, pt22);
      await converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token2.address, AddressZero, val22, tolerance);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal22.sub(pt22));
      await expect(await addr2.getBalance()).to.be.above(bal21);

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(AddressZero, token2.address, val21, 0, {value: pt21})
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      let val23 = ethers.BigNumber.from("100000000000000000000");
      let pt23 = await converterHelper.getExpectedAmountOutToSwapExactAmountInWithSpecificTolerance(token2.address, AddressZero, val23, tolerance);
      
      await token2.connect(addr2).approve(converterHelper.address, pt23);
      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithSpecificTolerance(token2.address, AddressZero, val23, 0)
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    });
  });

  describe("Swap without aggregator functions", function () {
    it("Swap exact amount out with minimum amount to receive", async function () {
      await token1.connect(addr2).approve(converterHelper.address, token1TotalSupply);
      await token2.connect(addr2).approve(converterHelper.address, token2TotalSupply);
      await token3.connect(addr2).approve(converterHelper.address, token3TotalSupply);

      let s1 = ethers.BigNumber.from("100000000");
      let r1 = ethers.BigNumber.from("9900000000");
      let bal11 = await token1.balanceOf(await addr2.getAddress());
      let bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token1.address, token2.address, s1, r1);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal11.sub(s1));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal12.add(r1));

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token1.address, token2.address, s1, ethers.BigNumber.from("10000000000"))
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      let s2 = ethers.BigNumber.from("1000000000000000000");
      let r2 = ethers.BigNumber.from("396000000");
      let bal21 = await addr2.getBalance();
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(AddressZero, token2.address, s2, r2, {value: s2});
      await expect(await addr2.getBalance()).to.be.below(bal21.sub(s2));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal22.add(r2));

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(AddressZero, token2.address, s2, ethers.BigNumber.from("400000000"), {value: s2})
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      await converterHelper.setUniswapMiddleRoute(token2.address, token3.address, [weth.address]);

      let s3 = ethers.BigNumber.from("80000000");
      let r3 = ethers.BigNumber.from("990000000000000000");
      let bal32 = await token2.balanceOf(await addr2.getAddress());
      let bal33 = await token3.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token2.address, token3.address, s3, r3);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal32.sub(s3));
      await expect(await token3.balanceOf(await addr2.getAddress())).to.be.above(bal33.add(r3));

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token2.address, token3.address, s3, ethers.BigNumber.from("1000000000000000000"))
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      let s4 = ethers.BigNumber.from("1000000000000000000");
      let r4 = ethers.BigNumber.from("79000000");
      let bal43 = await token3.balanceOf(await addr2.getAddress());
      let bal42 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token3.address, token2.address, s4, r4);
      await expect(await token3.balanceOf(await addr2.getAddress())).to.equal(bal43.sub(s4));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal42.add(r4));

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token3.address, token2.address, s4, ethers.BigNumber.from("80000000"))
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      await converterHelper.setUniswapMiddleRoute(token1.address, token3.address, [token2.address, weth.address]);
        
      let s5 = ethers.BigNumber.from("100000000");
      let r5 = ethers.BigNumber.from("120000000000000000000");
      let bal51 = await token1.balanceOf(await addr2.getAddress());
      let bal53 = await token3.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token1.address, token3.address, s5, r5);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal51.sub(s5));
      await expect(await token3.balanceOf(await addr2.getAddress())).to.be.above(bal53.add(r5));

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token1.address, token3.address, s5, ethers.BigNumber.from("125000000000000000000"))
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

      let s6 = ethers.BigNumber.from("1000000000000000000");
      let r6 = ethers.BigNumber.from("800000");
      let bal63 = await token3.balanceOf(await addr2.getAddress());
      let bal61 = await token1.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token3.address, token1.address, s6, r6);
      await expect(await token3.balanceOf(await addr2.getAddress())).to.equal(bal63.sub(s6));
      await expect(await token1.balanceOf(await addr2.getAddress())).to.be.above(bal61.add(r6));

      await expect(
        converterHelper.connect(addr2).swapExactAmountOutWithMinAmountToReceive(token3.address, token1.address, s6, ethers.BigNumber.from("810000"))
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    });
    it("Swap exact amount in with maximum amount to pay", async function () {
      await token1.connect(addr2).approve(converterHelper.address, token1TotalSupply);
      await token2.connect(addr2).approve(converterHelper.address, token2TotalSupply);
      await token3.connect(addr2).approve(converterHelper.address, token3TotalSupply);

      let s1 = ethers.BigNumber.from("10000000000");
      let r1 = ethers.BigNumber.from("101000000");
      let bal11 = await token1.balanceOf(await addr2.getAddress());
      let bal12 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token1.address, token2.address, s1, r1);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.be.above(bal11.sub(r1));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal12.add(s1));

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token1.address, token2.address, s1, ethers.BigNumber.from("100000000"))
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      let s2 = ethers.BigNumber.from("400000000");
      let r2 = ethers.BigNumber.from("1010000000000000000");
      let bal21 = await addr2.getBalance();
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(AddressZero, token2.address, s2, r2, {value: r2});
      await expect(await addr2.getBalance()).to.be.above(bal21.sub(r2));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(s2));

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(AddressZero, token2.address, s2, ethers.BigNumber.from("1000000000000000000"), {value: ethers.BigNumber.from("1000000000000000000")})
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      await converterHelper.setUniswapMiddleRoute(token2.address, token3.address, [weth.address]);

      let s3 = ethers.BigNumber.from("1000000000000000000");
      let r3 = ethers.BigNumber.from("81000000");
      let bal32 = await token2.balanceOf(await addr2.getAddress());
      let bal33 = await token3.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token2.address, token3.address, s3, r3);
      await expect(await token2.balanceOf(await addr2.getAddress())).to.be.above(bal32.sub(r3));
      await expect(await token3.balanceOf(await addr2.getAddress())).to.equal(bal33.add(s3));

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token2.address, token3.address, s3, ethers.BigNumber.from("80000000"))
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      let s4 = ethers.BigNumber.from("80000000");
      let r4 = ethers.BigNumber.from("1010000000000000000");
      let bal43 = await token3.balanceOf(await addr2.getAddress());
      let bal42 = await token2.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token3.address, token2.address, s4, r4);
      await expect(await token3.balanceOf(await addr2.getAddress())).to.be.above(bal43.sub(r4));
      await expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal42.add(s4));

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token3.address, token2.address, s4, ethers.BigNumber.from("1000000000000000000"))
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      await converterHelper.setUniswapMiddleRoute(token1.address, token3.address, [token2.address, weth.address]);
        
      let s5 = ethers.BigNumber.from("1000000000000000000");
      let r5 = ethers.BigNumber.from("820000");
      let bal51 = await token1.balanceOf(await addr2.getAddress());
      let bal53 = await token3.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token1.address, token3.address, s5, r5);
      await expect(await token1.balanceOf(await addr2.getAddress())).to.be.above(bal51.sub(r5));
      await expect(await token3.balanceOf(await addr2.getAddress())).to.equal(bal53.add(s5));

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token1.address, token3.address, s5, ethers.BigNumber.from("800000"))
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");

      let s6 = ethers.BigNumber.from("100000000");
      let r6 = ethers.BigNumber.from("129000000000000000000");
      let bal63 = await token3.balanceOf(await addr2.getAddress());
      let bal61 = await token1.balanceOf(await addr2.getAddress());
      await converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token3.address, token1.address, s6, r6);
      await expect(await token3.balanceOf(await addr2.getAddress())).to.be.above(bal63.sub(r6));
      await expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal61.add(s6));

      await expect(
        converterHelper.connect(addr2).swapExactAmountInWithMaxAmountToSold(token3.address, token1.address, s6, ethers.BigNumber.from("125000000000000000000"))
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    });
  });
});