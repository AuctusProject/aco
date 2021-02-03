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
    }).catch((err) => {
      const status = (err.response ? err.response.status : null);
      let message;
      if (status == 400 || status == 403 || status == 404) {
        message = (err.response.data ? err.response.data.message : "");
      } else {
        message = "internal api " + method + " " + pathUrl + " " + err;
      }
      reject({status: status, message: message})
    });
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

module.exports.createOrder = (body) => {   
  return new Promise((resolve, reject) => { 
    callApi("otc", "POST", body).then((response) => resolve(response)).catch((err) => reject(err));
  });
};

module.exports.getAcoPoolData = (pool, start = null, end = null) => {   
  return new Promise((resolve, reject) => { 
    let queryStringParameters = null;
    if (start) {
      queryStringParameters = {start: start};
    }
    if (end) {
      if (queryStringParameters) {
        queryStringParameters.end = end;
      } else {
        queryStringParameters = {end: end};
      }
    }
    callApi("pools/" + pool + getComplement(queryStringParameters), "GET", null).then((response) => resolve(response)).catch((err) => reject(err));
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