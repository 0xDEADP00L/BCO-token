let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionMultiTimedDelegated = artifacts.require('BLLNTokenOptionMultiTimedDelegated');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);

contract('Test BLLNTokenOptionMultiTimedDelegated', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let optionMultiTimedDelegated;

    let owner = acc[0];
    let optionOwner = acc[2];
    let delegatedAddress = acc[3];
    let newDelegatedAddress = acc[4];

    beforeEach(async function() {
        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address);

        await tokensaleController.mintPresale(presaleAmount, owner);

        optionMultiTimedDelegated = await BLLNTokenOptionMultiTimedDelegated.new(dividends.address,
                                                                                 token.address,
                                                                                 delegatedAddress,
                                                                                 { from: optionOwner });
    });

    describe('Delegate address', function() {

        it('should return correct delegated address',  async function() {
            let _delegatedAddress = await optionMultiTimedDelegated.delegateAddress();
            assert.equal(delegatedAddress, _delegatedAddress);
        });

        it('should change delegated address', async function() {

            /// @dev change delegated address
            await optionMultiTimedDelegated.changeDelegate(newDelegatedAddress, { from: delegatedAddress });

            let _newDelegatedAddress = await optionMultiTimedDelegated.delegateAddress();
            assert.equal(newDelegatedAddress, _newDelegatedAddress);
        });

        it('should fail changeDelegate', async function() {
            let fail = optionMultiTimedDelegated.changeDelegate(newDelegatedAddress, { from: owner });
            await assertThrows(fail, 'only address delegate can change delegate address');
        });

        it('should fail withdrawDividends', async function() {
            let fail = optionMultiTimedDelegated.withdrawDividends({ from: owner });
            await assertThrows(fail, 'only address delegate can withdraw dividends');
        });
    });
});
