let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionDelegated = artifacts.require('BLLNTokenOptionDelegated');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;
let closingTime;

contract('Test BLLNTokenOptionDelegated', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let tokenOptionDelegated;

    let owner = acc[0];
    let optionOwner = acc[1];
    let delegatedAddress = acc[2];
    let newDelegatedAddress = acc[0]

    /// @dev configure presale duration
    let presaleDuration = 30
    beforeEach(async function() {
        let lastBlock = await lastBlockTime();
        closingTime = lastBlock + presaleDuration

        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)

        await dividends.setTokenAddress(token.address);

        tokenOptionDelegated = await BLLNTokenOptionDelegated.new(dividends.address,
                                                                  token.address,
                                                                  closingTime,
                                                                  delegatedAddress,
                                                                  { from: optionOwner });
    });

    describe('Delegate', function() {
        it('should return correct delegated address', async function() {
            let _delegatedAddress = await tokenOptionDelegated.delegateAddress();
            assert.equal(delegatedAddress, _delegatedAddress);
        });

        it('should change delegated address', async function() {

            /// @dev change delegated address
            await tokenOptionDelegated.changeDelegate(newDelegatedAddress, { from: delegatedAddress });

            let _newDelegatedAddress = await tokenOptionDelegated.delegateAddress();
            assert.equal(newDelegatedAddress, _newDelegatedAddress);
        });

        it('should fail changeDelegate', async function() {
            let fail = tokenOptionDelegated.changeDelegate(newDelegatedAddress, { from: owner });
            await assertThrows(fail, 'only address delegate can change delegate address');
        });

        it('should fail withdrawDividends', async function() {
            let fail = tokenOptionDelegated.withdrawDividends({ from: owner });
            await assertThrows(fail, 'only address delegate can withdraw dividends');
        });
    });

})
