usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-ethers");
usePlugin("buidler-gas-reporter");

module.exports = {
    networks: {
        localhost: {
            timeout: 60000
        }
    },
    solc: {
        version: "0.6.6",
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    gasReporter: {
        enabled: false,
        currency: 'USD',
        gasPrice: 100
    }
};
