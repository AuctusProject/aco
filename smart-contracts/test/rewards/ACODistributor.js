const { expect } = require("chai");
const factoryABI = require("../../artifacts/contracts/core/ACOFactory.sol/ACOFactory.json");
const AddressZero = "0x0000000000000000000000000000000000000000";

describe("ACODistributor", function() {
  let ACOFactory;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let signer;
  let fee = 30;
  let maxExercisedAccounts = 120;
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 18;
  let token1TotalSupply = ethers.BigNumber.from("1000000000000000000000000000000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.BigNumber.from("10000000000000000000000");

  let expiration;
  let acoToken1Token2CallPrice1 = ethers.BigNumber.from("600000");
  let acoToken1Token2CallPrice2 = ethers.BigNumber.from("750000");
  let acoToken1Token2CallPrice3 = ethers.BigNumber.from("1000000");
  let acoToken1Token2CallPrice4 = ethers.BigNumber.from("1200000");
  let ACOToken1Token2Call1;
  let ACOToken1Token2Call2;
  let ACOToken1Token2Call3;
  let ACOToken1Token2Call4;
  let acoAmount1 = ethers.BigNumber.from("100000000000000000000000");
  let acoAmount2 = ethers.BigNumber.from("500000000000000000000000");
  let acoAmount3 = ethers.BigNumber.from("1000000000000000000000000");
  let acoAmount4 = ethers.BigNumber.from("200000000000000000000000");
  let acoDistributor;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, signer, ...addrs] = await ethers.getSigners();

    let ACOFactoryTemp = await (await ethers.getContractFactory("ACOFactoryV4")).deploy();
    await ACOFactoryTemp.deployed();

    let ACOTokenTemp = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOTokenTemp.deployed();

    let factoryInterface = new ethers.utils.Interface(factoryABI.abi);
    let factoryInitData = factoryInterface.encodeFunctionData("init", [await owner.getAddress(), ACOTokenTemp.address, fee, await addr3.getAddress()]);
    let buidlerACOFactoryProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(await owner.getAddress(), ACOFactoryTemp.address, factoryInitData);
    await buidlerACOFactoryProxy.deployed();
    ACOFactory = await ethers.getContractAt("ACOFactoryV4", buidlerACOFactoryProxy.address);
    await ACOFactory.setOperator(await owner.getAddress(), true);
    
    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();

    let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
    let current = parseInt(block.timestamp, 16);
    expiration = current + 3 * 86400;

    let tx = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice1, expiration, maxExercisedAccounts)).wait();
    let result0 = tx.events[tx.events.length - 1].args;
    ACOToken1Token2Call1 = await ethers.getContractAt("ACOToken", result0.acoToken);

    let tx1 = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice2, expiration, maxExercisedAccounts)).wait();
    let result1 = tx1.events[tx1.events.length - 1].args;
    ACOToken1Token2Call2 = await ethers.getContractAt("ACOToken", result1.acoToken);

    let tx2 = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice3, expiration, maxExercisedAccounts)).wait();
    let result2 = tx2.events[tx2.events.length - 1].args;
    ACOToken1Token2Call3 = await ethers.getContractAt("ACOToken", result2.acoToken);

    let tx3 = await (await ACOFactory.createAcoToken(token1.address, token2.address, true, acoToken1Token2CallPrice4, expiration, maxExercisedAccounts)).wait();
    let result3 = tx3.events[tx3.events.length - 1].args;
    ACOToken1Token2Call4 = await ethers.getContractAt("ACOToken", result3.acoToken);

    await token1.connect(owner).approve(ACOToken1Token2Call1.address, token1TotalSupply);
    await token1.connect(owner).approve(ACOToken1Token2Call2.address, token1TotalSupply);
    await token1.connect(owner).approve(ACOToken1Token2Call3.address, token1TotalSupply);
    await token1.connect(owner).approve(ACOToken1Token2Call4.address, token1TotalSupply);
    await ACOToken1Token2Call1.mint(acoAmount1);
    await ACOToken1Token2Call2.mint(acoAmount2);
    await ACOToken1Token2Call3.mint(acoAmount3);
    await ACOToken1Token2Call4.mint(acoAmount4);

    acoDistributor = await (await ethers.getContractFactory("ACODistributor")).deploy(await signer.getAddress(), 
        [ACOToken1Token2Call1.address, ACOToken1Token2Call2.address, ACOToken1Token2Call3.address, ACOToken1Token2Call4.address], 
        [acoAmount1, acoAmount2, acoAmount3, acoAmount4]);
  });

  describe("ACODistributor transactions", function () {
    it("Check claim behavior", async function () {
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(acoAmount1);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(acoAmount2);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.finished()).to.equal(false);







      
    });
    it("Check withdraw stuck token", async function () {

    });
  });
});