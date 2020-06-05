const web3Interface = require('./web3Interface.js');
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

module.exports.tokens = (event, context, callback) => {
  web3Interface.acoTokens().then((response) => {
    callback(null, {statusCode: 200, body: JSON.stringify(response)});
  }).catch((err) => setError(null, err).then(error => callback(null, error)));
};