let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
let BLLNDividends = artifacts.require('BLLNDividend');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let presaleAmount = 10;
let maxTotalSupply = 10000;
let tokenPrice = money(300);

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

contract('TestShareDividends', function(accounts) {
    let dividends;
    let token;
	let tokensaleController;
	let tokensale;

	let owner = accounts[0];
    let acc1 = accounts[1];
	let acc2 = accounts[2];
	let acc3 = accounts[3];

    beforeEach(async function() {
		dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)
        tokensale = await BLLNTokensaleBasic.new(tokensaleController.address, tokenPrice);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address)

        await tokensaleController.mintPresale(presaleAmount, owner);
        await tokensaleController.addAddressToWhitelist(tokensale.address);
    });

    describe('Share dividends', function() {
        it('should share dividends from company', async function() {
            ///@test _given
			let shareAmount = money(100);

			///@test _then
			let _expectedDividendBalanceAcc0 = Number(tokenPrice * (10*10/10 + 5*10/20 + 5*10/25 + 30*10/30) + money(100)*10/60).toFixed();
			let _expectedDividendBalanceAcc1 = Number(tokenPrice * (5*10/20 + 5*10/25 + 30*10/30) + money(100)*10/60).toFixed();
			let _expectedDividendBalanceAcc2 = Number(tokenPrice * (5*5/25 + 30*10/30) + money(100)*10/60).toFixed();
			let _expectedDividendBalanceAcc3 = Number(money(100)*10/60).toFixed();

            ///@dev Initial token balance is empty
			let tokenBalanceOwner = await token.balanceOf(owner);
			let tokenBalance1 = await token.balanceOf(acc1);
			let tokenBalance2 = await token.balanceOf(acc2);
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalanceOwner.toNumber(), presaleAmount);
			assert.equal(tokenBalance1.toNumber(), 0);
			assert.equal(tokenBalance2.toNumber(), 0);
			assert.equal(tokenBalance3.toNumber(), 0);

			///@dev acc1 buy 10 tokens
			await tokensale.sendTransaction({value: tokenPrice * 10, from: acc1});
			tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 10);

			///@dev acc2 buy 10 tokens by parts (5 and 5)
			await tokensale.sendTransaction({value: tokenPrice * 5, from: acc2});
			tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 5);

			dividendBalance = await dividends.getDividendBalance(acc2)
			assert.equal(dividendBalance.toNumber(), 0);

			await tokensale.sendTransaction({value: tokenPrice * 5, from: acc2});
			tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 10);

			dividendBalance = await dividends.getDividendBalance(acc2)
			assert.equal(dividendBalance.toNumber(), tokenPrice);

			///@dev acc3 buy 30 tokens
			await tokensale.sendTransaction({value: tokenPrice * 30, from: acc3});
			tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), 30);

			///@dev share dividends
			await dividends.shareDividends({value: shareAmount, from: owner});

			dividendBalance = await dividends.getDividendBalance(owner);
			assertNearEqual(dividendBalance.toNumber(), _expectedDividendBalanceAcc0, "Account 0 dividend balance");

			dividendBalance = await dividends.getDividendBalance(acc1);
			assertNearEqual(dividendBalance.toNumber(), _expectedDividendBalanceAcc1, "Account 1 dividend balance");

			dividendBalance = await dividends.getDividendBalance(acc2);
			assertNearEqual(dividendBalance.toNumber(), _expectedDividendBalanceAcc2, "Account 2 dividend balance");

			dividendBalance = await dividends.getDividendBalance(acc3);
			assertNearEqual(dividendBalance.toNumber(), _expectedDividendBalanceAcc3, "Account 3 dividend balance");
		});
    });
});
