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

contract('TestBLLNDividens', function(accounts) {
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

			await tokensale.sendTransaction({value: _ethers1, from: acc1});
		 	await tokensale.sendTransaction({value: _ethers2, from: acc2});
			await tokensale.sendTransaction({value: _ethers3, from: acc3});

			let shareBalance1 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1.toNumber(), _share1);

			let shareBalance2 = await dividends.getDividendBalance(acc2);
			assertNearEqual(shareBalance2.toNumber(), _share2);

			let shareBalance3 = await dividends.getDividendBalance(acc3);
			assertNearEqual(shareBalance3.toNumber(), _share3);

			await dividends.withdraw({from: acc1});
			let shareBalance1_empty = await dividends.getDividendBalance(acc1);
			assert.equal(shareBalance1_empty.toNumber(), 0);

			let contractBalance = await web3.eth.getBalance(dividends.address);
			assertNearEqual(contractBalance, _totalEthers);
		});

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
			await tokensale.sendTransaction({value: _ethers1, from: acc1});
			// Second buys 10
			await tokensale.sendTransaction({value: _ethers2, from: acc2});
			// First again buys 10
			await tokensale.sendTransaction({value: _ethers3, from: acc1});

			let shareBalance1 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1.toNumber(), _share1);
			let shareBalance2 = await dividends.getDividendBalance(acc2);
			assertNearEqual(shareBalance2.toNumber(), _share2);

			let contractBalance = await web3.eth.getBalance(dividends.address);
			assert.equal(contractBalance, _totalEthers);
		});

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
			await tokensale.sendTransaction({value: _ethers1, from: acc1});
			// Second buys 10
			await tokensale.sendTransaction({value: _ethers2, from: acc2});

			let shareBalance1_1 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1_1.toNumber(), _share1_1);
			// First withdraws his balance
			await dividends.withdraw({from: acc1});

			// First again buys 10
			await tokensale.sendTransaction({value: _ethers3, from: acc1});

			let shareBalance1_2 = await dividends.getDividendBalance(acc1);
			assertNearEqual(shareBalance1_2.toNumber(), _share1_2);
			let shareBalance2 = await dividends.getDividendBalance(acc2);
			assertNearEqual(shareBalance2.toNumber(), _share2);

			let contractBalance = await web3.eth.getBalance(dividends.address);
			assert.equal(contractBalance, _totalEthers);
		});
	});

    describe('withdrawal', function () {
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

        beforeEach(async function () {
            let tokenBalance1 = await token.balanceOf(acc1);
			assert.equal(tokenBalance1.toNumber(), 0);
			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), 0);
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), 0);

			await tokensale.sendTransaction({value: _ethers1, from: acc1});
		 	await tokensale.sendTransaction({value: _ethers2, from: acc2});
			await tokensale.sendTransaction({value: _ethers3, from: acc3});
        });

        it('should withdraw all dividends', async function () {
            let _totalEthers = (Number(_ethers1) + Number(_ethers2) + Number(_ethers3) - Number(_share1)).toFixed();

            let shareBalance1 = await dividends.getDividendBalance(acc1);
            assertNearEqual(shareBalance1.toNumber(), _share1);

            let shareBalance2 = await dividends.getDividendBalance(acc2);
            assertNearEqual(shareBalance2.toNumber(), _share2);

            let shareBalance3 = await dividends.getDividendBalance(acc3);
            assertNearEqual(shareBalance3.toNumber(), _share3);

            let balanceBefore = BN(await web3.eth.getBalance(acc1))
            let hash = await dividends.withdraw({from: acc1});
            let shareBalance1_empty = await dividends.getDividendBalance(acc1);
            assert.equal(shareBalance1_empty.toNumber(), 0);

            let balanceAfter = BN(await web3.eth.getBalance(acc1));
            let tx = await web3.eth.getTransaction(hash.receipt.transactionHash);
			let gasCost = BN(tx.gasPrice).mul(BN(hash.receipt.gasUsed));
			let withdrawAmount = balanceAfter.sub(balanceBefore).add(gasCost);
            assert.equal(withdrawAmount.toString(), shareBalance1.toString());

            let contractBalance = await web3.eth.getBalance(dividends.address);
            assertNearEqual(contractBalance, _totalEthers);
        });

        it('should fallback to withdraw', async function () {
            let _totalEthers = (Number(_ethers1) + Number(_ethers2) + Number(_ethers3) - Number(_share1)).toFixed();

            let shareBalance1 = await dividends.getDividendBalance(acc1);
            assertNearEqual(shareBalance1.toNumber(), _share1);

            let shareBalance2 = await dividends.getDividendBalance(acc2);
            assertNearEqual(shareBalance2.toNumber(), _share2);

            let shareBalance3 = await dividends.getDividendBalance(acc3);
            assertNearEqual(shareBalance3.toNumber(), _share3);

            await dividends.sendTransaction({value: "0", from: acc1});
            let shareBalance1_empty = await dividends.getDividendBalance(acc1);
            assert.equal(shareBalance1_empty.toNumber(), 0);

            let contractBalance = await web3.eth.getBalance(dividends.address);
            assertNearEqual(contractBalance, _totalEthers);
        });

        it('should withdraw dividends to another account', async function() {
            let _totalEthers = (Number(_ethers1) + Number(_ethers2) + Number(_ethers3) - Number(_share1)).toFixed();

            let shareBalance1 = await dividends.getDividendBalance(acc1);
            assertNearEqual(shareBalance1.toNumber(), _share1);

            let shareBalance2 = await dividends.getDividendBalance(acc2);
            assertNearEqual(shareBalance2.toNumber(), _share2);

            let shareBalance3 = await dividends.getDividendBalance(acc3);
            assertNearEqual(shareBalance3.toNumber(), _share3);

            let balanceBefore1 = BN(await web3.eth.getBalance(acc1));
            let balanceBefore2 = BN(await web3.eth.getBalance(acc2))
            let hash = await dividends.withdrawTo(acc2, {from: acc1});
            let shareBalance1_empty = await dividends.getDividendBalance(acc1);
            assert.equal(shareBalance1_empty.toNumber(), 0);

            let balanceAfter1 = BN(await web3.eth.getBalance(acc1));
            let gasCost = balanceBefore1.sub(balanceAfter1);
            let tx = await web3.eth.getTransaction(hash.receipt.transactionHash);
            let realGasCost = BN(tx.gasPrice).mul(BN(hash.receipt.gasUsed));
            assert.equal(gasCost.toString(), realGasCost.toString());

            let balanceAfter2 = BN(await web3.eth.getBalance(acc2));
            let withdrawAmount = balanceAfter2.sub(balanceBefore2);
            assert.equal(withdrawAmount.toString(), shareBalance1.toString());

            let contractBalance = await web3.eth.getBalance(dividends.address);
            assertNearEqual(contractBalance, _totalEthers);
        });
    });
});
