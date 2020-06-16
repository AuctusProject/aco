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
    }).catch((err) => reject("deribit " + method + complement + " " + err));
  });
};

module.exports.ticker = (queryStringParameters) => {   
  return new Promise((resolve, reject) => { 
    callApi("public/ticker", queryStringParameters).then((response) => resolve(response)).catch((err) => reject(err));
  });
};
  