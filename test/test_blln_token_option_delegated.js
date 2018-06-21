var BLLNToken = artifacts.require('BLLNToken');
var BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionDelegated = artifacts.require('BLLNTokenOptionDelegated');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

function lastBlockTime() {
    return web3.eth.getBlock('latest').timestamp;
}

function assertThrows(promise, message) {
    return promise.then(() => {
        assert.isNotOk(true, message)
    }).catch((e) => {
        assert.include(e.message, 'VM Exception')
    })
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;
let closingTime;

contract('Test BLLNTokenOptionDelegated', function(acc) {
    let dividends;
    let token;
    let tokenOptionDelegated;

    let owner = acc[0];
    let optionOwner = acc[1];
    let delegatedAddress = acc[2];
    let newDelegatedAddress = acc[0]

    /// @dev configure presale duration
    let lastBlock = lastBlockTime();
    let presaleDuration = 30
    closingTime = lastBlock + presaleDuration

    beforeEach(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
        token = await BLLNToken.new(dividends.address);
        await dividends.setTokenAddress(token.address);
        await dividends.mintPresale(presaleAmount, owner);

        tokenOptionDelegated = await BLLNTokenOptionDelegated.new(dividends.address, token.address, closingTime, delegatedAddress, { from: optionOwner });
    });

    describe('Delegate', function() {
        it('should return correct delegated address', async function() {
            let _delegatedAddress = await tokenOptionDelegated.m_delegateAddress();
            assert.equal(delegatedAddress, _delegatedAddress);
        });

        it('should change delegated address', async function() {

            /// @dev change delegated address
            await tokenOptionDelegated.changeDelegate(newDelegatedAddress, { from: delegatedAddress });

            let _newDelegatedAddress = await tokenOptionDelegated.m_delegateAddress();
            assert.equal(newDelegatedAddress, _newDelegatedAddress);
        });

        it('should fail changeDelegate', async function() {
            let fail = tokenOptionDelegated.changeDelegate(newDelegatedAddress, { from: owner });
            await assertThrows(fail, 'only address delegate can change delegate address');
        });

        it('should fail withdrawDividends', async function() {
            let fail = tokenOptionDelegated.withdrawDividends(1000, { from: owner });
            await assertThrows(fail, 'only address delegate can withdraw dividends');
        });
    });

})
