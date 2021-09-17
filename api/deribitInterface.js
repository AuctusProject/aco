const Axios = require('axios');

const apiUrl = "https://www.deribit.com/api/v2/";

const callApi = (method, queryStringParameters) => {
  return new Promise((resolve, reject) => { 
    let complement = "";
    if (!!queryStringParameters) {
      const data = Object.entries(queryStringParameters);
      if (data.length > 0) {
        complement += "?";
      }
      for (let i = 0; i < data.length; ++i) {
        if (i !== 0) complement += "&";
        complement += data[i][0] + "=" + encodeURIComponent(data[i][1]);
      }
    }
    Axios.get(apiUrl + method + complement).then((response) => {
      if (response && response.data) {
        resolve(response.data.result);
      } else {
        resolve(null);
      }
    }).catch((err) => {
      if (err.toString().indexOf("400") > 0) {
        resolve(null);
      } else {
        reject("deribit " + method + complement + " " + err);
      }
    });
  });
};

module.exports.ticker = (queryStringParameters) => {   
  return new Promise((resolve, reject) => { 
    callApi("public/ticker", queryStringParameters).then((response) => resolve(response)).catch((err) => reject(err));
  });
};

module.exports.instruments = (asset, type, expiration) => {   
  return new Promise((resolve, reject) => { 
    let complement = "?expired=false&kind=option&currency=" + asset;
    callApi("public/get_instruments" + complement).then((response) => {
      const result = [];
      for (let i = 0; i < response.length; ++i) {
        if (response[i].is_active) {
          let isCall = response[i].option_type === "call";
          if ((type && isCall) || (!type && !isCall)) {
            let exp = (response[i].expiration_timestamp/1000);
            if (!expiration || exp === expiration) {
              result.push({
                instrument: response[i].instrument_name, 
                asset: response[i].base_currency, 
                isCall: isCall,
                strikePrice: response[i].strike,
                expiration: exp
              });
            }
          }
        } 
      }
      resolve(result);
    }).catch((err) => reject(err));
  });
};
  