
options = {
  networks: {
  },
  compilers: {
    solc: {
      version: "0.5.8",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 2000
        }
      }
    }
  }
}

let reporterArg = process.argv.indexOf('--report');
if (reporterArg !== -1) {
  options['mocha'] = {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      excludeContracts: ['Migrations']
    }
  }
}


module.exports = options;
