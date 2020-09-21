const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/ACOPoolFactory.json");
const factoryABI = require("../../artifacts/ACOFactory.json");
const { createAcoStrategy1 } = require("./ACOStrategy1");

describe("ACOPoolFactory", function() {
  let buidlerACOFactoryProxy;
  let buidlerACOPoolFactoryProxy;
  let buidlerACOPoolFactory;
  let poolFactoryInterface;
  let ACOPool;
  let ACOPoolFactory;
  let flashExercise;
  let owner;
  let addr1;
  let addr2;
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 4;
  let token1TotalSupply = 9999990000;
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 8;
  let token2TotalSupply = 100000000000;
  let uniswapFactory;
  let weth;
  let uniswapRouter;
  let defaultStrategy;
  let chiToken;
  let fee = 100;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
    await ACOPool.deployed();

    let ACOFactory = await (await ethers.getContractFactory("ACOFactory")).deploy();
    await ACOFactory.deployed();
    
    factoryInterface = new ethers.utils.Interface(factoryABI.abi);

    ACOToken = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOToken.deployed();

    let ownerAddr = await owner.getAddress();
    let addr2Addr = await addr2.getAddress();
    let fee = 100
    let factoryInitData = factoryInterface.functions.init.encode([ownerAddr, ACOToken.address, fee, addr2Addr]);
    buidlerACOFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOFactory.address, factoryInitData);
    await buidlerACOFactoryProxy.deployed();

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
    
    ACOPoolFactory = await (await ethers.getContractFactory("ACOPoolFactory")).deploy();
    await ACOPoolFactory.deployed();

    poolFactoryInterface = new ethers.utils.Interface(poolFactoryABI.abi);

    let poolFactoryInitData = poolFactoryInterface.functions.init.encode([ownerAddr, ACOPool.address, buidlerACOFactoryProxy.address, flashExercise.address, chiToken.address, fee, ownerAddr]);
    buidlerACOPoolFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOPoolFactory.address, poolFactoryInitData);
    await buidlerACOPoolFactoryProxy.deployed();
    buidlerACOPoolFactory = await ethers.getContractAt("ACOPoolFactory", buidlerACOPoolFactoryProxy.address);

    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();

    defaultStrategy = await createAcoStrategy1();
    await buidlerACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);
  });
  
  describe("Proxy Deployment", function () {
    it("Should set the right proxy admin", async function () {
      expect(await buidlerACOPoolFactoryProxy.admin()).to.equal(await owner.getAddress());
    });
    it("Should set the right proxy implementation", async function () {
      expect(await buidlerACOPoolFactoryProxy.implementation()).to.equal(ACOPoolFactory.address);
    });
    it("Should set the right factory admin", async function () {
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());
    });
    it("Should set the right ACO Pool implementation", async function () {
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(ACOPool.address);
    });
    it("Should set the right ACO Factory", async function () {
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(buidlerACOFactoryProxy.address);
    });
    it("Should set the right ACO Flash Exercise", async function () {
      expect(await buidlerACOPoolFactory.acoFlashExercise()).to.equal(flashExercise.address);
    });
    it("Should set the right Chi Token", async function () {
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);
    });
    it("Should set the right ACO pool fee destination", async function () {
      expect(await buidlerACOPoolFactory.acoPoolFeeDestination()).to.equal(await owner.getAddress());
    });
    it("Should set the right ACO pool fee", async function () {
      expect(await buidlerACOPoolFactory.acoPoolFee()).to.equal(fee);
    });
  });

  describe("ACOPoolFactory transactions", function () {
    it("Check create ACO pool", async function () {
      let now = await getCurrentTimestamp();
      let tx = await (await buidlerACOPoolFactory.createAcoPool( token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)).wait();
      let result1 = tx.events[tx.events.length - 1].args;

      let buidlerPool = await ethers.getContractAt("ACOPool", result1.acoPool);
      expect(await buidlerPool.underlying()).to.equal(token1.address);    
      expect(await buidlerPool.strikeAsset()).to.equal(token2.address);    
      expect(await buidlerPool.isCall()).to.equal(true); 
      expect(await buidlerPool.poolStart()).to.equal(now + 86400);
      expect(await buidlerPool.acoFlashExercise()).to.equal(flashExercise.address);
      expect(await buidlerPool.acoFactory()).to.equal(buidlerACOFactoryProxy.address);
      expect(await buidlerPool.minStrikePrice()).to.equal(1);
      expect(await buidlerPool.maxStrikePrice()).to.equal(ethers.utils.bigNumberify("10000000000000000000000"));
      expect(await buidlerPool.minExpiration()).to.equal(now + 86400);
      expect(await buidlerPool.maxExpiration()).to.equal(now + (30*86400));
      expect(await buidlerPool.canBuy()).to.equal(false);
      expect(await buidlerPool.strategy()).to.equal(defaultStrategy.address);
      expect(await buidlerPool.baseVolatility()).to.equal(100000);
      expect(await buidlerPool.chiToken()).to.equal(chiToken.address);
      expect(await buidlerPool.fee()).to.equal(fee);
      expect(await buidlerPool.feeDestination()).to.equal(await owner.getAddress());
    });
    it("Check fail to create ACO pool", async function () {      
      let now = await getCurrentTimestamp();
      await expect(
        buidlerACOPoolFactory.connect(addr1).createAcoPool(token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");

      let newStrategy = await createAcoStrategy1();
      await expect(
        buidlerACOPoolFactory.connect(owner).createAcoPool(token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, newStrategy.address, 100000)
      ).to.be.revertedWith("ACOPoolFactory::_validateStrategy: Invalid strategy");
      
      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, now - 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Invalid pool start");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now - 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Invalid expiration");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, now + 86400, 2, 1, now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Invalid strike price range");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, now + 86400, 0, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Invalid strike price");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Invalid expiration range");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token1.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Same assets");

      await expect(
        buidlerACOPoolFactory.createAcoPool(await addr1.getAddress(), token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Invalid underlying");

      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, await addr1.getAddress(), true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)
      ).to.be.revertedWith("ACOPool:: Invalid strike asset");
      
      await expect(
        buidlerACOPoolFactory.createAcoPool(token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 0)
      ).to.be.revertedWith("ACOPool:: Invalid base volatility");
      
    });
    it("Check set pool factory admin", async function () {
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());
      await buidlerACOPoolFactory.setFactoryAdmin(await addr1.getAddress());
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await addr1.getAddress());
    });
    it("Check fail to set pool factory admin", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setFactoryAdmin(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setFactoryAdmin: Invalid factory admin");
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());

      await expect(
        buidlerACOPoolFactory.connect(addr1).setFactoryAdmin(await addr1.getAddress())
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.factoryAdmin()).to.equal(await owner.getAddress());
    });
    it("Check set ACO pool implementation", async function () {
      let newACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
      await newACOPool.deployed();

      await buidlerACOPoolFactory.setAcoPoolImplementation(newACOPool.address);
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(newACOPool.address);
    });
    it("Check fail to set ACO pool implementation", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setAcoPoolImplementation(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolImplementation: Invalid ACO pool implementation");
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(ACOPool.address);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolImplementation(ACOToken.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoPoolImplementation()).to.equal(ACOPool.address);
    });
    it("Check set ACO factory", async function () {
      let newACOFactory = await (await ethers.getContractFactory("ACOFactory")).deploy();
      await newACOFactory.deployed();

      await buidlerACOPoolFactory.setAcoFactory(newACOFactory.address);
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(newACOFactory.address);
    });
    it("Check fail to set ACO factory", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setAcoFactory(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setAcoFactory: Invalid ACO factory");
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(buidlerACOFactoryProxy.address);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoFactory(buidlerACOFactoryProxy.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoFactory()).to.equal(buidlerACOFactoryProxy.address);
    });
    it("Check set ACO flash exercise", async function () {
      expect(await buidlerACOPoolFactory.acoFlashExercise()).to.equal(flashExercise.address);

      newFlashExercise = await (await ethers.getContractFactory("ACOFlashExercise")).deploy(uniswapRouter.address);
      await newFlashExercise.deployed();
      
      await buidlerACOPoolFactory.setAcoFlashExercise(newFlashExercise.address);
      expect(await buidlerACOPoolFactory.acoFlashExercise()).to.equal(newFlashExercise.address);
    });
    it("Check fail to set ACO flash exercise", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setAcoFlashExercise(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setAcoFlashExercise: Invalid ACO flash exercise");
      expect(await buidlerACOPoolFactory.acoFlashExercise()).to.equal(flashExercise.address);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoFlashExercise(flashExercise.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.acoFlashExercise()).to.equal(flashExercise.address);
    });
    it("Check set CHI Token", async function () {
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);
      
      newChiToken = await (await ethers.getContractFactory("ChiToken")).deploy();
      await newChiToken.deployed();
      
      await buidlerACOPoolFactory.setChiToken(newChiToken.address);
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(newChiToken.address);
    });
    it("Check fail to set CHI Token", async function () {
      await expect(
        buidlerACOPoolFactory.connect(owner).setChiToken(ethers.constants.AddressZero)
      ).to.be.revertedWith("ACOPoolFactory::_setChiToken: Invalid Chi Token");
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);

      newChiToken = await (await ethers.getContractFactory("ChiToken")).deploy();
      await newChiToken.deployed();

      await expect(
        buidlerACOPoolFactory.connect(addr1).setChiToken(newChiToken.address)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.chiToken()).to.equal(chiToken.address);
    });
    it("Check set ACO pool permission", async function () {
      let ownerAddress = await owner.getAddress()
      let addr1Address = await addr1.getAddress()
      expect(await buidlerACOPoolFactory.poolAdminPermission(ownerAddress)).to.equal(true);
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);

      await buidlerACOPoolFactory.setAcoPoolPermission(addr1Address, true);
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(true);
      await buidlerACOPoolFactory.setAcoPoolPermission(addr1Address, false);
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);
    });
    it("Check fail to set ACO pool permission", async function () {
      let addr1Address = await addr1.getAddress()
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolPermission(addr1Address, true)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);
    });
    it("Check set ACO pool strategy permission", async function () {
      let newStrategy = await createAcoStrategy1();
      
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(false);
      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, true);
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(true);
      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, false);
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(false);
    });
    it("Check fail to set ACO pool strategy permission", async function () {
      let addr1Address = await addr1.getAddress()
      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolPermission(addr1Address, true)
      ).to.be.revertedWith("ACOPoolFactory::onlyFactoryAdmin");
      expect(await buidlerACOPoolFactory.poolAdminPermission(addr1Address)).to.equal(false);
    });
    it("Check set ACO pool strategy", async function () {
      let now = await getCurrentTimestamp();
      let tx = await (await buidlerACOPoolFactory.createAcoPool( token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      
      let newStrategy = await createAcoStrategy1();      
      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, true);
      expect(await buidlerACOPoolFactory.strategyPermitted(newStrategy.address)).to.equal(true);

      await buidlerACOPoolFactory.setAcoPoolStrategy(newStrategy.address, [result.acoPool]);
    });
    it("Check fail to set ACO pool strategy", async function () {
      let newStrategy = await createAcoStrategy1();    
      await expect(
        buidlerACOPoolFactory.connect(owner).setAcoPoolStrategy(newStrategy.address, [])
      ).to.be.revertedWith("ACOPoolFactory::_validateStrategy: Invalid strategy");

      await buidlerACOPoolFactory.setAcoPoolStrategyPermission(newStrategy.address, true);

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolStrategy(newStrategy.address, [])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin");
    });
    it("Check set ACO pool base volatility", async function () {
      let now = await getCurrentTimestamp();
     
      let tx = await (await buidlerACOPoolFactory.createAcoPool( token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool", result.acoPool);
      
      expect(await buidlerPool.baseVolatility()).to.equal(100000);

      await buidlerACOPoolFactory.setAcoPoolBaseVolatility([200000], [result.acoPool]);
      
      expect(await buidlerPool.baseVolatility()).to.equal(200000);
    });
    it("Check fail to set ACO pool base volatility", async function () {
      await expect(
        buidlerACOPoolFactory.setAcoPoolBaseVolatility([100000], [])
      ).to.be.revertedWith("ACOPoolFactory::_setAcoPoolBaseVolatility: Invalid arguments");

      let now = await getCurrentTimestamp();
      let tx = await (await buidlerACOPoolFactory.createAcoPool( token1.address, token2.address, true, now + 86400, 1, ethers.utils.bigNumberify("10000000000000000000000"), now + 86400, now + (30*86400), false, defaultStrategy.address, 100000)).wait();
      let result = tx.events[tx.events.length - 1].args;
      let buidlerPool = await ethers.getContractAt("ACOPool", result.acoPool);
      expect(await buidlerPool.baseVolatility()).to.equal(100000);

      await expect(
        buidlerACOPoolFactory.setAcoPoolBaseVolatility([0], [result.acoPool])
      ).to.be.revertedWith("ACOPool:: Invalid base volatility")

      await expect(
        buidlerACOPoolFactory.connect(addr1).setAcoPoolBaseVolatility([0], [result.acoPool])
      ).to.be.revertedWith("ACOPoolFactory::onlyPoolAdmin")

      expect(await buidlerPool.baseVolatility()).to.equal(100000);
    });

  });
});

const getCurrentTimestamp = async () => {
  let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
  return parseInt(block.timestamp, 16);
};

