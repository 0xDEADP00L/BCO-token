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

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);

contract('TestBLLNToken', function(accounts) {
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

	describe('token', function () {
		it('should reject payments', async function() {
			let paymentToTokenAddress = token.sendTransaction({value: tokenPrice, from: acc1});
			await assertThrows(paymentToTokenAddress, "Token is not rejecting payments.");
		});
	});

	describe('account', function () {
		it('should have zero token balance at start', async function() {
			let tokenBalance = await token.balanceOf(acc1);
			assert.equal(tokenBalance, 0);
		});

		it('should get bought tokens', async function () {
			let _tokens2 = 10;
			let _tokens3 = 10;
			let _ethers2 = tokenPrice * 10;
			let _ethers3 = tokenPrice * 10;
			let _totalEthers = (Number(_ethers2) + Number(_ethers3)).toFixed();

			let tokenBalance2_empty = await token.balanceOf(acc2);
			assert.equal(tokenBalance2_empty.toNumber(), 0);
			let tokenBalance3_empty = await token.balanceOf(acc3);
			assert.equal(tokenBalance3_empty.toNumber(), 0);

			await tokensale.sendTransaction({value: _ethers2, from: acc2});
			await tokensale.sendTransaction({value: _ethers3, from: acc3});

			let contractBalance = await web3.eth.getBalance(dividends.address);
			assert.equal(contractBalance, _totalEthers);

			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), _tokens2);
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), _tokens3);
		});
	});

	describe('buy', function () {
		it('should leave unused money on dividend account', async function () {
			let _tokens1 = 10;
			let _ethers1 = tokenPrice.add(money(5));
			let _share1 = money(5);
			let _totalEthers = Number(_ethers1);

			// Initial token balance is empty
			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);

			// First buys 10
			await tokensale.sendTransaction({value: _ethers1, from: acc1});

			// Change is located on account's dividend balance
			let shareBalance1 = await dividends.getDividendBalance(acc1);
			assert.equal(shareBalance1.toNumber(), _share1);

			let contractBalance = await web3.eth.getBalance(dividends.address);
			assert.equal(contractBalance, _totalEthers);
		});

		it('should buy only one last token and other part of ether add to change', async function() {

			// Initial token balance is empty
			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);

			//buy 89 tokens
			await tokensale.sendTransaction({value: tokenPrice * 89, from: acc1});
			let balance1 = await token.balanceOf(acc1);
			assert.equal(balance1.toNumber(), 89);

			await tokensale.sendTransaction({value: tokenPrice * 2, from: acc2});
			let balance2 = await token.balanceOf(acc2);
			assert.equal(balance2.toNumber(), 1);

			let dividendBal = await dividends.getDividendBalance(acc2);
			assert.equal(Number(tokenPrice), dividendBal.toNumber());
		});
	});

	describe('transfer', function () {
		it ('should transfer tokens and update tokens amount', async function() {
			// _given
			let _tenTokensFromAcc1 = {value: tokenPrice * 10, from: acc1};
			let _transferFromAcc1 = {from: acc1};
			let _threeNextTokensFromAcc1 = {value: tokenPrice * 3, from: acc1};

			//_then
			let _expectedDividendBalanceAcc1 = Number(money(315));
			let _expectedDividendBalanceAcc2 = Number(money(135));

			// Initial token balance is empty
			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);

			// acc1 buy 10 tokens
			await tokensale.sendTransaction(_tenTokensFromAcc1);
			tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 10);

			// transfer 2 tokens from acc1 to acc2
			await token.transfer(acc2, 2, _transferFromAcc1);
			tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 2);

			// transfer 1 token from acc1 to acc2
			await token.transfer(acc2, 1, _transferFromAcc1);
			tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 3);

			dividendBalance1 = await dividends.getDividendBalance(acc1);
			dividendBalance2 = await dividends.getDividendBalance(acc2);

			assert.equal(dividendBalance1.toNumber(), 0);
			assert.equal(dividendBalance2.toNumber(), 0);

			await tokensale.sendTransaction(_threeNextTokensFromAcc1);
			tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 10);

			dividendBalance1 = await dividends.getDividendBalance(acc1);
			dividendBalance2 = await dividends.getDividendBalance(acc2);

			assert.equal(dividendBalance1.toNumber(), _expectedDividendBalanceAcc1);
			assert.equal(dividendBalance2.toNumber(), _expectedDividendBalanceAcc2);
		});
	});

	describe('approval', function () {
		it ('should transfer allowed tokens and update tokens amount', async function() {
			//_then
			let _expectedDividendBalanceAcc1 = Number(money(315));
			let _expectedDividendBalanceAcc3 = Number(money(135));

			// Initial token balance is empty
			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), 0);

			// acc1 buy 10 tokens
			await tokensale.sendTransaction({value: tokenPrice * 10, from: acc1});
			tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 10);

			// acc1 approves 5 tokens for spending by acc2
			await token.approve(acc2, 5, {from: acc1});
			let allowedTokens = await token.allowance(acc1, acc2);
			assert.equal(allowedTokens.toNumber(), 5);

			// acc1 increases approval by 2
			await token.increaseApproval(acc2, 2, {from: acc1});
			allowedTokens = await token.allowance(acc1, acc2);
			assert.equal(allowedTokens.toNumber(), 7);

			// acc1 decreases approval by 3
			await token.decreaseApproval(acc2, 3, {from: acc1});
			allowedTokens = await token.allowance(acc1, acc2);
			assert.equal(allowedTokens.toNumber(), 4);

			// transfer 3 tokens from acc1 to acc2
			await token.transferFrom(acc1, acc3, 3, {from: acc2});
			tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 7);
			tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), 3);
			allowedTokens = await token.allowance(acc1, acc2);
			assert.equal(allowedTokens.toNumber(), 1);

			// cannot transfer 3 tokens from acc1 by acc2
			let fail = token.transferFrom(acc1, acc2, 3, {from: acc2});
			await assertThrows(fail, "Should not transfer more than allowed amount");

			let dividendBalance1 = await dividends.getDividendBalance(acc1);
			let dividendBalance2 = await dividends.getDividendBalance(acc2);
			let dividendBalance3 = await dividends.getDividendBalance(acc3);

			assert.equal(dividendBalance1.toNumber(), 0);
			assert.equal(dividendBalance2.toNumber(), 0);
			assert.equal(dividendBalance3.toNumber(), 0);

			await tokensale.sendTransaction({value: tokenPrice * 3, from: acc1});
			tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 10);

			dividendBalance1 = await dividends.getDividendBalance(acc1);
			dividendBalance2 = await dividends.getDividendBalance(acc2);
			dividendBalance3 = await dividends.getDividendBalance(acc3);

			assert.equal(dividendBalance1.toNumber(), _expectedDividendBalanceAcc1);
			assert.equal(dividendBalance2.toNumber(), 0);
			assert.equal(dividendBalance3.toNumber(), _expectedDividendBalanceAcc3);
		});
	});
});
