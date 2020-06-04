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
            else if (i === 2) event.acoToken = ("0x" + pureData.substring(o + 26, o + size));
            else if (i === 3) event.acoTokenImplementation = ("0x" + pureData.substring(o + 26, o + size));
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
  return listAcoTokens();
};
