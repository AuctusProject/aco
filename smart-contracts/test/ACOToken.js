const { expect } = require("chai");
const factoryABI = require("../artifacts/ACOFactory.json");

describe("ACOToken", function() {
  let buidlerFactory;
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
  let price1;
  let buidlerT1T210000P;
  let price2;
  let time;
  let maxExercisedAccounts = 100;

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

    buidlerFactory = await ethers.getContractAt("ACOFactory", buidlerProxy.address);

    time = Math.round(new Date().getTime() / 1000) + 86400;
    price1 = ethers.utils.bigNumberify("3000000");
    let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, true, price1, time, maxExercisedAccounts)).wait();
    buidlerEthT1003C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken);  

    price2 = ethers.utils.bigNumberify("10000000000000000000000");
    tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, false, price2, time, maxExercisedAccounts)).wait();
    buidlerT1T210000P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken);  
  });

  describe("Mint transactions", function () {
    it("Check mint payable", async function () {
      let value1 = ethers.utils.bigNumberify("3500000000000000000");
      await buidlerEthT1003C.connect(addr1).mintPayable({value: value1});    
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(value1); 
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      let value2 = ethers.utils.bigNumberify("40000000000000000");
      await buidlerEthT1003C.connect(addr2).mintPayable({value: value2});

      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(value1.add(value2));

      let value3 = ethers.utils.bigNumberify("230000000000000000");
      await buidlerEthT1003C.connect(addr1).mintPayable({value: value3}); 
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(value1.add(value2).add(value3)); 
      
      await buidlerEthT1003C.connect(addr1).mintToPayable(await addr3.getAddress(), {value: value3}); 
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(value1.add(value3).add(value3));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);

      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(value3);

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3)); 
      
      await buidlerEthT1003C.connect(owner).mintToPayable(await addr2.getAddress(), {value: value3});  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(value1.add(value3).add(value3));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(value2.add(value3));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(value3);

      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(value3);

      expect(await buidlerEthT1003C.balanceOf(await owner.getAddress())).to.equal(value3);
      expect(await buidlerEthT1003C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3).add(value3)); 

      await buidlerEthT1003C.connect(addr1).mintToPayable(await addr1.getAddress(), {value: value3}); 
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(value1.add(value3).add(value3).add(value3));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3).add(value3));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3).add(value3));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(value2.add(value3));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(value3);

      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(value3);

      expect(await buidlerEthT1003C.balanceOf(await owner.getAddress())).to.equal(value3);
      expect(await buidlerEthT1003C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3).add(value3).add(value3)); 

      await buidlerEthT1003C.connect(owner).mintPayable({value: value2}); 
      expect(await buidlerEthT1003C.balanceOf(await owner.getAddress())).to.equal(value3.add(value2));
      expect(await buidlerEthT1003C.currentCollateral(await owner.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.unassignableCollateral(await owner.getAddress())).to.equal(value2);
      expect(await buidlerEthT1003C.assignableCollateral(await owner.getAddress())).to.equal(0);     

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3).add(value3).add(value3).add(value2)); 
    });
    it("Check fail to mint payable", async function () {
      let value1 = ethers.utils.bigNumberify("3500000000000000000");
      await expect(
        buidlerT1T210000P.connect(addr1).mintPayable({value: value1})
      ).to.be.revertedWith("ACOToken::mintPayable: Invalid call");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);

      await expect(
        buidlerT1T210000P.connect(addr1).mintToPayable(await addr2.getAddress(), {value: value1})
      ).to.be.revertedWith("ACOToken::mintToPayable: Invalid call");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);

      await expect(
        buidlerEthT1003C.connect(addr1).mintPayable({value: 0})
      ).to.be.revertedWith("ACOToken::_mintToken: Invalid collateral amount");
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);  

      await expect(
        buidlerEthT1003C.connect(addr1).mintToPayable(await addr2.getAddress(), {value: 0})
      ).to.be.revertedWith("ACOToken::_mintToken: Invalid collateral amount");
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);  

      await network.provider.send("evm_increaseTime", [86400]);

      await expect(
        buidlerEthT1003C.connect(addr1).mintPayable({value: value1})
      ).to.be.revertedWith("ACOToken::Expired");
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);  

      await expect(
        buidlerEthT1003C.connect(addr1).mintToPayable(await addr2.getAddress(), {value: value1})
      ).to.be.revertedWith("ACOToken::Expired");
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);

      await network.provider.send("evm_increaseTime", [-86400]);

      buidlerEthT1003C.connect(addr1).mintPayable({value: 1})
    });
    it("Check mint", async function () {
      await token2.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));
      await token2.transfer(await addr2.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));

      let precision = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("3400500000000000000000");
      let amount1 = value1.mul(precision).div(price2);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1);    
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1); 
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);

      let value2 = ethers.utils.bigNumberify("40000000000000000");
      let amount2 = value2.mul(precision).div(price2);
      await token2.connect(addr2).approve(buidlerT1T210000P.address, value2);
      await buidlerT1T210000P.connect(addr2).mint(value2);
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);

      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2));

      let value3 = ethers.utils.bigNumberify("23000000000000000000");
      let amount3 = value3.mul(precision).div(price2);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value3);
      await buidlerT1T210000P.connect(addr1).mint(value3); 
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.add(amount3));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);

      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2).add(value3)); 
      
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value3);
      await buidlerT1T210000P.connect(addr1).mintTo(await addr3.getAddress(), value3); 
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.add(amount3).add(amount3));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);

      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(value3);

      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3)); 
      
      await token2.connect(owner).approve(buidlerT1T210000P.address, value3);
      await buidlerT1T210000P.connect(owner).mintTo(await addr2.getAddress(), value3); 
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.add(amount3).add(amount3));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value2.add(value3));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(value3);

      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(value3);

      expect(await buidlerT1T210000P.balanceOf(await owner.getAddress())).to.equal(amount3);
      expect(await buidlerT1T210000P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3).add(value3)); 

      await token2.connect(addr1).approve(buidlerT1T210000P.address, value3);
      await buidlerT1T210000P.connect(addr1).mintTo(await addr1.getAddress(), value3); 
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.add(amount3).add(amount3).add(amount3));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value3).add(value3));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.add(value3).add(value3));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value2.add(value3));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(value3);

      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(value3);

      expect(await buidlerT1T210000P.balanceOf(await owner.getAddress())).to.equal(amount3);
      expect(await buidlerT1T210000P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3).add(value3).add(value3));

      await token2.connect(owner).approve(buidlerT1T210000P.address, value2);
      await buidlerT1T210000P.connect(owner).mint(value2); 
      expect(await buidlerT1T210000P.balanceOf(await owner.getAddress())).to.equal(amount3.add(amount2));
      expect(await buidlerT1T210000P.currentCollateral(await owner.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.unassignableCollateral(await owner.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await owner.getAddress())).to.equal(0);    

      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2).add(value3).add(value3).add(value3).add(value3).add(value2)); 
     
    });
    it("Check fail to mint", async function () {
      await token2.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));
      await token1.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("1000000000"));

      let value1 = ethers.utils.bigNumberify("35000000000000000000");
      await expect(
        buidlerEthT1003C.connect(addr1).mint(value1)
      ).to.be.revertedWith("ACOToken::mint: Invalid call");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);

      await expect(
        buidlerEthT1003C.connect(addr1).mintTo(await addr2.getAddress(), value1)
      ).to.be.revertedWith("ACOToken::mintTo: Invalid call");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);
      
      await expect(
        buidlerT1T210000P.connect(addr1).mint(value1)
      ).to.be.revertedWith("ACOToken::_transferFromERC2");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);

      await expect(
        buidlerT1T210000P.connect(addr1).mintTo(await addr2.getAddress(), value1)
      ).to.be.revertedWith("ACOToken::_transferFromERC2");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);

      await token1.connect(addr1).approve(buidlerT1T210000P.address, 50);

      await expect(
        buidlerT1T210000P.connect(addr1).mint(50)
      ).to.be.revertedWith("ACOToken::_transferFromERC2");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  

      await expect(
        buidlerT1T210000P.connect(addr1).mintTo(await addr2.getAddress(), 50)
      ).to.be.revertedWith("ACOToken::_transferFromERC2");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  

      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);

      await expect(
        buidlerT1T210000P.connect(addr1).mint(value1.add(1))
      ).to.be.revertedWith("ACOToken::_transferFromERC2");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);

      await expect(
        buidlerT1T210000P.connect(addr1).mintTo(await addr2.getAddress(), value1.add(1))
      ).to.be.revertedWith("ACOToken::_transferFromERC2");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);

      await expect(
        buidlerT1T210000P.connect(addr1).mint(0)
      ).to.be.revertedWith("ACOToken::_mintToken: Invalid collateral amount");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  

      await expect(
        buidlerT1T210000P.connect(addr1).mintTo(await addr2.getAddress(), 0)
      ).to.be.revertedWith("ACOToken::_mintToken: Invalid collateral amount");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  

      await network.provider.send("evm_increaseTime", [86400]);

      await expect(
        buidlerT1T210000P.connect(addr1).mint(value1)
      ).to.be.revertedWith("ACOToken::Expired");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  

      await expect(
        buidlerT1T210000P.connect(addr1).mintTo(await addr2.getAddress(), value1)
      ).to.be.revertedWith("ACOToken::Expired");
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  

      await network.provider.send("evm_increaseTime", [-86400]);
    });
  });

  describe("Transfer/Approve transactions", function() {
    it("Check transfer", async function () {
      let val1 = ethers.utils.bigNumberify("4975000000000000000");
      let val2 = ethers.utils.bigNumberify("999000000000000000");
      let val3 = ethers.utils.bigNumberify("70000000000000000");
      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1});    
      
      await buidlerEthT1003C.connect(addr1).transfer(await addr2.getAddress(), val2);
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val1);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(val1.sub(val2));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val1);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(val1.sub(val2));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);

      await buidlerEthT1003C.connect(addr2).transfer(await addr3.getAddress(), val2);
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val1);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(val1.sub(val2));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val1);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(val1.sub(val2));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      await buidlerEthT1003C.connect(addr3).transfer(await addr1.getAddress(), val3);
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val1);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(val1.sub(val2).add(val3));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val1);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(val1.sub(val2).add(val3));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(val2.sub(val3));
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(val2.sub(val3));
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      await token2.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));

      let precision = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("5000000000000000000000");
      let value2 = ethers.utils.bigNumberify("190000000000000000000");
      let value3 = ethers.utils.bigNumberify("110000000000000000000");
      let amount1 = value1.mul(precision).div(price2);
      let amount2 = value2.mul(precision).div(price2);
      let amount3 = value3.mul(precision).div(price2);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1);    
      
      await buidlerT1T210000P.connect(addr1).transfer(await addr2.getAddress(), amount2);
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.sub(amount2));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.sub(value2));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr2).transfer(await addr3.getAddress(), amount2);
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.sub(amount2));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.sub(value2));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr3).transfer(await addr1.getAddress(), amount3);
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.sub(amount2).add(amount3));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.sub(value2).add(value3));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(value2.sub(value3));
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(amount2.sub(amount3));
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(0);
    });
    it("Check fail to transfer", async function () {
      await token2.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));
      
      await expect(
        buidlerEthT1003C.connect(addr1).transfer(await addr2.getAddress(), 1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(addr1).transfer(await addr2.getAddress(), 1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      let amount1 = ethers.utils.bigNumberify("2000000000000000000");
      await buidlerEthT1003C.connect(addr1).mintPayable({value: amount1});
      let precision2 = ethers.utils.bigNumberify("100000000");
      let value2 = ethers.utils.bigNumberify("5000000000000000000000");
      let amount2 = value2.mul(precision2).div(price2);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value2);
      await buidlerT1T210000P.connect(addr1).mint(value2);  

      await expect(
        buidlerEthT1003C.connect(addr1).transfer(await addr2.getAddress(), amount1.add(1))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(addr1).transfer(await addr2.getAddress(), amount2.add(1))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await network.provider.send("evm_increaseTime", [86400]);

      await buidlerEthT1003C.connect(addr1).transfer(await addr2.getAddress(), amount1);

      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(amount1);
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount2);

      await network.provider.send("evm_increaseTime", [-86400]);
    });
    it("Check approve/transferFrom", async function () {
      await token2.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));

      let amt1 = ethers.utils.bigNumberify("21000000000000000000");
      let amt2 = ethers.utils.bigNumberify("3480000000000000000");
      await buidlerEthT1003C.connect(addr1).mintPayable({value: amt1.add(amt2)});
      let precision2 = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("5000000000000000000000");
      let amount1 = value1.mul(precision2).div(price2);
      let value2 = ethers.utils.bigNumberify("666000000000000000000");
      let amount2 = value2.mul(precision2).div(price2);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value2.add(value1));
      await buidlerT1T210000P.connect(addr1).mint(value2.add(value1));  

      await buidlerEthT1003C.connect(addr1).approve(await owner.getAddress(), amt1.add(amt2));
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr1).approve(await owner.getAddress(), amount1.add(amount2));
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(0);

      await buidlerEthT1003C.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amt2);
      await buidlerT1T210000P.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount2);

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(amt1.add(amt2));  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(amt1);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(amt1.add(amt2));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(amt1);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(amt2);
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(amt2);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2));  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value2));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      
      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amt1);
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1);

      await buidlerEthT1003C.connect(addr1).increaseAllowance(await owner.getAddress(), amt1);
      await buidlerT1T210000P.connect(addr1).increaseAllowance(await owner.getAddress(), amount1);

      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amt1.add(amt1));
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1.add(amount1));
      
      await buidlerEthT1003C.connect(addr1).approve(await owner.getAddress(), amt1);
      await buidlerT1T210000P.connect(addr1).approve(await owner.getAddress(), amount1);

      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amt1);
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1);
      
      await buidlerEthT1003C.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amt2);
      await buidlerT1T210000P.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount2);

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(amt1.add(amt2));  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(amt1.sub(amt2));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(amt1.add(amt2));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(amt1.sub(amt2));
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(amt2.add(amt2));
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(amt2.add(amt2));
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2));  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.sub(amount2));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1.add(value2));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value1.sub(value2));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(value2.add(value2));
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount2.add(amount2));
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);

      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amt1.sub(amt2));
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1.sub(amount2));

      await buidlerEthT1003C.connect(addr1).decreaseAllowance(await owner.getAddress(), amt2);
      await buidlerT1T210000P.connect(addr1).decreaseAllowance(await owner.getAddress(), amount2);

      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amt1.sub(amt2).sub(amt2));
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1.sub(amount2).sub(amount2));
    });
    it("Check fail to approve/transferFrom", async function () {
      await token2.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));
      
      await expect(
        buidlerEthT1003C.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), 1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), 1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      let amount1 = ethers.utils.bigNumberify("2000000000000000000");
      let precision2 = ethers.utils.bigNumberify("100000000");
      let value2 = ethers.utils.bigNumberify("5000000000000000000000");
      let amount2 = value2.mul(precision2).div(price2);

      await buidlerEthT1003C.connect(addr1).approve(await owner.getAddress(),  amount1.add(amount1));
      await buidlerT1T210000P.connect(addr1).approve(await owner.getAddress(), amount2.add(amount2));

      await expect(
        buidlerEthT1003C.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), 1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), 1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003C.connect(addr1).mintPayable({value: amount1});
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value2);
      await buidlerT1T210000P.connect(addr1).mint(value2);  

      await expect(
        buidlerEthT1003C.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount1.add(ethers.utils.bigNumberify("1")))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount2.add(ethers.utils.bigNumberify("1")))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003C.connect(addr1).approve(await owner.getAddress(),  amount1.sub(ethers.utils.bigNumberify("1")));
      await buidlerT1T210000P.connect(addr1).approve(await owner.getAddress(), amount2.sub(ethers.utils.bigNumberify("1")));

      await expect(
        buidlerEthT1003C.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount2)
      ).to.be.revertedWith("SafeMath: subtraction overflow");
      
      await network.provider.send("evm_increaseTime", [86400]);

      await buidlerEthT1003C.connect(addr1).approve(await owner.getAddress(), amount1);
      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1);
      
      await buidlerEthT1003C.connect(addr1).increaseAllowance(await owner.getAddress(), ethers.utils.bigNumberify("1"));
      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1.add(ethers.utils.bigNumberify("1")));
      
      await buidlerEthT1003C.connect(addr1).decreaseAllowance(await owner.getAddress(), ethers.utils.bigNumberify("1"));
      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(amount1);
      
      await buidlerEthT1003C.connect(owner).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount1);
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(amount1);

      await network.provider.send("evm_increaseTime", [-86400]);
    });
  });

  describe("Burn transactions", function() {
    it("Check burn", async function () {
      let val1 = ethers.utils.bigNumberify("4975000000000000000");
      let val2 = ethers.utils.bigNumberify("1075000000000000000");
      let val3 = ethers.utils.bigNumberify("75000000000000000");
      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1.add(val2)});    
      
      await buidlerEthT1003C.connect(addr1).burn(val1); 
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val2);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      await buidlerEthT1003C.connect(addr1).transfer(await addr2.getAddress(), val3);
      await buidlerEthT1003C.connect(addr1).burn(val2.sub(val3)); 
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val3);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(val3);

      let addr1Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), addr1Balance);

      let precision = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("5000000000000000000000");
      let value2 = ethers.utils.bigNumberify("190000000000000000000");
      let amount1 = value1.mul(precision).div(price2);
      let amount2 = value2.mul(precision).div(price2);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1.add(value2));
      await buidlerT1T210000P.connect(addr1).mint(value1.add(value2)); 
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value2).sub(value1));   
      
      await buidlerT1T210000P.connect(addr1).burn(amount1); 
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value2);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value2));

      await token2.transfer(await addr2.getAddress(), addr1Balance);
      await token2.connect(addr2).approve(buidlerT1T210000P.address, value2.div(2));
      await buidlerT1T210000P.connect(addr2).mint(value2.div(2));
      await buidlerT1T210000P.connect(addr2).transfer(await addr1.getAddress(), amount2.div(2));

      await buidlerT1T210000P.connect(addr1).burn(amount2); 
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value2.div(2));  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount2.div(2));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance);

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1.add(val2)});    

      await buidlerEthT1003C.connect(addr1).approve(await addr3.getAddress(), val1.add(val2)); 
      await buidlerEthT1003C.connect(addr3).burnFrom(await addr1.getAddress(), val1); 
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val3.add(val2));  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val3.add(val2));
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await addr3.getAddress())).to.equal(val2);
      
      await buidlerEthT1003C.connect(addr2).mintPayable({value: val1.add(val3)});   
      await buidlerEthT1003C.connect(addr2).transfer(await addr1.getAddress(), val1.add(val3)); 

      await buidlerEthT1003C.connect(addr3).burnFrom(await addr1.getAddress(), val2); 
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val3.add(val3).add(val1));  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(val1.add(val3));
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.allowance(await addr1.getAddress(), await addr3.getAddress())).to.equal(0);
      
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1.add(value2));
      await buidlerT1T210000P.connect(addr1).mint(value1.add(value2)); 
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value2).sub(value1));   
      
      await buidlerT1T210000P.connect(addr1).approve(await addr3.getAddress(), amount1.add(amount2)); 
      await buidlerT1T210000P.connect(addr3).burnFrom(await addr1.getAddress(), amount1.add(amount2.div(2))); 
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value2);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount2);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value2.div(2));
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value2.div(2));
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value1.add(value2)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(value1.add(value2.div(2)));
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await addr3.getAddress())).to.equal(amount2.div(2));

      await buidlerT1T210000P.connect(addr1).transfer(await addr2.getAddress(), amount2.div(2));
      await buidlerT1T210000P.connect(addr3).burnFrom(await addr1.getAddress(), amount2.div(2)); 
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value2.div(2));  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value1.add(value2)));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(value1.add(value2));
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr2).burn(amount2.div(2)); 
      await token2.transfer(await addr2.getAddress(), addr1Balance);
      await token2.connect(addr2).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr2).mint(value1);
      await buidlerT1T210000P.connect(addr2).transfer(await addr1.getAddress(), amount1);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value2);
      await buidlerT1T210000P.connect(addr1).mint(value2);
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value2.add(value1));  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(amount1.add(amount2));
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value1.add(value2)).sub(value2));
      expect(await buidlerT1T210000P.allowance(await addr1.getAddress(), await owner.getAddress())).to.equal(0);
    });
    it("Check fail to burn", async function () {
      await token2.transfer(await addr1.getAddress(), ethers.utils.bigNumberify("10000000000000000000000"));
      let val1 = ethers.utils.bigNumberify("75000000000000000");
      let precision = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("5000000000000000000000");
      let amount1 = value1.mul(precision).div(price2);

      await buidlerEthT1003C.connect(owner).mintPayable({value: val1}); 
      await buidlerEthT1003C.connect(owner).transfer(await addr1.getAddress(), val1);
      await buidlerEthT1003C.connect(addr1).approve(await owner.getAddress(), val1);
      await token2.connect(owner).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(owner).mint(value1); 
      await buidlerT1T210000P.connect(owner).transfer(await addr1.getAddress(), amount1);
      await buidlerT1T210000P.connect(addr1).approve(await owner.getAddress(), amount1);

      await expect(
        buidlerEthT1003C.connect(addr1).burn(val1)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await expect(
        buidlerT1T210000P.connect(addr1).burn(amount1)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await expect(
        buidlerEthT1003C.connect(owner).burnFrom(await addr1.getAddress(), val1)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await expect(
        buidlerT1T210000P.connect(owner).burnFrom(await addr1.getAddress(), amount1)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 
   
      await expect(
        buidlerEthT1003C.connect(addr1).burn(0)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: Invalid token amount");

      await expect(
        buidlerT1T210000P.connect(addr1).burn(0)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: Invalid token amount");

      await expect(
        buidlerEthT1003C.connect(owner).burnFrom(await addr1.getAddress(), 0)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: Invalid token amount");

      await expect(
        buidlerT1T210000P.connect(owner).burnFrom(await addr1.getAddress(), 0)
      ).to.be.revertedWith("ACOToken::_redeemCollateral: Invalid token amount");

      let one = ethers.utils.bigNumberify("1");  

      await expect(
        buidlerEthT1003C.connect(addr1).burn(val1.add(val1).add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(addr1).burn(amount1.add(amount1).add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerEthT1003C.connect(owner).burnFrom(await addr1.getAddress(), val1.add(val1).add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(owner).burnFrom(await addr1.getAddress(), amount1.add(amount1).add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003C.connect(addr1).transfer(await owner.getAddress(), val1.add(one).add(one));
      await buidlerT1T210000P.connect(addr1).transfer(await owner.getAddress(), amount1.add(one).add(one));

      await expect(
        buidlerEthT1003C.connect(addr1).burn(val1.sub(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(addr1).burn(amount1.sub(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerEthT1003C.connect(owner).burnFrom(await addr1.getAddress(), val1.sub(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(owner).burnFrom(await addr1.getAddress(), amount1.sub(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003C.connect(addr1).approve(await owner.getAddress(), one);
      await buidlerT1T210000P.connect(addr1).approve(await owner.getAddress(), one);

      await expect(
        buidlerEthT1003C.connect(owner).burnFrom(await addr1.getAddress(), one.add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(owner).burnFrom(await addr1.getAddress(), one.add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await network.provider.send("evm_increaseTime", [86400]);

      await expect(
        buidlerEthT1003C.connect(addr1).burn(one)
      ).to.be.revertedWith("ACOToken::Expired");

      await expect(
        buidlerT1T210000P.connect(addr1).burn(one)
      ).to.be.revertedWith("ACOToken::Expired");

      await expect(
        buidlerEthT1003C.connect(owner).burnFrom(await addr1.getAddress(), one)
      ).to.be.revertedWith("ACOToken::Expired");

      await expect(
        buidlerT1T210000P.connect(owner).burnFrom(await addr1.getAddress(), one)
      ).to.be.revertedWith("ACOToken::Expired");
      
      await network.provider.send("evm_increaseTime", [-86400]);
    });
  });
  
  describe("Exercise transactions", function() {
    it("Check exercise", async function () {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let val1 = ethers.utils.bigNumberify("2000000000000000000");
      let val2 = ethers.utils.bigNumberify("4000000000000000000");
      let val3 = ethers.utils.bigNumberify("1000000000000000000");
      let precision1 = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("2000000000000000000000");
      let value2 = ethers.utils.bigNumberify("4000000000000000000000");
      let value3 = ethers.utils.bigNumberify("1000000000000000000000");
      let amount1 = value1.mul(precision1).div(price2);
      let amount2 = value2.mul(precision1).div(price2);
      let amount3 = value3.mul(precision1).div(price2);
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("200000000");
      let v2 = ethers.utils.bigNumberify("400000000");
      let v3 = ethers.utils.bigNumberify("100000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);
      let a3 = v3.mul(precision2).div(price1);
      let one = ethers.utils.bigNumberify("1");

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 
      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await buidlerEthT1003P.connect(addr1).mint(v1); 

      await buidlerEthT1003C.connect(addr2).mintPayable({value: val2}); 
      await token2.connect(addr2).approve(buidlerT1T210000P.address, value2);
      await buidlerT1T210000P.connect(addr2).mint(value2); 
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await buidlerEthT1003P.connect(addr2).mint(v2); 

      await buidlerEthT1003C.connect(addr3).mintPayable({value: val3}); 
      await token2.connect(addr3).approve(buidlerT1T210000P.address, value3);
      await buidlerT1T210000P.connect(addr3).mint(value3);
      await token1.connect(addr3).approve(buidlerEthT1003P.address, v3);
      await buidlerEthT1003P.connect(addr3).mint(v3); 
      
      await buidlerEthT1003C.connect(addr1).transfer(await addr3.getAddress(), val3);
      await buidlerEthT1003C.connect(addr1).transfer(await owner.getAddress(), val3);
      await buidlerEthT1003C.connect(addr2).transfer(await addr3.getAddress(), val3);
      await buidlerEthT1003C.connect(addr2).transfer(await addr3.getAddress(), val3);
      await buidlerEthT1003C.connect(addr2).transfer(await addr3.getAddress(), val3);
      await buidlerT1T210000P.connect(addr1).transfer(await addr3.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr1).transfer(await owner.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr2).transfer(await addr3.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr2).transfer(await addr3.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr2).transfer(await addr3.getAddress(), amount3);
      await buidlerEthT1003P.connect(addr1).transfer(await addr3.getAddress(), a3);
      await buidlerEthT1003P.connect(addr1).transfer(await owner.getAddress(), a3);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a3);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a3);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a3);
      
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val1.add(val2).add(val3));  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(val3); 
      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(val2.add(val3));
      expect(await buidlerEthT1003C.balanceOf(await owner.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val1);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(val2);
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(val1);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(val3.add(val3).add(val3));
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await owner.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2).add(value3));  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount3); 
      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(amount2.add(amount3));
      expect(await buidlerT1T210000P.balanceOf(await owner.getAddress())).to.equal(amount3);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value2);
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(value3.add(value3).add(value3));
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.sub(value1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.sub(value2));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.sub(value3));

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v2).add(v3));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(a2.sub(a3.mul(ethers.utils.bigNumberify("3")))); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a3.add(a3.mul(ethers.utils.bigNumberify("4"))));
      expect(await buidlerEthT1003P.balanceOf(await owner.getAddress())).to.equal(a3);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(v1.sub(one));
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v2.sub(one));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3.sub(one));
      expect(await buidlerEthT1003P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v3.sub(one));
      expect(await buidlerEthT1003P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(v1.sub(one));
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(v3.add(v3).add(v3).sub(one));
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3));

      let e1 = val3.mul(price1).div(precision2);
      expect((await buidlerEthT1003C.getBaseExerciseData(val3))[1]).to.equal(e1);  
      await token1.connect(owner).approve(buidlerEthT1003C.address, e1.add(await buidlerEthT1003C.maxExercisedAccounts()));
      let b1 = await addr2.getBalance();
      await buidlerEthT1003C.connect(owner).exercise(val3);

      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val1.add(val2));  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(val3); 
      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(val2.add(val3));
      expect(await buidlerEthT1003C.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(val1);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(val2.sub(val3));
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(val1);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(val3.add(val3));
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).add(e1).add(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(ethers.utils.bigNumberify("3"))).sub(e1).sub(maxExercisedAccounts));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.sub(value1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.sub(value2));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.sub(value3));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(ethers.utils.bigNumberify("3"))));
      expect(await addr2.getBalance()).to.equal(b1.add(val3.mul(fee).div(100000)));

      expect((await buidlerT1T210000P.getBaseExerciseData(amount3))[1]).to.equal(amount3);  
      await token1.connect(owner).approve(buidlerT1T210000P.address, amount3.add(await buidlerT1T210000P.maxExercisedAccounts()));
      await buidlerT1T210000P.connect(owner).exercise(amount3);
      let fee2 = value3.mul(fee).div(100000);
 
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1.add(value2));  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount3); 
      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(amount2.add(amount3));
      expect(await buidlerT1T210000P.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value2.sub(value3));
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(value1);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(value3.add(value3));
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).add(e1).add(amount3).add(1).add(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(ethers.utils.bigNumberify("3"))).sub(e1).sub(amount3).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.sub(value1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.sub(value2).add(fee2));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.sub(value3));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(ethers.utils.bigNumberify("3"))).add(value3).sub(fee2));

      expect((await buidlerEthT1003P.getBaseExerciseData(a3))[1]).to.equal(a3);  
      await buidlerEthT1003P.connect(owner).exercise(a3, {value: a3.add(await buidlerEthT1003P.maxExercisedAccounts())});
      let fee3 = v3.mul(fee).div(100000);
 
      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v2).add(one));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(a2.sub(a3.mul(ethers.utils.bigNumberify("3")))); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a3.add(a3.mul(ethers.utils.bigNumberify("4"))));
      expect(await buidlerEthT1003P.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(v1.sub(one));
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v2.sub(v3));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3.sub(one));
      expect(await buidlerEthT1003P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v3.sub(one));
      expect(await buidlerEthT1003P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(v1.sub(one));
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(v3.add(v3).sub(one));
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).add(e1).add(amount3).add(fee3).sub(one).add(1).add(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(ethers.utils.bigNumberify("3"))).sub(e1).sub(amount3).add(v3).sub(fee3).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.sub(value1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.sub(value2).add(fee2));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.sub(value3));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(ethers.utils.bigNumberify("3"))).add(value3).sub(fee2));

      let e2 = val2.mul(price1).div(precision2);
      expect((await buidlerEthT1003C.getBaseExerciseData(val2))[1]).to.equal(e2);  
      let b2 = await addr2.getBalance();
      await token1.connect(addr3).approve(buidlerEthT1003C.address, e2.add(await buidlerEthT1003C.maxExercisedAccounts()));
      await buidlerEthT1003C.connect(addr3).exercise(val2);
      
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(val1);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003C.balanceOf(await addr2.getAddress())).to.equal(val3); 
      expect(await buidlerEthT1003C.balanceOf(await addr3.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr2.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.currentCollateral(await addr3.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr2.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr3.getAddress())).to.equal(val3);
      expect(await buidlerEthT1003C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).add(e2.div(ethers.utils.bigNumberify("2"))).add(1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).add(e1).add(amount3).add(fee3).sub(one).add(e2.div(ethers.utils.bigNumberify("2"))).add(1).add(1).add(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(e2).sub(maxExercisedAccounts));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(ethers.utils.bigNumberify("3"))).sub(e1).sub(amount3).add(v3).sub(fee3).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.sub(value1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.sub(value2).add(fee2));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.sub(value3));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(ethers.utils.bigNumberify("3"))).add(value3).sub(fee2));
      expect(await addr2.getBalance()).to.equal(b2.add(val2.mul(fee).div(100000)));

      expect((await buidlerT1T210000P.getBaseExerciseData(amount2))[1]).to.equal(amount2);  
      await token1.connect(addr3).approve(buidlerT1T210000P.address, amount2.add(await buidlerT1T210000P.maxExercisedAccounts()));
      await buidlerT1T210000P.connect(addr3).exercise(amount2);
      let fee4 = value2.mul(fee).div(100000);
      
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(value1);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000P.balanceOf(await addr2.getAddress())).to.equal(amount3); 
      expect(await buidlerT1T210000P.balanceOf(await addr3.getAddress())).to.equal(amount3);
      expect(await buidlerT1T210000P.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr2.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.currentCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr2.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr3.getAddress())).to.equal(value3);
      expect(await buidlerT1T210000P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).add(e2.add(amount2).div(ethers.utils.bigNumberify("2"))).add(1).add(1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).add(e1).add(amount3).add(fee3).sub(one).add(e2.add(amount2).div(ethers.utils.bigNumberify("2"))).add(1).add(1).add(1).add(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(e2).sub(amount2).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(ethers.utils.bigNumberify("3"))).sub(e1).sub(amount3).add(v3).sub(fee3).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.sub(value1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.sub(value2).add(fee2).add(fee4));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.sub(value3).add(value2).sub(fee4));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(ethers.utils.bigNumberify("3"))).add(value3).sub(fee2));

      let amt = a3.mul(ethers.utils.bigNumberify("4"));
      expect((await buidlerEthT1003P.getBaseExerciseData(amt))[1]).to.equal(amt);  
      await buidlerEthT1003P.connect(addr3).exercise(amt, {value: amt.add(await buidlerEthT1003P.maxExercisedAccounts())});
      let t = amt.mul(price1).div(precision2);
      let fee5 = t.mul(fee).div(100000);

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(one).add(one));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(a2.sub(a3.mul(ethers.utils.bigNumberify("3")))); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a3);
      expect(await buidlerEthT1003P.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3.sub(one));
      expect(await buidlerEthT1003P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v3.sub(one));
      expect(await buidlerEthT1003P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).add(e2.add(amount2).div(ethers.utils.bigNumberify("2"))).add(1).add(1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).add(e1).add(amount3).add(fee3).add(fee5).sub(one).add(e2.add(amount2).div(ethers.utils.bigNumberify("2"))).add(1).add(1).add(1).add(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(e2).sub(amount2).add(t).sub(fee5).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(ethers.utils.bigNumberify("3"))).sub(e1).sub(amount3).add(v3).sub(fee3).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.sub(value1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.sub(value2).add(fee2).add(fee4));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.sub(value3).add(value2).sub(fee4));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(ethers.utils.bigNumberify("3"))).add(value3).sub(fee2));
    });
    it("Check fail to exercise", async function () {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let val1 = ethers.utils.bigNumberify("2000000000000000000");
      let val2 = ethers.utils.bigNumberify("4000000000000000000");
      let val3 = ethers.utils.bigNumberify("1000000000000000000");
      let precision1 = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("2000000000000000000000");
      let value2 = ethers.utils.bigNumberify("4000000000000000000000");
      let value3 = ethers.utils.bigNumberify("1000000000000000000000");
      let amount1 = value1.mul(precision1).div(price2);
      let amount2 = value2.mul(precision1).div(price2);
      let amount3 = value3.mul(precision1).div(price2);
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("200000000");
      let v2 = ethers.utils.bigNumberify("400000000");
      let v3 = ethers.utils.bigNumberify("100000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);
      let a3 = v3.mul(precision2).div(price1);
      let one = ethers.utils.bigNumberify("1");

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 
      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await buidlerEthT1003P.connect(addr1).mint(v1); 

      await buidlerEthT1003C.connect(addr2).mintPayable({value: val2}); 
      await token2.connect(addr2).approve(buidlerT1T210000P.address, value2);
      await buidlerT1T210000P.connect(addr2).mint(value2); 
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await buidlerEthT1003P.connect(addr2).mint(v2); 

      await buidlerEthT1003C.connect(addr3).mintPayable({value: val3}); 
      await token2.connect(addr3).approve(buidlerT1T210000P.address, value3);
      await buidlerT1T210000P.connect(addr3).mint(value3);
      await token1.connect(addr3).approve(buidlerEthT1003P.address, v3);
      await buidlerEthT1003P.connect(addr3).mint(v3); 
      
      await buidlerEthT1003C.connect(addr1).transfer(await addr3.getAddress(), val3);
      await buidlerEthT1003C.connect(addr1).transfer(await owner.getAddress(), val3);
      await buidlerEthT1003C.connect(addr2).transfer(await addr3.getAddress(), val3);
      await buidlerEthT1003C.connect(addr2).transfer(await addr3.getAddress(), val3);
      await buidlerEthT1003C.connect(addr2).transfer(await addr3.getAddress(), val3);
      await buidlerT1T210000P.connect(addr1).transfer(await addr3.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr1).transfer(await owner.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr2).transfer(await addr3.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr2).transfer(await addr3.getAddress(), amount3);
      await buidlerT1T210000P.connect(addr2).transfer(await addr3.getAddress(), amount3);
      await buidlerEthT1003P.connect(addr1).transfer(await addr3.getAddress(), a3);
      await buidlerEthT1003P.connect(addr1).transfer(await owner.getAddress(), a3);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a3);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a3);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a3);
      
      await expect(
        buidlerEthT1003C.connect(owner).exercise(0)
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerT1T210000P.connect(owner).exercise(0)
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerEthT1003P.connect(owner).exercise(0)
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerEthT1003P.connect(owner).exercise(a3, {value: a3})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      await expect(
        buidlerEthT1003P.connect(owner).exercise(a3, {value: a3.add(await buidlerEthT1003P.maxExercisedAccounts()).add(one)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      await expect(
        buidlerEthT1003P.connect(owner).exercise(a3, {value: a3.add(await buidlerEthT1003P.maxExercisedAccounts()).sub(one)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      await expect(
        buidlerEthT1003C.connect(owner).exercise(val3)
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      let e1 = val3.mul(price1).div(precision2);
      await token1.connect(owner).approve(buidlerEthT1003C.address, e1);
      await expect(
        buidlerEthT1003C.connect(owner).exercise(val3)
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await token1.connect(owner).approve(buidlerEthT1003C.address, e1.add(await buidlerEthT1003C.maxExercisedAccounts()).sub(one));
      await expect(
        buidlerEthT1003C.connect(owner).exercise(val3)
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await expect(
        buidlerT1T210000P.connect(owner).exercise(amount3)
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await token1.connect(owner).approve(buidlerT1T210000P.address, amount3);
      await expect(
        buidlerT1T210000P.connect(owner).exercise(amount3)
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await token1.connect(owner).approve(buidlerT1T210000P.address, amount3.add(await buidlerT1T210000P.maxExercisedAccounts()).sub(one));
      await expect(
        buidlerT1T210000P.connect(owner).exercise(amount3)
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await token1.connect(owner).approve(buidlerEthT1003C.address, e1.add(e1));
      await expect(
        buidlerEthT1003C.connect(owner).exercise(val3.add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token1.connect(owner).approve(buidlerT1T210000P.address, amount3.add(await buidlerT1T210000P.maxExercisedAccounts()).add(one));
      await expect(
        buidlerT1T210000P.connect(owner).exercise(amount3.add(one))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerEthT1003P.connect(owner).exercise(a3.add(one), {value: a3.add(await buidlerEthT1003P.maxExercisedAccounts()).add(one)})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token1.connect(owner).approve(buidlerEthT1003C.address, e1.add(await buidlerEthT1003C.maxExercisedAccounts()));
      await token1.connect(owner).approve(buidlerT1T210000P.address, amount3.add(await buidlerT1T210000P.maxExercisedAccounts()));

      await expect(
        buidlerEthT1003C.connect(owner).exercise(val3, {value: one})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: No ether expected");

      await expect(
        buidlerT1T210000P.connect(owner).exercise(amount3, {value: one})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: No ether expected");

      let four = ethers.utils.bigNumberify("4");
      await buidlerEthT1003C.connect(addr3).transfer(await owner.getAddress(), val3.mul(four));
      await buidlerT1T210000P.connect(addr3).transfer(await owner.getAddress(), amount3.mul(four));
      await buidlerEthT1003P.connect(addr3).transfer(await owner.getAddress(), a3.mul(four));

      let e2 = val3.mul(price1).div(precision2);
      await token1.connect(addr3).approve(buidlerEthT1003C.address, e2.add(await buidlerEthT1003C.maxExercisedAccounts()));
      await expect(
        buidlerEthT1003C.connect(addr3).exercise(val3)
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");

      await token1.connect(addr3).approve(buidlerT1T210000P.address, amount3.add(await buidlerT1T210000P.maxExercisedAccounts()));
      await expect(
        buidlerT1T210000P.connect(addr3).exercise(amount3)
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");
      ;
      await expect(
        buidlerEthT1003P.connect(addr3).exercise(a3, {value: a3.add(await buidlerEthT1003P.maxExercisedAccounts())})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available"); 
      
      await buidlerEthT1003C.connect(addr3).transfer(await owner.getAddress(), four);
      await buidlerT1T210000P.connect(addr3).transfer(await owner.getAddress(), four);
      await buidlerEthT1003P.connect(addr3).transfer(await owner.getAddress(), four);

      await expect(
        buidlerEthT1003C.connect(addr3).exercise(1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerT1T210000P.connect(addr3).exercise(1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");
      ;
      await expect(
        buidlerEthT1003P.connect(addr3).exercise(1, {value: one.add(await buidlerEthT1003P.maxExercisedAccounts())})
      ).to.be.revertedWith("SafeMath: subtraction overflow");  
      
      await token1.connect(owner).approve(buidlerEthT1003C.address, e1.add(await buidlerEthT1003C.maxExercisedAccounts()));
      await token1.connect(owner).approve(buidlerT1T210000P.address, amount3.add(await buidlerT1T210000P.maxExercisedAccounts()));

      await network.provider.send("evm_increaseTime", [86400]);

      await expect(
        buidlerEthT1003C.connect(owner).exercise(val3)
      ).to.be.revertedWith("ACOToken::Expired");

      await expect(
        buidlerT1T210000P.connect(owner).exercise(amount3)
      ).to.be.revertedWith("ACOToken::Expired");
      
      await expect(
        buidlerT1T210000P.connect(owner).exercise(a3, {value: a3.add(await buidlerT1T210000P.maxExercisedAccounts())})
      ).to.be.revertedWith("ACOToken::Expired");

      await network.provider.send("evm_increaseTime", [-86400]);
    });
    it("Check exercise from", async function() {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let precision1 = ethers.utils.bigNumberify("100000000");
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("100000000");
      let v2 = ethers.utils.bigNumberify("200000000");
      let v3 = ethers.utils.bigNumberify("300000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);
      let a3 = v3.mul(precision2).div(price1);

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, true, price2, time, maxExercisedAccounts)).wait();
      let buidlerT1T210000C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await token1.connect(addr3).approve(buidlerEthT1003P.address, v3);
      await buidlerEthT1003P.connect(addr1).mint(v1); 
      await buidlerEthT1003P.connect(addr2).mint(v2); 
      await buidlerEthT1003P.connect(addr3).mint(v3); 
      await token1.connect(addr1).approve(buidlerT1T210000C.address, v1);
      await token1.connect(addr2).approve(buidlerT1T210000C.address, v2);
      await token1.connect(addr3).approve(buidlerT1T210000C.address, v3);
      await buidlerT1T210000C.connect(addr1).mint(v1); 
      await buidlerT1T210000C.connect(addr2).mint(v2); 
      await buidlerT1T210000C.connect(addr3).mint(v3); 

      await buidlerEthT1003P.connect(addr1).transfer(await addr3.getAddress(), a1);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a1);
      await buidlerT1T210000C.connect(addr1).transfer(await addr3.getAddress(), v1);
      await buidlerT1T210000C.connect(addr2).transfer(await addr3.getAddress(), v1);
      
      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v2).add(v3));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(a2.sub(a1)); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a3.add(a1).add(a1));
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v2.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(v2.sub(v1).sub(1));
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v1.add(v2).add(v3));  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(v2.sub(v1)); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(v3.add(v1).add(v1));
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(v2.sub(v1));
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)));

      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1.add(v1));

      let e1 = (v1.add(v1)).mul(price2).div(precision1);
      expect((await buidlerEthT1003P.getBaseExerciseData(a1.add(a1)))[1]).to.equal(a1.add(a1)); 
      expect((await buidlerT1T210000C.getBaseExerciseData(v1.add(v1)))[1]).to.equal(e1);  

      let b1 = await addr1.getBalance();
      let b2 = await addr2.getBalance();
      let b3 = await addr3.getBalance();
      await buidlerEthT1003P.connect(owner).exerciseFrom(await addr3.getAddress(), a1.add(a1), {value: a1.add(a1).add(await buidlerEthT1003P.maxExercisedAccounts())});
      let fee1 = v1.add(v1).mul(fee).div(100000);

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v3).add(1));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(a2.sub(a1)); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a3);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)));
      expect(await addr1.getBalance()).to.equal(b1.add(a1).add(1));
      expect(await addr2.getBalance()).to.equal(b2.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b3);

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(await buidlerT1T210000C.maxExercisedAccounts()));
      await buidlerT1T210000C.connect(owner).exerciseFrom(await addr3.getAddress(), v1.add(v1));

      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v1.add(v3));  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(v2.sub(v1)); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(maxExercisedAccounts));
      expect(await addr1.getBalance()).to.equal(b1.add(a1).add(1));
      expect(await addr2.getBalance()).to.equal(b2.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b3);

      await buidlerEthT1003P.connect(addr2).transfer(await addr1.getAddress(), a1);
      await buidlerEthT1003P.connect(addr3).transfer(await addr1.getAddress(), a1);
      await buidlerT1T210000C.connect(addr2).transfer(await addr1.getAddress(), v1);
      await buidlerT1T210000C.connect(addr3).transfer(await addr1.getAddress(), v1);

      await buidlerEthT1003P.connect(addr1).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr1).approve(await owner.getAddress(), v1.add(v1));

      expect((await buidlerEthT1003P.getBaseExerciseData(a1.add(a1)))[1]).to.equal(a1.add(a1)); 
      expect((await buidlerT1T210000C.getBaseExerciseData(v1.add(v1)))[1]).to.equal(e1);  

      let b11 = await addr1.getBalance();
      let b21 = await addr2.getBalance();
      let b31 = await addr3.getBalance();
      await buidlerEthT1003P.connect(owner).exerciseFrom(await addr1.getAddress(), a1.add(a1), {value: a1.add(a1).add(await buidlerEthT1003P.maxExercisedAccounts())});

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v2.add(1).add(1));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a2.add(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);
      
      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee1).sub(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(maxExercisedAccounts));
      expect(await addr1.getBalance()).to.equal(b11);
      expect(await addr2.getBalance()).to.equal(b21.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b31.add(a1).add(1));

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(await buidlerT1T210000C.maxExercisedAccounts()));
      await buidlerT1T210000C.connect(owner).exerciseFrom(await addr1.getAddress(), v1.add(v1));

      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v2);  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee1).sub(1).add(fee1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1).add(1).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(e1).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await addr1.getBalance()).to.equal(b11);
      expect(await addr2.getBalance()).to.equal(b21.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b31.add(a1).add(1));

      await buidlerEthT1003P.connect(addr3).transfer(await addr1.getAddress(), a2.add(1));
      await buidlerT1T210000C.connect(addr3).transfer(await addr1.getAddress(), v2);

      await buidlerEthT1003P.connect(addr1).approve(await owner.getAddress(), a2.add(1));
      await buidlerT1T210000C.connect(addr1).approve(await owner.getAddress(), v2);

      let e2 = v2.mul(price2).div(precision1);
      expect((await buidlerEthT1003P.getBaseExerciseData(a2.add(1)))[1]).to.equal(a2.add(1)); 
      expect((await buidlerT1T210000C.getBaseExerciseData(v2))[1]).to.equal(e2);  

      let b12 = await addr1.getBalance();
      let b22 = await addr2.getBalance();
      let b32 = await addr3.getBalance();
      await buidlerEthT1003P.connect(owner).exerciseFrom(await addr1.getAddress(), a2.add(1), {value: a2.add(await buidlerEthT1003P.maxExercisedAccounts()).add(1)});

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(2);  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee1).sub(1).add(fee1).add(fee1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v2).sub(fee1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1).add(1).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(e1).sub(maxExercisedAccounts).sub(maxExercisedAccounts));
      expect(await addr1.getBalance()).to.equal(b12);
      expect(await addr2.getBalance()).to.equal(b22);
      expect(await addr3.getBalance()).to.equal(b32.add(a2.add(1)).add(1));

      await token2.connect(owner).approve(buidlerT1T210000C.address, e2.add(await buidlerT1T210000C.maxExercisedAccounts()));
      await buidlerT1T210000C.connect(owner).exerciseFrom(await addr1.getAddress(), v2);

      expect(await buidlerT1T210000C.totalCollateral()).to.equal(0);  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee1).sub(1).add(fee1).add(fee1).add(fee1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v1).add(v1).sub(fee1).add(v2).sub(fee1).add(v2).sub(fee1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1).add(1).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(e2).add(1).add(1));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(e1).sub(e2).sub(maxExercisedAccounts).sub(maxExercisedAccounts).sub(maxExercisedAccounts));

      expect(await addr1.getBalance()).to.equal(b12);
      expect(await addr2.getBalance()).to.equal(b22);
      expect(await addr3.getBalance()).to.equal(b32.add(a2.add(1)).add(1));
    });
    it("Check fail to exercise from", async function() {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let precision1 = ethers.utils.bigNumberify("100000000");
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("100000000");
      let v2 = ethers.utils.bigNumberify("200000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, true, price2, time, maxExercisedAccounts)).wait();
      let buidlerT1T210000C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await buidlerEthT1003P.connect(addr1).mint(v1); 
      await buidlerEthT1003P.connect(addr2).mint(v2); 
      await token1.connect(addr1).approve(buidlerT1T210000C.address, v1);
      await token1.connect(addr2).approve(buidlerT1T210000C.address, v2);
      await buidlerT1T210000C.connect(addr1).mint(v1); 
      await buidlerT1T210000C.connect(addr2).mint(v2); 

      await buidlerEthT1003P.connect(addr1).transfer(await addr3.getAddress(), a1);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a1);
      await buidlerT1T210000C.connect(addr1).transfer(await addr3.getAddress(), v1);
      await buidlerT1T210000C.connect(addr2).transfer(await addr3.getAddress(), v1);

      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1.add(v1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr3.getAddress(), 0)
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr3.getAddress(), 0)
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr3.getAddress(), a1.add(a1), {value: a1.add(a1).add(maxExercisedAccounts).sub(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr3.getAddress(), a1.add(a1), {value: a1.add(a1).add(maxExercisedAccounts).add(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1);
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1);
      let e1 = (v1.add(v1)).mul(price2).div(precision1);

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr3.getAddress(), a1.add(a1), {value: a1.add(a1).add(maxExercisedAccounts)})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(maxExercisedAccounts));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr3.getAddress(), v1.add(v1))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1.add(v1));
      
      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(maxExercisedAccounts).sub(1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr3.getAddress(), v1.add(v1))
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr3.getAddress(), a1.add(a1).add(1), {value: a1.add(a1).add(maxExercisedAccounts).add(1)})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(e1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr3.getAddress(), v1.add(v1).add(1))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr3.getAddress(), v1.add(v1), {value: 1})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: No ether expected");

      await buidlerEthT1003P.connect(addr2).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr2).approve(await owner.getAddress(), v1.add(v1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr2.getAddress(), a1.add(1), {value: a1.add(maxExercisedAccounts).add(1)})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(e1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr2.getAddress(), v1.add(1))
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003P.connect(addr3).transfer(await addr1.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr3).transfer(await addr1.getAddress(), v1.add(v1));

      await buidlerEthT1003P.connect(addr1).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr1).approve(await owner.getAddress(), v1.add(v1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr1.getAddress(), a1.add(1), {value: a1.add(maxExercisedAccounts).add(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(e1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr1.getAddress(), v1.add(1))
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");

      await network.provider.send("evm_increaseTime", [86400]);

      await expect(
        buidlerEthT1003P.connect(owner).exerciseFrom(await addr2.getAddress(), a1, {value: a1.add(maxExercisedAccounts)})
      ).to.be.revertedWith("ACOToken::Expired");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseFrom(await addr2.getAddress(), v1)
      ).to.be.revertedWith("ACOToken::Expired");

      await network.provider.send("evm_increaseTime", [-86400]);
    });
    it("Check exercise accounts", async function () {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let precision1 = ethers.utils.bigNumberify("100000000");
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("100000000");
      let v2 = ethers.utils.bigNumberify("200000000");
      let v3 = ethers.utils.bigNumberify("300000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);
      let a3 = v3.mul(precision2).div(price1);

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, true, price2, time, maxExercisedAccounts)).wait();
      let buidlerT1T210000C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await token1.connect(addr3).approve(buidlerEthT1003P.address, v3);
      await buidlerEthT1003P.connect(addr1).mint(v1); 
      await buidlerEthT1003P.connect(addr2).mint(v2); 
      await buidlerEthT1003P.connect(addr3).mint(v3); 
      await token1.connect(addr1).approve(buidlerT1T210000C.address, v1);
      await token1.connect(addr2).approve(buidlerT1T210000C.address, v2);
      await token1.connect(addr3).approve(buidlerT1T210000C.address, v3);
      await buidlerT1T210000C.connect(addr1).mint(v1); 
      await buidlerT1T210000C.connect(addr2).mint(v2); 
      await buidlerT1T210000C.connect(addr3).mint(v3); 

      await buidlerEthT1003P.connect(addr1).transfer(await owner.getAddress(), a1);
      await buidlerEthT1003P.connect(addr2).transfer(await owner.getAddress(), a1);
      await buidlerEthT1003P.connect(addr3).transfer(await owner.getAddress(), a3);
      await buidlerT1T210000C.connect(addr1).transfer(await owner.getAddress(), v1);
      await buidlerT1T210000C.connect(addr2).transfer(await owner.getAddress(), v1);
      await buidlerT1T210000C.connect(addr3).transfer(await owner.getAddress(), v3);
      
      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v2).add(v3));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(a2.sub(a1)); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.balanceOf(await owner.getAddress())).to.equal(a1.add(a1).add(a3));
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v2.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(v2.sub(v1).sub(1));
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.assignableCollateral(await owner.getAddress())).to.equal(0);
      
      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v1.add(v2).add(v3));  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(v2.sub(v1)); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.balanceOf(await owner.getAddress())).to.equal(v3.add(v1).add(v1));
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(v2.sub(v1));
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);

      let e1 = (v1.add(v1)).mul(price2).div(precision1);
      expect((await buidlerEthT1003P.getBaseExerciseData(a1.add(a1)))[1]).to.equal(a1.add(a1)); 
      expect((await buidlerT1T210000C.getBaseExerciseData(v1.add(v1)))[1]).to.equal(e1);  

      let b1 = await addr1.getBalance();
      let b2 = await addr2.getBalance();
      let b3 = await addr3.getBalance();
      await buidlerEthT1003P.connect(owner).exerciseAccounts(a1.add(a1), [await addr2.getAddress(), await addr1.getAddress()], {value: a1.add(a1).add(2)});
      let fee1 = v1.add(v1).mul(fee).div(100000);

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v3).add(1));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(a2.sub(a1)); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.balanceOf(await owner.getAddress())).to.equal(a3);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await addr1.getBalance()).to.equal(b1.add(a1).add(1));
      expect(await addr2.getBalance()).to.equal(b2.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b3);

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2));
      await buidlerT1T210000C.connect(owner).exerciseAccounts(v1.add(v1), [await addr2.getAddress(), await addr1.getAddress()]);
      
      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v1.add(v3));  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(v1); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.balanceOf(await owner.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await addr1.getBalance()).to.equal(b1.add(a1).add(1));
      expect(await addr2.getBalance()).to.equal(b2.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b3);

      await buidlerEthT1003P.connect(addr2).transfer(await owner.getAddress(), a2.sub(a1));
      await buidlerT1T210000C.connect(addr2).transfer(await owner.getAddress(), v1);

      let e2 = v3.mul(price2).div(precision1);
      expect((await buidlerEthT1003P.getBaseExerciseData(a3))[1]).to.equal(a3); 
      expect((await buidlerT1T210000C.getBaseExerciseData(v3))[1]).to.equal(e2);  

      let b11 = await addr1.getBalance();
      let b21 = await addr2.getBalance();
      let b31 = await addr3.getBalance();
      await buidlerEthT1003P.connect(owner).exerciseAccounts(a3, [await addr1.getAddress(), await addr2.getAddress(), await addr3.getAddress()], {value: a3.add(3)});
      let fee2 = v3.mul(fee).div(100000);

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(1));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.balanceOf(await owner.getAddress())).to.equal(a1);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee2));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await addr1.getBalance()).to.equal(b11);
      expect(await addr2.getBalance()).to.equal(b21.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b31.add(a2).add(1).add(1));

      await token2.connect(owner).approve(buidlerT1T210000C.address, e2.add(3));
      await buidlerT1T210000C.connect(owner).exerciseAccounts(v3, [await addr1.getAddress(), await addr2.getAddress(), await addr3.getAddress()]);
      
      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v1);  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.balanceOf(await owner.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await owner.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.assignableCollateral(await owner.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee2).add(fee2));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(e2.div(3)).add(1).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.add(e2.div(3).mul(2)).add(1));
      expect(await addr1.getBalance()).to.equal(b11);
      expect(await addr2.getBalance()).to.equal(b21.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b31.add(a2).add(1).add(1));
    });
    it("Check fail to exercise accounts", async function () {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let precision1 = ethers.utils.bigNumberify("100000000");
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("100000000");
      let v2 = ethers.utils.bigNumberify("200000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, true, price2, time, maxExercisedAccounts)).wait();
      let buidlerT1T210000C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await buidlerEthT1003P.connect(addr1).mint(v1); 
      await buidlerEthT1003P.connect(addr2).mint(v2); 
      await token1.connect(addr1).approve(buidlerT1T210000C.address, v1);
      await token1.connect(addr2).approve(buidlerT1T210000C.address, v2);
      await buidlerT1T210000C.connect(addr1).mint(v1); 
      await buidlerT1T210000C.connect(addr2).mint(v2); 

      await buidlerEthT1003P.connect(addr1).transfer(await owner.getAddress(), a1);
      await buidlerEthT1003P.connect(addr2).transfer(await owner.getAddress(), a1);
      await buidlerT1T210000C.connect(addr1).transfer(await owner.getAddress(), v1);
      await buidlerT1T210000C.connect(addr2).transfer(await owner.getAddress(), v1);

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccounts(0, [await addr1.getAddress()])
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccounts(0, [await addr1.getAddress()])
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccounts(a1.add(a1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(2).sub(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccounts(a1.add(a1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(2).add(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      let e1 = (v1.add(v1)).mul(price2).div(precision1);
      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2).sub(1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccounts(v1.add(v1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccounts(a1.add(a1).add(1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(2).add(1)})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccounts(a1.add(a1), [await addr1.getAddress(), await addr3.getAddress()], {value: a1.add(a1).add(2)})
      ).to.be.revertedWith("ACOToken::_exerciseAccounts: Invalid remaining amount");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(e1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccounts(v1.add(v1).add(1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccounts(v1.add(v1), [await addr1.getAddress(), await addr2.getAddress()], {value: 1})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: No ether expected");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccounts(v1.add(v1), [await addr1.getAddress(), await addr3.getAddress()])
      ).to.be.revertedWith("ACOToken::_exerciseAccounts: Invalid remaining amount");

      await expect(
        buidlerEthT1003P.connect(addr2).exerciseAccounts(1, [await addr1.getAddress(), await addr2.getAddress()], {value: 2 + 1})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(addr2).approve(buidlerT1T210000C.address, e1.add(2));
      await expect(
        buidlerT1T210000C.connect(addr2).exerciseAccounts(1, [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003P.connect(owner).transfer(await addr2.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(owner).transfer(await addr2.getAddress(), v1.add(v1));

      await expect(
        buidlerEthT1003P.connect(addr2).exerciseAccounts(a1.add(1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(2).add(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");

      await token2.connect(addr2).approve(buidlerT1T210000C.address, e1.add(e1));
      await expect(
        buidlerT1T210000C.connect(addr2).exerciseAccounts(v1.add(1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");

      await network.provider.send("evm_increaseTime", [86400]);

      await expect(
        buidlerEthT1003P.connect(addr2).exerciseAccounts(a1.sub(1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(2).sub(1)})
      ).to.be.revertedWith("ACOToken::Expired");

      await expect(
        buidlerT1T210000C.connect(addr2).exerciseAccounts(v1.sub(1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("ACOToken::Expired");

      await network.provider.send("evm_increaseTime", [-86400]);
    });
    it("Check exercise accounts from", async function () {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let precision1 = ethers.utils.bigNumberify("100000000");
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("100000000");
      let v2 = ethers.utils.bigNumberify("200000000");
      let v3 = ethers.utils.bigNumberify("300000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);
      let a3 = v3.mul(precision2).div(price1);

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, true, price2, time, maxExercisedAccounts)).wait();
      let buidlerT1T210000C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await token1.connect(addr3).approve(buidlerEthT1003P.address, v3);
      await buidlerEthT1003P.connect(addr1).mint(v1); 
      await buidlerEthT1003P.connect(addr2).mint(v2); 
      await buidlerEthT1003P.connect(addr3).mint(v3); 
      await token1.connect(addr1).approve(buidlerT1T210000C.address, v1);
      await token1.connect(addr2).approve(buidlerT1T210000C.address, v2);
      await token1.connect(addr3).approve(buidlerT1T210000C.address, v3);
      await buidlerT1T210000C.connect(addr1).mint(v1); 
      await buidlerT1T210000C.connect(addr2).mint(v2); 
      await buidlerT1T210000C.connect(addr3).mint(v3); 

      await buidlerEthT1003P.connect(addr2).transfer(await addr1.getAddress(), a2);
      await buidlerEthT1003P.connect(addr3).transfer(await addr1.getAddress(), a1);
      await buidlerT1T210000C.connect(addr2).transfer(await addr1.getAddress(), v2);
      await buidlerT1T210000C.connect(addr3).transfer(await addr1.getAddress(), v1);
      
      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v2).add(v3));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(a1.add(a3).sub(1)); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a2.add(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v2.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(v2.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(v1.sub(1));
      
      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v1.add(v2).add(v3));  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(v1.add(v3)); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(v1);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)));

      let e1 = (v1.add(v1)).mul(price2).div(precision1);
      expect((await buidlerEthT1003P.getBaseExerciseData(a1.add(a1)))[1]).to.equal(a1.add(a1)); 
      expect((await buidlerT1T210000C.getBaseExerciseData(v1.add(v1)))[1]).to.equal(e1);  
      await buidlerEthT1003P.connect(addr1).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr1).approve(await owner.getAddress(), v1.add(v1));

      let b1 = await addr1.getBalance();
      let b2 = await addr2.getBalance();
      let b3 = await addr3.getBalance();
      await buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr1.getAddress(), a1.add(a1), [await addr1.getAddress(), await addr3.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(3)});
      let fee1 = v1.add(v1).mul(fee).div(100000);

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v1.add(v3).add(1));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(a2); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a2.add(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)));
      expect(await addr1.getBalance()).to.equal(b1);
      expect(await addr2.getBalance()).to.equal(b2.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b3.add(a1).add(1));

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(3));
      await buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr1.getAddress(), v1.add(v1), [await addr1.getAddress(), await addr3.getAddress(), await addr2.getAddress()]);
    
      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v1.add(v3));  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(v2); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).sub(fee1).add(v1).add(v1));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(3));
      expect(await addr1.getBalance()).to.equal(b1);
      expect(await addr2.getBalance()).to.equal(b2.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b3.add(a1).add(1));

      await buidlerEthT1003P.connect(addr1).transfer(await addr3.getAddress(), a2);
      await buidlerT1T210000C.connect(addr1).transfer(await addr3.getAddress(), v2);

      let e2 = v1.mul(price2).div(precision1);
      expect((await buidlerEthT1003P.getBaseExerciseData(a1))[1]).to.equal(a1); 
      expect((await buidlerT1T210000C.getBaseExerciseData(v1))[1]).to.equal(e2);  
      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1);
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1);

      let b11 = await addr1.getBalance();
      let b21 = await addr2.getBalance();
      let b31 = await addr3.getBalance();
      await buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), a1, [await addr2.getAddress(), await addr1.getAddress()], {value: a1.add(2)});
      let fee2 = v1.mul(fee).div(100000);

      expect(await buidlerEthT1003P.totalCollateral()).to.equal(v3.add(1).add(1));  
      expect(await buidlerEthT1003P.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerEthT1003P.balanceOf(await addr3.getAddress())).to.equal(a3);
      expect(await buidlerEthT1003P.currentCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.currentCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerEthT1003P.assignableCollateral(await addr1.getAddress())).to.equal(v1.sub(1));
      expect(await buidlerEthT1003P.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerEthT1003P.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee2).sub(1));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).sub(fee1).add(v1).add(v1).add(v1).sub(fee2));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(3));
      expect(await addr1.getBalance()).to.equal(b11);
      expect(await addr2.getBalance()).to.equal(b21.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b31);

      await token2.connect(owner).approve(buidlerT1T210000C.address, e2.add(3));
      await buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), v1, [await addr3.getAddress(), await addr2.getAddress(), await addr1.getAddress()]);
    
      expect(await buidlerT1T210000C.totalCollateral()).to.equal(v3);  
      expect(await buidlerT1T210000C.balanceOf(await addr1.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr2.getAddress())).to.equal(0); 
      expect(await buidlerT1T210000C.balanceOf(await addr3.getAddress())).to.equal(v3);
      expect(await buidlerT1T210000C.currentCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.currentCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.currentCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.unassignableCollateral(await addr3.getAddress())).to.equal(v2);
      expect(await buidlerT1T210000C.assignableCollateral(await addr1.getAddress())).to.equal(v1);
      expect(await buidlerT1T210000C.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await buidlerT1T210000C.assignableCollateral(await addr3.getAddress())).to.equal(0);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(start1Balance.sub(v1).sub(v1));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(start1Balance.sub(v2).sub(v2).add(fee1).sub(1).add(fee1).add(fee2).sub(1).add(fee2));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(start1Balance.sub(v3).sub(v3));
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(token1TotalSupply.sub(start1Balance.mul(3)).add(v1).add(v1).sub(fee1).sub(fee1).add(v1).add(v1).add(v1).sub(fee2).add(v1).sub(fee2));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(start2Balance);
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(e2).add(1).add(1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(start2Balance.add(e1.div(2)).add(1));
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(token2TotalSupply.sub(start2Balance.mul(3)).sub(e1).sub(e2).sub(3).sub(3));
      expect(await addr1.getBalance()).to.equal(b11);
      expect(await addr2.getBalance()).to.equal(b21.add(a1).add(1));
      expect(await addr3.getBalance()).to.equal(b31);
    });
    it("Check fail to exercise accounts from", async function () {
      let start1Balance = ethers.utils.bigNumberify("10000000000");
      await token1.transfer(await addr1.getAddress(), start1Balance);
      await token1.transfer(await addr2.getAddress(), start1Balance);
      await token1.transfer(await addr3.getAddress(), start1Balance);
      let start2Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), start2Balance);
      await token2.transfer(await addr2.getAddress(), start2Balance);
      await token2.transfer(await addr3.getAddress(), start2Balance);
      let precision1 = ethers.utils.bigNumberify("100000000");
      let precision2 = ethers.utils.bigNumberify("1000000000000000000");
      let v1 = ethers.utils.bigNumberify("100000000");
      let v2 = ethers.utils.bigNumberify("200000000");
      let a1 = v1.mul(precision2).div(price1);
      let a2 = v2.mul(precision2).div(price1);

      let tx = await (await buidlerFactory.createAcoToken(ethers.constants.AddressZero, token1.address, false, price1, time, maxExercisedAccounts)).wait();
      let buidlerEthT1003P = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      tx = await (await buidlerFactory.createAcoToken(token1.address, token2.address, true, price2, time, maxExercisedAccounts)).wait();
      let buidlerT1T210000C = await ethers.getContractAt("ACOToken", tx.events[tx.events.length - 1].args.acoToken); 

      await token1.connect(addr1).approve(buidlerEthT1003P.address, v1);
      await token1.connect(addr2).approve(buidlerEthT1003P.address, v2);
      await buidlerEthT1003P.connect(addr1).mint(v1); 
      await buidlerEthT1003P.connect(addr2).mint(v2); 
      await token1.connect(addr1).approve(buidlerT1T210000C.address, v1);
      await token1.connect(addr2).approve(buidlerT1T210000C.address, v2);
      await buidlerT1T210000C.connect(addr1).mint(v1); 
      await buidlerT1T210000C.connect(addr2).mint(v2); 

      await buidlerEthT1003P.connect(addr1).transfer(await addr3.getAddress(), a1);
      await buidlerEthT1003P.connect(addr2).transfer(await addr3.getAddress(), a1);
      await buidlerT1T210000C.connect(addr1).transfer(await addr3.getAddress(), v1);
      await buidlerT1T210000C.connect(addr2).transfer(await addr3.getAddress(), v1);

      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1.add(v1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), 0, [await addr1.getAddress()])
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), 0, [await addr1.getAddress()])
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid token amount");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), a1.add(a1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(2).sub(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), a1.add(a1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(2).add(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Invalid ether amount");

      let e1 = (v1.add(v1)).mul(price2).div(precision1);
      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2).sub(1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), v1.add(v1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("ACOToken::_transferFromERC20");

      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1.add(a1).add(1));
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1.add(v1).add(1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), a1.add(a1).add(1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(2).add(1)})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), a1.add(a1), [await addr1.getAddress(), await addr3.getAddress()], {value: a1.add(a1).add(2)})
      ).to.be.revertedWith("ACOToken::_exerciseAccounts: Invalid remaining amount");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(e1));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), v1.add(v1).add(1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), v1.add(v1), [await addr1.getAddress(), await addr2.getAddress()], {value: 1})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: No ether expected");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), v1.add(v1), [await addr1.getAddress(), await addr3.getAddress()])
      ).to.be.revertedWith("ACOToken::_exerciseAccounts: Invalid remaining amount");

      await buidlerEthT1003P.connect(addr3).approve(await owner.getAddress(), a1.add(a1).sub(1));
      await buidlerT1T210000C.connect(addr3).approve(await owner.getAddress(), v1.add(v1).sub(1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), a1.add(a1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(a1).add(2)})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr3.getAddress(), v1.add(v1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003P.connect(addr2).approve(await owner.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr2).approve(await owner.getAddress(), v1.add(v1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr2.getAddress(), 1, [await addr1.getAddress(), await addr2.getAddress()], {value: 2 + 1})
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await token2.connect(owner).approve(buidlerT1T210000C.address, e1.add(2));
      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr2.getAddress(), 1, [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      await buidlerEthT1003P.connect(addr3).transfer(await addr2.getAddress(), a1.add(a1));
      await buidlerT1T210000C.connect(addr3).transfer(await addr2.getAddress(), v1.add(v1));

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr2.getAddress(), a1.add(1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(2).add(1)})
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr2.getAddress(), v1.add(1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("ACOToken::_validateAndBurn: Token amount not available");

      await network.provider.send("evm_increaseTime", [86400]);

      await expect(
        buidlerEthT1003P.connect(owner).exerciseAccountsFrom(await addr2.getAddress(), a1.sub(1), [await addr1.getAddress(), await addr2.getAddress()], {value: a1.add(2).sub(1)})
      ).to.be.revertedWith("ACOToken::Expired");

      await expect(
        buidlerT1T210000C.connect(owner).exerciseAccountsFrom(await addr2.getAddress(), v1.sub(1), [await addr1.getAddress(), await addr2.getAddress()])
      ).to.be.revertedWith("ACOToken::Expired");

      await network.provider.send("evm_increaseTime", [-86400]);
    });
  });

  describe("Redeem transactions", function() {
    it("Check redeem", async function () {
      let addr1Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), addr1Balance);
      let val1 = ethers.utils.bigNumberify("75000000000000000");
      let precision = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("5000000000000000000000");
      let amount1 = value1.mul(precision).div(price2);

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 

      await network.provider.send("evm_increaseTime", [86400]);

      await buidlerEthT1003C.connect(addr1).redeem();
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr1).redeem();
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance);

      await network.provider.send("evm_increaseTime", [-86400]);

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await buidlerEthT1003C.connect(addr1).approve(await addr2.getAddress(), val1);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 
      await buidlerT1T210000P.connect(addr1).approve(await addr3.getAddress(), amount1);

      await network.provider.send("evm_increaseTime", [86400]);

      await buidlerEthT1003C.connect(addr2).redeemFrom(await addr1.getAddress());
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr3).redeemFrom(await addr1.getAddress());
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(value1);

      await network.provider.send("evm_increaseTime", [-86400]);

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await buidlerEthT1003C.connect(addr1).transfer(await addr2.getAddress(), val1);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 
      await buidlerT1T210000P.connect(addr1).transfer(await addr2.getAddress(), amount1);
      
      await network.provider.send("evm_increaseTime", [86400]);

      await buidlerEthT1003C.connect(addr1).redeem();
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr1).redeem();
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(value1);

      await network.provider.send("evm_increaseTime", [-86400]);

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await buidlerEthT1003C.connect(addr1).transfer(await addr2.getAddress(), val1);
      await buidlerEthT1003C.connect(addr1).approve(await addr2.getAddress(), val1);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 
      await buidlerT1T210000P.connect(addr1).transfer(await addr2.getAddress(), amount1);
      await buidlerT1T210000P.connect(addr1).approve(await addr3.getAddress(), amount1);
      
      await network.provider.send("evm_increaseTime", [86400]);

      await buidlerEthT1003C.connect(addr2).redeemFrom(await addr1.getAddress());
      expect(await buidlerEthT1003C.totalCollateral()).to.equal(0);  
      expect(await buidlerEthT1003C.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerEthT1003C.assignableCollateral(await addr1.getAddress())).to.equal(0);

      await buidlerT1T210000P.connect(addr3).redeemFrom(await addr1.getAddress());
      expect(await buidlerT1T210000P.totalCollateral()).to.equal(0);  
      expect(await buidlerT1T210000P.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.currentCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.unassignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await buidlerT1T210000P.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(addr1Balance.sub(value1).sub(value1));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(value1.add(value1));

      await network.provider.send("evm_increaseTime", [-86400]);
    });
    it("Check fail to redeem", async function () {
      let addr1Balance = ethers.utils.bigNumberify("10000000000000000000000");
      await token2.transfer(await addr1.getAddress(), addr1Balance);
      let val1 = ethers.utils.bigNumberify("75000000000000000");
      let precision = ethers.utils.bigNumberify("100000000");
      let value1 = ethers.utils.bigNumberify("5000000000000000000000");
      let amount1 = value1.mul(precision).div(price2);

      await buidlerEthT1003C.connect(addr1).mintPayable({value: val1}); 
      await buidlerEthT1003C.connect(addr1).approve(await addr3.getAddress(), val1);
      await token2.connect(addr1).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(addr1).mint(value1); 
      await buidlerT1T210000P.connect(addr1).approve(await addr3.getAddress(), amount1);

      await buidlerEthT1003C.connect(owner).mintPayable({value: val1}); 
      await buidlerEthT1003C.connect(owner).transfer(await addr2.getAddress(), val1);
      await buidlerEthT1003C.connect(owner).approve(await addr3.getAddress(), val1);
      await token2.connect(owner).approve(buidlerT1T210000P.address, value1);
      await buidlerT1T210000P.connect(owner).mint(value1); 
      await buidlerT1T210000P.connect(owner).transfer(await addr2.getAddress(), amount1);
      await buidlerT1T210000P.connect(owner).approve(await addr3.getAddress(), amount1);
      
      await buidlerEthT1003C.connect(addr2).approve(await addr3.getAddress(), val1);
      await buidlerT1T210000P.connect(addr2).approve(await addr3.getAddress(), amount1);

      await expect(
        buidlerEthT1003C.connect(addr1).redeem()
      ).to.be.revertedWith("ACOToken::_redeem: Token not expired yet");

      await expect(
        buidlerT1T210000P.connect(addr1).redeem()
      ).to.be.revertedWith("ACOToken::_redeem: Token not expired yet");

      await expect(
        buidlerEthT1003C.connect(addr3).redeemFrom(await addr1.getAddress())
      ).to.be.revertedWith("ACOToken::_redeem: Token not expired yet");

      await expect(
        buidlerT1T210000P.connect(addr3).redeemFrom(await addr1.getAddress())
      ).to.be.revertedWith("ACOToken::_redeem: Token not expired yet");
      
      await network.provider.send("evm_increaseTime", [86400]);  
      
      await expect(
        buidlerEthT1003C.connect(addr2).redeem()
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await expect(
        buidlerT1T210000P.connect(addr2).redeem()
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await expect(
        buidlerEthT1003C.connect(addr3).redeemFrom(await addr2.getAddress())
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await expect(
        buidlerT1T210000P.connect(addr3).redeemFrom(await addr2.getAddress())
      ).to.be.revertedWith("ACOToken::_redeemCollateral: No collateral available");

      await expect(
        buidlerEthT1003C.connect(addr2).redeemFrom(await addr1.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await expect(
        buidlerT1T210000P.connect(addr2).redeemFrom(await addr1.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await expect(
        buidlerEthT1003C.connect(addr2).redeemFrom(await owner.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await expect(
        buidlerT1T210000P.connect(addr2).redeemFrom(await owner.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await network.provider.send("evm_increaseTime", [-86400]);

      await buidlerEthT1003C.connect(addr1).approve(await addr3.getAddress(), val1.sub(1));
      await buidlerT1T210000P.connect(addr1).approve(await addr3.getAddress(), amount1.sub(1));
      await buidlerEthT1003C.connect(owner).approve(await addr3.getAddress(), val1.sub(1));
      await buidlerT1T210000P.connect(owner).approve(await addr3.getAddress(), amount1.sub(1));
      
      await network.provider.send("evm_increaseTime", [86400]);  

      await expect(
        buidlerEthT1003C.connect(addr3).redeemFrom(await addr1.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await expect(
        buidlerT1T210000P.connect(addr3).redeemFrom(await addr1.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await expect(
        buidlerEthT1003C.connect(addr3).redeemFrom(await owner.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await expect(
        buidlerT1T210000P.connect(addr3).redeemFrom(await owner.getAddress())
      ).to.be.revertedWith("ACOToken::redeemFrom: No allowance");

      await network.provider.send("evm_increaseTime", [-86400]);
    });
  });
});