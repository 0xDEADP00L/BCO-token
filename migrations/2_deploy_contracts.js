const BLLNToken = artifacts.require('BLLNToken');
const BLLNDividend = artifacts.require('BLLNDividend');

/// @dev deploy params
let maxTotalSupply = 250*(10**6);

let shares1 = {
	"a1": 91969860, //	evogroup shares - 36.79%
	"a2": 15265070, //	group 1 - 6.11%
	"a3": 2544178, //	advisors - 1.02%
	"a4": 2544178, //	bounty - 1.02%
	"a5": 2544178, //	bounty&advisors backup - 1.02%
	"a6": 15265070 //	early presale - 6.11%
};

module.exports = async function(deployer, network, accounts) {
	let owner = accounts[0];
    let a1 = owner;
    let a2 = accounts[1];
    let a3 = accounts[2];
    let a4 = accounts[3];
    let a5 = accounts[4];
    let a6 = accounts[5];

	/// @dev Creation

    /// @dev deploy BLLNToken
	await deployer.deploy(BLLNDividend, maxTotalSupply, {from: owner});
	let dividend = await BLLNDividend.deployed();

	await deployer.deploy(BLLNToken, dividend.address, {from: owner});
	let token = await BLLNToken.deployed();
	await dividend.setTokenAddress(token.address, {from: owner});

	/// @dev Preparation stage 1

    await dividend.mintPresale(shares1["a1"], a1, {from: owner});
	await dividend.mintPresale(shares1["a2"], a2, {from: owner});
	await dividend.mintPresale(shares1["a3"], a3, {from: owner});
    await dividend.mintPresale(shares1["a4"], a4, {from: owner});
    await dividend.mintPresale(shares1["a5"], a5, {from: owner});
	await dividend.mintPresale(shares1["a6"], a6, {from: owner});

	console.log("Deployment stage 1 complete");
	if (network != 'test' && network != 'ganache') {
		console.log("---------------- Contracts Addresses -------------------\n");
		console.log("BLLNToken: " + BLLNToken.address);
		console.log("BLLNDividend: " + BLLNDividend.address);
		console.log("\n---------------- Contracts ABI -------------------\n");
		console.log("BLLNToken: " + JSON.stringify(BLLNToken.abi) +'\n');
		console.log("BLLNDividend: " + JSON.stringify(BLLNDividend.abi));
	}
};
