const { expect } = require("chai");
const factoryABI = require("../artifacts/contracts/core/ACOFactory.sol/ACOFactory.json");

describe("ACOOTC", function() {
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let fee = ethers.BigNumber.from("30");
  let token1;
  let token1Name = "TOKEN1";
  let token1Symbol = "TOK1";
  let token1Decimals = 8;
  let token1TotalSupply = ethers.BigNumber.from("100000000000000000000000000");
  let token2;
  let token2Name = "TOKEN2";
  let token2Symbol = "TOK2";
  let token2Decimals = 6;
  let token2TotalSupply = ethers.BigNumber.from("1000000000000000000000000");
  let buidlerFactory;
  let weth;
  let acoOtc;

  const getPersonalSignedAskOrder = async (wallet, order) => {
    const orderHashHex = getAskOrderHash(order, acoOtc.address);
    return await getPersonalSignedOrder(wallet, order, orderHashHex);
  };

  const getPersonalSignedBidOrder = async (wallet, order) => {
    const orderHashHex = getBidOrderHash(order, acoOtc.address);
    return await getPersonalSignedOrder(wallet, order, orderHashHex);
  };

  const getTypedSignedAskOrder = async (wallet, order) => {
    return await getTypedSignedOrder(wallet, order, "AskOrder");
  };

  const getTypedSignedBidOrder = async (wallet, order) => {
    return await getTypedSignedOrder(wallet, order, "BidOrder");
  };

  const getTypedSignedOrder = async (wallet, order, primaryType) => {
    const domain = {
      name: "ACOOTC",
      version: "1",
      chainId: 31337,
      verifyingContract: acoOtc.address
    };
    const typedData = {
      domain: domain,
      message: order,
      primaryType: primaryType,
      types: orderTypes
    };
    const signedMsg = await network.provider.send("eth_signTypedData",[await wallet.getAddress(),typedData]);
    return await fillSignedOrder(wallet, order, signedMsg, "0x01");
  };

  const getPersonalSignedOrder = async (wallet, order, orderHashHex) => {
    const signedMsg = await wallet.signMessage(ethers.utils.arrayify(orderHashHex));
    return await fillSignedOrder(wallet, order, signedMsg, "0x45");
  };

  const fillSignedOrder = async (wallet, order, signedMsg, signedType) => {
    const sig = ethers.utils.splitSignature(signedMsg);
    const signature = {signatory:(await wallet.getAddress()),validator:acoOtc.address,version:signedType,v:sig.v,r:sig.r,s:sig.s};
    return {...order,signature};
  };
  
  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    
    let ACOFactoryV4 = await (await ethers.getContractFactory("ACOFactoryV4")).deploy();
    await ACOFactoryV4.deployed();
    
    let factoryInterface = new ethers.utils.Interface(factoryABI.abi);

    let ACOToken = await (await ethers.getContractFactory("ACOToken")).deploy();
    await ACOToken.deployed();

    let ownerAddr = await owner.getAddress();
    let addr2Addr = await addr2.getAddress();
    let initData = factoryInterface.encodeFunctionData("init", [ownerAddr, ACOToken.address, fee, addr2Addr]);
    let buidlerProxy = await (await ethers.getContractFactory("ACOProxy")).deploy(ownerAddr, ACOFactoryV4.address, initData);
    await buidlerProxy.deployed();

    token1 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token1Name, token1Symbol, token1Decimals, token1TotalSupply);
    await token1.deployed();

    token2 = await (await ethers.getContractFactory("ERC20ForTest")).deploy(token2Name, token2Symbol, token2Decimals, token2TotalSupply);
    await token2.deployed();
    
    await token1.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("100000000000000000"));
    await token1.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("100000000000000000"));
    await token1.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("100000000000000000"));
    await token2.connect(owner).transfer(await addr1.getAddress(), ethers.BigNumber.from("1000000000000000"));
    await token2.connect(owner).transfer(await addr2.getAddress(), ethers.BigNumber.from("1000000000000000"));
    await token2.connect(owner).transfer(await addr3.getAddress(), ethers.BigNumber.from("1000000000000000"));

    weth = await (await ethers.getContractFactory("WETH9")).deploy();
    await weth.deployed(); 

    acoOtc = await (await ethers.getContractFactory("ACOOTC")).deploy(buidlerProxy.address, weth.address);
    await acoOtc.deployed(); 

    buidlerFactory = await ethers.getContractAt("ACOFactoryV4", buidlerProxy.address);
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
    it("Check signatures", async function () {
      const partyAco = getPartyAco(await addr1.getAddress(),100000000,token1.address,token2.address,true,18000000000,1299999999);
      const partyToken = getPartyToken(ethers.constants.AddressZero,10000000,token2.address);
      const affiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      const nonce = 1;
      const expiry = Date.now();
      const askOrder = getUnsignedOrder(nonce, expiry, partyAco, partyToken, affiliate);
      const bidOrder = getUnsignedOrder(nonce, expiry, partyToken, partyAco, affiliate);

      const personalAskOrder = await getPersonalSignedAskOrder(addr1, askOrder);
      expect(await acoOtc.isValidAskOrder(getNestedAskOrder(personalAskOrder))).to.equal(true);
      
      const personalBidOrder = await getPersonalSignedBidOrder(addr1, bidOrder);
      expect(await acoOtc.isValidBidOrder(getNestedBidOrder(personalBidOrder))).to.equal(true);

      const typedAskOrder = await getTypedSignedAskOrder(addr1, askOrder);
      expect(await acoOtc.isValidAskOrder(getNestedAskOrder(typedAskOrder))).to.equal(true);
      
      const typedBidOrder = await getTypedSignedBidOrder(addr1, bidOrder);
      expect(await acoOtc.isValidBidOrder(getNestedBidOrder(typedBidOrder))).to.equal(true);
    });
    it("Swap regular ask order", async function () {
      let expiryTime = 1699999999;
      let signerAmount = 100000000;
      let senderAmount = 10000000;
      let strikePrice = 18000000000;
      const signer1 = getPartyAco(await addr1.getAddress(),signerAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const sender1 = getPartyToken(ethers.constants.AddressZero,senderAmount,token2.address);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      let expiry = Date.now();

      const order1 = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);

      let bal11 = await token1.balanceOf(await addr1.getAddress());
      let bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal21 = await token2.balanceOf(await addr1.getAddress());
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr2).approve(acoOtc.address, senderAmount);
      let signedOrder = await getPersonalSignedAskOrder(addr1, order1);
      let tx = await (await acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr2).approve(acoOtc.address, senderAmount);
      ++nonce;
      order1.nonce = nonce;
      signedOrder = await getTypedSignedAskOrder(addr1, order1);
      tx = await (await acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount * 2);

      let affiliateAmount = 1000000;
      const affiliate1 = getPartyToken(await addr3.getAddress(),affiliateAmount,token2.address);
      ++nonce;
      const order2 = getUnsignedOrder(nonce, expiry, signer1, sender1, affiliate1);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      let bal23 = await token2.balanceOf(await addr3.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr2).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedAskOrder(addr1, order2);
      tx = await (await acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(senderAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(affiliateAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount * 3);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount * 3);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr2).approve(acoOtc.address, senderAmount);
      ++nonce;
      order2.nonce = nonce;
      signedOrder = await getTypedSignedAskOrder(addr1, order2);
      tx = await (await acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(senderAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(affiliateAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount * 4);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount * 4);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);

      ++nonce;
      const sender2 = getPartyToken(await addr3.getAddress(),senderAmount,token2.address);
      const affiliate2 = getPartyToken(await addr2.getAddress(),affiliateAmount,token2.address);
      const order3 = getUnsignedOrder(nonce, expiry, signer1, sender2, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedAskOrder(addr1, order3);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount * 5);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount * 4);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      ++nonce;
      order3.nonce = nonce;
      signedOrder = await getTypedSignedAskOrder(addr1, order3);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount * 6);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount * 4);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);

      ++nonce;
      const signer2 = getPartyAco(await addr1.getAddress(),signerAmount,ethers.constants.AddressZero,token2.address,true,strikePrice,expiryTime);
      const order4 = getUnsignedOrder(nonce, expiry, signer2, sender2, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await weth.connect(addr1).deposit({value: signerAmount});
      await weth.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedAskOrder(addr1, order4);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.signerToken,"latest"]))).to.equal(signerAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await weth.connect(addr1).deposit({value: signerAmount});
      await weth.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      ++nonce;
      order4.nonce = nonce;
      signedOrder = await getTypedSignedAskOrder(addr1, order4);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.signerToken,"latest"]))).to.equal(signerAmount * 2);

      ++nonce;
      let collateralAmount = Math.floor(signerAmount * strikePrice / 100000000);
      const signer3 = getPartyAco(await addr1.getAddress(),signerAmount,token1.address,token2.address,false,strikePrice,expiryTime);
      const order5 = getUnsignedOrder(nonce, expiry, signer3, sender2, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, collateralAmount + affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedAskOrder(addr1, order5);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(collateralAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(collateralAmount);
      expect(await aco.assignableTokens(await addr1.getAddress())).to.equal(signerAmount);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.signerToken,"latest"]))).to.equal(0);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, collateralAmount + affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      ++nonce;
      order5.nonce = nonce;
      signedOrder = await getTypedSignedAskOrder(addr1, order5);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(collateralAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(collateralAmount * 2);
      expect(await aco.assignableTokens(await addr1.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.signerToken,"latest"]))).to.equal(0);

      ++nonce;
      const signer4 = getPartyAco(await addr1.getAddress(),signerAmount,token1.address,ethers.constants.AddressZero,false,strikePrice,expiryTime);
      const order6 = getUnsignedOrder(nonce, expiry, signer4, sender2, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await weth.connect(addr1).deposit({value: collateralAmount});
      await weth.connect(addr1).approve(acoOtc.address, collateralAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedAskOrder(addr1, order6);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(collateralAmount);
      expect(await aco.assignableTokens(await addr1.getAddress())).to.equal(signerAmount);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.signerToken,"latest"]))).to.equal(collateralAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await weth.connect(addr1).deposit({value: collateralAmount});
      await weth.connect(addr1).approve(acoOtc.address, collateralAmount);
      await token2.connect(addr1).approve(acoOtc.address, affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, senderAmount);
      ++nonce;
      order6.nonce = nonce;
      signedOrder = await getTypedSignedAskOrder(addr1, order6);
      tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount).sub(affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(collateralAmount * 2);
      expect(await aco.assignableTokens(await addr1.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.signerToken,"latest"]))).to.equal(collateralAmount * 2);
  });
    it("Swap ask order with signer permission", async function () { 
      let expiryTime = 1699999999;
      let signerAmount = 100000000;
      let senderAmount = 10000000;
      let strikePrice = 18000000000;
      const emptySignature = {signatory:ethers.constants.AddressZero,validator:ethers.constants.AddressZero,version:"0x00",v:0,r:"0x0000000000000000000000000000000000000000000000000000000000000000",s:"0x0000000000000000000000000000000000000000000000000000000000000000"};
      const signer1 = getPartyAco(await addr1.getAddress(),signerAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const sender1 = getPartyToken(ethers.constants.AddressZero,senderAmount,token2.address);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      let expiry = Date.now();

      const order1 = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);

      await acoOtc.connect(addr1).authorizeSigner(await addr2.getAddress());
      await acoOtc.connect(addr1).authorizeSigner(await addr3.getAddress());

      let bal11 = await token1.balanceOf(await addr1.getAddress());
      let bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal21 = await token2.balanceOf(await addr1.getAddress());
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr2).approve(acoOtc.address, senderAmount);
      const order = {...order1,signature: emptySignature};
      let tx = await (await acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(order))).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal13 = await token1.balanceOf(await addr3.getAddress());
      let bal10 = await token1.balanceOf(await owner.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      let bal23 = await token2.balanceOf(await addr3.getAddress());
      let bal20 = await token2.balanceOf(await owner.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(owner).approve(acoOtc.address, senderAmount);
      order1.nonce += 1;
      let signedOrder = await getPersonalSignedAskOrder(addr3, order1);
      tx = await (await acoOtc.connect(owner).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(bal10);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(bal20.sub(senderAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await owner.getAddress())).to.equal(signerAmount);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount * 2);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await owner.getAddress())).to.equal(0);
    }); 
    it("Swap ask order with sender permission", async function () { 
      let expiryTime = 1699999999;
      let signerAmount = 100000000;
      let senderAmount = 10000000;
      let strikePrice = 18000000000;
      const signer1 = getPartyAco(await addr1.getAddress(),signerAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const sender1 = getPartyToken(await addr2.getAddress(),senderAmount,token2.address);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      let expiry = Date.now();

      const order1 = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);

      await acoOtc.connect(addr2).authorizeSender(await addr3.getAddress());

      let bal11 = await token1.balanceOf(await addr1.getAddress());
      let bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal13 = await token1.balanceOf(await addr3.getAddress());
      let bal21 = await token2.balanceOf(await addr1.getAddress());
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      let bal23 = await token2.balanceOf(await addr3.getAddress());
      await token1.connect(addr1).approve(acoOtc.address, signerAmount);
      await token2.connect(addr2).approve(acoOtc.address, senderAmount);
      let signedOrder = await getPersonalSignedAskOrder(addr1, order1);
      let tx = await (await acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco = await ethers.getContractAt("ACOToken", result.signerToken);
      expect(await buidlerFactory.creators(result.signerToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11.sub(signerAmount));
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.add(senderAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.sub(senderAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23);
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(signerAmount);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(signerAmount);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
    });
    it("Fail to swap ask order", async function () {
      let expiryTime = 1699999999;
      let signerAmount = 100000000;
      let senderAmount = 10000000;
      let strikePrice = 18000000000;
      const signer1 = getPartyAco(await addr1.getAddress(),signerAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const sender1 = getPartyToken(ethers.constants.AddressZero,senderAmount,token2.address);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      
      let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
      let expiry = parseInt(block.timestamp, 16);
      let order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      let signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order expired");

      expiry = Date.now();
      await acoOtc.connect(addr1).cancelUpTo(2);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Nonce too low");

      nonce = 3;
      await acoOtc.connect(addr1).cancel([3]);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order taken or cancelled");

      nonce = 4;
      let affiliate = getPartyToken(await addr1.getAddress(),100000,token2.address);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, affiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Self transfer");

      let sender = getPartyToken(await addr3.getAddress(),senderAmount,token2.address);
      order = getUnsignedOrder(nonce, expiry, signer1, sender, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Sender unauthorized");

      sender = getPartyToken(await addr1.getAddress(),senderAmount,token2.address);
      order = getUnsignedOrder(nonce, expiry, signer1, sender, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr1).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Self transfer");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr1).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Self transfer");

      const emptySignature = {signatory:ethers.constants.AddressZero,validator:ethers.constants.AddressZero,version:"0x00",v:0,r:"0x0000000000000000000000000000000000000000000000000000000000000000",s:"0x0000000000000000000000000000000000000000000000000000000000000000"};
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      order = {...order,signature:emptySignature};
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(order))
      ).to.be.revertedWith("ACOOTC:: Signer unauthorized");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr2, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signer unauthorized");
      
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      signedOrder.signature.v = signedOrder.signature.v+1;
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getTypedSignedAskOrder(addr1, order);
      signedOrder.signature.v = signedOrder.signature.v+1;
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr2, order);
      signedOrder.signature.signatory = await addr1.getAddress();
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getTypedSignedAskOrder(addr2, order);
      signedOrder.signature.signatory = await addr1.getAddress();
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("transferFrom");

      await token2.connect(addr2).approve(acoOtc.address, senderAmount);
      
      let signer = getPartyAco(await addr1.getAddress(),0,token1.address,token2.address,true,strikePrice,expiryTime);
      order = getUnsignedOrder(nonce, expiry, signer, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Collateral amount is too low");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("transferFrom");

      await token1.connect(addr1).approve(acoOtc.address, signerAmount);

      affiliate = getPartyToken(await addr3.getAddress(),100000,token1.address);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, affiliate);
      signedOrder = await getPersonalSignedAskOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("transferFrom");

      await token1.connect(addr1).approve(acoOtc.address, signerAmount + 100000);

      await acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder));

      await expect(
        acoOtc.connect(addr2).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order taken or cancelled");

      await expect(
        acoOtc.connect(addr3).swapAskOrder(getNestedAskOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order taken or cancelled");
    });
    it("Swap regular bid order", async function () {
      let expiryTime = 1699999999;
      let signerAmount = 10000000;
      let senderAmount = 100000000;
      let strikePrice = 18000000000;
      const signer1 = getPartyToken(await addr1.getAddress(),signerAmount,token2.address);
      const sender1 = getPartyAco(ethers.constants.AddressZero,senderAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      let expiry = Date.now();

      const order1 = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);

      let bal11 = await token1.balanceOf(await addr1.getAddress());
      let bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal21 = await token2.balanceOf(await addr1.getAddress());
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount);
      await token1.connect(addr2).approve(acoOtc.address, senderAmount);
      let signedOrder = await getPersonalSignedBidOrder(addr1, order1);
      let tx = await (await acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(senderAmount));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount);
      await token1.connect(addr2).approve(acoOtc.address, senderAmount);
      ++nonce;
      order1.nonce = nonce;
      signedOrder = await getTypedSignedBidOrder(addr1, order1);
      tx = await (await acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(senderAmount));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 2);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount * 2);

      let affiliateAmount = 1000000;
      const affiliate1 = getPartyToken(await addr3.getAddress(),affiliateAmount,token2.address);
      ++nonce;
      const order2 = getUnsignedOrder(nonce, expiry, signer1, sender1, affiliate1);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      let bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await token1.connect(addr2).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedBidOrder(addr1, order2);
      tx = await (await acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(senderAmount));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(signerAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(affiliateAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 3);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount * 3);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await token1.connect(addr2).approve(acoOtc.address, senderAmount);
      ++nonce;
      order2.nonce = nonce;
      signedOrder = await getTypedSignedBidOrder(addr1, order2);
      tx = await (await acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(senderAmount));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(signerAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(affiliateAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 4);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount * 4);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);

      ++nonce;
      const sender2 = getPartyAco(await addr3.getAddress(),senderAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const affiliate2 = getPartyToken(await addr2.getAddress(),affiliateAmount,token2.address);
      const order3 = getUnsignedOrder(nonce, expiry, signer1, sender2, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await token1.connect(addr3).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedBidOrder(addr1, order3);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13.sub(senderAmount));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 5);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount * 4);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(senderAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await token1.connect(addr3).approve(acoOtc.address, senderAmount);
      ++nonce;
      order3.nonce = nonce;
      signedOrder = await getTypedSignedBidOrder(addr1, order3);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13.sub(senderAmount));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 6);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount * 4);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(senderAmount * 2);

      ++nonce;
      const sender3 = getPartyAco(await addr3.getAddress(),senderAmount,ethers.constants.AddressZero,token2.address,true,strikePrice,expiryTime);
      const order4 = getUnsignedOrder(nonce, expiry, signer1, sender3, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await weth.connect(addr3).deposit({value: senderAmount});
      await weth.connect(addr3).approve(acoOtc.address, senderAmount);
      signedOrder = await getPersonalSignedBidOrder(addr1, order4);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(senderAmount);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.senderToken,"latest"]))).to.equal(senderAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await weth.connect(addr3).deposit({value: senderAmount});
      await weth.connect(addr3).approve(acoOtc.address, senderAmount);
      ++nonce;
      order4.nonce = nonce;
      signedOrder = await getTypedSignedBidOrder(addr1, order4);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 2);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(senderAmount * 2);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.senderToken,"latest"]))).to.equal(senderAmount * 2);

      ++nonce;
      let collateralAmount = Math.floor(senderAmount * strikePrice / 100000000);
      const sender4 = getPartyAco(await addr3.getAddress(),senderAmount,token1.address,token2.address,false,strikePrice,expiryTime);
      const order5 = getUnsignedOrder(nonce, expiry, signer1, sender4, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, collateralAmount);
      signedOrder = await getPersonalSignedBidOrder(addr1, order5);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(collateralAmount).add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(collateralAmount);
      expect(await aco.assignableTokens(await addr3.getAddress())).to.equal(senderAmount);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.senderToken,"latest"]))).to.equal(0);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await token2.connect(addr3).approve(acoOtc.address, collateralAmount);
      ++nonce;
      order5.nonce = nonce;
      signedOrder = await getTypedSignedBidOrder(addr1, order5);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.sub(collateralAmount).add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 2);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(collateralAmount * 2);
      expect(await aco.assignableTokens(await addr3.getAddress())).to.equal(senderAmount * 2);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.senderToken,"latest"]))).to.equal(0);
      
      ++nonce;
      const sender5 = getPartyAco(await addr3.getAddress(),senderAmount,token1.address,ethers.constants.AddressZero,false,strikePrice,expiryTime);
      const order6 = getUnsignedOrder(nonce, expiry, signer1, sender5, affiliate2);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await weth.connect(addr3).deposit({value: collateralAmount});
      await weth.connect(addr3).approve(acoOtc.address, collateralAmount);
      signedOrder = await getPersonalSignedBidOrder(addr1, order6);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(collateralAmount);
      expect(await aco.assignableTokens(await addr3.getAddress())).to.equal(senderAmount);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.senderToken,"latest"]))).to.equal(collateralAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      bal13 = await token1.balanceOf(await addr3.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount + affiliateAmount);
      await weth.connect(addr3).deposit({value: collateralAmount});
      await weth.connect(addr3).approve(acoOtc.address, collateralAmount);
      ++nonce;
      order6.nonce = nonce;
      signedOrder = await getTypedSignedBidOrder(addr1, order6);
      tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount + affiliateAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(affiliateAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 2);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(collateralAmount * 2);
      expect(await aco.assignableTokens(await addr3.getAddress())).to.equal(senderAmount * 2);
      expect(ethers.BigNumber.from(await network.provider.send("eth_getBalance", [result.senderToken,"latest"]))).to.equal(collateralAmount * 2);
    });
    it("Swap bid order with signer permission", async function () { 
      let expiryTime = 1699999999;
      let signerAmount = 10000000;
      let senderAmount = 100000000;
      let strikePrice = 18000000000;
      const emptySignature = {signatory:ethers.constants.AddressZero,validator:ethers.constants.AddressZero,version:"0x00",v:0,r:"0x0000000000000000000000000000000000000000000000000000000000000000",s:"0x0000000000000000000000000000000000000000000000000000000000000000"};
      const signer1 = getPartyToken(await addr1.getAddress(),signerAmount,token2.address);
      const sender1 = getPartyAco(ethers.constants.AddressZero,senderAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      let expiry = Date.now();

      const order1 = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);

      await acoOtc.connect(addr1).authorizeSigner(await addr2.getAddress());
      await acoOtc.connect(addr1).authorizeSigner(await addr3.getAddress());

      let bal11 = await token1.balanceOf(await addr1.getAddress());
      let bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal21 = await token2.balanceOf(await addr1.getAddress());
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount);
      await token1.connect(addr2).approve(acoOtc.address, senderAmount);
      const order = {...order1,signature: emptySignature};
      let tx = await (await acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(order))).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(senderAmount));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount);

      bal11 = await token1.balanceOf(await addr1.getAddress());
      bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal13 = await token1.balanceOf(await addr3.getAddress());
      let bal10 = await token1.balanceOf(await owner.getAddress());
      bal21 = await token2.balanceOf(await addr1.getAddress());
      bal22 = await token2.balanceOf(await addr2.getAddress());
      let bal23 = await token2.balanceOf(await addr3.getAddress());
      let bal20 = await token2.balanceOf(await owner.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount);
      await token1.connect(owner).approve(acoOtc.address, senderAmount);
      order1.nonce += 1;
      let signedOrder = await getTypedSignedBidOrder(addr3, order1);
      tx = await (await acoOtc.connect(owner).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      result = tx.events[tx.events.length - 1].args;
      aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12);
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token1.balanceOf(await owner.getAddress())).to.equal(bal10.sub(senderAmount));
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22);
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23);
      expect(await token2.balanceOf(await owner.getAddress())).to.equal(bal20.add(signerAmount));
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount * 2);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await owner.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await owner.getAddress())).to.equal(senderAmount);
    }); 
    it("Swap bid order with sender permission", async function () { 
      let expiryTime = 1699999999;
      let signerAmount = 10000000;
      let senderAmount = 100000000;
      let strikePrice = 18000000000;
      const signer1 = getPartyToken(await addr1.getAddress(),signerAmount,token2.address);
      const sender1 = getPartyAco(await addr2.getAddress(),senderAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      let expiry = Date.now();

      const order1 = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);

      await acoOtc.connect(addr2).authorizeSender(await addr3.getAddress());

      let bal11 = await token1.balanceOf(await addr1.getAddress());
      let bal12 = await token1.balanceOf(await addr2.getAddress());
      let bal13 = await token1.balanceOf(await addr3.getAddress());
      let bal21 = await token2.balanceOf(await addr1.getAddress());
      let bal22 = await token2.balanceOf(await addr2.getAddress());
      let bal23 = await token2.balanceOf(await addr3.getAddress());
      await token2.connect(addr1).approve(acoOtc.address, signerAmount);
      await token1.connect(addr2).approve(acoOtc.address, senderAmount);
      let signedOrder = await getPersonalSignedBidOrder(addr1, order1);
      let tx = await (await acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))).wait();
      let result = tx.events[tx.events.length - 1].args;
      let aco = await ethers.getContractAt("ACOToken", result.senderToken);
      expect(await buidlerFactory.creators(result.senderToken)).to.equal(acoOtc.address);

      expect(await token1.balanceOf(await addr1.getAddress())).to.equal(bal11);
      expect(await token1.balanceOf(await addr2.getAddress())).to.equal(bal12.sub(senderAmount));
      expect(await token1.balanceOf(await addr3.getAddress())).to.equal(bal13);
      expect(await token2.balanceOf(await addr1.getAddress())).to.equal(bal21.sub(signerAmount));
      expect(await token2.balanceOf(await addr2.getAddress())).to.equal(bal22.add(signerAmount));
      expect(await token2.balanceOf(await addr3.getAddress())).to.equal(bal23);
      expect(await aco.balanceOf(await addr1.getAddress())).to.equal(senderAmount);
      expect(await aco.balanceOf(await addr2.getAddress())).to.equal(0);
      expect(await aco.balanceOf(await addr3.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr1.getAddress())).to.equal(0);
      expect(await aco.assignableCollateral(await addr2.getAddress())).to.equal(senderAmount);
      expect(await aco.assignableCollateral(await addr3.getAddress())).to.equal(0);
    });
    it("Fail to swap bid order", async function () {
      let expiryTime = 1699999999;
      let signerAmount = 10000000;
      let senderAmount = 100000000;
      let strikePrice = 18000000000;
      const signer1 = getPartyToken(await addr1.getAddress(),signerAmount,token2.address);
      const sender1 = getPartyAco(ethers.constants.AddressZero,senderAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      const emptyAffiliate = getPartyToken(ethers.constants.AddressZero,0,ethers.constants.AddressZero);
      let nonce = 1;
      
      let block = await network.provider.send("eth_getBlockByNumber",["latest",true]);
      let expiry = parseInt(block.timestamp, 16);
      let order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      let signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order expired");

      expiry = Date.now(); 
      await acoOtc.connect(addr1).cancelUpTo(2);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Nonce too low");

      nonce = 3;
      await acoOtc.connect(addr1).cancel([3]);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order taken or cancelled");

      nonce = 4;
      let affiliate = getPartyToken(await addr1.getAddress(),100000,token2.address);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, affiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Self transfer");

      let sender = getPartyAco(await addr3.getAddress(),senderAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      order = getUnsignedOrder(nonce, expiry, signer1, sender, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Sender unauthorized");

      sender = getPartyAco(await addr1.getAddress(),senderAmount,token1.address,token2.address,true,strikePrice,expiryTime);
      order = getUnsignedOrder(nonce, expiry, signer1, sender, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr1).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Self transfer");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr1).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Self transfer");

      const emptySignature = {signatory:ethers.constants.AddressZero,validator:ethers.constants.AddressZero,version:"0x00",v:0,r:"0x0000000000000000000000000000000000000000000000000000000000000000",s:"0x0000000000000000000000000000000000000000000000000000000000000000"};
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      order = {...order,signature:emptySignature};
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(order))
      ).to.be.revertedWith("ACOOTC:: Signer unauthorized");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr2, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signer unauthorized");
      
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      signedOrder.signature.v = signedOrder.signature.v+1;
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getTypedSignedBidOrder(addr1, order);
      signedOrder.signature.v = signedOrder.signature.v+1;
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr2, order);
      signedOrder.signature.signatory = await addr1.getAddress();
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getTypedSignedBidOrder(addr2, order);
      signedOrder.signature.signatory = await addr1.getAddress();
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Signature invalid");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("transferFrom");

      await token1.connect(addr2).approve(acoOtc.address, senderAmount);
      
      sender = getPartyAco(await addr2.getAddress(),0,token1.address,token2.address,true,strikePrice,expiryTime);
      order = getUnsignedOrder(nonce, expiry, signer1, sender, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Collateral amount is too low");

      order = getUnsignedOrder(nonce, expiry, signer1, sender1, emptyAffiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("transferFrom");

      await token2.connect(addr1).approve(acoOtc.address, signerAmount);

      affiliate = getPartyToken(await addr3.getAddress(),100000,token1.address);
      order = getUnsignedOrder(nonce, expiry, signer1, sender1, affiliate);
      signedOrder = await getPersonalSignedBidOrder(addr1, order);
      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("transferFrom");

      await token1.connect(addr1).approve(acoOtc.address, 100000);

      await acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder));

      await expect(
        acoOtc.connect(addr2).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order taken or cancelled");

      await expect(
        acoOtc.connect(addr3).swapBidOrder(getNestedBidOrder(signedOrder))
      ).to.be.revertedWith("ACOOTC:: Order taken or cancelled");
    });
  });
});

const getNestedPartyAco = (party) => {
  return [party.responsible, party.amount, party.underlying, party.strikeAsset, party.isCall, party.strikePrice, party.expiryTime];
};

const getNestedPartyToken = (party) => {
  return [party.responsible, party.amount, party.token];
};

const getNestedAskOrder = (order) => {
  return [order.nonce, order.expiry, getNestedPartyAco(order.signer), getNestedPartyToken(order.sender), getNestedPartyToken(order.affiliate), getNestedSignature(order.signature)];
};

const getNestedBidOrder = (order) => {
  return [order.nonce, order.expiry, getNestedPartyToken(order.signer), getNestedPartyAco(order.sender), getNestedPartyToken(order.affiliate), getNestedSignature(order.signature)];
};

const getNestedSignature = (signature) => {
  return [signature.signatory, signature.validator, signature.version, signature.v, signature.r, signature.s];
};

const getPartyAco = (responsible, amount, underlying, strikeAsset, isCall, strikePrice, expiryTime) => {
  return { responsible, amount, underlying, strikeAsset, isCall, strikePrice, expiryTime };
};

const getPartyToken = (responsible, amount, token) => {
  return { responsible, amount, token };
};

const getUnsignedOrder = (nonce, expiry, signer, sender, affiliate) => {
  return { nonce, expiry, signer, sender, affiliate };
}

const stringifyType = (typeName) => {
  let str = typeName + "(";
  const keys = Object.keys(orderTypes[typeName]);
  for (let i = 0; i < keys.length; i++) {
    str += orderTypes[typeName][i].type + " " + orderTypes[typeName][i].name;
    if (i !== keys.length - 1) {
      str += ',';
    }
  }
  return str + ")";
};

const EIP712_DOMAIN_TYPEHASH = () => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(stringifyType("EIP712Domain")));
const PARTY_TOKEN_TYPEHASH = () =>  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(stringifyType("PartyToken")));
const PARTY_ACO_TYPEHASH = () => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(stringifyType("PartyAco")));
const ASK_ORDER_TYPEHASH = () =>  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(stringifyType("AskOrder") + stringifyType("PartyAco") + stringifyType("PartyToken")));
const BID_ORDER_TYPEHASH = () =>  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(stringifyType("BidOrder") + stringifyType("PartyAco") + stringifyType("PartyToken")));

const getAskOrderHash = (order, otcContract) => {
  return ethers.utils.keccak256(
    Buffer.concat([
      Buffer.from('1901', 'hex'),
      hashDomain(otcContract),
      hashAskOrder(order)
    ])
  );
};

const getBidOrderHash = (order, otcContract) => {
  return ethers.utils.keccak256(
    Buffer.concat([
      Buffer.from('1901', 'hex'),
      hashDomain(otcContract),
      hashBidOrder(order)
    ])
  );
};

const hashAskOrder = (order) => {
  return ethers.utils.arrayify(ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint256', 'uint256', 'bytes32', 'bytes32', 'bytes32'],
      [
        ASK_ORDER_TYPEHASH(),
        "0x" + order.nonce.toString(16),
        "0x" + order.expiry.toString(16),
        hashPartyAco(order.signer),
        hashPartyToken(order.sender),
        hashPartyToken(order.affiliate)
      ]
    )
  ));
};

const hashBidOrder = (order) => {
  return ethers.utils.arrayify(ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint256', 'uint256', 'bytes32', 'bytes32', 'bytes32'],
      [
        BID_ORDER_TYPEHASH(),
        "0x" + order.nonce.toString(16),
        "0x" + order.expiry.toString(16),
        hashPartyToken(order.signer),
        hashPartyAco(order.sender),
        hashPartyToken(order.affiliate)
      ]
    )
  ));
};

const hashDomain = (otcContract) => {
  return ethers.utils.arrayify(ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        EIP712_DOMAIN_TYPEHASH(),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACOOTC")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")),
        "0x" + (31337).toString(16),
        otcContract
      ]
    )
  ));
};

const hashPartyAco = (partyAco) => {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256', 'address', 'address', 'bool', 'uint256', 'uint256'],
      [PARTY_ACO_TYPEHASH(), partyAco.responsible, "0x" + partyAco.amount.toString(16), partyAco.underlying, partyAco.strikeAsset, partyAco.isCall, "0x" + partyAco.strikePrice.toString(16), "0x" + partyAco.expiryTime.toString(16)]
    )
  );
};

const hashPartyToken = (partyToken) => {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256', 'address'],
      [PARTY_TOKEN_TYPEHASH(), partyToken.responsible, "0x" + partyToken.amount.toString(16), partyToken.token]
    )
  );
};

const orderTypes = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  PartyAco: [
      { name: 'responsible', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'underlying', type: 'address' },
      { name: 'strikeAsset', type: 'address' },
      { name: 'isCall', type: 'bool' },
      { name: 'strikePrice', type: 'uint256' },
      { name: 'expiryTime', type: 'uint256' },
  ],
  PartyToken: [
    { name: 'responsible', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'token', type: 'address' }
  ],
  AskOrder: [
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'signer', type: 'PartyAco' },
    { name: 'sender', type: 'PartyToken' },
    { name: 'affiliate', type: 'PartyToken' }
  ],
  BidOrder: [
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'signer', type: 'PartyToken' },
    { name: 'sender', type: 'PartyAco' },
    { name: 'affiliate', type: 'PartyToken' }
  ]
};