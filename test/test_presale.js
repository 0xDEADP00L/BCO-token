let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
let BLLNDividends = artifacts.require('BLLNDividend');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let ownerAmount = 100;
let presaleAmounts = [10, 20, 10, 30];
let maxTotalSupply = 10000;
let tokenPrice = money(300);

contract('TestPresale', function(accounts) {
    let dividends;
    let token;
    let tokensaleController;
    let tokensale;

	let owner = accounts[0];
    let acc1 = accounts[1];
	let acc2 = accounts[2];
	let acc3 = accounts[3];
    let acc4 = accounts[4];

    beforeEach(async function() {
    	dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)
        tokensale = await BLLNTokensaleBasic.new(tokensaleController.address, tokenPrice);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address)

        await tokensaleController.mintPresale(ownerAmount, owner);
        await tokensaleController.addAddressToWhitelist(tokensale.address);
    });

    describe('presale', function() {
        it('only owner should be able to presale', async function() {
            let amount = 10;

            let acc1MintPresale = tokensaleController.mintPresale(10, acc1, {from: acc1});
            let acc2MintPresale = tokensaleController.mintPresale(10, acc2, {from: acc2});
            await assertThrows(acc1MintPresale, "Acc1 cannot mint presale");
            await assertThrows(acc2MintPresale, "Acc2 cannot mint presale");

            let ok1 = await tokensaleController.mintPresale(10, acc1, {from: owner});
			assert.equal(ok1.receipt.status, '0x01');

            let ok2 = await tokensaleController.mintPresale(10, acc2, {from: owner});
            assert.equal(ok2.receipt.status, '0x01');
        });

        it('only owner should be able to stop', async function() {
            let acc1FinishPresale = tokensaleController.finishPresale({from: acc1});
            let acc2FinishPresale = tokensaleController.finishPresale({from: acc2});
            await assertThrows(acc1FinishPresale, "Acc1 cannot finish presale");
            await assertThrows(acc2FinishPresale, "Acc2 cannot finish presale");

            let ok = await tokensaleController.finishPresale({from: owner});
            assert.equal(ok.receipt.status, '0x01');
        });

        it('should be unable to presale after finish', async function() {
            let ok = await tokensaleController.finishPresale({from: owner});
            assert.equal(ok.receipt.status, '0x01');

            let finishAgain = tokensaleController.finishPresale({from: owner});
            await assertThrows(finishAgain, "Unable to finish twice");
        });
    });

    describe('prebuyers', function() {
        beforeEach(async function() {
            for (var i = 1; i <= presaleAmounts.length; ++i) {
                await tokensaleController.mintPresale(presaleAmounts[i-1], accounts[i], {from: owner});
            }
        });

        it('should get presold tokens', async function() {
            let ownerTokens = await token.balanceOf(owner);
            assert.equal(ownerTokens.toNumber(), ownerAmount);

            for (var i = 1; i <= presaleAmounts.length; ++i) {
                let acciTokens = await token.balanceOf(accounts[i]);
                assert.equal(acciTokens.toNumber(), presaleAmounts[i-1], "Account " + i + " token balance mismatch");
            }
		});

        it('should not get dividends from presale', async function() {
            let ownerBalance = await dividends.getDividendBalance(owner);
            assert.equal(ownerBalance.toNumber(), 0);

            for (var i = 1; i <= presaleAmounts.length; ++i) {
                let acciBalance = await dividends.getDividendBalance(accounts[i]);
                assert.equal(acciBalance.toNumber(), 0, "Account " + i + " dividend balance should be zero");
            }
        });

        it('should get correct dividend amount from public sale', async function() {
            let _ether = tokenPrice*10;
            let _ownerDividends = (_ether*100/170).toFixed();
            let _accDividends = [
                (_ether*10/170).toFixed(),
                (_ether*20/170).toFixed(),
                (_ether*10/170).toFixed(),
                (_ether*30/170).toFixed()
            ];

            await tokensale.sendTransaction({value: _ether, from: accounts[5]});

            let ownerBalance = await dividends.getDividendBalance(owner);
            assert.equal(ownerBalance.toNumber(), _ownerDividends);

            for (var i = 1; i <= presaleAmounts.length; ++i) {
                let acciBalance = await dividends.getDividendBalance(accounts[i]);
                assert.equal(acciBalance.toNumber(), _accDividends[i-1], "Account " + i + " dividend balance mismatch");
            }
        });
    });
});
