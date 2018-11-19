let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenBurnPit = artifacts.require('BLLNTokenBurnPit');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);

contract('Test BLLN Token Burn Pit', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let burnPit;

    let owner = acc[0];

    beforeEach(async function() {
        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address);

        await tokensaleController.mintPresale(presaleAmount, owner);

        burnPit = await BLLNTokenBurnPit.new();
    })

    describe('Burn pit', function() {
        it('should accept BLLN tokens', async function() {
            let tokenAmount = 10

            /// @dev initial token balance is zero
            let burnPitTokenBalance = await token.balanceOf(burnPit.address);
            assert.equal(burnPitTokenBalance.toNumber(), 0);

            /// @dev transfer 10 tokens
			await token.transfer(burnPit.address, 10);
            burnPitTokenBalance = await token.balanceOf(burnPit.address);
            assert.equal(burnPitTokenBalance.toNumber(), 10);
        });

        it('should revert ether', async function() {
			let etherPayment = burnPit.sendTransaction({value: tokenPrice, from: owner});
			await assertThrows(etherPayment, "Burn pit is not rejecting payments.");
        });
    });
})
