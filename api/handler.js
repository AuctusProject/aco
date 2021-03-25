const web3Interface = require('./web3Interface.js');
const deribitInterface = require('./deribitInterface.js');
const internalInterface = require('./internalInterface.js');
const email = require('./email.js');

const setError = (statusCode, error, event, errorPrepend) => {
  let message = getErrorMessage(error, errorPrepend);
  return new Promise((resolve, reject) => {
    email.sendEmail(message + getEventData(event)).catch((err) => {
      message = "sendEmail error!!! " + message + " --- " + err;
    }).finally(() => {
      resolve(getResponse(message, statusCode));
    });
  });
};

const getEventData = (event) => {
  if (event) {
    try {
      return "       >>>> EVENT: " + JSON.stringify(event);
    } catch (e) {
      return "       >>>> Read EVENT error: " + e;
    }
  }
  return "";
};

const getErrorMessage = (error, prependString = "") => {
  let msg = (prependString ? prependString + " " : "");
  try {
    if (error instanceof Error) {
      msg += "MESSAGE: " + error.message;
      if (error.response) {
        if (error.response.status) msg += " STATUS CODE: " + error.response.status;
        if (error.response.data) msg += " DATA: " + stringify(error.response.data);
        if (error.response.headers) msg += " HEADERS: " + stringify(error.response.headers);
      } else if (error.stack) {
        msg += " STACK: " + error.stack;
      }
    } else if (typeof(error) === "string") {
      msg += error; 
    } else if (error.length > 0) {
      for (let i = 0; i < error.length; ++i) {
        msg += this.getErrorMessage(error[i]) + " --- ";
      }
    } else if (typeof(error) === "object") {
      msg += stringify(error);
    } else {
      msg += error.toString();
    }
  } catch {
    msg += "Not identified";
  }
  return msg;
};

const getResponse = (response, statusCode = null) => {
  const isJson = !!response && typeof(response) !== "string";
  return {
    statusCode: (statusCode || 501), 
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Content-Type": (isJson ? "application/json" : !!response && response.startsWith("<html>") ? "text/html" : "text/plain")
    }, 
    body: (isJson ? JSON.stringify(response) : !!response ? response : "")
  };
};

const handle = (fn, callback, event, errorPrepend = null) => {
  fn.then((response) => callback(null, getResponse(response, 200))).catch((err) => setError(null, err, event, errorPrepend).then((error) => callback(null, error)));
};

module.exports.tokens = (event, context, callback) => {
  handle(web3Interface.acoTokens(), callback, event, "tokens");
};

module.exports.pools = (event, context, callback) => {
  handle(web3Interface.acoPools(), callback, event, "pools");
};

module.exports.poolHistoricalShares = (event, context, callback) => {
  handle(web3Interface.acoPoolHistoricalShares(event.pathParameters.pool), callback, event, "pool historical shares");
};

module.exports.poolSituation = (event, context, callback) => {
  handle(web3Interface.acoPoolSituation(event.pathParameters.pool), callback, event, "pool open positions");
};

module.exports.poolHistoricalEvents = (event, context, callback) => {
  handle(web3Interface.acoPoolHistoricalEvents(event.pathParameters.pool), callback, event, "pool historical events");
};

module.exports.deribitTicker = (event, context, callback) => {
  handle(deribitInterface.ticker(event.queryStringParameters), callback, event, "deribitTicker");
};

module.exports.deribitInstruments = (event, context, callback) => {
  let asset = event.queryStringParameters["asset"];
  let type = event.queryStringParameters["isCall"] !== undefined ? event.queryStringParameters["isCall"] === "true" ? true : event.queryStringParameters["isCall"] === "false" ? false : undefined : undefined;
  let expiration = event.queryStringParameters["expiration"] ? isNaN(event.queryStringParameters["expiration"]) ? undefined : parseInt(event.queryStringParameters["expiration"]) : null;
  if (asset === undefined || type === undefined || expiration === undefined) {
    callback(null, getResponse(null, 400));
  } else {
    handle(deribitInterface.instruments(asset, type, expiration), callback, event, "deribitInstruments");
  }
};

module.exports.opynQuote = (event, context, callback) => {
  handle(web3Interface.opynQuote(event.queryStringParameters), callback, event, "opynQuote");
};

module.exports.assets = (event, context, callback) => {
  handle(internalInterface.assets(event.queryStringParameters), callback, event, "assets");
};

module.exports.getOrder = (event, context, callback) => {
  const orderId = event.pathParameters ? event.pathParameters.orderId : "";
  handle(internalInterface.getOrder(orderId), callback, event, "getOrder");
};

module.exports.createOrder = (event, context, callback) => {
  const body = (event.body ? JSON.parse(event.body) : null);
  handle(internalInterface.createOrder(body), callback, event, "createOrder");
};

module.exports.getAirdrop = (event, context, callback) => {
  const arg = event.pathParameters ? event.pathParameters.arg : "";
  handle(internalInterface.getAirdrop(arg), callback, event, "getAirdrop " + arg);
};