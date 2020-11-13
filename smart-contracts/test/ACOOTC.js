const { expect } = require("chai");
const factoryABI = require("../artifacts/ACOFactory.json");

describe("ACOOTC", function() {
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let fee = ethers.utils.bigNumberify("30");
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 8;
  let token1TotalSupply = ethers.utils.bigNumberify("1000000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.utils.bigNumberify("10000000000000000");
  let buidlerFactory;
  let weth;
  let acoOtc;
  let maxExercisedAccounts = 120;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    
    let ACOFactoryV3 = await (await ethers.getContractFactory("ACOFactoryV3")).deploy();
    await ACOFactoryV3.deployed();
    
    let factoryInterface = new ethers.utils.Interface(factoryABI.abi);

    let ACOToken = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOToken.deployed();

    let ownerAddr = await owner.getAddress();
    let addr2Addr = await addr2.getAddress();
    let initData = factoryInterface.functions.init.encode([ownerAddr, ACOToken.address, fee, addr2Addr]);
    let buidlerProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOFactoryV3.address, initData);
    await buidlerProxy.deployed();

    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    weth = await (await ethers.getContractFactory("WETH9")).deploy();
    await weth.deployed(); 

    acoOtc = await (await ethers.getContractFactory("ACOOTC")).deploy(buidlerProxy.address, weth.address);
    await acoOtc.deployed(); 

    buidlerFactory = await ethers.getContractAt("ACOFactoryV3", buidlerProxy.address);
    await buidlerFactory.setOperator(await owner.getAddress(), true);
    await buidlerFactory.setOperator(acoOtc.address, true);
  });

  describe("OTC transactions", function () {
    it("Cancel nonce", async function () {
      expect(parseInt(await acoOtc.signerNonceStatus(await addr1.getAddress(), 0), 16)).to.equal(0);
      expect(parseInt(await acoOtc.signerNonceStatus(await addr1.getAddress(), 1), 16)).to.equal(0);
      await acoOtc.connect(addr1).cancel([0,1]);
      expect(parseInt(await acoOtc.signerNonceStatus(await addr1.getAddress(), 0), 16)).to.equal(1);
      expect(parseInt(await acoOtc.signerNonceStatus(await addr1.getAddress(), 1), 16)).to.equal(1);

      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 1), 16)).to.equal(0);
      await acoOtc.connect(owner).cancel([1]);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 1), 16)).to.equal(1);

      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 100), 16)).to.equal(0);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 101), 16)).to.equal(0);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 102), 16)).to.equal(0);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 103), 16)).to.equal(0);
      await acoOtc.connect(owner).cancel([100,102,101]);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 100), 16)).to.equal(1);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 101), 16)).to.equal(1);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 102), 16)).to.equal(1);
      expect(parseInt(await acoOtc.signerNonceStatus(await owner.getAddress(), 103), 16)).to.equal(0);
    });
    it("Cancel nonce up to", async function () {
      expect(await acoOtc.signerMinimumNonce(await addr1.getAddress())).to.equal(0);
      await acoOtc.connect(addr1).cancelUpTo(1);
      expect(await acoOtc.signerMinimumNonce(await addr1.getAddress())).to.equal(1);

      expect(await acoOtc.signerMinimumNonce(await owner.getAddress())).to.equal(0);
      await acoOtc.connect(owner).cancelUpTo(100);
      expect(await acoOtc.signerMinimumNonce(await owner.getAddress())).to.equal(100);
      await acoOtc.connect(owner).cancelUpTo(0);
      expect(await acoOtc.signerMinimumNonce(await owner.getAddress())).to.equal(0);
    });
    it("Set authorize sender", async function () {
      expect(await acoOtc.senderAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(false);
      await acoOtc.connect(addr1).authorizeSender(await owner.getAddress());
      expect(await acoOtc.senderAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(true);

      await expect(
        acoOtc.connect(addr1).authorizeSender(await addr1.getAddress())
      ).to.be.revertedWith("ACOOTC:: Self authorization");
      expect(await acoOtc.senderAuthorizations(await addr1.getAddress(), await addr1.getAddress())).to.equal(false);
      expect(await acoOtc.senderAuthorizations(await owner.getAddress(), await addr1.getAddress())).to.equal(false);
    });
    it("Set authorize signer", async function () {
      expect(await acoOtc.signerAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(false);
      await acoOtc.connect(addr1).authorizeSigner(await owner.getAddress());
      expect(await acoOtc.signerAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(true);

      await expect(
        acoOtc.connect(addr1).authorizeSigner(await addr1.getAddress())
      ).to.be.revertedWith("ACOOTC:: Self authorization");
      expect(await acoOtc.signerAuthorizations(await addr1.getAddress(), await addr1.getAddress())).to.equal(false);
      expect(await acoOtc.signerAuthorizations(await owner.getAddress(), await addr1.getAddress())).to.equal(false);
    });
    it("Revoke sender", async function () {
      expect(await acoOtc.senderAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(false);
      await acoOtc.connect(addr1).authorizeSender(await owner.getAddress());
      expect(await acoOtc.senderAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(true);
      await acoOtc.connect(addr1).revokeSender(await owner.getAddress());
      expect(await acoOtc.senderAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(false);
      expect(await acoOtc.senderAuthorizations(await owner.getAddress(), await addr1.getAddress())).to.equal(false);
    });
    it("Revoke signer", async function () {
      expect(await acoOtc.signerAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(false);
      await acoOtc.connect(addr1).authorizeSigner(await owner.getAddress());
      expect(await acoOtc.signerAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(true);
      await acoOtc.connect(addr1).revokeSigner(await owner.getAddress());
      expect(await acoOtc.signerAuthorizations(await addr1.getAddress(), await owner.getAddress())).to.equal(false);
      expect(await acoOtc.signerAuthorizations(await owner.getAddress(), await addr1.getAddress())).to.equal(false);
    });
    it("Swap ask order", async function () {

    });
    it("Swap bid order", async function () {

    });
  });
});