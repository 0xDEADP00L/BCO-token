const BLLNToken = artifacts.require('BLLNToken');
const BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
const BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
const BLLNDividend = artifacts.require('BLLNDividend');

/// @dev deploy params
let maxTotalSupply = 250*(10**6);
let tokenPrice = web3.utils.toWei("600", "szabo");
let shares1 = {
	"a1": 91969860, //	evogroup shares - 36.79%
	"a2": 15265070, //	group 1 - 6.11%
	"a3": 2544178, //	advisors - 1.02%
	"a4": 2544178, //	bounty - 1.02%
	"a5": 2544178, //	bounty&advisors backup - 1.02%
	"a6": 15265070 //	early presale - 6.11%
};

let isExtendedLoggingEnabled = false;

function log(message) {
	if (isExtendedLoggingEnabled) {
		console.log(message);
	}
}

module.exports = async function(deployer, network, accounts) {
	let owner = accounts[0];
    let a1 = owner;
    let a2 = accounts[1];
    let a3 = accounts[2];
    let a4 = accounts[3];
    let a5 = accounts[4];
    let a6 = accounts[5];

	if (network != 'test') {
		isExtendedLoggingEnabled = true;
	}

	/// @dev Creation stage
	log("\n/*** Deploying contracts ***/\n");
	await deployer.deploy(BLLNDividend, {from: owner});
	let dividend = await BLLNDividend.deployed();

	await deployer.deploy(BLLNToken, dividend.address, {from: owner});
	let token = await BLLNToken.deployed();

	await deployer.deploy(BLLNTokensaleController, maxTotalSupply, dividend.address, token.address, {from: owner});
	let tokensaleController = await BLLNTokensaleController.deployed();

	await deployer.deploy(BLLNTokensaleBasic, tokensaleController.address, tokenPrice, {from: owner});
	let tokensale = await BLLNTokensaleBasic.deployed();
	/// @dev Configuration stage
	log("\n/*** Configuring contracts ***/\n");
	log("  BLLNDividend");
	log("    Setting token address");
	await dividend.setTokenAddress(token.address, {from: owner});

	log("  BLLNToken");
	log("    Setting tokensale controller address");
	await token.setTokensaleControllerAddress(tokensaleController.address, {from: owner});

	/// @dev Preparation stage 1
	log("\n/*** Minting presale amounts ***/\n");
	log("Minting " + shares1["a1"] + " tokens for " + a1);
    await tokensaleController.mintPresale(shares1["a1"], a1, {from: owner});
	log("Minting " + shares1["a2"] + " tokens for " + a2);
	await tokensaleController.mintPresale(shares1["a2"], a2, {from: owner});
	log("Minting " + shares1["a3"] + " tokens for " + a3);
	await tokensaleController.mintPresale(shares1["a3"], a3, {from: owner});
	log("Minting " + shares1["a4"] + " tokens for " + a4);
    await tokensaleController.mintPresale(shares1["a4"], a4, {from: owner});
	log("Minting " + shares1["a5"] + " tokens for " + a5);
    await tokensaleController.mintPresale(shares1["a5"], a5, {from: owner});
	log("Minting " + shares1["a6"] + " tokens for " + a6);
	await tokensaleController.mintPresale(shares1["a6"], a6, {from: owner});

	log("Deployment stage complete");
	if (network != 'test' && network != 'ganache') {
		console.log("---------------- Contracts Addresses -------------------\n");
		console.log("BLLNToken: " + BLLNToken.address);
		console.log("BLLNDividend: " + BLLNDividend.address);
		console.log("BLLNDividend: " + BLLNTokensaleController.address);
		console.log("\n---------------- Contracts ABI -------------------\n");
		console.log("BLLNToken: " + JSON.stringify(BLLNToken.abi) +'\n');
		console.log("BLLNDividend: " + JSON.stringify(BLLNDividend.abi));
		console.log("BLLNDividend: " + JSON.stringify(BLLNTokensaleController.abi));
	}
};
