const BCOToken = artifacts.require('BCOToken');
const BCODividend = artifacts.require('BCODividend');

let presaleAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);

module.exports = async function(deployer, network, accounts) {
	let owner = accounts[0];
	await deployer.deploy(BCODividend, presaleAmount, maxTotalSupply, {from: owner});
	let dividend = await BCODividend.deployed();
	await deployer.deploy(BCOToken, dividend.address, {from: owner});
	let token = await BCOToken.deployed();
	await dividend.setTokenAddress(token.address, {from: owner});
	await token.mintPresale(presaleAmount, owner, {from: owner});
	if (network != 'test' && network != 'ganache') {
		console.log("---------------- Contracts Addresses -------------------\n");
		console.log("BCOToken: " + BCOToken.address);
		console.log("BCODividend: " + BCODividend.address);
		console.log("\n---------------- Contracts ABI -------------------\n");
		console.log("BCOToken: " + JSON.stringify(BCOToken.abi) +'\n');
		console.log("BCODividend: " + JSON.stringify(BCODividend.abi));
	}
};
