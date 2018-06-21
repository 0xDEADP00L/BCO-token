var BLLNToken = artifacts.require('BLLNToken');
var BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionCapped = artifacts.require('BLLNTokenOptionCapped');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;

contract('Test BLLNTokenOptionCapped', function(acc) {
    let dividends;
    let token;
    let tokenOptionCapped;

    let owner = acc[0];
    let optionOwner = acc[1];

    beforeEach(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
        token = await BLLNToken.new(dividends.address);
        await dividends.setTokenAddress(token.address);
        await dividends.mintPresale(presaleAmount, owner);

        tokenOptionCapped = await BLLNTokenOptionCapped.new(dividends.address, token.address, maxTotalSupply, { from: optionOwner });
    });

    describe('Cap', function() {
        it('should return false for canTransferTokens', async function() {
            let failedTransfer = await tokenOptionCapped.canTransferTokens({ from: optionOwner });
            assert.equal(failedTransfer, false);
        });

        it('should return true for canTransferTokens', async function() {
            let _tokenPrice90Tok = tokenPrice * 90;

            await dividends.buyToken({ value: _tokenPrice90Tok, from: owner})
            let successTransfer = await tokenOptionCapped.canTransferTokens({ from: optionOwner });
            assert.equal(successTransfer, true);
        });
    });
});
