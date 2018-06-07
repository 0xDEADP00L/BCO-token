var BCOToken = artifacts.require('BCOToken');
var BCODividends = artifacts.require('BCODividend');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

function assertThrows(promise, message) {
    return promise.then(() => {
        assert.isNotOk(true, message)
    }).catch((e) => {
        assert.include(e.message, 'VM Exception')
    })
}

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
let tokenPrice = money(170);

contract('TestBCOToken', function(accounts) {
	let dividends;
	let token;

	let owner = accounts[0];
	let acc1 = accounts[1];
	let acc2 = accounts[2];
	let acc3 = accounts[3];

	beforeEach(async function () {
		dividends = await BCODividends.new(presaleAmount, maxTotalSupply);
		token = await BCOToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await token.mintPresale(presaleAmount, owner);
	});

	describe('token', function () {
		it('should reject payments', async function() {
			let paymentToTokenAddress = token.sendTransaction({value: tokenPrice, from: acc1});
			assertThrows(paymentToTokenAddress, "Token is not rejecting payments.");
		});
	});

	describe('account', function () {
		it('should have zero token balance at start', async function() {
			let tokenBalance = await token.balanceOf(acc1);
			assert.equal(tokenBalance, 0);
		});

		it('should return sellable token amount', async function () {
			let sellable = await dividends.getSellableTokenAmount();
			assert.equal(sellable.toNumber(), (maxTotalSupply - presaleAmount));
		});

		it('should get bought tokens increasing in price', async function () {
			let _tokens2 = 10;
			let _tokens3 = 10;
			let _ethers2 = tokenPrice * 10;
			let _ethers3 = tokenPrice * 10;
			let _totalEthers = (Number(_ethers2) + Number(_ethers3)).toFixed();

			let tokenBalance2_empty = await token.balanceOf(acc2);
			assert.equal(tokenBalance2_empty.toNumber(), 0);
			let tokenBalance3_empty = await token.balanceOf(acc3);
			assert.equal(tokenBalance3_empty.toNumber(), 0);

			await dividends.sendTransaction({value: _ethers2, from: acc2});
			await dividends.sendTransaction({value: _ethers3, from: acc3});

			assert.equal(web3.eth.getBalance(dividends.address).toNumber(), _totalEthers);

			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), _tokens2);
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), _tokens3);
		});
	});

	describe('dividends', function () {
		it('should get dividend shares for bought tokens', async function () {
			let _tokens1 = 10;
			let _tokens2 = 10;
			let _tokens3 = 10;
			let _ethers1 = tokenPrice * 10;
			let _ethers2 = tokenPrice * 10;
			let _ethers3 = tokenPrice * 10;
		 	let _share1 = (_ethers2*_tokens1/(_tokens1 + presaleAmount)
			 		     + _ethers3*_tokens1/(_tokens1 + _tokens2 + presaleAmount));
			 let _share2 = (_ethers3*_tokens2/(_tokens1 + _tokens2 + presaleAmount));
			 let _share3 = 0;
			 let _totalEthers = (Number(_ethers1) + Number(_ethers2) + Number(_ethers3) - Number(_share1)).toFixed();

			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), 0);

			await dividends.buyToken({value: _ethers1, from: acc1});
		 	await dividends.buyToken({value: _ethers2, from: acc2});
			await dividends.buyToken({value: _ethers3, from: acc3});

			let shareBalance1 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1.toNumber(), _share1);

			let shareBalance2 = await dividends.getDividendBalance(acc2);
			assertNearEqual(shareBalance2.toNumber(), _share2);

			let shareBalance3 = await dividends.getDividendBalance(acc3);
			assertNearEqual(shareBalance3.toNumber(), _share3);

			await dividends.withdraw(shareBalance1, {from: acc1});
			let shareBalance1_empty = await dividends.getDividendBalance(acc1);
			assert.equal(shareBalance1_empty.toNumber(), 0);

			assertNearEqual(web3.eth.getBalance(dividends.address).toNumber(), _totalEthers);
		});
	});

	describe('dividends 2', function () {
		it('should share dividends to self for buying tokens', async function () {
			let _tokens1 = 10;
			let _tokens2 = 10;
			let _tokens3 = 10;
			let _ethers1 = tokenPrice * 10;
			let _ethers2 = tokenPrice * 10;
			let _ethers3 = tokenPrice * 10;

			let _share1 = (_ethers2*_tokens1/(_tokens1 + presaleAmount)
						 + _ethers3*_tokens1/(_tokens1 + _tokens2 + presaleAmount));
			let _share2 = (_ethers3*_tokens2/(_tokens1 + _tokens2 + presaleAmount));
			let _totalEthers = (Number(_ethers1) + Number(_ethers2) + Number(_ethers3)).toFixed();

			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);

			// First buys 10
			await dividends.buyToken({value: _ethers1, from: acc1});
			// Second buys 10
			await dividends.buyToken({value: _ethers2, from: acc2});
			// First again buys 10
			await dividends.buyToken({value: _ethers3, from: acc1});

			let shareBalance1 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1.toNumber(), _share1);
			let shareBalance2 = await dividends.getDividendBalance(acc2);
			assertNearEqual(shareBalance2.toNumber(), _share2);

			assert.equal(web3.eth.getBalance(dividends.address).toNumber(), _totalEthers);
		});
	});

	describe('dividends 3', function () {
		it('withdrawal should not affect share calculations', async function () {
			let _tokens1 = 10;
			let _tokens2 = 10;
			let _tokens3 = 10;
			let _ethers1 = tokenPrice * 10;
			let _ethers2 = tokenPrice * 10;
			let _ethers3 = tokenPrice * 10;

			let _share1_1 = (_ethers2*_tokens1/(_tokens1 + presaleAmount));
			let _share1_2 = (_ethers3*_tokens1/(_tokens1 + _tokens2 + presaleAmount));
			let _share2 = (_ethers3*_tokens2/(_tokens1 + _tokens2 + presaleAmount));
			let _totalEthers = (Number(_ethers1) + Number(_ethers2) + Number(_ethers3) - Number(_share1_1)).toFixed();

			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);

			// First buys 10
			await dividends.buyToken({value: _ethers1, from: acc1});
			// Second buys 10
			await dividends.buyToken({value: _ethers2, from: acc2});

			let shareBalance1_1 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1_1.toNumber(), _share1_1);
			// First withdraws his balance
			await dividends.withdraw(shareBalance1_1, {from: acc1});

			// First again buys 10
			await dividends.buyToken({value: _ethers3, from: acc1});

			let shareBalance1_2 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1_2.toNumber(), _share1_2);
			let shareBalance2 = await dividends.getDividendBalance(acc2);
			assertNearEqual(shareBalance2.toNumber(), _share2);

			assert.equal(web3.eth.getBalance(dividends.address).toNumber(), _totalEthers);
		});
	});

	describe('buy', function () {
		it('should leave unused money on dividend account', async function () {
			let _tokens1 = 10;
			let _ethers1 = Number(tokenPrice) + Number(money(5));
			let _share1 = money(5);
			let _totalEthers = Number(_ethers1);

			// Initial token balance is empty
			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);

			// First buys 10
			await dividends.buyToken({value: _ethers1, from: acc1});

			// Change is located on account's dividend balance
			let shareBalance1 = await dividends.getDividendBalance(acc1);
			assert.equal(shareBalance1.toNumber(), _share1);

			assert.equal(web3.eth.getBalance(dividends.address).toNumber(), _totalEthers);
		});
	});

	describe('buy2', function() {
		it('should buy only one last token and other part of ether add to change', async function() {

			// Initial token balance is empty
			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);

			//buy 89 tokens
			await dividends.buyToken({value: tokenPrice * 89, from: acc1});
			let balance1 = await token.balanceOf(acc1);
			assert.equal(balance1.toNumber(), 89);

			await dividends.buyToken({value: tokenPrice * 2, from: acc2});
			let balance2 = await token.balanceOf(acc2);
			assert.equal(balance2.toNumber(), 1);

			let dividendBal = await dividends.getDividendBalance(acc2)
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
			let _expectedDividendBalanceAcc1 = Number(money(178.5));
			let _expectedDividendBalanceAcc2 = Number(money(76.5));

			// Initial token balance is empty
			let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);

			// acc1 buy 10 tokens
			await dividends.buyToken(_tenTokensFromAcc1);
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

			await dividends.buyToken(_threeNextTokensFromAcc1);
			tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 10);

			dividendBalance1 = await dividends.getDividendBalance(acc1);
			dividendBalance2 = await dividends.getDividendBalance(acc2);

			assert.equal(dividendBalance1.toNumber(), _expectedDividendBalanceAcc1);
			assert.equal(dividendBalance2.toNumber(), _expectedDividendBalanceAcc2);
		});
	});
});
