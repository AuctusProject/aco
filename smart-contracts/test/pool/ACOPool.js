const { expect } = require("chai");
const poolABI = require("../../artifacts/ACOPool.json");
const factoryABI = require("../../artifacts/ACOFactory.json");
const { createAcoStrategy1 } = require("./ACOStrategy1");
const { AddressZero } = require("ethers/constants");

describe("ACOPool", function() {
    let buidlerFactory;
    let buidlerACOFactoryProxy;
    let buidlerACOPoolFactoryProxy;
    let buidlerACOPoolFactory;
    let poolFactoryInterface;
    let ACOPool;
    let ACOPoolFactory;
    let token1;
    let token1Name = "TOKEN1";
    let token1Symbol = "TOK1";
    let token1Decimals = 4;
    let token1TotalSupply = 20000000;
    let token2;
    let token2Name = "TOKEN2";
    let token2Symbol = "TOK2";
    let token2Decimals = 8;
    let token2TotalSupply = 100000000000;
    let ACOTokenAddress;
    let ACOEthTokenAddress;
    let defaultAggregator;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
        let ACOFactory = await (await ethers.getContractFactory("ACOFactoryV2")).deploy();
        await ACOFactory.deployed();
        
        let factoryInterface = new ethers.utils.Interface(factoryABI.abi);
    
        let ACOToken = await (await ethers.getContractFactory("ACOToken")).deploy();
        await ACOToken.deployed();
    
        let ownerAddr = await owner.getAddress();
        let addr2Addr = await addr2.getAddress();
        let fee = 100
        let factoryInitData = factoryInterface.functions.init.encode([ownerAddr, ACOToken.address, fee, addr2Addr]);
        buidlerACOFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOFactory.address, factoryInitData);
        await buidlerACOFactoryProxy.deployed();
    
        buidlerFactory = await ethers.getContractAt("ACOFactoryV2", buidlerACOFactoryProxy.address);

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
        
        token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
        await token1.deployed();
    
        token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
        await token2.deployed();
    
        defaultStrategy = await createAcoStrategy1();
        
        defaultAggregator = await (await ethers.getContractFactory("AggregatorForTest")).deploy(token2Decimals, 200000000);
        await defaultAggregator.deployed();
        
        ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
        await ACOPool.deployed();

        const maxExercisedAccounts = 120;
        let time = Math.round(new Date().getTime() / 1000) + (3*86400);
        let price = 3 * 10 ** token2Decimals;
        let tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, true, price, time, maxExercisedAccounts)).wait();
        let result1 = tx.events[tx.events.length - 1].args;
        ACOTokenAddress = result1.acoToken;

        let tx2 = await (await buidlerFactory.createAcoToken(AddressZero, token2.address, true, price, time, maxExercisedAccounts)).wait();
        let result2 = tx2.events[tx2.events.length - 1].args;
        ACOEthTokenAddress = result2.acoToken;
    });

    describe("ACOPool transactions", function () {
        it("Check init ACO pool", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = Math.round(new Date().getTime() / 1000);
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: buidlerACOFactoryProxy.address,
                chiToken: chiToken.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.utils.bigNumberify("10000000000000000000000"),
                minExpiration: now + 86400,
                maxExpiration: now + (30*86400),
                isCall: true,
                canBuy: false,
                strategy: defaultStrategy.address,
                baseVolatility: 100000
            };
            await ACOPool.init(initData);
      
            expect(await ACOPool.underlying()).to.equal(token1.address);    
            expect(await ACOPool.strikeAsset()).to.equal(token2.address);    
            expect(await ACOPool.isCall()).to.equal(true); 
            expect(await ACOPool.poolStart()).to.equal(now + 86400);
            expect(await ACOPool.acoFlashExercise()).to.equal(flashExercise.address);
            expect(await ACOPool.acoFactory()).to.equal(buidlerACOFactoryProxy.address);
            expect(await ACOPool.minStrikePrice()).to.equal(1);
            expect(await ACOPool.maxStrikePrice()).to.equal(ethers.utils.bigNumberify("10000000000000000000000"));
            expect(await ACOPool.minExpiration()).to.equal(now + 86400);
            expect(await ACOPool.maxExpiration()).to.equal(now + (30*86400));
            expect(await ACOPool.canBuy()).to.equal(false);
            expect(await ACOPool.strategy()).to.equal(defaultStrategy.address);
            expect(await ACOPool.baseVolatility()).to.equal(100000);
          });
        it("Check fail to init ACO pool", async function () {
            let now = Math.round(new Date().getTime() / 1000);
            let addr2Addr = await addr2.getAddress();
            var baseInitData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: buidlerACOFactoryProxy.address,
                chiToken: chiToken.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.utils.bigNumberify("10000000000000000000000"),
                minExpiration: now + 86400,
                maxExpiration: now + (30*86400),
                isCall: true,
                canBuy: false,
                strategy: defaultStrategy.address,
                baseVolatility: 100000
            };
      
            var cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.poolStart = now - 86400;
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid pool start");
      
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.minExpiration = now - 86400;
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid expiration");
      
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.minStrikePrice = 2;
            cloneInitData.maxStrikePrice = 1;
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid strike price range");
      
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.minStrikePrice = 0;
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid strike price");
      
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.maxExpiration = now + (400);
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid expiration range");
      
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.strikeAsset = token1.address;
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Same assets");
      
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.underlying = await addr1.getAddress();
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid underlying");
      
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.strikeAsset = await addr1.getAddress();
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid strike asset");
            
            cloneInitData = JSON.parse(JSON.stringify(baseInitData));
            cloneInitData.baseVolatility = 0;
            await expect(ACOPool.init(cloneInitData)).to.be.revertedWith("ACOPool:: Invalid base volatility");
          });    
        it("Check ACO pool views", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = Math.round(new Date().getTime() / 1000);
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: buidlerACOFactoryProxy.address,
                chiToken: chiToken.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.utils.bigNumberify("10000000000000000000000"),
                minExpiration: now + 86400,
                maxExpiration: now + (30*86400),
                isCall: true,
                canBuy: false,
                strategy: defaultStrategy.address,
                baseVolatility: 100000
            };
            await ACOPool.init(initData);
      
            expect(await ACOPool.decimals()).to.equal(18);
            expect(await ACOPool.collateral()).to.equal(token1.address);
            expect(await ACOPool.isStarted()).to.equal(false);            
            expect(await ACOPool.notFinished()).to.equal(true);
            await network.provider.send("evm_increaseTime", [2*86400]);
            await network.provider.send("evm_mine");
            expect(await ACOPool.isStarted()).to.equal(true); 
            expect(await ACOPool.notFinished()).to.equal(true);
            await network.provider.send("evm_increaseTime", [30*86400]);
            await network.provider.send("evm_mine");
            expect(await ACOPool.isStarted()).to.equal(true); 
            expect(await ACOPool.notFinished()).to.equal(false);
            await network.provider.send("evm_increaseTime", [-32*86400]);
        });
        it("Check ACO pool quote", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = Math.round(new Date().getTime() / 1000);
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: buidlerFactory.address,
                chiToken: chiToken.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.utils.bigNumberify("600000000"),
                minExpiration: now + 86400,
                maxExpiration: now + (5*86400),
                isCall: true,
                canBuy: false,
                strategy: defaultStrategy.address,
                baseVolatility: 100000
            };
            await ACOPool.init(initData);            
            let ownerAddr = await owner.getAddress();

            await token1.connect(owner).approve(ACOPool.address, token1TotalSupply);            
            await ACOPool.deposit(token1TotalSupply, ownerAddr);

            await network.provider.send("evm_increaseTime", [86400]);
            await network.provider.send("evm_mine");
            await defaultStrategy.setAgreggator(token1.address, token2.address, defaultAggregator.address);
            console.log(await ACOPool.quote(true, ACOTokenAddress, 1));

            await network.provider.send("evm_increaseTime", [-86400]);
        });
        it("Check ERC20 deposit", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = Math.round(new Date().getTime() / 1000);
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: buidlerFactory.address,
                chiToken: chiToken.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.utils.bigNumberify("600000000"),
                minExpiration: now + 86400,
                maxExpiration: now + (5*86400),
                isCall: true,
                canBuy: false,
                strategy: defaultStrategy.address,
                baseVolatility: 100000
            };
            await ACOPool.init(initData);            
            let ownerAddr = await owner.getAddress();
            let depositAmount = 1000;

            await token1.connect(owner).transfer(addr2Addr, depositAmount);
            
            await token1.connect(owner).approve(ACOPool.address, token1TotalSupply);            
            
            await ACOPool.deposit(depositAmount, ownerAddr);

            expect(await ACOPool.collateralDeposited()).to.equal(depositAmount);

            await token1.connect(addr2).approve(ACOPool.address, token1TotalSupply);            
            await ACOPool.connect(addr2).deposit(depositAmount, addr2Addr);
            
            expect(await ACOPool.collateralDeposited()).to.equal(depositAmount*2);
        });
        it("Check ether deposit", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = Math.round(new Date().getTime() / 1000);
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: buidlerFactory.address,
                chiToken: chiToken.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: AddressZero,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.utils.bigNumberify("600000000"),
                minExpiration: now + 86400,
                maxExpiration: now + (5*86400),
                isCall: true,
                canBuy: false,
                strategy: defaultStrategy.address,
                baseVolatility: 100000
            };
            await ACOPool.init(initData);            
            let ownerAddr = await owner.getAddress();

            let depositAmount = ethers.utils.bigNumberify("1000000000000000000");
            await ACOPool.deposit(depositAmount, ownerAddr, {value: depositAmount});
            
            expect(await ACOPool.collateralDeposited()).to.equal(depositAmount);

            await ACOPool.connect(addr2).deposit(depositAmount, addr2Addr, {value: depositAmount});
            
            expect(await ACOPool.collateralDeposited()).to.equal(ethers.utils.bigNumberify("2000000000000000000"));
        });
        it("Check fail to deposit", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = Math.round(new Date().getTime() / 1000);
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: buidlerFactory.address,
                chiToken: chiToken.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.utils.bigNumberify("600000000"),
                minExpiration: now + 86400,
                maxExpiration: now + (5*86400),
                isCall: true,
                canBuy: false,
                strategy: defaultStrategy.address,
                baseVolatility: 100000
            };
            await ACOPool.init(initData);            
            let ownerAddr = await owner.getAddress();
            let depositAmount = 1000;
            
            await network.provider.send("evm_increaseTime", [86400]);
            
            await expect(
                ACOPool.deposit(depositAmount, ownerAddr)
            ).to.be.revertedWith("ACOPool:: Pool already started");

            await network.provider.send("evm_increaseTime", [-86400]);

            await expect(
                ACOPool.deposit(0, ownerAddr)
            ).to.be.revertedWith("ACOPool:: Invalid collateral amount");
            
            await expect(
                ACOPool.deposit(depositAmount, AddressZero)
            ).to.be.revertedWith("ACOPool:: Invalid to");

            await expect(
                ACOPool.deposit(depositAmount, ownerAddr, {value: 1})
            ).to.be.revertedWith("ACOHelper:: Ether is not expected");
            
            await expect(
                ACOPool.deposit(depositAmount, ownerAddr)
            ).to.be.revertedWith("ACOERC20Helper::_callTransferFromERC20");
        });
    });
});