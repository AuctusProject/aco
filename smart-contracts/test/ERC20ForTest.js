const { expect } = require("chai");

describe("ERC20ForTest", function() {
  let ERC20ForTest;
  let buidlerToken;
  let owner;
  let addr1;
  let addr2;
  let totalSupply = 1000000;
  let amount1 = 800000;
  let amount2 = 200000;
  let decimals = 4;
  let name = "ERC20 Token";
  let symbol = "TEST";

  beforeEach(async function () {
    ERC20ForTest = await ethers.getContractFactory("ERC20ForTest");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    buidlerToken = await ERC20ForTest.deploy(name, symbol, decimals, totalSupply);
    await buidlerToken.deployed();
  });
  
  describe("Deployment", function () {
    it("Should set the right name", async function () {
      expect(await buidlerToken.name()).to.equal(name);
    });
    it("Should set the right symbol", async function () {
      expect(await buidlerToken.symbol()).to.equal(symbol);
    });
    it("Should set the right decimals", async function () {
      expect(await buidlerToken.decimals()).to.equal(decimals);
    });
    it("Should set the right totalSupply", async function () {
      expect(await buidlerToken.totalSupply()).to.equal(totalSupply);
    });
    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await buidlerToken.balanceOf(owner.getAddress());
      expect(await buidlerToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Check transfer function", async function () {
      await buidlerToken.transfer(await addr1.getAddress(), amount1);
      const addr1Balance = await buidlerToken.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(amount1);

      await buidlerToken.connect(addr1).transfer(await addr2.getAddress(), amount2);
      const addr2Balance = await buidlerToken.balanceOf(await addr2.getAddress());
      expect(addr2Balance).to.equal(amount2);

      const newAddr1Balance = await buidlerToken.balanceOf(await addr1.getAddress());
      expect(newAddr1Balance).to.equal(amount1 - amount2);
    });
    it("Check fail to transfer", async function () {
      const initialOwnerBalance = await buidlerToken.balanceOf(await owner.getAddress());
      await expect(
        buidlerToken.connect(addr1).transfer(await owner.getAddress(), 1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");

      expect(await buidlerToken.balanceOf(await owner.getAddress())).to.equal(initialOwnerBalance);
    });
    it("Check approve/transferFrom functions", async function () {
      await buidlerToken.connect(addr1).approve(await addr2.getAddress(), amount1);
      
      let addr1Balance = await buidlerToken.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(0);

      await buidlerToken.connect(owner).transfer(await addr1.getAddress(), amount1);
      await buidlerToken.connect(owner).transfer(await addr2.getAddress(), amount2);

      addr1Balance = await buidlerToken.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(amount1);
      let addr2Balance = await buidlerToken.balanceOf(await addr2.getAddress());
      expect(addr2Balance).to.equal(amount2);
      
      let allow2Balance = await buidlerToken.allowance(await addr1.getAddress(), await addr2.getAddress());
      expect(allow2Balance).to.equal(amount1);

      await buidlerToken.connect(addr2).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount2);
      addr1Balance = await buidlerToken.balanceOf(await addr1.getAddress());
      addr2Balance = await buidlerToken.balanceOf(await addr2.getAddress());
      expect(addr1Balance).to.equal(amount1 - amount2);
      expect(addr2Balance).to.equal(amount2 + amount2);

      allow2Balance = await buidlerToken.allowance(await addr1.getAddress(), await addr2.getAddress());
      expect(allow2Balance).to.equal(amount1 - amount2);

      await buidlerToken.connect(addr1).approve(await addr2.getAddress(), amount2);
      
      addr1Balance = await buidlerToken.balanceOf(await addr1.getAddress());
      addr2Balance = await buidlerToken.balanceOf(await addr2.getAddress());
      expect(addr1Balance).to.equal(amount1 - amount2);
      expect(addr2Balance).to.equal(amount2 + amount2);

      allow2Balance = await buidlerToken.allowance(await addr1.getAddress(), await addr2.getAddress());
      expect(allow2Balance).to.equal(amount2);

      await buidlerToken.connect(addr1).increaseAllowance(await addr2.getAddress(), amount2);
      allow2Balance = await buidlerToken.allowance(await addr1.getAddress(), await addr2.getAddress());
      expect(allow2Balance).to.equal(amount2 + amount2);

      await buidlerToken.connect(addr2).transferFrom(await addr1.getAddress(), await addr2.getAddress(), amount2);
      addr1Balance = await buidlerToken.balanceOf(await addr1.getAddress());
      addr2Balance = await buidlerToken.balanceOf(await addr2.getAddress());
      expect(addr1Balance).to.equal(amount1 - amount2 - amount2);
      expect(addr2Balance).to.equal(amount2 + amount2 + amount2);

      allow2Balance = await buidlerToken.allowance(await addr1.getAddress(), await addr2.getAddress());
      expect(allow2Balance).to.equal(amount2);

      await buidlerToken.connect(addr1).decreaseAllowance(await addr2.getAddress(), amount2);
      allow2Balance = await buidlerToken.allowance(await addr1.getAddress(), await addr2.getAddress());
      expect(allow2Balance).to.equal(0);
    });
    it("Check fail to transferFrom", async function () {
      await buidlerToken.connect(owner).approve(await addr1.getAddress(), amount2);
      const ownerBalance = await buidlerToken.balanceOf(await owner.getAddress());
      expect(totalSupply).to.equal(ownerBalance);
      await expect(
        buidlerToken.connect(addr1).transferFrom(await owner.getAddress(), await addr1.getAddress(), amount1)
      ).to.be.revertedWith("SafeMath: subtraction overflow");
      expect(await buidlerToken.balanceOf(await owner.getAddress())).to.equal(ownerBalance);

      await buidlerToken.connect(addr1).transferFrom(await owner.getAddress(), await addr1.getAddress(), amount2);
      await buidlerToken.connect(owner).approve(await addr1.getAddress(), amount1 + amount1);
      await expect(
        buidlerToken.connect(addr1).transferFrom(await owner.getAddress(), await addr1.getAddress(), amount1 + amount2)
      ).to.be.revertedWith("SafeMath: subtraction overflow");
    });
  });
});