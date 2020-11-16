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
    it("Swap ask order", async function () {
      
    });
    it("Swap bid order", async function () {

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
      [PARTY_ACO_TYPEHASH(), partyAco.responsible, "0x" + partyAco.amount.toString(16), partyAco.underlying, partyAco.strikeAsset, partyAco.isCall ? "0x1" : "0x0", "0x" + partyAco.strikePrice.toString(16), "0x" + partyAco.expiryTime.toString(16)]
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
