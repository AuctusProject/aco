const Axios = require('axios');

const fromBlock = "0x" + parseInt(process.env.FROM_BLOCK).toString(16);

const callEthereum = (method, methodData, secondParam = "latest") => {
  return new Promise((resolve, reject) => {
    Axios.post("https://" + process.env.CHAIN + ".infura.io/v3/" + process.env.INFURA_ID, 
      {
        "jsonrpc":"2.0",
        "id": Date.now(),
        "method": method,
        "params": ((secondParam !== null && secondParam !== undefined) ? [methodData, secondParam] : [methodData])
      }, 
      {headers: {"Content-Type": "application/json"}})
      .then((response) =>
      {
        if (response && response.data) {
          if (response.error) {
            reject(method + " " + methodData + " " + JSON.stringify(response.data.error));
          } else {
            resolve(response.data.result);
          }
        } else {
          resolve(null);
        }
      })
      .catch((err) => reject("web3 " + method + " " + methodData + " " + err.stack));
  });
};

const addressToData = (address) => {
  return address.substring(2).padStart(64, '0');
};

const numberToData = (num) => {
  return num.toString(16).padStart(64, '0');
};

const isEther = (token) => {
  return token === "0x0" || token === "0x0000000000000000000000000000000000000000";
};

const getTokenInfo = (token) => {
  return new Promise((resolve, reject) => {
    Promise.all([getSymbol(token), getDecimals(token)]).then((result) =>
    {
      resolve({symbol: result[0], decimals: result[1]});
    }).catch((err) => reject(err));
  });
};

const getBaseVolatility = (pool) => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0xbbe024a9"}).then((result) => 
      {
        if (result) {
          resolve(parseInt(result, 16));
        } else {
          reject(new Error("Invalid volatility"));
        }
      }).catch((err) => reject(err));
  });
};

const getWithdrawNoLockedOnAcoPool = (acoPool, shares) => {
  return new Promise((resolve, reject) => { 
    callEthereum("eth_call", {"to": acoPool, "data": "0xf92a336f" + numberToData(shares)}).then((result) => {
      if (result.startsWith("0x")) {
        resolve({
          underlying: BigInt("0x" + result.substring(2, 66)),
          strikeAsset: BigInt("0x" + result.substring(66, 130)),
          isPossible: (parseInt(result.substring(130), 16) === 1)
        });
      } else {
        reject(new Error("Error on get withdraw data for " + acoPool));
      }
    }).catch((err) => reject(err));
  });
};

const getPoolNetData = (acoPool, totalSupply, poolDecimals) => {
  return new Promise((resolve, reject) => { 
    internalGetPoolNetData(acoPool, totalSupply, poolDecimals, reject, resolve, 0);
  }).catch((err) => reject(err));
};


const internalGetPoolNetData = (acoPool, totalSupply, poolDecimals, onError, onSuccess, attempt) => {
  if (totalSupply === BigInt(0) || poolDecimals <= attempt || attempt === 3) {
    onSuccess({
      underlyingPerShare: "0",
      strikeAssetPerShare: "0",
      underlyingTotalShare: "0",
      strikeAssetTotalShare: "0"
    });
  } else {
    const share = BigInt(10) ** BigInt(poolDecimals - attempt);
    if (totalSupply >= share) {
      getWithdrawNoLockedOnAcoPool(acoPool, share).then((result) => {
        if (result.isPossible) {
          onSuccess({
            underlyingPerShare: (result.underlying * (BigInt(10) ** BigInt(attempt))).toString(10),
            strikeAssetPerShare: (result.strikeAsset * (BigInt(10) ** BigInt(attempt))).toString(10),
            underlyingTotalShare: (totalSupply * result.underlying / share).toString(10),
            strikeAssetTotalShare: (totalSupply * result.strikeAsset / share).toString(10)
          });
        } else {
          ++attempt;
          internalGetPoolNetData(acoPool, totalSupply, poolDecimals, onError, onSuccess, attempt);
        }
      }).catch((err) => onError(err));
    } else {
      ++attempt;
      internalGetPoolNetData(acoPool, totalSupply, poolDecimals, onError, onSuccess, attempt);
    }
  }
};

const getSymbol = (token) => {
  return new Promise((resolve, reject) => {
    if (isEther(token)) {
      resolve("ETH");
    } else {
      callEthereum("eth_call", {"to": token, "data": "0x95d89b41"}).then((result) => 
      {
        if (result && result.length > 130) {
          const size = parseInt(result.substring(66, 130), 16);
          let symbol = "";
          let start = 130;
          for (let i = 0; i < size; ++i) {
            symbol += String.fromCharCode("0x" + result.substring(start, start + 2));
            start += 2;
          }
          resolve(symbol);
        } else {
          resolve(result);
        }
      }).catch((err) => reject(err));
    }
  });
};

const getDecimals = (token) => {
  return new Promise((resolve, reject) => {
    if (isEther(token)) {
      resolve(18);
    } else {
      callEthereum("eth_call", {"to": token, "data": "0x313ce567"}).then((result) => {
        if (result) {
          resolve(parseInt(result, 16));
        } else {
          resolve(0);
        }
      }).catch((err) => reject(err));
    }
  });
};

const getTotalSupply = (token) => {
  return new Promise((resolve, reject) => {
      callEthereum("eth_call", {"to": token, "data": "0x18160ddd"}).then((result) => {
      if (result) {
        resolve(BigInt(result));
      } else {
        resolve(BigInt(0));
      }
    }).catch((err) => reject(err));
  });
};

const getBalance = (token, address) => {
  if (isEther(token)) {
    return getEthBalance(address);
  } else {
    return getTokenBalance(token, address);
  }
};

const getTokenBalance = (token, address) => {
  return new Promise((resolve, reject) => {
      callEthereum("eth_call", {"to": token, "data": "0x70a08231" + addressToData(address)}).then((result) => {
      if (result) {
        resolve(BigInt(result));
      } else {
        resolve(BigInt(0));
      }
    }).catch((err) => reject(err));
  });
};

const getEthBalance = (address) => {    
  return new Promise((resolve, reject) => {
    callEthereum("eth_getBalance", address).then((result) => {
      if (result) {
        resolve(BigInt(result));
      } else {
        resolve(BigInt(0));
      }
    }).catch((err) => reject(err));
  });
};

const getTransaction = (transactionHash) => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_getTransactionReceipt", transactionHash, null).then((result) => {
      if (result && result.blockNumber) {
        resolve(result);
      } else {
        resolve(null);
      }
    }).catch((err) => reject(err));
  });
};

const listAcoTokens = () => {      
  return new Promise((resolve, reject) => { 
    Promise.all([
      getAcoTokensByEvent("0x830ecf50af8281b7fc6c07ca94ed228468437e79a01755686fbb541d37103cb2"),
      getAcoTokensByEvent("0xd0e563bacc44116780b4c1d100d239178b84de4445ff3c7db2def6a02b746350")
    ]).then((result) => {
      resolve([].concat(result[0], result[1]));
    }).catch((err) => reject(err));
  });
};

const getAcoTokensByEvent = async (eventTopic) => {
  return new Promise((resolve, reject) => { 
    callEthereum("eth_getLogs", {"address": [process.env.ACO_FACTORY], "fromBlock": fromBlock, "topics": [eventTopic]}, null).then((result) => {
      const acos = [];
      if (result) {
        const size = 64;
        const now = Math.ceil(Date.now() / 1000);
        for (let k = 0; k < result.length; ++k) {
          let event = {};
          let pureData = result[k].data.substring(2);
          let numChunks = Math.ceil(pureData.length / size);
          for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            if (i === 0) event.strikePrice = BigInt("0x" + pureData.substring(o, o + size)).toString(10);
            else if (i === 1) event.expiryTime = parseInt(pureData.substring(o, o + size), 16);
            else if (i === 2) event.acoToken = ("0x" + pureData.substring(o + 24, o + size));
            else if (i === 3) event.acoTokenImplementation = ("0x" + pureData.substring(o + 24, o + size));
            else if (i === 4) event.creator = ("0x" + pureData.substring(o + 24, o + size));
          }
          if (event.expiryTime > now) {
            event.underlying = ("0x" + result[k].topics[1].substring(26));
            event.strikeAsset = ("0x" + result[k].topics[2].substring(26));
            event.isCall = (parseInt(result[k].topics[3], 16) === 1);
            acos.push(event);
          }
        }
      }
      resolve(acos);
    }).catch((err) => reject(err));
  })
};

const listAcoPools = () => {   
  return new Promise((resolve, reject) => { 
    return callEthereum("eth_getLogs", {"address": [process.env.ACO_POOL_FACTORY], "fromBlock": fromBlock, "topics": ["0x076bfd23ec3f80ca74cf420529ee593e7c84ce95d3da04885d1324031a363a5c"]}, null).then((result) => {
      const response = [];
      if (result) {
        const size = 64;
        for (let k = 0; k < result.length; ++k) {
          let event = {};
          let pureData = result[k].data.substring(2);
          let numChunks = Math.ceil(pureData.length / size);
          for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            if (i === 0) event.acoPool = ("0x" + pureData.substring(o + 24, o + size));
            else if (i === 1) event.acoPoolImplementation = ("0x" + pureData.substring(o + 24, o + size));
          }
          event.underlying = ("0x" + result[k].topics[1].substring(26));
          event.strikeAsset = ("0x" + result[k].topics[2].substring(26));
          event.isCall = (parseInt(result[k].topics[3], 16) === 1);
          response.push(event);
        }
      }
      resolve(response);
    }).catch((err) => reject(err));
  });
};

module.exports.opynQuote = (queryArguments) => { 
  return new Promise((resolve, reject) => {
    if (!queryArguments || !queryArguments.exchange || !queryArguments.token || !queryArguments.swappedToken || 
      !queryArguments.amount || (queryArguments.isBuy !== true && queryArguments.isBuy !== false && 
        queryArguments.isBuy !== "true" && queryArguments.isBuy !== "false") ) {
      resolve(null);
    } else {
      let data = ((queryArguments.isBuy === true || queryArguments.isBuy === "true") ? "0xbec165e7" : "0x3ed9c978") + addressToData(queryArguments.token) + addressToData(queryArguments.swappedToken) + numberToData(BigInt(queryArguments.amount));
      callEthereum("eth_call", {"to": queryArguments.exchange, "data": data}).then((result) => {
        if (result && result !== "0x") {
          resolve(BigInt(result).toString(10));
        } else {
          resolve(null);
        }
      }).catch((err) => reject(err));
    }
  });
};

module.exports.acoTokens = () => {   
  return new Promise((resolve, reject) => { 
    listAcoTokens().then((response) =>
    {
      const promises = [];
      let added = {};
      for (let i = 0; i < response.length; ++i) {
        added[response[i].acoToken] = promises.length;
        promises.push(getTokenInfo(response[i].acoToken));
        if (added[response[i].underlying] === undefined) {
          added[response[i].underlying] = promises.length;
          promises.push(getTokenInfo(response[i].underlying));
        }
        if (added[response[i].strikeAsset] === undefined) {
          added[response[i].strikeAsset] = promises.length;
          promises.push(getTokenInfo(response[i].strikeAsset));
        }
      }
      Promise.all(promises).then((result) =>
      {
        for (let j = 0; j < response.length; ++j) {
          response[j].acoTokenInfo = result[added[response[j].acoToken]];
          response[j].underlyingInfo = result[added[response[j].underlying]];
          response[j].strikeAssetInfo = result[added[response[j].strikeAsset]];
        }
        resolve(response);
      }).catch((err) => reject(err));
    }).catch((err) => reject(err));
  });
};

module.exports.acoPools = () => {   
  return new Promise((resolve, reject) => { 
    listAcoPools().then((response) =>
    {
      const promises = [];
      let added = {};
      for (let i = 0; i < response.length; ++i) {
        added[(response[i].acoPool+"vol")] = promises.length;
        promises.push(getBaseVolatility(response[i].acoPool));
        added[(response[i].acoPool+"und")] = promises.length;
        promises.push(getBalance(response[i].underlying, response[i].acoPool));
        added[(response[i].acoPool+"str")] = promises.length;
        promises.push(getBalance(response[i].strikeAsset, response[i].acoPool));
        added[(response[i].acoPool+"tol")] = promises.length;
        promises.push(getTotalSupply(response[i].acoPool));
        added[response[i].acoPool] = promises.length;
        promises.push(getTokenInfo(response[i].acoPool));
        if (added[response[i].underlying] === undefined) {
          added[response[i].underlying] = promises.length;
          promises.push(getTokenInfo(response[i].underlying));
        }
        if (added[response[i].strikeAsset] === undefined) {
          added[response[i].strikeAsset] = promises.length;
          promises.push(getTokenInfo(response[i].strikeAsset));
        }
      }
      Promise.all(promises).then((result) =>
      {
        const shareDataPromises = [];
        for (let j = 0; j < response.length; ++j) {
          response[j].volatility = result[added[(response[j].acoPool+"vol")]];
          response[j].underlyingBalance = (result[added[(response[j].acoPool+"und")]]).toString(10);
          response[j].strikeAssetBalance = (result[added[(response[j].acoPool+"str")]]).toString(10);
          response[j].totalSupply = (result[added[(response[j].acoPool+"tol")]]).toString(10);
          response[j].acoPoolInfo = result[added[response[j].acoPool]];
          response[j].underlyingInfo = result[added[response[j].underlying]];
          response[j].strikeAssetInfo = result[added[response[j].strikeAsset]];

          shareDataPromises.push(getPoolNetData(response[j].acoPool, result[added[(response[j].acoPool+"tol")]], result[added[response[j].acoPool]].decimals))
        }
        Promise.all(shareDataPromises).then((data) => 
        {
          for (let k = 0; k < response.length; ++k) {
            response[k].underlyingPerShare = data[k].underlyingPerShare;
            response[k].strikeAssetPerShare = data[k].strikeAssetPerShare;
            response[k].underlyingTotalShare = data[k].underlyingTotalShare;
            response[k].strikeAssetTotalShare = data[k].strikeAssetTotalShare;
          }
          resolve(response);
        }).catch((err) => reject(err));
      }).catch((err) => reject(err));
    }).catch((err) => reject(err));
  });
};
