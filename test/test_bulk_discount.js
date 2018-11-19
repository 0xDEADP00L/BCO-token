let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
let BLLNDividends = artifacts.require('BLLNDividend');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let ownerAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);
let tokenPrice = money(300);

contract('TestBulkDiscount', function(accounts) {
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

    describe('bulk sale', function() {
        it('should not activate until 10k tokens buy', async function() {
			await tokensaleController.setTokenDiscountThreshold(10**4);

            let eth = tokenPrice * (10**4 - 1);

            await tokensale.sendTransaction({value: eth, from: acc1});
            let div = await dividends.getDividendBalance(acc1);
            assert.equal(div.toNumber(), 0, "Dividend balance should be zero.");
        });

        it('should activate on 10k tokens buy', async function() {
            let eth = tokenPrice * 10**4;

            await tokensale.sendTransaction({value: eth, from: acc1});
            let div = await dividends.getDividendBalance(acc1);
            assert.ok(div.gt(BN(0)), "Dividend balance should be nonzero.");
        });

        it('should decrease on tokensale progress', async function() {
            let eth = tokenPrice * 10**4 * 10;

            await tokensale.sendTransaction({value: eth, from: acc1});
            let div1 = await dividends.getDividendBalance(acc1);

            await tokensale.sendTransaction({value: eth, from: acc2});
            let div2 = await dividends.getDividendBalance(acc2);

            await tokensale.sendTransaction({value: eth, from: acc3});
            let div3 = await dividends.getDividendBalance(acc3);

            await tokensale.sendTransaction({value: eth, from: acc4});
            let div4 = await dividends.getDividendBalance(acc4);

            assert.ok(div1.gt(div2), "acc1 should get more discount than acc2");
            assert.ok(div2.gt(div3), "acc2 should get more discount than acc3");
            assert.ok(div3.gt(div4), "acc3 should get more discount than acc4");
        });
    });
});
