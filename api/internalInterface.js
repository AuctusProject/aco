const Axios = require('axios');

const callApi = (pathUrl, method, body = null) => {
  return new Promise((resolve, reject) => { 
    Axios.request({
      method: method,
      url: process.env.INTERNAL_API + pathUrl, 
      headers: {"Content-Type": "application/json"},
      data: body 
    }).then((response) => {
      if (response && response.data) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    }).catch((err) => reject("internal api " + method + " " + pathUrl + " " + err));
  });
};

module.exports.assets = (queryStringParameters) => {   
  return new Promise((resolve, reject) => { 
    callApi("assets" + getComplement(queryStringParameters), "GET").then((response) => resolve(response)).catch((err) => reject(err));
  });
};

module.exports.getOrder = (id) => {   
  return new Promise((resolve, reject) => { 
    callApi("otc/" + encodeURIComponent(id), "GET").then((response) => resolve(response)).catch((err) => reject(err));
  });
};

module.exports.createOrder = (id, body) => {   
  return new Promise((resolve, reject) => { 
    callApi("otc/" + encodeURIComponent(id), "POST", body).then((response) => resolve(response)).catch((err) => reject(err));
  });
};

const getComplement = (queryStringParameters) => {
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
  return complement;
};