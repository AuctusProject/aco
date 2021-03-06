const { expect } = require("chai");
const poolFactoryABI = require("../../artifacts/contracts/periphery/pool/ACOPoolFactory.sol/ACOPoolFactory.json");
const factoryABI = require("../../artifacts/contracts/core/ACOFactory.sol/ACOFactory.json");
const { createAcoStrategy1 } = require("./ACOStrategy1.js");
const AddressZero = "0x0000000000000000000000000000000000000000";

let started = false;

describe("ACOPool", function() {
    let ACOFactory;
    let ACOPoolFactory;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let fee = ethers.BigNumber.from("100");
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

    let token1Token2Price = ethers.BigNumber.from("10000000000");
    let ethToken2Price = ethers.BigNumber.from("400000000");
    let expiration;
    let start;
    let acoEthToken2CallPrice = ethers.BigNumber.from("500000000");
    let acoEthToken2CallPrice2 = ethers.BigNumber.from("300000000");
    let acoEthToken2PutPrice = ethers.BigNumber.from("300000000");
    let acoEthToken2PutPrice2 = ethers.BigNumber.from("500000000");
    let acoToken1Token2CallPrice = ethers.BigNumber.from("12000000000");
    let acoToken1Token2CallPrice2 = ethers.BigNumber.from("9000000000");
    let acoToken1Token2PutPrice = ethers.BigNumber.from("9000000000");
    let acoToken1Token2PutPrice2 = ethers.BigNumber.from("12000000000");
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

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        
        if (!started) {
            let baseTx = {to: await owner.getAddress(), value: ethers.BigNumber.from("5000000000000000000000")};
            await addr1.sendTransaction(baseTx);
            await addr2.sendTransaction(baseTx);
            await addr3.sendTransaction(baseTx);
            started = true;
        }

        let ACOFactoryTemp = await (await ethers.getContractFactory("ACOFactoryV4")).deploy();
        await ACOFactoryTemp.deployed();

        let ACOTokenTemp = await (await ethers.getContractFactory("ACOToken")).deploy();
        await ACOTokenTemp.deployed();
    
        let factoryInterface = new ethers.utils.Interface(factoryABI.abi);
        let factoryInitData = factoryInterface.encodeFunctionData("init", [await owner.getAddress(), ACOTokenTemp.address, 0, await addr3.getAddress()]);
        let buidlerACOFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOFactoryTemp.address, factoryInitData);
        await buidlerACOFactoryProxy.deployed();
        ACOFactory = await ethers.getContractAt("ACOFactoryV4", buidlerACOFactoryProxy.address);
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
    
        defaultStrategy = await createAcoStrategy1();
        await defaultStrategy.setAgreggator(token1.address, token2.address, aggregatorToken1Token2.address);
        await defaultStrategy.setAgreggator(AddressZero, token2.address, aggregatorWethToken2.address);

        let ACOPoolTemp = await (await ethers.getContractFactory("ACOPool")).deploy();
        await ACOPoolTemp.deployed();

        let ACOPoolFactoryTemp = await (await ethers.getContractFactory("ACOPoolFactory")).deploy();
        await ACOPoolFactoryTemp.deployed();
        let ACOPoolFactoryTempV2 = await (await ethers.getContractFactory("ACOPoolFactoryV2")).deploy();
        await ACOPoolFactoryTempV2.deployed();
        
        let poolFactoryInterface = new ethers.utils.Interface(poolFactoryABI.abi);
        let poolFactoryInitData = poolFactoryInterface.encodeFunctionData("init", [await owner.getAddress(), ACOPoolTemp.address, buidlerACOFactoryProxy.address, flashExercise.address, chiToken.address, fee, await addr3.getAddress()]);
        let buidlerACOPoolFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOPoolFactoryTemp.address, poolFactoryInitData);
        await buidlerACOPoolFactoryProxy.deployed();
        ACOPoolFactory = await ethers.getContractAt("ACOPoolFactoryV2", buidlerACOPoolFactoryProxy.address);

        await ACOPoolFactory.setAcoPoolStrategyPermission(defaultStrategy.address, true);
        
        await buidlerACOPoolFactoryProxy.connect(owner).setImplementation(ACOPoolFactoryTempV2.address, []);
        converterHelper = await (await ethers.getContractFactory("ACOAssetConverterHelper")).deploy(uniswapRouter.address);
        await converterHelper.deployed();
        await ACOPoolFactory.setAcoAssetConverterHelper(converterHelper.address);

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

        current = await getCurrentTimestamp();
        start = current + 140;

        let tx8 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, true, start, ethers.BigNumber.from("9000000000"), ethers.BigNumber.from("12000000000"), start, expiration, false, defaultStrategy.address, token1Token2BaseVolatility)).wait();
        let result8 = tx8.events[tx8.events.length - 1].args;
        ACOPoolToken1Token2Call = await ethers.getContractAt("ACOPool", result8.acoPool);

        let tx9 = await (await ACOPoolFactory.createAcoPool(token1.address, token2.address, false, start, ethers.BigNumber.from("9000000000"), ethers.BigNumber.from("12000000000"), start, expiration, false, defaultStrategy.address, token1Token2BaseVolatility)).wait();
        let result9 = tx9.events[tx9.events.length - 1].args;
        ACOPoolToken1Token2Put = await ethers.getContractAt("ACOPool", result9.acoPool);
        
        let tx10 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, true, start, ethers.BigNumber.from("300000000"), ethers.BigNumber.from("500000000"), start, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
        let result10 = tx10.events[tx10.events.length - 1].args;
        ACOPoolEthToken2Call = await ethers.getContractAt("ACOPool", result10.acoPool);

        let tx11 = await (await ACOPoolFactory.createAcoPool(AddressZero, token2.address, false, start, ethers.BigNumber.from("300000000"), ethers.BigNumber.from("500000000"), start, expiration, false, defaultStrategy.address, ethToken2BaseVolatility)).wait();
        let result11 = tx11.events[tx11.events.length - 1].args;
        ACOPoolEthToken2Put = await ethers.getContractAt("ACOPool", result11.acoPool);
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
                assetConverterHelper: converterHelper.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.BigNumber.from("10000000000000000000000"),
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
            expect(await ACOPool.assetConverterHelper()).to.equal(converterHelper.address);
            expect(await ACOPool.minStrikePrice()).to.equal(1);
            expect(await ACOPool.maxStrikePrice()).to.equal(ethers.BigNumber.from("10000000000000000000000"));
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
                assetConverterHelper: converterHelper.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.BigNumber.from("10000000000000000000000"),
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
                assetConverterHelper: converterHelper.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.BigNumber.from("10000000000000000000000"),
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
                assetConverterHelper: converterHelper.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.BigNumber.from("600000000"),
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
                assetConverterHelper: converterHelper.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: AddressZero,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.BigNumber.from("600000000"),
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

            let depositAmount = ethers.BigNumber.from("1000000000000000000");
            await ACOPool.deposit(depositAmount, ownerAddr, {value: depositAmount});
            
            expect(await ACOPool.collateralDeposited()).to.equal(depositAmount);

            await ACOPool.connect(addr2).deposit(depositAmount, addr2Addr, {value: depositAmount});
            
            expect(await ACOPool.collateralDeposited()).to.equal(ethers.BigNumber.from("2000000000000000000"));
        });
        it("Check fail to deposit", async function () {            
            let addr2Addr = await addr2.getAddress();
            let now = await getCurrentTimestamp();
            var initData = {
                poolStart: now + 86400,
                acoFlashExercise: flashExercise.address,
                acoFactory: ACOFactory.address,
                chiToken: chiToken.address,
                assetConverterHelper: converterHelper.address,
                fee: 100,
                feeDestination: addr2Addr,
                underlying: token1.address,
                strikeAsset: token2.address,
                minStrikePrice: 1,
                maxStrikePrice: ethers.BigNumber.from("600000000"),
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
            ).to.be.revertedWith("No payable");
            
            await expect(
                ACOPool.deposit(depositAmount, ownerAddr)
            ).to.be.revertedWith("transferFrom");
        });
        it("Check deposit ACOPoolEthToken2Call", async function () {
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);

            let val1 = ethers.BigNumber.from("1000000000000000000");
            let val2 = ethers.BigNumber.from("5000000000000000000");
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

            let val1 = ethers.BigNumber.from("200000000");
            let val2 = ethers.BigNumber.from("600000000");
            let bal1 = ethers.BigNumber.from("200000000000000000000");
            let bal2 = ethers.BigNumber.from("600000000000000000000");
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

            let val1 = ethers.BigNumber.from("800000000");
            let val2 = ethers.BigNumber.from("2000000000");
            let bal1 = ethers.BigNumber.from("8000000000000000000");
            let bal2 = ethers.BigNumber.from("20000000000000000000");
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

            let val1 = ethers.BigNumber.from("10000");
            let val2 = ethers.BigNumber.from("8000");
            let bal1 = ethers.BigNumber.from("10000000000000000");
            let bal2 = ethers.BigNumber.from("8000000000000000");
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
        it("Check swap ACOPoolEthToken2Call", async function () {
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);

            let val1 = ethers.BigNumber.from("5000000000000000000");
            await ACOPoolEthToken2Call.connect(addr1).deposit(val1, await addr1.getAddress(), {value: val1});
            await await ACOPoolEthToken2Call.connect(addr2).deposit(val1, await addr2.getAddress(), {value: val1});
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(val1.mul(2));

            await jumpUntilStart(start);
            let deadline = (await getCurrentTimestamp()) + 100;
            let swapAmount = ethers.BigNumber.from("1000000000000000000");
            let maxValueToPay = ethers.BigNumber.from("30000000");
            expect(await ACOEthToken2Call.balanceOf(await owner.getAddress())).to.equal(0);
            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
            await ACOPoolEthToken2Call.swap(true, ACOEthToken2Call.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline);
            expect(await ACOEthToken2Call.balanceOf(await owner.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolEthToken2Call.acoTokensData(ACOEthToken2Call.address)).amountSold).to.equal(swapAmount);

            expect(await ACOEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            await token2.connect(addr1).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
            await ACOPoolEthToken2Call.swap(true, ACOEthToken2Call.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolEthToken2Call.acoTokensData(ACOEthToken2Call.address)).amountSold).to.equal(swapAmount.mul(2));

            await ACOPoolEthToken2Call.swap(true, ACOEthToken2Call.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(swapAmount.mul(2));
            expect((await ACOPoolEthToken2Call.acoTokensData(ACOEthToken2Call.address)).amountSold).to.equal(swapAmount.mul(3));

            maxValueToPay = ethers.BigNumber.from("300000000");
            await ACOPoolEthToken2Call.swap(true, ACOEthToken2Call2.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOEthToken2Call2.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolEthToken2Call.acoTokensData(ACOEthToken2Call2.address)).amountSold).to.equal(swapAmount);
        });
        it("Check swap ACOPoolEthToken2Put", async function () {
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);

            await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

            let val1 = ethers.BigNumber.from("3000000000");            
            await ACOPoolEthToken2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await await ACOPoolEthToken2Put.connect(addr2).deposit(val1, await addr2.getAddress());

            let totalSupply = ethers.BigNumber.from("6000000000000000000000");
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(totalSupply);

            await jumpUntilStart(start);
            let deadline = (await getCurrentTimestamp()) + 100;
            let swapAmount = ethers.BigNumber.from("1000000000000000000");
            let maxValueToPay = ethers.BigNumber.from("30000000");
            expect(await ACOEthToken2Put.balanceOf(await owner.getAddress())).to.equal(0);
            await token2.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await ACOPoolEthToken2Put.swap(true, ACOEthToken2Put.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline);
            expect(await ACOEthToken2Put.balanceOf(await owner.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolEthToken2Put.acoTokensData(ACOEthToken2Put.address)).amountSold).to.equal(swapAmount);

            expect(await ACOEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(0);
            await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await ACOPoolEthToken2Put.swap(true, ACOEthToken2Put.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolEthToken2Put.acoTokensData(ACOEthToken2Put.address)).amountSold).to.equal(swapAmount.mul(2));

            await ACOPoolEthToken2Put.swap(true, ACOEthToken2Put.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(swapAmount.mul(2));
            expect((await ACOPoolEthToken2Put.acoTokensData(ACOEthToken2Put.address)).amountSold).to.equal(swapAmount.mul(3));

            maxValueToPay = ethers.BigNumber.from("200000000");
            await ACOPoolEthToken2Put.swap(true, ACOEthToken2Put2.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOEthToken2Put2.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolEthToken2Put.acoTokensData(ACOEthToken2Put2.address)).amountSold).to.equal(swapAmount);
        });
        it("Check swap ACOPoolToken1Token2Call", async function () {
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);

            await token1.connect(addr1).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

            let val1 = ethers.BigNumber.from("12000000000000");            
            await ACOPoolToken1Token2Call.connect(addr1).deposit(val1, await addr1.getAddress());
            await await ACOPoolToken1Token2Call.connect(addr2).deposit(val1, await addr2.getAddress());

            let totalSupply = ethers.BigNumber.from("240000000000000000000000");
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(totalSupply);

            await jumpUntilStart(start);
            let deadline = (await getCurrentTimestamp()) + 100;
            let swapAmount = ethers.BigNumber.from("100000000");
            let maxValueToPay = ethers.BigNumber.from("300000000");
            expect(await ACOToken1Token2Call.balanceOf(await owner.getAddress())).to.equal(0);
            await token2.connect(owner).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
            await ACOPoolToken1Token2Call.swap(true, ACOToken1Token2Call.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline);
            expect(await ACOToken1Token2Call.balanceOf(await owner.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolToken1Token2Call.acoTokensData(ACOToken1Token2Call.address)).amountSold).to.equal(swapAmount);

            expect(await ACOToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            await token2.connect(addr1).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);
            await ACOPoolToken1Token2Call.swap(true, ACOToken1Token2Call.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolToken1Token2Call.acoTokensData(ACOToken1Token2Call.address)).amountSold).to.equal(swapAmount.mul(2));

            await ACOPoolToken1Token2Call.swap(true, ACOToken1Token2Call.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(swapAmount.mul(2));
            expect((await ACOPoolToken1Token2Call.acoTokensData(ACOToken1Token2Call.address)).amountSold).to.equal(swapAmount.mul(3));

            maxValueToPay = ethers.BigNumber.from("3000000000");
            await ACOPoolToken1Token2Call.swap(true, ACOToken1Token2Call2.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOToken1Token2Call2.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolToken1Token2Call.acoTokensData(ACOToken1Token2Call2.address)).amountSold).to.equal(swapAmount);
        });
        it("Check swap ACOPoolToken1Token2Put", async function () {
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);

            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            let val1 = ethers.BigNumber.from("90000000000");            
            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await await ACOPoolToken1Token2Put.connect(addr2).deposit(val1, await addr2.getAddress());

            let totalSupply = ethers.BigNumber.from("180000000000000000000000");
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(totalSupply);

            await jumpUntilStart(start)
            let deadline = (await getCurrentTimestamp()) + 100;
            let swapAmount = ethers.BigNumber.from("1000000");
            let maxValueToPay = ethers.BigNumber.from("300000000");
            expect(await ACOToken1Token2Put.balanceOf(await owner.getAddress())).to.equal(0);
            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline);
            expect(await ACOToken1Token2Put.balanceOf(await owner.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolToken1Token2Put.acoTokensData(ACOToken1Token2Put.address)).amountSold).to.equal(swapAmount);

            expect(await ACOToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(0);
            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolToken1Token2Put.acoTokensData(ACOToken1Token2Put.address)).amountSold).to.equal(swapAmount.mul(2));

            await ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(swapAmount.mul(2));
            expect((await ACOPoolToken1Token2Put.acoTokensData(ACOToken1Token2Put.address)).amountSold).to.equal(swapAmount.mul(3));

            maxValueToPay = ethers.BigNumber.from("3000000000");
            await ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put2.address, swapAmount, maxValueToPay, await addr1.getAddress(), deadline);
            expect(await ACOToken1Token2Put2.balanceOf(await addr1.getAddress())).to.equal(swapAmount);
            expect((await ACOPoolToken1Token2Put.acoTokensData(ACOToken1Token2Put2.address)).amountSold).to.equal(swapAmount);
        });
        it("Check swap fail", async function () {
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);

            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            let val1 = ethers.BigNumber.from("90000000000");            
            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await await ACOPoolToken1Token2Put.connect(addr2).deposit(val1, await addr2.getAddress());

            let totalSupply = ethers.BigNumber.from("180000000000000000000000");
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(totalSupply);


            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);

            await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

            let val2 = ethers.BigNumber.from("3000000000");            
            await ACOPoolEthToken2Put.connect(addr1).deposit(val2, await addr1.getAddress());
            await await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());
            let totalSupply2 = ethers.BigNumber.from("6000000000000000000000");
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(totalSupply2);

            await jumpUntilStart(start);

            let deadline = (await getCurrentTimestamp()) + 100;
            let swapAmount = ethers.BigNumber.from("100000000");
            let maxValueToPay = ethers.BigNumber.from("500000000");
            expect(await ACOToken1Token2Put.balanceOf(await owner.getAddress())).to.equal(0);
            
            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline - 101)
            ).to.be.revertedWith("ACOPool:: Swap deadline");

            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, maxValueToPay, AddressZero, deadline)
            ).to.be.revertedWith("ACOPool:: Invalid destination");

            await expect(
                ACOPoolToken1Token2Put.swap(false, ACOToken1Token2Put.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: The pool only sell");

            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, 0, maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: Invalid token amount");

            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Call.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: Invalid ACO Token");

            let acoTokenExpiration = (await getCurrentTimestamp()) + 10;
            let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, false, acoToken1Token2PutPrice2, acoTokenExpiration, maxExercisedAccounts)).wait();
            let result0 = tx.events[tx.events.length - 1].args;
            let ACOToken1Token2PutExpired = await ethers.getContractAt("ACOToken", result0.acoToken);
            
            await jumpUntilStart(acoTokenExpiration);

            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2PutExpired.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: ACO token expired");

            await expect(
                ACOPoolEthToken2Put.swap(true, ACOEthToken2Put.address, 1, maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: Token amount is too small");

            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount.mul(200).add(1), maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: Insufficient liquidity");

            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, 1, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: Swap restriction");

            await aggregatorToken1Token2.updateAnswer(ethers.BigNumber.from("800000000000"));
            
            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("ACOPool:: Swap restriction");

            await aggregatorToken1Token2.updateAnswer(ethers.BigNumber.from("1000000000000"));

            await expect(
                ACOPoolToken1Token2Put.swap(true, ACOToken1Token2Put.address, swapAmount, maxValueToPay, await owner.getAddress(), deadline)
            ).to.be.revertedWith("transferFrom");
        });
        it("Check restore for ACOPoolEthToken2Call", async function () {
            let val1 = ethers.BigNumber.from("1000000000000000000");
            let val2 = ethers.BigNumber.from("2000000000000000000");
            let val3 = ethers.BigNumber.from("3000000000000000000");
            await ACOPoolEthToken2Call.connect(addr1).deposit(val1, await addr1.getAddress(), {value: val1});
            await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});
            await ACOPoolEthToken2Call.connect(addr3).deposit(val3, await addr3.getAddress(), {value: val3});

            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);

            await jumpUntilStart(start);

            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);

            let quote = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, val1);
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, val1, quote[0], await owner.getAddress(), start + 100);

            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(ethers.BigNumber.from(quote[0].sub(quote[1])));

            let balance = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]));

            let tx = await (await ACOPoolEthToken2Call.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);
            expect(quote[0].sub(quote[1])).to.equal(result.amountOut);
            expect(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"])).to.equal(balance.add(result.collateralIn));
        });
        it("Check restore for ACOPoolEthToken2Put", async function () {
            let val1 = ethers.BigNumber.from("1000000000");
            let val2 = ethers.BigNumber.from("2000000000");
            let val3 = ethers.BigNumber.from("3000000000");

            await token2.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr1).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

            await ACOPoolEthToken2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolEthToken2Put.connect(addr2).deposit(val2, await addr2.getAddress());
            await ACOPoolEthToken2Put.connect(addr3).deposit(val3, await addr3.getAddress());

            await jumpUntilStart(start);

            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3));

            let amount = ethers.BigNumber.from("2000000000000000000");
            let quote = await ACOPoolEthToken2Put.quote(true, ACOEthToken2Put.address, amount);
            await ACOPoolEthToken2Put.connect(owner).swap(true, ACOEthToken2Put.address, amount, quote[0], await owner.getAddress(), start + 100);
            
            let value = ethers.BigNumber.from(quote[0].sub(quote[1]));
            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3).sub(acoEthToken2PutPrice.mul(2)).add(value));

            let acoBalance = await ACOEthToken2Put.balanceOf(await owner.getAddress());
            expect(acoBalance).to.equal(amount);
            let exercise = await ACOEthToken2Put.getBaseExerciseData(amount);
            await ACOEthToken2Put.connect(owner).exercise(amount, 1, {value: ethers.BigNumber.from(exercise[1]).add(maxExercisedAccounts)});
            
            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3).sub(acoEthToken2PutPrice.mul(2)).add(value));
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(amount.add(1));

            await aggregatorWethToken2.updateAnswer(ethers.BigNumber.from("30000000000"));
            let tx = await (await ACOPoolEthToken2Put.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(val1.add(val2).add(val3).sub(acoEthToken2PutPrice.mul(2)).add(value).add(ethers.BigNumber.from(result.collateralIn)));
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);
        });
        it("Check restore for ACOPoolToken1Token2Call", async function () {
            let val1 = ethers.BigNumber.from("100000000");
            let val2 = ethers.BigNumber.from("200000000");
            let val3 = ethers.BigNumber.from("300000000");
            
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

            let amount = ethers.BigNumber.from("50000000");
            let quote = await ACOPoolToken1Token2Call.quote(true, ACOToken1Token2Call.address, amount);
            await ACOPoolToken1Token2Call.connect(owner).swap(true, ACOToken1Token2Call.address, amount, quote[0], await owner.getAddress(), start + 100);

            expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(ethers.BigNumber.from(quote[0].sub(quote[1])));
            expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(val1.add(val2).add(val3).sub(amount));

            let tx = await (await ACOPoolToken1Token2Call.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
            expect(quote[0].sub(quote[1])).to.equal(result.amountOut);
            expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(val1.add(val2).add(val3).sub(amount).add(result.collateralIn));
        });
        it("Check restore for ACOPoolToken1Token2Put", async function () {
            let val1 = ethers.BigNumber.from("1000000000");
            let val2 = ethers.BigNumber.from("2000000000");
            let val3 = ethers.BigNumber.from("3000000000");

            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());
            await ACOPoolToken1Token2Put.connect(addr3).deposit(val3, await addr3.getAddress());

            await jumpUntilStart(start);

            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3));

            let amount = ethers.BigNumber.from("10000000");
            let quote = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put.address, amount);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put.address, amount, quote[0], await owner.getAddress(), start + 100);
            
            let value = ethers.BigNumber.from(quote[0].sub(quote[1]));
            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3).add(value).sub("900000000"));

            let acoBalance = await ACOToken1Token2Put.balanceOf(await owner.getAddress());
            expect(acoBalance).to.equal(amount);
            await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);
            await ACOToken1Token2Put.connect(owner).exercise(amount, start);
            
            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3).add(value).sub("900000000"));
            expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(amount.add(1));

            await aggregatorToken1Token2.updateAnswer(ethers.BigNumber.from("900000000000"));
            let tx = await (await ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).wait();
            let result = tx.events[tx.events.length - 1].args;
            
            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(val1.add(val2).add(val3).add(value).sub("900000000").add(ethers.BigNumber.from(result.collateralIn)));
            expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
        });
        it("Check restore fail", async function () {
            let val1 = ethers.BigNumber.from("1000000000");
            let val2 = ethers.BigNumber.from("2000000000000000000");

            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});

            await jumpUntilStart(start);

            await expect(ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).to.be.revertedWith("ACOPool:: No balance");
            await expect(ACOPoolEthToken2Call.connect(addr2).restoreCollateral()).to.be.revertedWith("ACOPool:: No balance");
            
            let amount1 = ethers.BigNumber.from("10000000");
            let quote1 = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put.address, amount1);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put.address, amount1, quote1[0], await owner.getAddress(), start + 100);
            
            await expect(ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).to.be.revertedWith("ACOPool:: No balance");

            await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);
            await ACOToken1Token2Put.connect(owner).exercise(amount1, start);

            let amount2 = ethers.BigNumber.from("1000000000000000");
            let quote2 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, amount2);
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, amount2, quote2[0], await owner.getAddress(), start + 100);

            await expect(ACOPoolToken1Token2Put.connect(addr2).restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");

            await aggregatorWethToken2.updateAnswer("30000000000");
            await expect(ACOPoolEthToken2Call.connect(addr2).restoreCollateral()).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
        });
        it("Check redeem ACOPoolEthToken2Call", async function () {
            let val1 = ethers.BigNumber.from("1000000000000000000");
            let val2 = ethers.BigNumber.from("3500000000000000000");
            await ACOPoolEthToken2Call.connect(addr1).deposit(val1, await addr1.getAddress(), {value: val1});
            await ACOPoolEthToken2Call.connect(addr2).deposit(val1, await addr2.getAddress(), {value: val1});
            await ACOPoolEthToken2Call.connect(addr3).deposit(val1, await addr3.getAddress(), {value: val1});
            await ACOPoolEthToken2Call.connect(addr1).deposit(val2, await addr1.getAddress(), {value: val2});
            await ACOPoolEthToken2Call.connect(addr1).deposit(val2, await owner.getAddress(), {value: val2});

            await jumpUntilStart(start);

            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);

            let quote1 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, val1);
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, val1, quote1[0], await owner.getAddress(), start + 100);

            let quote2 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, val1.div(2));
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, val1.div(2), quote2[0], await owner.getAddress(), start + 100);

            let totalSupply = val2.mul(2).add(val1.mul(3));
            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(val1.add(val2));
            expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.balanceOf(await owner.getAddress())).to.equal(val2);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(totalSupply); 
            expect(await ACOPoolEthToken2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(1);

            await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

            let poolBalance2 = await token2.balanceOf(ACOPoolEthToken2Call.address);
            let addr1Balance2 = await token2.balanceOf(await addr1.getAddress());
            await ACOPoolEthToken2Call.connect(addr1).redeem();
            
            let addr1Redeem2 = poolBalance2.mul(val1.add(val2)).div(totalSupply);
            expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance2.add(addr1Redeem2));

            poolBalance2 = poolBalance2.sub(addr1Redeem2);
            totalSupply = val2.add(val1.mul(2));
            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.balanceOf(await owner.getAddress())).to.equal(val2);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(totalSupply);
            expect(await ACOPoolEthToken2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(totalSupply);
            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(poolBalance2);

            await ACOPoolEthToken2Call.connect(addr2).approve(await owner.getAddress(), val1);

            let addr2Balance1 = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [(await addr2.getAddress()),"latest"]));
            let addr2Balance2 = await token2.balanceOf(await addr2.getAddress());
            let ownerBalance2 = await token2.balanceOf(await owner.getAddress());
            await ACOPoolEthToken2Call.connect(owner).redeemFrom(await addr2.getAddress());

            let addr2Redeem2 = poolBalance2.mul(val1).div(totalSupply);
            let addr2bal = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [(await addr2.getAddress()),"latest"]));
            ownerBalance2 = ownerBalance2.add(addr2Redeem2);
            expect(addr2bal).to.equal(addr2Balance1);
            expect(await token2.balanceOf(await addr2.getAddress())).to.equal(addr2Balance2);
            expect(await token2.balanceOf(await owner.getAddress())).to.equal(ownerBalance2);

            poolBalance2 = poolBalance2.sub(addr2Redeem2);
            totalSupply = val2.add(val1);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.balanceOf(await owner.getAddress())).to.equal(val2);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(totalSupply);
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(totalSupply);
            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(poolBalance2);

            await ACOPoolEthToken2Call.connect(owner).redeem();

            let ownerRedeem2 = poolBalance2.mul(val2).div(totalSupply);
            expect(await token2.balanceOf(await owner.getAddress())).to.equal(ownerBalance2.add(ownerRedeem2));

            poolBalance2 = poolBalance2.sub(ownerRedeem2);
            totalSupply = val1;
            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(val1);
            expect(await ACOPoolEthToken2Call.balanceOf(await owner.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(totalSupply);
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(totalSupply);
            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(poolBalance2);

            let addr3Balance2 = await token2.balanceOf(await addr3.getAddress());
            await ACOPoolEthToken2Call.connect(addr3).redeem();

            expect(await token2.balanceOf(await addr3.getAddress())).to.equal(addr3Balance2.add(poolBalance2));

            expect(await ACOPoolEthToken2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr2.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await addr3.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.balanceOf(await owner.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Call.totalSupply()).to.equal(0);
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Call.address,"latest"]))).to.equal(0);
            expect(await token2.balanceOf(ACOPoolEthToken2Call.address)).to.equal(0);
        });
        it("Check redeem ACOPoolEthToken2Put", async function () {
            let val1 = ethers.BigNumber.from("10000000000");

            await token2.connect(owner).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolEthToken2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolEthToken2Put.address, token2TotalSupply);

            await ACOPoolEthToken2Put.connect(owner).deposit(val1, await addr1.getAddress());
            await ACOPoolEthToken2Put.connect(addr2).deposit(val1, await addr2.getAddress());

            await jumpUntilStart(start);

            let amount = ethers.BigNumber.from("2000000000000000000");
            let quote = await ACOPoolEthToken2Put.quote(true, ACOEthToken2Put.address, amount);
            await ACOPoolEthToken2Put.connect(addr3).swap(true, ACOEthToken2Put.address, amount, quote[0], await addr1.getAddress(), start + 100);
            
            let exercise = await ACOEthToken2Put.getBaseExerciseData(amount);
            await ACOEthToken2Put.connect(addr1).exercise(amount, 1, {value: ethers.BigNumber.from(exercise[1]).add(maxExercisedAccounts)});

            await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

            await aggregatorWethToken2.updateAnswer(ethers.BigNumber.from("30000000000"));
            await ACOPoolEthToken2Put.connect(addr1).restoreCollateral();

            expect(await ACOPoolEthToken2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(1);

            await ACOPoolEthToken2Put.connect(addr1).approve(await addr3.getAddress(), amount.mul(val1));
            let poolBalance = await token2.balanceOf(ACOPoolEthToken2Put.address);
            let addr1bal = ethers.BigNumber.from(await network.provider.send("eth_getBalance", [(await addr1.getAddress()),"latest"]));
            let addr1Bal2 = await token2.balanceOf(await addr1.getAddress());
            let addr2Bal2 = await token2.balanceOf(await addr2.getAddress());
            let addr3Bal2 = await token2.balanceOf(await addr3.getAddress());
            await ACOPoolEthToken2Put.connect(addr3).redeemFrom(await addr1.getAddress());
            expect(await ACOPoolEthToken2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
            await ACOPoolEthToken2Put.connect(addr2).redeem();

            let profit = poolBalance.div(2);
            expect(await token2.balanceOf(ACOPoolEthToken2Put.address)).to.equal(0);
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [ACOPoolEthToken2Put.address,"latest"]))).to.equal(0);
            expect(await ACOPoolEthToken2Put.totalSupply()).to.equal(0);
            expect(await ACOPoolEthToken2Put.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Put.balanceOf(await addr2.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Put.balanceOf(await addr3.getAddress())).to.equal(0);
            expect(await ACOPoolEthToken2Put.balanceOf(await owner.getAddress())).to.equal(0);
            expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Bal2);
            expect(await token2.balanceOf(await addr2.getAddress())).to.equal(addr2Bal2.add(profit).add(1));
            expect(await token2.balanceOf(await addr3.getAddress())).to.equal(addr3Bal2.add(profit));
            expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [(await addr1.getAddress()),"latest"]))).to.equal(addr1bal);
        });
        it("Check redeem ACOPoolToken1Token2Call", async function () {
            let val1 = ethers.BigNumber.from("100000000");
            let val2 = ethers.BigNumber.from("900000000");
            let val3 = ethers.BigNumber.from("600000000");
            
            await token1.connect(owner).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr1).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr3).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

            await ACOPoolToken1Token2Call.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
            await ACOPoolToken1Token2Call.connect(addr3).deposit(val3, await addr3.getAddress());

            await token2.connect(owner).approve(ACOPoolToken1Token2Call.address, token2TotalSupply);

            await jumpUntilStart(start);

            let amount = ethers.BigNumber.from("1600000000");
            let quote = await ACOPoolToken1Token2Call.quote(true, ACOToken1Token2Call.address, amount);
            await ACOPoolToken1Token2Call.connect(owner).swap(true, ACOToken1Token2Call.address, amount, quote[0], await owner.getAddress(), start + 100);

            await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

            expect(await ACOPoolToken1Token2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(1);

            let poolBalance1 = await token1.balanceOf(ACOPoolToken1Token2Call.address);
            let poolBalance2 = await token2.balanceOf(ACOPoolToken1Token2Call.address);
            let addr1Bal1 = await token1.balanceOf(await addr1.getAddress());
            let addr2Bal1 = await token1.balanceOf(await addr2.getAddress());
            let addr3Bal1 = await token1.balanceOf(await addr3.getAddress());
            let addr1Bal2 = await token2.balanceOf(await addr1.getAddress());
            let addr2Bal2 = await token2.balanceOf(await addr2.getAddress());
            let addr3Bal2 = await token2.balanceOf(await addr3.getAddress());
            await ACOPoolToken1Token2Call.connect(addr1).redeem();
            expect(await ACOPoolToken1Token2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
            await ACOPoolToken1Token2Call.connect(addr2).redeem();
            await ACOPoolToken1Token2Call.connect(addr3).redeem();

            let total = val1.add(val2).add(val3);
            let addr1pool2 = poolBalance2.mul(val1).div(total);
            let addr2pool2 = poolBalance2.mul(val2).div(total);
            let addr3pool2 = poolBalance2.mul(val3).div(total);
            expect(await token2.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
            expect(await token1.balanceOf(ACOPoolToken1Token2Call.address)).to.equal(0);
            expect(await ACOPoolToken1Token2Call.totalSupply()).to.equal(0);
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress())).to.equal(0);
            expect(await ACOPoolToken1Token2Call.balanceOf(await addr3.getAddress())).to.equal(0);
            expect(await token1.balanceOf(await addr1.getAddress())).to.equal(addr1Bal1.add(val1));
            expect(await token1.balanceOf(await addr2.getAddress())).to.equal(addr2Bal1.add(val2));
            expect(await token1.balanceOf(await addr3.getAddress())).to.equal(addr3Bal1.add(val3));
            expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Bal2.add(addr1pool2));
            expect(await token2.balanceOf(await addr2.getAddress())).to.equal(addr2Bal2.add(addr2pool2));
            expect(await token2.balanceOf(await addr3.getAddress())).to.equal(addr3Bal2.add(addr3pool2));
        });
        it("Check redeem ACOPoolToken1Token2Put", async function () {
            let val1 = ethers.BigNumber.from("2000000000");
            let val2 = ethers.BigNumber.from("3000000000");
            let val3 = ethers.BigNumber.from("4000000000");

            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr3).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            await ACOPoolToken1Token2Put.connect(addr1).deposit(val1, await addr1.getAddress());
            await ACOPoolToken1Token2Put.connect(addr2).deposit(val2, await addr2.getAddress());
            await ACOPoolToken1Token2Put.connect(addr3).deposit(val3, await addr3.getAddress());

            await jumpUntilStart(start);

            let amount = ethers.BigNumber.from("100000000");
            let quote = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put.address, amount);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put.address, amount, quote[0], await owner.getAddress(), start + 100);

            await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);
            await ACOToken1Token2Put.connect(owner).exercise(amount, start);
            
            await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

            expect(await ACOPoolToken1Token2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(1);

            let poolBalance1 = await token1.balanceOf(ACOPoolToken1Token2Put.address);
            let poolBalance2 = await token2.balanceOf(ACOPoolToken1Token2Put.address);
            let addr1Bal1 = await token1.balanceOf(await addr1.getAddress());
            let addr2Bal1 = await token1.balanceOf(await addr2.getAddress());
            let addr3Bal1 = await token1.balanceOf(await addr3.getAddress());
            let addr1Bal2 = await token2.balanceOf(await addr1.getAddress());
            let addr2Bal2 = await token2.balanceOf(await addr2.getAddress());
            let addr3Bal2 = await token2.balanceOf(await addr3.getAddress());
            await ACOPoolToken1Token2Put.connect(addr1).redeem();
            expect(await ACOPoolToken1Token2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
            await ACOPoolToken1Token2Put.connect(addr2).redeem();
            await ACOPoolToken1Token2Put.connect(addr3).redeem();

            let total = val1.add(val2).add(val3);
            let addr1pool1 = poolBalance1.mul(val1).div(total);
            let addr2pool1 = poolBalance1.mul(val2).div(total);
            let addr3pool1 = poolBalance1.mul(val3).div(total);
            let addr1pool2 = poolBalance2.mul(val1).div(total);
            let addr2pool2 = poolBalance2.mul(val2).div(total);
            let addr3pool2 = poolBalance2.mul(val3).div(total);
            expect(await token2.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
            expect(await token1.balanceOf(ACOPoolToken1Token2Put.address)).to.equal(0);
            expect(await ACOPoolToken1Token2Put.totalSupply()).to.equal(0);
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr1.getAddress())).to.equal(0);
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr2.getAddress())).to.equal(0);
            expect(await ACOPoolToken1Token2Put.balanceOf(await addr3.getAddress())).to.equal(0);
            expect(await token1.balanceOf(await addr1.getAddress())).to.equal(addr1Bal1.add(addr1pool1));
            expect(await token1.balanceOf(await addr2.getAddress())).to.equal(addr2Bal1.add(addr2pool1));
            expect(await token1.balanceOf(await addr3.getAddress())).to.equal(addr3Bal1.add(addr3pool1).add(2));
            expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Bal2.add(addr1pool2));
            expect(await token2.balanceOf(await addr2.getAddress())).to.equal(addr2Bal2.add(addr2pool2));
            expect(await token2.balanceOf(await addr3.getAddress())).to.equal(addr3Bal2.add(addr3pool2));
        });
        it("Check redeem fail", async function () {
            let val1 = ethers.BigNumber.from("100000000");
            let val2 = ethers.BigNumber.from("900000000");
            
            await token1.connect(owner).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);
            await token1.connect(addr2).approve(ACOPoolToken1Token2Call.address, token1TotalSupply);

            await ACOPoolToken1Token2Call.connect(owner).deposit(val1, await addr1.getAddress());
            await ACOPoolToken1Token2Call.connect(addr2).deposit(val2, await addr2.getAddress());
            
            let bal = await ACOPoolToken1Token2Call.balanceOf(await addr2.getAddress());
            await ACOPoolToken1Token2Call.connect(addr2).approve(await owner.getAddress(), bal);

            await jumpUntilStart(start);

            await expect(ACOPoolToken1Token2Call.connect(owner).redeem()).to.be.revertedWith("ACOPool:: Account with no share");

            await ACOPoolToken1Token2Call.connect(addr2).transfer(await addr3.getAddress(), bal);

            await expect(ACOPoolToken1Token2Call.connect(addr2).redeem()).to.be.revertedWith("ACOPool:: Account with no share");
            await expect(ACOPoolToken1Token2Call.connect(owner).redeemFrom(await addr2.getAddress())).to.be.revertedWith("ACOPool:: Account with no share");

            await expect(ACOPoolToken1Token2Call.connect(addr1).redeem()).to.be.revertedWith("ACOPool:: Pool is not finished");
            await expect(ACOPoolToken1Token2Call.connect(addr3).redeem()).to.be.revertedWith("ACOPool:: Pool is not finished");
            await expect(ACOPoolToken1Token2Call.connect(owner).redeemFrom(await addr3.getAddress())).to.be.revertedWith("ACOPool:: Pool is not finished");

            await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

            await expect(ACOPoolToken1Token2Call.connect(owner).redeemFrom(await addr1.getAddress())).to.be.revertedWith("SafeMath: subtraction overflow");

            await ACOPoolToken1Token2Call.connect(addr3).approve(await owner.getAddress(), bal.sub(1));

            await expect(ACOPoolToken1Token2Call.connect(owner).redeemFrom(await addr3.getAddress())).to.be.revertedWith("SafeMath: subtraction overflow");

            await ACOPoolToken1Token2Call.connect(addr3).approve(await owner.getAddress(), bal);

            await ACOPoolToken1Token2Call.connect(addr1).redeem();
            await ACOPoolToken1Token2Call.connect(owner).redeemFrom(await addr3.getAddress());
        });
        it("Check redeem ACO tokens", async function () {
            let val1 = ethers.BigNumber.from("1000000000000000000");
            let val2 = ethers.BigNumber.from("3500000000000000000");
            await ACOPoolEthToken2Call.connect(addr1).deposit(val1, await addr1.getAddress(), {value: val1});
            await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});

            let val21 = ethers.BigNumber.from("20000000000");
            let val22 = ethers.BigNumber.from("30000000000");

            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            await ACOPoolToken1Token2Put.connect(addr1).deposit(val21, await addr1.getAddress());
            await ACOPoolToken1Token2Put.connect(addr2).deposit(val22, await addr2.getAddress());

            await jumpUntilStart(start);

            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(owner).approve(ACOEthToken2Call.address, token2TotalSupply);
            await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);

            let quote1 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, val1);
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, val1, quote1[0], await owner.getAddress(), start + 100);

            let quote2 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call2.address, val1.div(2));
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call2.address, val1.div(2), quote2[0], await owner.getAddress(), start + 100);

            await ACOEthToken2Call.connect(owner).exercise(val1, start);

            let amount1 = ethers.BigNumber.from("100000000");
            let quote11 = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put.address, amount1);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put.address, amount1, quote11[0], await owner.getAddress(), start + 100);

            let amount12 = ethers.BigNumber.from("200000000");
            let quote12 = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put2.address, amount12);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put2.address, amount12, quote12[0], await owner.getAddress(), start + 100);

            await ACOToken1Token2Put.connect(owner).exercise(amount1, start);

            expect(await ACOPoolEthToken2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(2);
            expect(await ACOPoolToken1Token2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(2);

            await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

            await ACOPoolEthToken2Call.connect(addr3).redeemACOTokens();
            await ACOPoolToken1Token2Put.connect(addr3).redeemACOTokens();

            expect(await ACOPoolEthToken2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
            expect(await ACOPoolToken1Token2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
        });
        it("Check redeem ACO token", async function () {
            let val1 = ethers.BigNumber.from("1000000000000000000");
            let val2 = ethers.BigNumber.from("3500000000000000000");
            await ACOPoolEthToken2Call.connect(addr1).deposit(val1, await addr1.getAddress(), {value: val1});
            await ACOPoolEthToken2Call.connect(addr2).deposit(val2, await addr2.getAddress(), {value: val2});

            let val21 = ethers.BigNumber.from("20000000000");
            let val22 = ethers.BigNumber.from("30000000000");

            await token2.connect(addr1).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(addr2).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);

            await ACOPoolToken1Token2Put.connect(addr1).deposit(val21, await addr1.getAddress());
            await ACOPoolToken1Token2Put.connect(addr2).deposit(val22, await addr2.getAddress());

            await jumpUntilStart(start);

            await token2.connect(owner).approve(ACOPoolEthToken2Call.address, token2TotalSupply);
            await token2.connect(owner).approve(ACOPoolToken1Token2Put.address, token2TotalSupply);
            await token2.connect(owner).approve(ACOEthToken2Call.address, token2TotalSupply);
            await token1.connect(owner).approve(ACOToken1Token2Put.address, token1TotalSupply);

            let quote1 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call.address, val1);
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call.address, val1, quote1[0], await owner.getAddress(), start + 100);

            let quote2 = await ACOPoolEthToken2Call.quote(true, ACOEthToken2Call2.address, val1.div(2));
            await ACOPoolEthToken2Call.connect(owner).swap(true, ACOEthToken2Call2.address, val1.div(2), quote2[0], await owner.getAddress(), start + 100);

            await ACOEthToken2Call.connect(owner).exercise(val1, start);

            let amount1 = ethers.BigNumber.from("100000000");
            let quote11 = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put.address, amount1);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put.address, amount1, quote11[0], await owner.getAddress(), start + 100);

            let amount12 = ethers.BigNumber.from("200000000");
            let quote12 = await ACOPoolToken1Token2Put.quote(true, ACOToken1Token2Put2.address, amount12);
            await ACOPoolToken1Token2Put.connect(owner).swap(true, ACOToken1Token2Put2.address, amount12, quote12[0], await owner.getAddress(), start + 100);

            await ACOToken1Token2Put.connect(owner).exercise(amount1, start);

            expect(await ACOPoolEthToken2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(2);
            expect(await ACOPoolToken1Token2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(2);

            await network.provider.send("evm_setNextBlockTimestamp", [expiration]);

            await ACOPoolEthToken2Call.connect(addr3).redeemACOToken(ACOEthToken2Call.address);
            await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put.address);
            
            expect(await ACOPoolEthToken2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(1);
            expect(await ACOPoolToken1Token2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(1);
            
            await ACOPoolEthToken2Call.connect(addr3).redeemACOToken(ACOEthToken2Call2.address);
            await ACOPoolToken1Token2Put.connect(addr3).redeemACOToken(ACOToken1Token2Put2.address);

            expect(await ACOPoolEthToken2Call.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
            expect(await ACOPoolToken1Token2Put.numberOfACOTokensCurrentlyNegotiated()).to.equal(0);
        });
    });
});

const getCurrentTimestamp = async () => {
    let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
    return parseInt(block.timestamp, 16);
};

exports.getCurrentTimestamp = getCurrentTimestamp;

const jumpUntilStart = async (start) => {
    let time = await getCurrentTimestamp();
    while (time < start) {
        await network.provider.send("evm_mine");
        time = await getCurrentTimestamp();
    } 
};