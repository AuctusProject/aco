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
  
  const getSignedData = async (_id, _account, _amount) => {
    const signedMsg = await signer.signMessage(ethers.utils.arrayify(getHashData(_id, _account, _amount)));
    return ethers.utils.splitSignature(signedMsg);
  };

  const getHashData = (_id, _account, _amount) => {
    let idHex;
    if ((typeof _id) == "object") {
      idHex = _id.toHexString();
    } else {
      idHex = "0x" + _id.toString(16);
    }
    let amountHex;
    if ((typeof _amount) == "object") {
      amountHex = _amount.toHexString();
    } else {
      amountHex = "0x" + _amount.toString(16);
    }
    return ethers.utils.solidityKeccak256(
        ['address', 'uint256', 'address', 'uint256'],
        [acoDistributor.address, idHex, _account, amountHex]
      );
  };

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
    await ACOToken1Token2Call1.mint(acoAmount1.mul(3));
    await ACOToken1Token2Call2.mint(acoAmount2.mul(3));
    await ACOToken1Token2Call3.mint(acoAmount3.mul(3));
    await ACOToken1Token2Call4.mint(acoAmount4.mul(3));

    acoDistributor = await (await ethers.getContractFactory("ACODistributor")).deploy(await signer.getAddress(), 
        [ACOToken1Token2Call1.address, ACOToken1Token2Call2.address, ACOToken1Token2Call3.address, ACOToken1Token2Call4.address]);
          
    await ACOToken1Token2Call1.transfer(acoDistributor.address, acoAmount1);
    await ACOToken1Token2Call2.transfer(acoDistributor.address, acoAmount2);
    await ACOToken1Token2Call3.transfer(acoDistributor.address, acoAmount3);
    await ACOToken1Token2Call4.transfer(acoDistributor.address, acoAmount4);
  });

  describe("ACODistributor transactions", function () {
    it("Check claim behavior", async function () {
      await acoDistributor.setAcoBalances();

      let _addr1 = await addr1.getAddress();
      let _addr2 = await addr2.getAddress();
      let _addr3 = await addr3.getAddress();
      let _addr4 = await addr4.getAddress();
      let _addr5 = await addr5.getAddress();
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(acoAmount1);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(acoAmount2);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);

      let id = 1;
      let amount = ethers.BigNumber.from("10000000000000000000000");

      let sig = await getSignedData(id, _addr1, amount);

      await expect(
        acoDistributor.connect(addr1).claim(id, _addr1, amount.add(1), sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Invalid arguments");

      await acoDistributor.claim(id, _addr1, amount, sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(acoAmount1.sub(amount));
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(acoAmount2);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      await expect(
        acoDistributor.claim(id, _addr1, amount, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Claimed");

      ++id;

      await expect(
        acoDistributor.claim(id, _addr1, amount, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Invalid arguments");

      sig = await getSignedData(id, _addr2, amount.mul(10));
      
      await expect(
        acoDistributor.claim(id, _addr2, amount, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Invalid arguments");

      await expect(
        acoDistributor.claim(id, _addr3, amount.mul(10), sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Invalid arguments");

      await acoDistributor.connect(addr2).claim(id, _addr2, amount.mul(10), sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(acoAmount2.sub(amount));
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      await expect(
        acoDistributor.connect(addr3).withdrawToken(ACOToken1Token2Call2.address, amount, _addr2)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await acoDistributor.connect(owner).withdrawToken(ACOToken1Token2Call2.address, amount.mul(48), await owner.getAddress());
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(acoAmount2.sub(amount.mul(49)));
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      ++id;
      sig = await getSignedData(id, _addr1, amount.div(2));
      await acoDistributor.connect(addr3).claim(id, _addr1, amount.div(2), sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(amount.div(2));
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(amount.div(2));
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      await ACOToken1Token2Call2.transfer(acoDistributor.address, amount.div(2));
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(amount.div(2));
      await expect(
        acoDistributor.connect(addr1).setAcoBalances()
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await acoDistributor.connect(owner).setAcoBalances();
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(amount);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(amount.div(2));
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      ++id;
      sig = await getSignedData(id, _addr4, amount.mul(50));
      await acoDistributor.connect(addr4).claim(id, _addr4, amount.mul(50), sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3.sub(amount.mul(49)));
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(amount.div(2));
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(amount.mul(49));
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      ++id;
      sig = await getSignedData(id, _addr4, amount.mul(20));
      await acoDistributor.connect(addr4).claim(id, _addr4, amount.mul(20), sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(acoAmount3.sub(amount.mul(69)));
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(amount.div(2));
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(amount.mul(69));
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      await expect(
        acoDistributor.connect(addr5).setHalt(true)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await acoDistributor.halted()).to.equal(false);
      await acoDistributor.connect(owner).setHalt(true);
      expect(await acoDistributor.halted()).to.equal(true);

      ++id;
      sig = await getSignedData(id, _addr3, amount.mul(31));

      await expect(
        acoDistributor.connect(addr3).claim(id, _addr3, amount.mul(31), sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Halted");
      
      await expect(
        acoDistributor.connect(addr3).setHalt(false)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await acoDistributor.connect(owner).setHalt(false);
      await acoDistributor.connect(addr3).claim(id, _addr3, amount.mul(31), sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(acoAmount4);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(amount.div(2));
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(amount.mul(31));
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(amount.mul(69));
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(0);

      ++id;
      sig = await getSignedData(id, _addr2, amount.mul(4));
      await acoDistributor.claim(id, _addr2, amount.mul(4), sig.v, sig.r, sig.s);
      ++id;
      sig = await getSignedData(id, _addr1, amount.mul(2));
      await acoDistributor.claim(id, _addr1, amount.mul(2), sig.v, sig.r, sig.s);
      ++id;
      sig = await getSignedData(id, _addr2, amount.mul(2));
      await acoDistributor.claim(id, _addr2, amount.mul(2), sig.v, sig.r, sig.s);
      ++id;
      sig = await getSignedData(id, _addr3, amount.mul(5));
      await acoDistributor.claim(id, _addr3, amount.mul(5), sig.v, sig.r, sig.s);
      ++id;
      sig = await getSignedData(id, _addr5, amount.mul(6));
      await acoDistributor.claim(id, _addr5, amount.mul(6), sig.v, sig.r, sig.s);
      ++id;
      sig = await getSignedData(id, _addr4, amount.mul(4));
      await acoDistributor.claim(id, _addr4, amount.mul(4), sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(0);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(amount.div(2));
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(amount.mul(31));
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(amount.mul(69));
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(amount.mul(2));
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(amount.mul(6));
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(amount.mul(5));
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(amount);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(amount.mul(6));

      await expect(
        acoDistributor.claim(id, _addr4, amount.mul(4), sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Claimed");

      ++id;
      sig = await getSignedData(id, _addr1, amount.mul(2));
      await acoDistributor.claim(id, _addr1, amount.mul(2), sig.v, sig.r, sig.s);
      expect(await acoDistributor.acos(0)).to.equal(ACOToken1Token2Call1.address);
      expect(await acoDistributor.acos(1)).to.equal(ACOToken1Token2Call2.address);
      expect(await acoDistributor.acos(2)).to.equal(ACOToken1Token2Call3.address);
      expect(await acoDistributor.acos(3)).to.equal(ACOToken1Token2Call4.address);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call1.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call2.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call3.address)).to.equal(0);
      expect(await acoDistributor.acosAmount(ACOToken1Token2Call4.address)).to.equal(0);
      expect(await acoDistributor.halted()).to.equal(false);
      expect(await ACOToken1Token2Call1.balanceOf(_addr1)).to.equal(amount);
      expect(await ACOToken1Token2Call1.balanceOf(_addr2)).to.equal(amount.mul(9));
      expect(await ACOToken1Token2Call1.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr4)).to.equal(0);
      expect(await ACOToken1Token2Call1.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr1)).to.equal(amount.div(2));
      expect(await ACOToken1Token2Call2.balanceOf(_addr2)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr3)).to.equal(0);
      expect(await ACOToken1Token2Call2.balanceOf(_addr4)).to.equal(amount);
      expect(await ACOToken1Token2Call2.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr1)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr2)).to.equal(0);
      expect(await ACOToken1Token2Call3.balanceOf(_addr3)).to.equal(amount.mul(31));
      expect(await ACOToken1Token2Call3.balanceOf(_addr4)).to.equal(amount.mul(69));
      expect(await ACOToken1Token2Call3.balanceOf(_addr5)).to.equal(0);
      expect(await ACOToken1Token2Call4.balanceOf(_addr1)).to.equal(amount.mul(2));
      expect(await ACOToken1Token2Call4.balanceOf(_addr2)).to.equal(amount.mul(6));
      expect(await ACOToken1Token2Call4.balanceOf(_addr3)).to.equal(amount.mul(5));
      expect(await ACOToken1Token2Call4.balanceOf(_addr4)).to.equal(amount);
      expect(await ACOToken1Token2Call4.balanceOf(_addr5)).to.equal(amount.mul(6));
    });
  });
});