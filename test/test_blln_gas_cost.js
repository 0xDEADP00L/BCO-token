let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
let BLLNDividends = artifacts.require('BLLNDividend');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let nearErrorValue = 1;
function nearEqual(given, expected) {
	return given >= expected - nearErrorValue
		&& given <= expected + nearErrorValue;
}

function assertNearEqual(given, expected, message) {
	var msg = "";
	if (message != undefined) {
		msg = message + ": " + given + " should be nearly equal to " + expected;
	} else {
		msg = given + " should be nearly equal to " + expected;
	}
	assert.ok(nearEqual(given, expected), msg);
}

let presaleAmount = 370000;
let maxTotalSupply = 1000000;
let tokenPrice = money(300);

contract('TestBLLNGasCost', function(accounts) {
	let dividends;
	let token;
	let tokensaleController;
	let tokensale;

	let owner = accounts[0];
	let acc1 = accounts[1];
	let acc2 = accounts[2];
	let acc3 = accounts[3];

	beforeEach(async function () {
		dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)
        tokensale = await BLLNTokensaleBasic.new(tokensaleController.address, tokenPrice);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address);

        await tokensaleController.mintPresale(presaleAmount, owner);
        await tokensaleController.addAddressToWhitelist(tokensale.address);
	});

	describe('gas cost', function () {
        beforeEach(async function() {
            // Send 1 transaction to initialize D_n value
            await tokensale.sendTransaction({value: tokenPrice * 1000, from: owner});
        });

		it('tokensale gas cost', async function() {
            let _tokens2 = 9999;
            let _ethers2 = tokenPrice * _tokens2;

            let _tokens3 = 10001;
			let _ethers3 = tokenPrice * _tokens3;

			/*
				<10k / >10k discounted
				claimed / non-claimed
				no-tokens / has tokens
			*/

			// <10k, claimed, no-tokens
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toString(), "0");
			let dividends2 = await dividends.calculateDividendAmount(acc2);
			assert.equal(dividends2.toString(), "0");
            let send1Hash = await tokensale.sendTransaction({value: _ethers2, from: acc2});

			// <10k, claimed, has tokens
			tokenBalance2 = await token.balanceOf(acc2);
			assert.notEqual(tokenBalance2.toString(), "0");
			dividends2 = await dividends.calculateDividendAmount(acc2);
			assert.equal(dividends2.toString(), "0");
			let send2Hash = await tokensale.sendTransaction({value: _ethers2, from: acc2});

			// >10k, claimed, no-tokens
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toString(), "0");
			let dividends3 = await dividends.calculateDividendAmount(acc3);
			assert.equal(dividends3.toString(), "0");
            let send3Hash = await tokensale.sendTransaction({value: _ethers3, from: acc3});

			// >10k, claimed, has tokens
			await dividends.withdraw({from: acc3});

			tokenBalance3 = await token.balanceOf(acc3);
			assert.notEqual(tokenBalance3.toString(), "0");
			dividends3 = await dividends.calculateDividendAmount(acc3);
			assert.equal(dividends3.toString(), "0");
            let send4Hash = await tokensale.sendTransaction({value: _ethers3, from: acc3});

			// force unclaim dividends
			await dividends.shareDividends({value: tokenPrice * 10000, from: acc1});

			// <10k, non-claimed, has tokens
			tokenBalance2 = await token.balanceOf(acc2);
			assert.notEqual(tokenBalance2.toString(), "0");
			dividends2 = await dividends.calculateDividendAmount(acc2);
			assert.notEqual(dividends2.toString(), "0");
			let send5Hash = await tokensale.sendTransaction({value: _ethers2, from: acc2});

			// >10k, non-claimed, has tokens
			tokenBalance3 = await token.balanceOf(acc3);
			assert.notEqual(tokenBalance3.toString(), "0");
			dividends3 = await dividends.calculateDividendAmount(acc3);
			assert.notEqual(dividends3.toString(), "0");
			let send6Hash = await tokensale.sendTransaction({value: _ethers3, from: acc3});

            console.log("[GAS] Buy <10k tokens (claimed, no-tokens): " + send1Hash.receipt.gasUsed);
            console.log("[GAS] Buy <10k tokens (claimed, tokens): " + send2Hash.receipt.gasUsed);
			console.log("[GAS] Buy <10k tokens (non-claimed, tokens): " + send5Hash.receipt.gasUsed);
            console.log("[GAS] Buy >10k (discounted) tokens (claimed, no-tokens): " + send3Hash.receipt.gasUsed);
            console.log("[GAS] Buy >10k (discounted) tokens (claimed, tokens): " + send4Hash.receipt.gasUsed);
			console.log("[GAS] Buy >10k (discounted) tokens (non-claimed, tokens): " + send6Hash.receipt.gasUsed);
        });

        it('transfer gas cost', async function() {
            let _boughtTokens = 1000;
            let _ethers = tokenPrice * _boughtTokens;
            let _transferTokens = 100;

			/*
				claimed / non-claimed
				no-tokens / has tokens
			*/

			// A has 1000 tokens
			await tokensale.sendTransaction({value: _ethers, from: acc1});

			// A (claimed, has tokens) -> B (claimed, no-tokens)
			let tokenBalanceA = await token.balanceOf(acc1);
			assert.notEqual(tokenBalanceA.toString(), "0");
			let dividendsA = await dividends.calculateDividendAmount(acc1);
			assert.equal(dividendsA.toString(), "0");

			let tokenBalanceB = await token.balanceOf(acc2);
			assert.equal(tokenBalanceB.toString(), "0");
			let dividendsB = await dividends.calculateDividendAmount(acc2);
			assert.equal(dividendsB.toString(), "0");

			let transfer1Hash = await token.transfer(acc2, _transferTokens, {from: acc1});

			// A (claimed, has tokens) -> B (claimed, has tokens)
			tokenBalanceA = await token.balanceOf(acc1);
			assert.notEqual(tokenBalanceA.toString(), "0");
			dividendsA = await dividends.calculateDividendAmount(acc1);
			assert.equal(dividendsA.toString(), "0");

			tokenBalanceB = await token.balanceOf(acc2);
			assert.notEqual(tokenBalanceB.toString(), "0");
			dividendsB = await dividends.calculateDividendAmount(acc2);
			assert.equal(dividendsB.toString(), "0");

			let transfer2Hash = await token.transfer(acc2, _transferTokens, {from: acc1});

			// A (non-claimed, has tokens) -> C (claimed, no-tokens)
			await dividends.shareDividends({value: tokenPrice * 1000, from: owner});

			tokenBalanceA = await token.balanceOf(acc1);
			assert.notEqual(tokenBalanceA.toString(), "0");
			dividendsA = await dividends.calculateDividendAmount(acc1);
			assert.notEqual(dividendsA.toString(), "0");

			let tokenBalanceC = await token.balanceOf(acc3);
			assert.equal(tokenBalanceC.toString(), "0");
			let dividendsC = await dividends.calculateDividendAmount(acc3);
			assert.equal(dividendsC.toString(), "0");

			let transfer3Hash = await token.transfer(acc3, _transferTokens, {from: acc1});

			// A (non-claimed, has tokens) -> C (claimed, has tokens)
			await dividends.shareDividends({value: tokenPrice * 1000, from: owner});
			await dividends.withdraw({from: acc3});

			tokenBalanceA = await token.balanceOf(acc1);
			assert.notEqual(tokenBalanceA.toString(), "0");
			dividendsA = await dividends.calculateDividendAmount(acc1);
			assert.notEqual(dividendsA.toString(), "0");

			tokenBalanceC = await token.balanceOf(acc3);
			assert.notEqual(tokenBalanceC.toString(), "0");
			dividendsC = await dividends.calculateDividendAmount(acc3);
			assert.equal(dividendsC.toString(), "0");

			let transfer4Hash = await token.transfer(acc3, _transferTokens, {from: acc1});

			// A (non-claimed, has tokens) -> C (non-claimed, has tokens)
			await dividends.shareDividends({value: tokenPrice * 1000, from: owner});

			tokenBalanceA = await token.balanceOf(acc1);
			assert.notEqual(tokenBalanceA.toString(), "0");
			dividendsA = await dividends.calculateDividendAmount(acc1);
			assert.notEqual(dividendsA.toString(), "0");

			tokenBalanceC = await token.balanceOf(acc3);
			assert.notEqual(tokenBalanceC.toString(), "0");
			dividendsC = await dividends.calculateDividendAmount(acc3);
			assert.notEqual(dividendsC.toString(), "0");

			let transfer5Hash = await token.transfer(acc3, _transferTokens, {from: acc1});

            console.log("[GAS] A (claimed, has tokens) -> B (claimed, no-tokens): " + transfer1Hash.receipt.gasUsed);
            console.log("[GAS] A (claimed, has tokens) -> B (claimed, has tokens): " + transfer2Hash.receipt.gasUsed);
			console.log("[GAS] A (non-claimed, has tokens) -> C (claimed, no-tokens): " + transfer3Hash.receipt.gasUsed);
            console.log("[GAS] A (non-claimed, has tokens) -> C (claimed, has tokens): " + transfer4Hash.receipt.gasUsed);
			console.log("[GAS] A (non-claimed, has tokens) -> C (non-claimed, has tokens): " + transfer5Hash.receipt.gasUsed);
        });

        it('withdraw gas cost', async function () {
            let _tokens = 10000;

			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);
            let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), 0);

			await tokensaleController.mintPresale(presaleAmount, acc1);
			await tokensaleController.mintPresale(presaleAmount, acc2);
			await tokensaleController.mintPresale(presaleAmount, acc3);

			await dividends.shareDividends({value: tokenPrice * 10000, from: owner});

			/*
			 	claimed/non-claimed
			*/

			// fallback non-claimed
			let dividends1 = await dividends.calculateDividendAmount(acc1);
			assert.notEqual(dividends1.toString(), "0");
			let withdraw1Hash = await dividends.sendTransaction({from: acc1});
			// fallback claimed
			await token.transfer(owner, 1, {from: acc2});

			let dividends2 = await dividends.calculateDividendAmount(acc2);
			assert.equal(dividends2.toString(), "0");
			let withdraw2Hash = await dividends.sendTransaction({from: acc2});

			// withdraw non-claimed
			let dividends3 = await dividends.calculateDividendAmount(acc3);
			assert.notEqual(dividends3.toString(), "0");

			let withdraw3Hash = await dividends.withdraw({from: acc3});
			// withdraw claimed
			await dividends.shareDividends({value: tokenPrice * 10000, from: owner});
			await token.transfer(owner, 1, {from: acc1});

			dividends1 = await dividends.calculateDividendAmount(acc1);
			assert.equal(dividends1.toString(), "0");
			let withdraw4Hash = await dividends.withdraw({from: acc1});

			// withdrawTo non-claimed
			dividends2 = await dividends.calculateDividendAmount(acc2);
			assert.notEqual(dividends2.toString(), "0");
			let withdraw5Hash = await dividends.withdrawTo(owner, {from: acc2});
			// withdrawTo claimed
			await token.transfer(owner, 1, {from: acc3});

			dividends3 = await dividends.calculateDividendAmount(acc3);
			assert.equal(dividends3.toString(), "0");
			let withdraw6Hash = await dividends.withdrawTo(owner, {from: acc3});

            console.log("[GAS] Withdraw (fallback non-claimed): " + withdraw1Hash.receipt.gasUsed);
            console.log("[GAS] Withdraw (fallback claimed): " + withdraw2Hash.receipt.gasUsed);
            console.log("[GAS] Withdraw (withdraw non-claimed): " + withdraw3Hash.receipt.gasUsed);
            console.log("[GAS] Withdraw (withdraw claimed): " + withdraw4Hash.receipt.gasUsed);
            console.log("[GAS] Withdraw (withdrawTo non-claimed): " + withdraw5Hash.receipt.gasUsed);
			console.log("[GAS] Withdraw (withdrawTo claimed): " + withdraw6Hash.receipt.gasUsed);
        });
	});
});
