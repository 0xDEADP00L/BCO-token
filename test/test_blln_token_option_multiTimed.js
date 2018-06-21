var BLLNToken = artifacts.require('BLLNToken');
var BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionMultiTimed = artifacts.require('BLLNTokenOptionMultiTimed');

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

contract('Test BLLNTokenOptionMultiTimed', function(acc) {
    let dividends;
    let token;
    let tokenOptionMultiTimed;

    let owner = acc[0];
    let optionOwner = acc[1];

    beforeEach(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
        token = await BLLNToken.new(dividends.address);
        await dividends.setTokenAddress(token.address);
        await dividends.mintPresale(presaleAmount, owner);

        tokenOptionMultiTimed = await BLLNTokenOptionMultiTimed.new(dividends.address, token.address, { from: optionOwner });
    });

    describe('Point array', function() {
        it('should return correct array count', async function() {
            let _seconds30 = 30000;

            let _timePointStage_1 = lastBlockTime() + _seconds30;
            let _amountStage_1 = 100;

            /// @dev initial time points count
            let points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(0,points.toNumber());

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(1, points.toNumber());

            let amountStage1 = await tokenOptionMultiTimed.tokenAmountFor(0);
            assert.equal(amountStage1, _amountStage_1);
        });
    })
});
