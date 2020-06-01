const { expect } = require("chai");
const factoryABI = require("../artifacts/ACOFactory.json");

describe("ACOFlashExercise", function() {
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let fee = ethers.utils.bigNumberify("100");
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 8;
  let token1TotalSupply = ethers.utils.bigNumberify("10000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 18;
  let token2TotalSupply = ethers.utils.bigNumberify("100000000000000000000000000");
  let buidlerEthT1003C;
  let buidlerEthT1003P;
  let price1;
  let buidlerT1T210000P;
  let price2;
  let time;
  let uniswapRouter;
  let uniswapFactory;
  let weth;
  let pairToken1Token2;
  let pairToken1weth;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    
    let ACOFactory = await (await ethers.getContractFactory("ACOFactory")).deploy();
    await ACOFactory.deployed();
    
    let factoryInterface = new ethers.utils.Interface(factoryABI.abi);

    let ACOToken = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOToken.deployed();

    let ownerAddr = await owner.getAddress();
    let addr2Addr = await addr2.getAddress();
    let initData = factoryInterface.functions.init.encode([ownerAddr, ACOToken.address, fee, addr2Addr]);
    let buidlerProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOFactory.address, initData);
    await buidlerProxy.deployed();

    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();

    let buidlerFactory = await ethers.getContractAt("ACOFactory", buidlerProxy.address);

    time = Math.round(new Date().getTime() / 1000) + 86400;
    price1 = ethers.utils.bigNumberify("3000000");
    let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, true, price1, time)).wait();
    buidlerEthT1003C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken);  

    tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time)).wait();
    buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

    price2 = ethers.utils.bigNumberify("10000000000000000000000");
    tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, false, price2, time)).wait();
    buidlerT1T210000P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken);  

    uniswapFactory = await (await ethers.getContractFactory("UniswapV2Factory")).deploy(await owner.getAddress());
    await uniswapFactory.deployed();

    weth = await (await ethers.getContractFactory("WETH9")).deploy();
    await weth.deployed(); 

    uniswapRouter = await (await ethers.getContractFactory("UniswapV2Router01")).deploy(uniswapFactory.address, weth.address);
    await uniswapRouter.deployed();

    await uniswapFactory.createPair(token1.address, token2.address);
    await uniswapFactory.createPair(token1.address, weth.address);

    pairToken1Token2 = await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token1.address, token2.address));
    pairToken1weth =  await ethers.getContractAt("UniswapV2Pair", await uniswapFactory.getPair(token1.address, weth.address));

    await token1.connect(owner).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr1).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr2).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(addr3).approve(pairToken1Token2.address, token1TotalSupply);
    await token1.connect(owner).approve(pairToken1weth.address, token1TotalSupply);
    await token1.connect(addr1).approve(pairToken1weth.address, token1TotalSupply);
    await token1.connect(addr2).approve(pairToken1weth.address, token1TotalSupply);
    await token1.connect(addr3).approve(pairToken1weth.address, token1TotalSupply);
    await token2.connect(owner).approve(pairToken1Token2.address, token2TotalSupply);
    await token2.connect(addr1).approve(pairToken1Token2.address, token2TotalSupply);
    await token2.connect(addr2).approve(pairToken1Token2.address, token2TotalSupply);
    await token2.connect(addr3).approve(pairToken1Token2.address, token2TotalSupply);
    await token1.connect(owner).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr1).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr2).approve(uniswapRouter.address, token1TotalSupply);
    await token1.connect(addr3).approve(uniswapRouter.address, token1TotalSupply);
    await token2.connect(owner).approve(uniswapRouter.address, token2TotalSupply);
    await token2.connect(addr1).approve(uniswapRouter.address, token2TotalSupply);
    await token2.connect(addr2).approve(uniswapRouter.address, token2TotalSupply);
    await token2.connect(addr3).approve(uniswapRouter.address, token2TotalSupply);

    await token1.connect(owner).transfer(pairToken1Token2.address, ethers.utils.bigNumberify("10000000000"));
    await token2.connect(owner).transfer(pairToken1Token2.address, ethers.utils.bigNumberify("1000000000000000000000000"));
    await pairToken1Token2.connect(owner).mint(await owner.getAddress());
  
    await token1.connect(owner).transfer(pairToken1weth.address, ethers.utils.bigNumberify("10000000000"));
    let ethAmount = ethers.utils.bigNumberify("4000000000000000000000");
    await weth.connect(owner).deposit({value: ethAmount});
    await weth.connect(owner).transfer(pairToken1weth.address, ethAmount);
    await pairToken1weth.connect(owner).mint(await owner.getAddress());
});

  describe("Flash exercise transactions", function () {
    it("Check flash exercise", async function () {
     
    });
    it("Check fail to flash exercise", async function () {
      
    });
  });
});