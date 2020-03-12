

var tokenMock = artifacts.require("TokenMock");
var staking = artifacts.require("Staking");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(tokenMock).then(function() {
    return deployer.deploy(staking, tokenMock.address, 120);
  })
}


