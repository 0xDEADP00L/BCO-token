var BLLNToken = artifacts.require('BLLNToken');
var BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionTimed = artifacts.require('BLLNTokenOptionTimed');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

function lastBlockTime() {
    return web3.eth.getBlock('latest').timestamp;
}

const increaseTime = function(duration) {
    const id = Date.now()

    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1)

            web3.currentProvider.sendAsync({
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
    let tokenOptionTimed;

    let owner = acc[0];
    let optionOwner = acc[1];

    beforeEach(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
        token = await BLLNToken.new(dividends.address);
        await dividends.setTokenAddress(token.address);
        await dividends.mintPresale(presaleAmount, owner);

        /// @dev configure presale duration
        let lastBlock = lastBlockTime();
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
            await dividends.mintPresale(1488, tokenOptionTimed.address);
            let tokenBalanceOption = await tokenOptionTimed.getTokenAmount();

            assert.equal(tokenBalanceOption.toNumber(), 1488);
        })
    });
});
