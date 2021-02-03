const Axios = require('axios');
const internalApi = require('./internalInterface.js');

const fromBlock = "0x" + parseInt(process.env.FROM_BLOCK).toString(16);
const percentage = BigInt(100000);
const oldPoolImplementation = "0x68153d392966d38b7ae4415bd5778d02a579a437";

const callEthereum = (method, methodData, secondParam = "latest") => {
  return new Promise((resolve, reject) => {
    Axios.post("https://" + process.env.CHAIN + ".infura.io/v3/" + process.env.INFURA_ID, 
      {
        "jsonrpc":"2.0",
        "id": Date.now(),
        "method": method,
        "params": ((secondParam !== null && secondParam !== undefined) ? [methodData, secondParam] : 
          ((methodData !== null && methodData !== undefined) ? [methodData] : []))
      }, 
      {headers: {"Content-Type": "application/json"}})
      .then((response) =>
      {
        if (response && response.data) {
          if (response.data.error) {
            reject(new Error(method + " " + methodData + " " + JSON.stringify(response.data.error)));
          } else {
            resolve(response.data.result);
          }
        } else {
          resolve(null);
        }
      }).catch((err) => reject(new Error("web3 " + method + " " + methodData + " " + err.stack)));
  });
};

const addressToData = (address) => {
  return address.substring(2).padStart(64, '0');
};

const numberToData = (num) => {
  return num.toString(16).padStart(64, '0');
};

const booleanToData = (bool) => {
  return "000000000000000000000000000000000000000000000000000000000000000" + (bool ? "1" : "0");
};

const isEther = (token) => {
  return token === "0x0" || token === "0x0000000000000000000000000000000000000000";
};

const parseBlock = (block) => {
  if (typeof(block) === "number" || typeof(block) === "bigint") {
    return "0x" + block.toString(16);
  } else {
    return block.toString();
  }
};

const parseBigIntToNumber = (value, decimals) => {
  const precision = 10000000000.0;
  return parseFloat(value * BigInt(precision) / (BigInt(10) ** BigInt(decimals))) / precision;
}

const getAcoPoolName = (underlyingSymbol, strikeAssetSymbol, isCall) => {
  return "ACO POOL WRITE " + underlyingSymbol + "-" + strikeAssetSymbol + "-" + (isCall ? "CALL" : "PUT");
};

const formatDate = (unix) => {
  const date = new Date(unix * 1000);
  const y = date.getUTCFullYear().toString().substring(2);
  const d = date.getUTCDate() < 10 ? "0" + date.getUTCDate() : date.getUTCDate();
  const month = date.getUTCMonth();
  const m = month === 0 ? "JAN" : month === 1 ? "FEB" : month === 2 ? "MAR" : month === 3 ? "APR" : month === 4 ? "MAY" : month === 5 ? "JUN" : month === 6 ? "JUL" : month === 7 ? "AUG" : month === 8 ? "SEP" : month === 9 ? "OCT" : month === 10 ? "NOV" : "DEC"; 
  const h = date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours();
  const min = date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes();
  return d + m + y + "-" + h + min + "UTC";
};

const getAcoName = (underlyingSymbol, strikeAssetSymbol, isCall, strikePrice, expiryTime, strikeAssetDecimals) => {
  return "ACO " + 
    underlyingSymbol + "-" + 
    parseBigIntToNumber(strikePrice, strikeAssetDecimals) + 
    strikeAssetSymbol + "-" + 
    (isCall ? "C" : "P") + "-" +
    formatDate(expiryTime);
};

const getAcoCollateralAmount = (tokenAmount, isCall, strikePrice, underlyingDecimals) => {
  if (!isCall && tokenAmount > BigInt(0)) {
    return tokenAmount * strikePrice / (BigInt(10) ** BigInt(underlyingDecimals));
  } else {
    return tokenAmount;
  }
};

const getTokenInfo = (token, block = "latest") => {
  return new Promise((resolve, reject) => {
    Promise.all([getSymbol(token, block), getDecimals(token, block)]).then((result) =>
    {
      resolve({symbol: result[0], decimals: result[1]});
    }).catch((err) => reject(err));
  });
};

const getAcoPoolBaseVolatility = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0xbbe024a9"}, parseBlock(block)).then((result) => 
      {
        if (result) {
          resolve(BigInt(result));
        } else {
          reject(new Error("Invalid volatility"));
        }
      }).catch((err) => reject(err));
  });
};

const getAcoPoolFee = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0xddca3f43"}, parseBlock(block)).then((result) => 
      {
        if (result) {
          resolve(BigInt(result));
        } else {
          reject(new Error("Invalid pool fee"));
        }
      }).catch((err) => reject(err));
  });
};

const getAcoPoolUnderlyingPriceAdjustPercentage = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0x0b5256af"}, parseBlock(block)).then((result) => 
      {
        if (result) {
          resolve(BigInt(result));
        } else {
          reject(new Error("Invalid pool underlying price adjust"));
        }
      }).catch((err) => reject(err));
  });
};

const getAcoPoolStrategy = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0xa8c62e76"}, parseBlock(block)).then((result) => {
      if (result) {
        resolve("0x" + result.substring(26));
      } else {
        reject(new Error("Invalid strategy for ACO pool"));
      }
    }).catch((err) => reject(err));
  });
};

const getAcoPoolAssetConverter = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0x5d73efce"}, parseBlock(block)).then((result) => {
      if (result) {
        resolve("0x" + result.substring(26));
      } else {
        reject(new Error("Invalid converter for ACO pool"));
      }
    }).catch((err) => reject(err));
  });
};

const getAssetConverterPrice = (assetConverter, underlying, strikeAsset, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": assetConverter, "data": "0xac41865a" + addressToData(underlying) + addressToData(strikeAsset)}, parseBlock(block)).then((result) => {
      if (result) {
        resolve(BigInt(result));
      } else {
        reject(new Error("Invalid price for converter"));
      }
    }).catch((err) => reject(err));
  });
};

const getOpenPositionPenaltyPercentage = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0x9a4ed023"}, parseBlock(block)).then((result) => 
      {
        if (result) {
          resolve(BigInt(result));
        } else {
          reject(new Error("Invalid open position penalty"));
        }
      }).catch((err) => reject(err));
  });
};

const getAcoPoolBasicData = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": process.env.ACO_POOL_FACTORY, "data": "0xc0bb662b" + addressToData(pool)}, parseBlock(block)).then((result) =>  {
      if (result) {
        const pureData = result.substring(2);
        const underlying = "0x" + pureData.substring(24, 64);
        const strikeAsset = "0x" + pureData.substring(88, 128);
        if (underlying === strikeAsset) {
          reject(new Error("Invalid pool address " + pool));
        } else {
          resolve({
            underlying: underlying,
            strikeAsset: strikeAsset,
            isCall: (parseInt(pureData.substring(128), 16) === 1)
          });
        }
      } else {
        reject(new Error("Invalid pool " + pool));
      }
    }).catch((err) => reject(err));
  });
};

const getAcoBasicData = (aco, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": process.env.ACO_FACTORY, "data": "0x398436b8" + addressToData(aco)}, parseBlock(block)).then((result) =>  {
      if (result) {
        const pureData = result.substring(2);
        const underlying = "0x" + pureData.substring(24, 64);
        const strikeAsset = "0x" + pureData.substring(88, 128);
        if (underlying === strikeAsset) {
          reject(new Error("Invalid aco address " + aco));
        } else {
          resolve({
            underlying: underlying,
            strikeAsset: strikeAsset,
            isCall: (parseInt(pureData.substring(128, 192), 16) === 1),
            strikePrice: BigInt("0x" + pureData.substring(192, 256)),
            expiryTime: parseInt(pureData.substring(256), 16)
          });
        }
      } else {
        reject(new Error("Invalid aco " + aco));
      }
    }).catch((err) => reject(err));
  });
};

const getAcoDataOnPool = (pool, aco, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0xa817857e" + addressToData(aco)}, parseBlock(block)).then((result) =>  {
      if (result) {
        const pureData = result.substring(2);
        resolve({
          open: (parseInt(pureData.substring(0, 64), 16) === 1),
          valueSold: BigInt("0x" + pureData.substring(64, 128)),
          collateralLocked: BigInt("0x" + pureData.substring(128, 192)),
          collateralRedeemed: BigInt("0x" + pureData.substring(192, 256)),
          index: parseInt(pureData.substring(256, 320), 16),
          openIndex: parseInt(pureData.substring(320), 16)
        });
      } else {
        reject(new Error("Invalid aco " + aco + " on pool " + pool));
      }
    }).catch((err) => reject(err));
  });
};

const getGeneralData = (pool, block = "latest") => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": pool, "data": "0x9b4e23ae"}, parseBlock(block)).then((result) =>  {
      if (result) {
        const pureData = result.substring(2);
        const size = 64;
        const numChunks = Math.ceil(pureData.length / size);
        const response = {};
        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
          let property = "";
          if (i === 0) property = "underlyingBalance";
          else if (i === 1) property = "strikeAssetBalance";
          else if (i === 2) property = "collateralLocked";
          else if (i === 3) property = "collateralOnOpenPosition";
          else if (i === 4) property = "collateralLockedRedeemable";
          if (property) {
            response[property] = BigInt("0x" + pureData.substring(o, o + size));
          }
        }
        resolve(response);
      } else {
        reject(new Error("Invalid general data"));
      }
    }).catch((err) => reject(err));
  });
};

const getWithdrawNoLockedOnAcoPool = (acoPool, shares, block = "latest") => {
  return new Promise((resolve, reject) => { 
    callEthereum("eth_call", {"to": acoPool, "data": "0xf92a336f" + numberToData(shares)}, parseBlock(block)).then((result) => {
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

const quoteOnAcoStrategy = (acoStrategy, underlying, strikeAsset, isCall, strikePrice, expiryTime, baseVolatility, underlyingPrice, block = "latest") => {
  return new Promise((resolve, reject) => { 
    callEthereum("eth_call", {"to": acoStrategy, "data": "0x8d67bee2" + numberToData(underlyingPrice) + addressToData(underlying) + addressToData(strikeAsset) + booleanToData(isCall) + numberToData(strikePrice) + numberToData(expiryTime) + numberToData(baseVolatility) + numberToData(0) + numberToData(1)}, parseBlock(block)).then((result) => {
      if (result) {
        resolve({
          price: BigInt(result.substring(0, 66)),
          volatility: BigInt("0x" + result.substring(66))
        });
      } else {
        reject(new Error("Error on quote"));
      }
    }).catch((err) => reject(err));
  });
};

const getPoolNetData = (acoPool, totalSupply, poolDecimals, block = "latest") => {
  return new Promise((resolve, reject) => { 
    internalGetPoolNetData(acoPool, totalSupply, poolDecimals, block, reject, resolve, 0);
  });
};

const internalGetPoolNetData = (acoPool, totalSupply, poolDecimals, block, onError, onSuccess, attempt) => {
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
      getWithdrawNoLockedOnAcoPool(acoPool, share, block).then((result) => {
        if (result.isPossible) {
          onSuccess({
            underlyingPerShare: (result.underlying * (BigInt(10) ** BigInt(attempt))).toString(10),
            strikeAssetPerShare: (result.strikeAsset * (BigInt(10) ** BigInt(attempt))).toString(10),
            underlyingTotalShare: (totalSupply * result.underlying / share).toString(10),
            strikeAssetTotalShare: (totalSupply * result.strikeAsset / share).toString(10)
          });
        } else {
          ++attempt;
          internalGetPoolNetData(acoPool, totalSupply, poolDecimals, block, onError, onSuccess, attempt);
        }
      }).catch((err) => onError(err));
    } else {
      ++attempt;
      internalGetPoolNetData(acoPool, totalSupply, poolDecimals, block, onError, onSuccess, attempt);
    }
  }
};

const getSymbol = (token, block = "latest") => {
  return new Promise((resolve, reject) => {
    if (isEther(token)) {
      resolve("ETH");
    } else {
      callEthereum("eth_call", {"to": token, "data": "0x95d89b41"}, parseBlock(block)).then((result) => 
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

const getDecimals = (token, block = "latest") => {
  return new Promise((resolve, reject) => {
    if (isEther(token)) {
      resolve(18);
    } else {
      callEthereum("eth_call", {"to": token, "data": "0x313ce567"}, parseBlock(block)).then((result) => {
        if (result) {
          resolve(parseInt(result, 16));
        } else {
          resolve(0);
        }
      }).catch((err) => reject(err));
    }
  });
};

const getTotalSupply = (token, block = "latest") => {
  return new Promise((resolve, reject) => {
      callEthereum("eth_call", {"to": token, "data": "0x18160ddd"}, parseBlock(block)).then((result) => {
      if (result) {
        resolve(BigInt(result));
      } else {
        resolve(BigInt(0));
      }
    }).catch((err) => reject(err));
  });
};

const getBalance = (token, address, block = "latest") => {
  if (isEther(token)) {
    return getEthBalance(address, block);
  } else {
    return getTokenBalance(token, address, block);
  }
};

const getTokenBalance = (token, address, block = "latest") => {
  return new Promise((resolve, reject) => {
      callEthereum("eth_call", {"to": token, "data": "0x70a08231" + addressToData(address)}, parseBlock(block)).then((result) => {
      if (result) {
        resolve(BigInt(result));
      } else {
        resolve(BigInt(0));
      }
    }).catch((err) => reject(err));
  });
};

const getEthBalance = (address, block = "latest") => {    
  return new Promise((resolve, reject) => {
    callEthereum("eth_getBalance", address, parseBlock(block)).then((result) => {
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

const getLastBlockNumber = () => {
  return new Promise((resolve, reject) => {
    callEthereum("eth_blockNumber", null, null).then((result) => resolve(parseInt(result, 16))).catch((err) => reject(err)); 
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

const getAcoPoolWithdrawOpenPositionPenaltyHistory = async (pool) => {
  return new Promise((resolve, reject) => { 
    callEthereum("eth_getLogs", {"address": [pool], "fromBlock": fromBlock, "topics": ["0xd352239c19dc57bad583cde39eb95d7bf6cccc6acc47e7016b8fea01cb84215a"]}, null).then((result) => {
      if (result) {
        const data = [];
        for (let i = 0; i < result.length; ++i) {
          data.push({block: parseInt(result[i].blockNumber, 16), value: BigInt(result[i].topics[2])});
        }
        resolve(data);
      } else {
        reject(new Error("Invalid pool"))
      }
    }).catch((err) => reject(err));
  })
};

const numberOfOpenAcoTokensOnAcoPool = (pool, block = "latest") => {
  return new Promise((resolve, reject) => { 
    callEthereum("eth_call", {"to": pool, "data": "0xb5b8a810"}, parseBlock(block)).then((result) => {
      if (result) {
        resolve(parseInt(result, 16));
      } else {
        reject(new Error("Invalid number of open ACO tokens negotiated"));
      }
    }).catch((err) => reject(err));
  });
};

const getOpenAcoTokenOnAcoPool = (pool, index, block = "latest") => {
  return new Promise((resolve, reject) => { 
    callEthereum("eth_call", {"to": pool, "data": "0xf21bb169" + numberToData(index)}, parseBlock(block)).then((result) => {
      if (result) {
        resolve("0x" + result.substring(26));
      } else {
        reject(new Error("Invalid address of ACO tokens negotiated"));
      }
    }).catch((err) => reject(err));
  });
};

const listOpenAcoTokensOnAcoPool = (pool, block = "latest") => {
  return new Promise((resolve, reject) => { 
    numberOfOpenAcoTokensOnAcoPool(pool, block).then((numberOfAcoTOkens) => {
      const promises = [];
      for (let i = 0; i < numberOfAcoTOkens; ++i) {
        promises.push(getOpenAcoTokenOnAcoPool(pool, i, block));
      }
      Promise.all(promises).then((acoTokens) => resolve(acoTokens)).catch((err) => reject(err));
    }).catch((err) => reject(err));
  });
};

const getAcoCurrentCollaterizedTokens = (aco, account, block = "latest") => {    
  return new Promise((resolve, reject) => {
    callEthereum("eth_call", {"to": aco, "data": "0x45f79d1b" + addressToData(account)}, parseBlock(block)).then((result) => {
      resolve(BigInt(result));
    }).catch((err) => reject(err));
  });
};

const getPoolOpenNetValue = (isCall, collateralLocked, openValue, underlyingPrice, underlyingPriceAdjust, withdrawOpenPenalty, underlyingDecimals) => {
  return getPoolCollateralValue(isCall, collateralLocked, underlyingPrice, underlyingDecimals) - openValue * (percentage + withdrawOpenPenalty + underlyingPriceAdjust) / percentage;
};

const getPoolCollateralValue = (isCall, collateralLocked, underlyingPrice, underlyingDecimals) => {
  if (isCall) {
    return collateralLocked * underlyingPrice / (BigInt(10) ** BigInt(underlyingDecimals));
  } else {
    return collateralLocked;
  }
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
      getLastBlockNumber().then((blockNumber) => {
        const promises = [];
        let added = {};
        for (let i = 0; i < response.length; ++i) {
          added[(response[i].acoPool+"vol")] = promises.length;
          promises.push(getAcoPoolBaseVolatility(response[i].acoPool, blockNumber));
          added[(response[i].acoPool+"tol")] = promises.length;
          promises.push(getTotalSupply(response[i].acoPool, blockNumber));
          added[response[i].acoPool] = promises.length;
          promises.push(getTokenInfo(response[i].acoPool, blockNumber));
          if (added[response[i].underlying] === undefined) {
            added[response[i].underlying] = promises.length;
            promises.push(getTokenInfo(response[i].underlying, blockNumber));
          }
          if (added[response[i].strikeAsset] === undefined) {
            added[response[i].strikeAsset] = promises.length;
            promises.push(getTokenInfo(response[i].strikeAsset, blockNumber));
          }
          if (response[i].acoPoolImplementation === oldPoolImplementation) {
            added[(response[i].acoPool+"und")] = promises.length;
            promises.push(getBalance(response[i].underlying, response[i].acoPool, blockNumber));
            added[(response[i].acoPool+"str")] = promises.length;
            promises.push(getBalance(response[i].strikeAsset, response[i].acoPool, blockNumber));
          } else {
            added[(response[i].acoPool+"pen")] = promises.length;
            promises.push(getOpenPositionPenaltyPercentage(response[i].acoPool, blockNumber));
            added[(response[i].acoPool+"ged")] = promises.length;
            promises.push(getGeneralData(response[i].acoPool, blockNumber));
          }
        }
        Promise.all(promises).then((result) =>
        {
          const shareDataPromises = [];
          const shareDataIndex = [];
          for (let j = 0; j < response.length; ++j) {
            let totalSupply = result[added[(response[j].acoPool+"tol")]];
            let poolDecimals = result[added[response[j].acoPool]].decimals;
  
            response[j].volatility = parseFloat(result[added[(response[j].acoPool+"vol")]]);
            response[j].totalSupply = totalSupply.toString(10);
            response[j].acoPoolInfo = result[added[response[j].acoPool]];
            response[j].underlyingInfo = result[added[response[j].underlying]];
            response[j].strikeAssetInfo = result[added[response[j].strikeAsset]];
  
            if (response[j].acoPoolImplementation === oldPoolImplementation) {
              response[j].underlyingBalance = (result[added[(response[j].acoPool+"und")]]).toString(10);
              response[j].strikeAssetBalance = (result[added[(response[j].acoPool+"str")]]).toString(10);
              shareDataIndex.push(j);
              shareDataPromises.push(getPoolNetData(response[j].acoPool, totalSupply, poolDecimals, blockNumber));
            } else {
              let openPositionPenalty = result[added[(response[j].acoPool+"pen")]];
              let generalData = result[added[(response[j].acoPool+"ged")]];
  
              response[j].underlyingBalance = generalData.underlyingBalance.toString(10);
              response[j].strikeAssetBalance = generalData.strikeAssetBalance.toString(10);
  
              if (totalSupply > BigInt(0)) {
                let collateral;
                if (response[j].isCall) {
                  collateral = generalData.underlyingBalance;
                } else {
                  collateral = generalData.strikeAssetBalance;
                }
                let collateralPerShare = collateral + generalData.collateralLocked - (generalData.collateralOnOpenPosition * (percentage + openPositionPenalty)) / percentage;
                let share = BigInt(10) ** BigInt(poolDecimals);
                if (response[j].isCall) {
                  response[j].underlyingPerShare = (share * collateralPerShare / totalSupply).toString(10);
                  response[j].strikeAssetPerShare = (share * generalData.strikeAssetBalance / totalSupply).toString(10);
                  response[j].underlyingTotalShare = collateralPerShare.toString(10);
                  response[j].strikeAssetTotalShare = generalData.strikeAssetBalance.toString(10);
                } else {
                  response[j].underlyingPerShare = (share * generalData.underlyingBalance / totalSupply).toString(10);
                  response[j].strikeAssetPerShare = (share * collateralPerShare / totalSupply).toString(10);
                  response[j].underlyingTotalShare = generalData.underlyingBalance.toString(10);
                  response[j].strikeAssetTotalShare = collateralPerShare.toString(10);
                }
              } else {
                response[j].underlyingPerShare = "0";
                response[j].strikeAssetPerShare = "0";
                response[j].underlyingTotalShare = "0";
                response[j].strikeAssetTotalShare = "0";
              }
            }
          }
          Promise.all(shareDataPromises).then((data) => 
          {
            for (let k = 0; k < shareDataIndex.length; ++k) {
              response[shareDataIndex[k]].underlyingPerShare = data[k].underlyingPerShare;
              response[shareDataIndex[k]].strikeAssetPerShare = data[k].strikeAssetPerShare;
              response[shareDataIndex[k]].underlyingTotalShare = data[k].underlyingTotalShare;
              response[shareDataIndex[k]].strikeAssetTotalShare = data[k].strikeAssetTotalShare;
            }
            resolve(response);
          }).catch((err) => reject(err));
        }).catch((err) => reject(err));
      }).catch((err) => reject(err));
    }).catch((err) => reject(err));
  });
};

module.exports.acoPoolSituation = (pool) => {   
  return new Promise((resolve, reject) => { 
    getLastBlockNumber().then((blockNumber) => {
      getAcoPoolBasicData(pool, blockNumber).then((basicData) => {
        Promise.all([
          getTokenInfo(basicData.underlying, blockNumber),
          getTokenInfo(basicData.strikeAsset, blockNumber),
          getTotalSupply(pool, blockNumber),
          getGeneralData(pool, blockNumber), 
          listOpenAcoTokensOnAcoPool(pool, blockNumber),
          getOpenPositionPenaltyPercentage(pool, blockNumber),
          getAcoPoolBaseVolatility(pool, blockNumber),
          getAcoPoolFee(pool, blockNumber),
          getAcoPoolStrategy(pool, blockNumber),
          getAcoPoolAssetConverter(pool, blockNumber),
          getAcoPoolUnderlyingPriceAdjustPercentage(pool, blockNumber)
        ]).then((data) => {
          getAssetConverterPrice(data[9], basicData.underlying, basicData.strikeAsset, blockNumber).then((underlyingPrice) => {
            let openPositionValue;
            if (basicData.isCall) {
              openPositionValue = data[3].collateralOnOpenPosition * underlyingPrice * (percentage - data[10]) / (BigInt(10) ** BigInt(data[0].decimals + 5));
            } else {
              openPositionValue = data[3].collateralOnOpenPosition;
            }
            const result = {
              name: getAcoPoolName(data[0].symbol, data[1].symbol, basicData.isCall),
              address: pool.toLowerCase(),
              underlying: basicData.underlying, 
              strikeAsset: basicData.strikeAsset,
              isCall: basicData.isCall,
              underlyingInfo: data[0],
              strikeAssetInfo: data[1],
              totalSupply: data[2].toString(10),
              underlyingBalance: data[3].underlyingBalance.toString(10),
              strikeAssetBalance: data[3].strikeAssetBalance.toString(10),
              collateralLocked: data[3].collateralLocked.toString(10),
              openOpositionValue: openPositionValue.toString(10),
              openOpositionNetValue: getPoolOpenNetValue(basicData.isCall, data[3].collateralLocked, openPositionValue, underlyingPrice, data[10], data[5], data[0].decimals).toString(10),
              volatility: parseBigIntToNumber(data[6], 3),
              protocolFee: parseBigIntToNumber(data[7], 3),
              openAcos: []
            };
            const acoPromises = [];
            for (let i = 0; i < data[4].length; ++i) {
              acoPromises.push(getAcoBasicData(data[4][i], blockNumber));
              acoPromises.push(getAcoDataOnPool(pool, data[4][i], blockNumber));
              acoPromises.push(getAcoCurrentCollaterizedTokens(data[4][i], pool, blockNumber));
            }
            Promise.all(acoPromises).then((acoData) => {
              const quotePromises = [];
              const now = Math.ceil(Date.now() / 1000);
              let index = 0;
              for (let j = 0; j < data[4].length; ++j) {
                let amount = acoData[index].expiryTime > now ? acoData[index+2] : BigInt(0);
                result.openAcos.push({
                  name: getAcoName(data[0].symbol, data[1].symbol, basicData.isCall, acoData[index].strikePrice, acoData[index].expiryTime, data[1].decimals),
                  address: data[4][j],
                  tokenAmount: amount.toString(10),
                  collateralLocked: getAcoCollateralAmount(acoData[index+2], basicData.isCall, acoData[index].strikePrice, data[0].decimals).toString(10),
                  valueSold: acoData[index+1].valueSold.toString(10),
                  value: "0",
                  netValue: "0"
                });
                if (amount > BigInt(0)) {
                  quotePromises.push(quoteOnAcoStrategy(data[8], basicData.underlying, basicData.strikeAsset, basicData.isCall, acoData[index].strikePrice, acoData[index].expiryTime, data[6], underlyingPrice, blockNumber));
                }
                index = index + 3;
              }
              Promise.all(quotePromises).then((quotes) => {
                let quoteIndex = 0;
                for (let k = 0; k < data[4].length; ++k) {
                  if (result.openAcos[k].tokenAmount !== "0") {
                    result.openAcos[k].value = (BigInt(result.openAcos[k].tokenAmount) * quotes[quoteIndex].price * (percentage + data[7]) / (BigInt(10) ** BigInt(data[0].decimals + 5))).toString(10);
                    result.openAcos[k].netValue = getPoolOpenNetValue(basicData.isCall, BigInt(result.openAcos[k].collateralLocked), BigInt(result.openAcos[k].value), underlyingPrice, data[10], data[5], data[0].decimals).toString(10);
                    ++quoteIndex;
                  } else {
                    result.openAcos[k].netValue = getPoolCollateralValue(basicData.isCall, BigInt(result.openAcos[k].collateralLocked), underlyingPrice, data[0].decimals).toString(10);
                  }
                }
                resolve(result);
              }).catch((err) => reject(err));
            }).catch((err) => reject(err));
          }).catch((err) => reject(err)); 
        }).catch((err) => reject(err));
      }).catch((err) => reject(err));
    }).catch((err) => reject(err));
  });
};

module.exports.acoPoolHistoricalShares = (pool) => {   
  return new Promise((resolve, reject) => { 
    getAcoPoolBasicData(pool).then((basicData) => {
      getAcoPoolWithdrawOpenPositionPenaltyHistory(pool).then((penalties) => {
        getDecimals(pool).then((decimals) => {
          const share = BigInt(10) ** BigInt(decimals);
          const now = Math.ceil(Date.now() / 1000);
          internalApi.getAcoPoolData(pool, now - 7776000).then((data) => {
            const result = [];
            for (let i = 0; i < data.length; ++i) {
              let event = {t: data[i].t, u: "0", s: "0"};
              let totalSupply = BigInt(data[i].a);
              if (totalSupply > BigInt(0)) {
                let openPositionPenalty = penalties.filter(c=>c.block<=data[i].b).reduce((a,b)=>a.block>b.block?a:b).value;
                let collateral;
                if (basicData.isCall) {
                  collateral = BigInt(data[i].u);
                } else {
                  collateral = BigInt(data[i].s);
                }
                let collateralPerShare = collateral + BigInt(data[i].l) - (BigInt(data[i].o) * (BigInt(100000) + openPositionPenalty)) / BigInt(100000);
                if (basicData.isCall) {
                  event.u = (share * collateralPerShare / totalSupply).toString(10);
                  event.s = (share * BigInt(data[i].s) / totalSupply).toString(10);
                } else {
                  event.u = (share * BigInt(data[i].u) / totalSupply).toString(10);
                  event.s = (share * collateralPerShare / totalSupply).toString(10);
                }
              }
              result.push(event);
            }
            resolve(result);
          }).catch((err) => reject(err));
        }).catch((err) => reject(err));
      }).catch((err) => reject(err));
    }).catch((err) => reject(err));
  });
};

module.exports.acoPoolHistoricalEvents = (pool) => {   
  return new Promise((resolve, reject) => { 
    
  });
};