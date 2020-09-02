const Axios = require('axios');

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
    Axios.get(process.env.INTERNAL_API + method + complement).then((response) => {
      if (response && response.data) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    }).catch((err) => reject("internal api " + method + complement + " " + err));
  });
};

module.exports.assets = (queryStringParameters) => {   
  return new Promise((resolve, reject) => { 
    callApi("assets", queryStringParameters).then((response) => resolve(response)).catch((err) => reject(err));
  });
};