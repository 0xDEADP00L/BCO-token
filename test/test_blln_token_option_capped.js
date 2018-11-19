let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNDividends = artifacts.require('BLLNDividend');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
var BLLNTokenOptionCapped = artifacts.require('BLLNTokenOptionCapped');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;

contract('Test BLLNTokenOptionCapped', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let tokensale;
    let tokenOptionCapped;

    let owner = acc[0];
    let optionOwner = acc[1];

    beforeEach(async function() {
        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)
        tokensale = await BLLNTokensaleBasic.new(tokensaleController.address, tokenPrice);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address);

        await tokensaleController.mintPresale(presaleAmount, owner);
        await tokensaleController.addAddressToWhitelist(tokensale.address);

        tokenOptionCapped = await BLLNTokenOptionCapped.new(dividends.address, token.address, maxTotalSupply, { from: optionOwner });
    });

    describe('Cap', function() {
        it('should return false for canTransferTokens', async function() {
            let failedTransfer = await tokenOptionCapped.canTransferTokens({ from: optionOwner });
            assert.equal(failedTransfer, false);
        });

        it('should return true for canTransferTokens', async function() {
            let _tokenPrice90Tok = tokenPrice * 90;

            await tokensale.sendTransaction({ value: _tokenPrice90Tok, from: owner})
            let successTransfer = await tokenOptionCapped.canTransferTokens({ from: optionOwner });
            assert.equal(successTransfer, true);
        });
    });
});
