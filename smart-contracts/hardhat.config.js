require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");

module.exports = {
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true
        }
    },
    mocha: {
        timeout: 60000,
    },
    solidity: {
        version: "0.6.6",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    gasReporter: {
        enabled: false,
        currency: 'USD',
        gasPrice: 100
    }
};
