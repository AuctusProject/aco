const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/ACOPoolFactory.json");
const factoryABI = require("../../artifacts/ACOFactory.json");
const { createAcoStrategy1 } = require("./ACOStrategy1");
const { AddressZero } = require("ethers/constants");

let started = false;

describe("ACOPool", function() {
    let ACOFactory;
    let ACOPoolFactory;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let fee = ethers.utils.bigNumberify("100");
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

    let token1Token2Price = ethers.utils.bigNumberify("10000000000");
    let ethToken2Price = ethers.utils.bigNumberify("400000000");
    let expiration;
    let start;
    let acoEthToken2CallPrice = ethers.utils.bigNumberify("500000000");
    let acoEthToken2PutPrice = ethers.utils.bigNumberify("300000000");
    let acoToken1Token2CallPrice = ethers.utils.bigNumberify("12000000000");
    let acoToken1Token2PutPrice = ethers.utils.bigNumberify("9000000000");
    let ethToken2BaseVolatility = 85000;
    let token1Token2BaseVolatility = 70000;
    let ACOEthToken2Call;
    let ACOEthToken2Put;
    let ACOToken1Token2Call;
    let ACOToken1Token2Put;
    let ACOPoolEthToken2Call;
    let ACOPoolEthToken2Put;
    let ACOPoolToken1Token2Call;
    let ACOPoolToken1Token2Put;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        
        if (!started) {
            let baseTx = {to: await owner.getAddress(), value: ethers.utils.bigNumberify("5000000000000000000000")};
            await addr1.sendTransaction(baseTx);
            await addr2.sendTransaction(baseTx);
            await addr3.sendTransaction(baseTx);
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
    
        defaultStrategy = await createAcoStrategy1();
        await defaultStrategy.setAgreggator(token1.address, token2.address, aggregatorToken1Token2.address);
        await defaultStrategy.setAgreggator(AddressZero, token2.address, aggregatorWethToken2.address);

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

        let current = await getCurrentTimestamp();
        expiration = current + 3 * 86400;

        let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice, expiration, maxExercisedAccounts)).wait();
        let result0 = tx.events[tx.events.length - 1].args;
        ACOToken1Token2Call = await ethers.getContractAt("ACOToken", result0.acoToken);

        let tx1 = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice, expiration, maxExercisedAccounts)).wait();
        let result1 = tx1.events[tx1.events.length - 1].args;
        ACOToken1Token2Put = await ethers.getContractAt("ACOToken", result1.acoToken);

        let tx2 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, true, acoEthToken2CallPrice, expiration, maxExercisedAccounts)).wait();
        let result2 = tx2.events[tx2.events.length - 1].args;
        ACOEthToken2Call = await ethers.getContractAt("ACOToken", result2.acoToken);

        let tx3 = await (await ACOFactory.createAcoToken(AddressZero, token2.address, false, acoEthToken2PutPrice, expiration, maxExercisedAccounts)).wait();
        let result3 = tx3.events[tx3.events.length - 1].args;
        ACOEthToken2Put = await ethers.getContractAt("ACOToken", result3.acoToken);

        current = await getCurrentTimestamp();
        start = current + 140;

        let tx4 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, start, ethers.utils.bigNumberify("9000000000"), ethers.utils.bigNumberify("12000000000"), start, expiration, false, defaultStrategy.address, token1Token2BaseVolatility)).wait();
        let result4 = tx4.events[tx4.events.length - 1].args;
        ACOPoolToken1Token2Call = await ethers.getContractAt("ACOPool", result4.acoPool);

        let tx5 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, start, ethers.utils.bigNumberify("9000000000"), ethers.utils.bigNumberify("12000000000"), start, expiration, false, defaultStrategy.address, token1Token2BaseVolatility)).wait();
        let result5 = tx5.events[tx5.events.length - 1].args;
        ACOPoolToken1Token2Put = await ethers.getContractAt("ACOPool", result5.acoPool);
        
        let tx6 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, start, ethers.utils.bigNumberify("300000000"), ethers.utils.bigNumberify("500000000"), start, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
        let result6 = tx6.events[tx6.events.length - 1].args;
        ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool", result6.acoPool);

        let tx7 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, start, ethers.utils.bigNumberify("300000000"), ethers.utils.bigNumberify("500000000"), start, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
        let result7 = tx7.events[tx7.events.length - 1].args;
        ACOPoolEthToken2Put = await ethers.getContractAt("ACOPool", result7.acoPool);
    });

    afterEach(async function () {
        let balLP = await pairWethToken2.balanceOf(await owner.getAddress());
        let addr = await owner.getAddress();
        await pairWethToken2.connect(owner).transfer(pairWethToken2.address, balLP);
        await pairWethToken2.connect(owner).burn(addr);
        let balWETH = await weth.balanceOf(addr);
        await weth.connect(owner).withdraw(balWETH);
    });

    describe("ACOPool transactions", function () {
        it("Check init ACO pool", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = await getCurrentTimestamp();
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: ACOFactory.address,
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
            let ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
            await ACOPool.deployed();
            await ACOPool.init(initData);
      
            expect(await ACOPool.underlying()).to.equal(token1.address);    
            expect(await ACOPool.strikeAsset()).to.equal(token2.address);    
            expect(await ACOPool.isCall()).to.equal(true); 
            expect(await ACOPool.poolStart()).to.equal(now + 86400);
            expect(await ACOPool.acoFlashExercise()).to.equal(flashExercise.address);
            expect(await ACOPool.acoFactory()).to.equal(ACOFactory.address);
            expect(await ACOPool.minStrikePrice()).to.equal(1);
            expect(await ACOPool.maxStrikePrice()).to.equal(ethers.utils.bigNumberify("10000000000000000000000"));
            expect(await ACOPool.minExpiration()).to.equal(now + 86400);
            expect(await ACOPool.maxExpiration()).to.equal(now + (30*86400));
            expect(await ACOPool.canBuy()).to.equal(false);
            expect(await ACOPool.strategy()).to.equal(defaultStrategy.address);
            expect(await ACOPool.baseVolatility()).to.equal(100000);
            expect(await ACOPool.chiToken()).to.equal(chiToken.address);
            expect(await ACOPool.fee()).to.equal(fee);
            expect(await ACOPool.feeDestination()).to.equal(addr2Addr);
          });
        it("Check fail to init ACO pool", async function () {
            let now = await getCurrentTimestamp();
            let addr2Addr = await addr2.getAddress();
            var baseInitData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: ACOFactory.address,
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
            let ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
            await ACOPool.deployed();
      
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
            let now = await getCurrentTimestamp();
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: ACOFactory.address,
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
            let ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
            await ACOPool.deployed();
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
        it("Check ERC20 deposit", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = await getCurrentTimestamp();
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: ACOFactory.address,
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
            let ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
            await ACOPool.deployed();
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
            let now = await getCurrentTimestamp();
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: ACOFactory.address,
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
            let ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
            await ACOPool.deployed();
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
            let now = await getCurrentTimestamp();
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: ACOFactory.address,
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
            let ACOPool = await (await ethers.getContractFactory("ACOPool")).deploy();
            await ACOPool.deployed();
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
            ).to.be.revertedWith("ACOAssetHelper:: Ether is not expected");
            
            await expect(
                ACOPool.deposit(depositAmount, ownerAddr)
            ).to.be.revertedWith("ACOAssetHelper::_callTransferFromERC20");
        });
        it("Check deposit ACOPoolEthToken2Call", async function () {
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);

            let val1 = ethers.utils.bigNumberify("1000000000000000000");
            let val2 = ethers.utils.bigNumberify("5000000000000000000");
            await ACOPoolEthToken2Call.connect(addr1).deposit(val1, await addr1.getAddress(), {value: val1});
            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1);
            await await ACOPoolEthToken2Call.connect(addr2).deposit(val1, await addr2.getAddress(), {value: val1});
            expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.mul(2));
            await ACOPoolEthToken2Call.connect(addr3).deposit(val1, await addr3.getAddress(), {value: val1});
            expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.mul(3));
            await ACOPoolEthToken2Call.connect(addr1).deposit(val2, await addr1.getAddress(), {value: val2});
            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1.add(val2));
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val2.add(val1.mul(3)));
            await ACOPoolEthToken2Call.connect(addr1).deposit(val2, await owner.getAddress(), {value: val2});
            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1.add(val2));
            expect(await ACOPoolEthToken2Call.balanceOf(await owner.getAddress())).to.equal(val2);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val2.mul(2).add(val1.mul(3)));
        });
        it("Check deposit ACOPoolEthToken2Put", async function () {
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);

            await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

            let val1 = ethers.utils.bigNumberify("200000000");
            let val2 = ethers.utils.bigNumberify("600000000");
            let bal1 = ethers.utils.bigNumberify("200000000000000000000");
            let bal2 = ethers.utils.bigNumberify("600000000000000000000");
            await ACOPoolEthToken2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(bal1);
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(bal1);
            await await ACOPoolEthToken2Put.connect(addr2).deposit(val1, await addr2.getAddress());
            expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(bal1);
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(bal1.mul(2));
            await ACOPoolEthToken2Put.connect(addr1).deposit(val2, await addr1.getAddress());
            expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(bal1.add(bal2));
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(bal2.add(bal1.mul(2)));
            await ACOPoolEthToken2Put.connect(addr1).deposit(val1, await addr3.getAddress());
            expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(bal1.add(bal2));
            expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.equal(bal1);
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(bal2.add(bal1.mul(3)));
            await ACOPoolEthToken2Put.connect(addr3).deposit(val1, await addr3.getAddress());
            expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.equal(bal1.mul(2));
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(bal2.add(bal1.mul(4)));
        });
        it("Check deposit ACOPoolToken1Token2Call", async function () {
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);

            await token1.connect(addr1).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr3).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

            let val1 = ethers.utils.bigNumberify("800000000");
            let val2 = ethers.utils.bigNumberify("2000000000");
            let bal1 = ethers.utils.bigNumberify("8000000000000000000");
            let bal2 = ethers.utils.bigNumberify("20000000000000000000");
            await ACOPoolToken1Token2Call.connect(addr1).deposit(val1, await addr3.getAddress());
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.equal(bal1);
            await ACOPoolToken1Token2Call.connect(addr1).deposit(val1, await addr1.getAddress());
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(bal1);
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(bal1.mul(2));
            await await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(bal2);
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(bal1.mul(2).add(bal2));
            await ACOPoolToken1Token2Call.connect(addr1).deposit(val2, await addr1.getAddress());
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(bal1.add(bal2));
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(bal1.mul(2).add(bal2.mul(2)));
            await ACOPoolToken1Token2Call.connect(addr3).deposit(val1, await addr3.getAddress());
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.equal(bal1.mul(2));
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(bal1.mul(3).add(bal2.mul(2)));
        });
        it("Check deposit ACOPoolToken1Token2Put", async function () {
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);

            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            let val1 = ethers.utils.bigNumberify("10000");
            let val2 = ethers.utils.bigNumberify("8000");
            let bal1 = ethers.utils.bigNumberify("10000000000000000");
            let bal2 = ethers.utils.bigNumberify("8000000000000000");
            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr3.getAddress());
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(bal1);
            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(bal1);
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(bal1.mul(2));
            await await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(bal2);
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(bal1.mul(2).add(bal2));
            await ACOPoolToken1Token2Put.connect(addr1).deposit(val2, await addr1.getAddress());
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(bal1.add(bal2));
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(bal1.mul(2).add(bal2.mul(2)));
            await ACOPoolToken1Token2Put.connect(addr3).deposit(val1, await addr3.getAddress());
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(bal1.mul(2));
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(bal1.mul(3).add(bal2.mul(2)));
        });
        it("Check restore for ACOPoolEthToken2Call", async function () {
            let val1 = ethers.utils.bigNumberify("1000000000000000000");
            let val2 = ethers.utils.bigNumberify("2000000000000000000");
            let val3 = ethers.utils.bigNumberify("3000000000000000000");
            await ACOPoolEthToken2Call.connect(addr1).deposit(val1, await addr1.getAddress(), {value: val1});
            await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});
            await ACOPoolEthToken2Call.connect(addr3).deposit(val3, await addr3.getAddress(), {value: val3});

            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);

            await jumpUntilStart(start);

            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);

            let quote = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, val1);
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, val1, quote[0], await owner.getAddress(), start + 100);

            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(ethers.utils.bigNumberify(quote[0].sub(quote[1])));

            let balance = ethers.utils.bigNumberify(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]));

            let tx = await (await ACOPoolEthToken2Call.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);
            expect(quote[0].sub(quote[1])).to.equal(result.amountOut);
            expect(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"])).to.equal(balance.add(result.collateralIn));
        });
        it("Check restore for ACOPoolEthToken2Put", async function () {
            let val1 = ethers.utils.bigNumberify("1000000000");
            let val2 = ethers.utils.bigNumberify("2000000000");
            let val3 = ethers.utils.bigNumberify("3000000000");

            await token2.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

            await ACOPoolEthToken2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());
            await ACOPoolEthToken2Put.connect(addr3).deposit(val3, await addr3.getAddress());

            await jumpUntilStart(start);

            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3));

            let amount = ethers.utils.bigNumberify("2000000000000000000");
            let quote = await ACOPoolEthToken2Put.quote(true, ACOEthToken2Put.address, amount);
            await ACOPoolEthToken2Put.connect(owner).swap(true, ACOEthToken2Put.address, amount, quote[0], await owner.getAddress(), start + 100);
            
            let value = ethers.utils.bigNumberify(quote[0].sub(quote[1]));
            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3).sub(acoEthToken2PutPrice.mul(2)).add(value));

            let acoBalance = await ACOEthToken2Put.balanceOf(await owner.getAddress());
            expect(acoBalance).to.equal(amount);
            let exercise = await ACOEthToken2Put.getBaseExerciseData(amount);
            await ACOEthToken2Put.connect(owner).exercise(amount, 1, {value: ethers.utils.bigNumberify(exercise[1]).add(maxExercisedAccounts)});
            
            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3).sub(acoEthToken2PutPrice.mul(2)).add(value));
            expect(ethers.utils.bigNumberify(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(amount.add(1));

            await aggregatorWethToken2.updateAnswer(ethers.utils.bigNumberify("30000000000"));
            let tx = await (await ACOPoolEthToken2Put.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3).sub(acoEthToken2PutPrice.mul(2)).add(value).add(ethers.utils.bigNumberify(result.collateralIn)));
            expect(ethers.utils.bigNumberify(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);
        });
        it("Check restore for ACOPoolToken1Token2Call", async function () {
            let val1 = ethers.utils.bigNumberify("100000000");
            let val2 = ethers.utils.bigNumberify("200000000");
            let val3 = ethers.utils.bigNumberify("300000000");
            
            await token1.connect(owner).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr1).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr3).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

            await ACOPoolToken1Token2Call.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
            await ACOPoolToken1Token2Call.connect(addr3).deposit(val3, await addr3.getAddress());

            await token2.connect(owner).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);

            await jumpUntilStart(start);

            expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);

            let amount = ethers.utils.bigNumberify("50000000");
            let quote = await ACOPoolToken1Token2Call.quote(true, ACOToken1Token2Call.address, amount);
            await ACOPoolToken1Token2Call.connect(owner).swap(true, ACOToken1Token2Call.address, amount, quote[0], await owner.getAddress(), start + 100);

            expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(ethers.utils.bigNumberify(quote[0].sub(quote[1])));
            expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(val1.add(val2).add(val3).sub(amount));

            let tx = await (await ACOPoolToken1Token2Call.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
            expect(quote[0].sub(quote[1])).to.equal(result.amountOut);
            expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(val1.add(val2).add(val3).sub(amount).add(result.collateralIn));
        });
        it("Check restore for ACOPoolToken1Token2Put", async function () {
            let val1 = ethers.utils.bigNumberify("1000000000");
            let val2 = ethers.utils.bigNumberify("2000000000");
            let val3 = ethers.utils.bigNumberify("3000000000");

            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());
            await ACOPoolToken1Token2Put.connect(addr3).deposit(val3, await addr3.getAddress());

            await jumpUntilStart(start);

            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3));

            let amount = ethers.utils.bigNumberify("10000000");
            let quote = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put.address, amount);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put.address, amount, quote[0], await owner.getAddress(), start + 100);
            
            let value = ethers.utils.bigNumberify(quote[0].sub(quote[1]));
            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3).add(value).sub("900000000"));

            let acoBalance = await ACOToken1Token2Put.balanceOf(await owner.getAddress());
            expect(acoBalance).to.equal(amount);
            await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);
            await ACOToken1Token2Put.connect(owner).exercise(amount, start);
            
            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3).add(value).sub("900000000"));
            expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(amount.add(1));

            await aggregatorToken1Token2.updateAnswer(ethers.utils.bigNumberify("900000000000"));
            let tx = await (await ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3).add(value).sub("900000000").add(ethers.utils.bigNumberify(result.collateralIn)));
            expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
        });
        it("Check restore fail", async function () {
            let val1 = ethers.utils.bigNumberify("1000000000");
            let val2 = ethers.utils.bigNumberify("2000000000000000000");

            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});

            await jumpUntilStart(start);

            await expect(ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).to.be.revertedWith("ACOPool:: No balance");
            await expect(ACOPoolEthToken2Call.connect(addr2).restoreCollateral()).to.be.revertedWith("ACOPool:: No balance");
            
            let amount1 = ethers.utils.bigNumberify("10000000");
            let quote1 = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put.address, amount1);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put.address, amount1, quote1[0], await owner.getAddress(), start + 100);
            
            await expect(ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).to.be.revertedWith("ACOPool:: No balance");

            await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);
            await ACOToken1Token2Put.connect(owner).exercise(amount1, start);

            let amount2 = ethers.utils.bigNumberify("1000000000000000");
            let quote2 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, amount2);
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, amount2, quote2[0], await owner.getAddress(), start + 100);

            await expect(ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

            await aggregatorWethToken2.updateAnswer("30000000000");
            await expect(ACOPoolEthToken2Call.connect(addr2).restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
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
}