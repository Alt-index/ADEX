var Migrations = artifacts.require("ALX");
var Migrations1 = artifacts.require("ALX2");

module.exports = function(deployer) {
  deployer.deploy(Migrations,"10000000000000000", "Alt Index, Open End Crypto Fund ERC20", "ALX", "0", "604800", "0x627306090abaB3A6e1400e9345bC60c78a8BEf57");
  deployer.deploy(Migrations1);
};
