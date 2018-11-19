let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionTimed = artifacts.require('BLLNTokenOptionTimed');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

const increaseTime = function(duration) {
    const id = Date.now()

    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1)

            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: id+1,
            }, (err2, res) => {
                return err2 ? reject(err2) : resolve(res)
            })
        })
    })
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;
let closingTime;

contract('Test BLLNTokenOptionTimed', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let tokenOptionTimed;

    let owner = acc[0];
    let optionOwner = acc[1];

    beforeEach(async function() {
        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address)

        await tokensaleController.mintPresale(presaleAmount, owner);

        /// @dev configure presale duration
        let lastBlock = await lastBlockTime();
        let presaleDuration = 30
        closingTime = lastBlock + presaleDuration

        tokenOptionTimed = await BLLNTokenOptionTimed.new(dividends.address, token.address, closingTime, { from: optionOwner });
    });

    describe('Timed', function() {
        it('should return false for canTransferTokens',  async function() {
            let failedTransfer = await tokenOptionTimed.canTransferTokens({ from: optionOwner });
            assert.equal(failedTransfer, false);
        });

        it('should return true for canTransferTokens', async function() {
            let _seconds35 = 35000;

            increaseTime(_seconds35);
            let successTransfer = await tokenOptionTimed.canTransferTokens({ from: optionOwner });
            assert.equal(successTransfer, true);
        });
    });

	describe('Presale', function () {
        it('should mint tokens to optionTimed contract', async function() {
            await tokensaleController.mintPresale(1488, tokenOptionTimed.address);
            let tokenBalanceOption = await tokenOptionTimed.getTokenAmount();

            assert.equal(tokenBalanceOption.toNumber(), 1488);
        })
    });
});
