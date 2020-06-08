const Axios = require('axios');

const fromBlock = "0x" + parseInt(process.env.FROM_BLOCK).toString(16);
let web3Id = 0;

const callEthereum = (method, methodData, secondParam = "latest") => {
  return new Promise((resolve, reject) => {
    Axios.post("https://" + process.env.CHAIN + ".infura.io/v3/" + process.env.INFURA_ID, 
      {
        "jsonrpc":"2.0",
        "id": ++web3Id,
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
      .catch((err) => reject(method + " " + methodData + " " + err.stack));
  });
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

const listAcoTokens = () => {   
  return new Promise((resolve, reject) => { 
    return callEthereum("eth_getLogs", {"address": [process.env.ACO_FACTORY], "fromBlock": fromBlock, "topics": ["0x830ecf50af8281b7fc6c07ca94ed228468437e79a01755686fbb541d37103cb2"]}, null).then((result) => {
      const response = [];
      if (result) {
        const size = 64;
        const now = Math.ceil((new Date()).getTime() / 1000);
        for (let k = 0; k < result.length; ++k) {
          let event = {};
          let expired = false;
          let pureData = result[k].data.substring(2);
          let numChunks = Math.ceil(pureData.length / size);
          for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            if (i === 0) event.strikePrice = BigInt("0x" + pureData.substring(o, o + size)).toString(10);
            else if (i === 1) event.expiryTime = parseInt(pureData.substring(o, o + size), 16);
            else if (i === 2) event.acoToken = ("0x" + pureData.substring(o + 24, o + size));
            else if (i === 3) event.acoTokenImplementation = ("0x" + pureData.substring(o + 24, o + size));
            if (event.expiryTime <= now) {
              expired = true;
              break;
            }
          }
          if (!expired) {
            event.underlying = ("0x" + result[k].topics[1].substring(26));
            event.strikeAsset = ("0x" + result[k].topics[2].substring(26));
            event.isCall = (parseInt(result[k].topics[3], 16) === 1);
            response.push(event);
          }
        }
      }
      resolve(response);
    }).catch((err) => reject(err));
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
