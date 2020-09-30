const web3Interface = require('./web3Interface.js');
const deribitInterface = require('./deribitInterface.js');
const internalInterface = require('./internalInterface.js');
const email = require('./email.js');

const setError = (statusCode, error) => {
  let message = ((error instanceof Error) ? error.stack : error);
  return new Promise((resolve, reject) => {
    email.sendEmail(message).catch((err) => {
      message = "sendEmail error!!! " + message + " --- " + err;
    }).finally(() => {
      resolve({ 
        statusCode: statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: message
      });
    });
  });
};

const successCallback = (response) => {
  return {
    statusCode: 200, 
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    }, 
    body: response !== null && response !== undefined ? JSON.stringify(response) : ""
  };
};

module.exports.tokens = (event, context, callback) => {
  web3Interface.acoTokens().then((response) => {
    callback(null, successCallback(response));
  }).catch((err) => setError(null, err).then(error => callback(null, error)));
};

module.exports.pools = (event, context, callback) => {
  web3Interface.acoPools().then((response) => {
    callback(null, successCallback(response));
  }).catch((err) => setError(null, err).then(error => callback(null, error)));
};

module.exports.deribitTicker = (event, context, callback) => {
  deribitInterface.ticker(event.queryStringParameters).then((response) => {
    callback(null, successCallback(response));
  }).catch((err) => setError(null, err).then(error => callback(null, error)));
};

module.exports.opynQuote = (event, context, callback) => {
  web3Interface.opynQuote(event.queryStringParameters).then((response) => {
    callback(null, successCallback(response));
  }).catch((err) => setError(null, err).then(error => callback(null, error)));
};

module.exports.assets = (event, context, callback) => {
  internalInterface.assets(event.queryStringParameters).then((response) => {
    callback(null, successCallback(response));
  }).catch((err) => setError(null, err).then(error => callback(null, error)));
};