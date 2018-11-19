let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionMultiTimed = artifacts.require('BLLNTokenOptionMultiTimedTestable');

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
            if (err1) return reject(err1);

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

contract('Test BLLNTokenOptionMultiTimed', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let tokenOptionMultiTimed;

    let owner = acc[0];
    let optionOwner = acc[2];
    let someAddress = acc[3];

    beforeEach(async function() {
        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address)

        await tokensaleController.mintPresale(presaleAmount, owner);

        tokenOptionMultiTimed = await BLLNTokenOptionMultiTimed.new(dividends.address, token.address, { from: optionOwner });
    });

    describe('Point array', function() {
        it('should return correct array count', async function() {
            let _seconds30 = 30000;
            let _minute2 = 120000;
            let lastBlock = await lastBlockTime();

            let _timePointStage_1 = lastBlock + _seconds30;
            let _amountStage_1 = 100;

            let _timePointStage_2 = lastBlock + _minute2;
            let _amountStage_2 = 200;

            /// @dev initial time points count
            let points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(0,points.toNumber());

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(1, points.toNumber());


            /// @dev add stage 2
            await tokenOptionMultiTimed.addStage(_timePointStage_2, _amountStage_2, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(2, points.toNumber());

            let amountStage1 = await tokenOptionMultiTimed.tokenAmountFor(0);
            assert.equal(amountStage1, _amountStage_1);

            let amountStage2 = await tokenOptionMultiTimed.tokenAmountFor(1);
            assert.equal(amountStage2, _amountStage_2);
        });
    })

    describe('Transfer tokens', function() {
        it('should transfer tokens at stage 1', async function() {
            let _minutes2 = 120000;
            let lastBlock = await lastBlockTime();
            let _timePointStage_1 = lastBlock + _minutes2;
            let _amountStage_1 = 7;
            let _tokensToTransfer_1 = 5;

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(1, points.toNumber());

            /// @dev transfer 7 tokens to MultiTimedContract
            await token.transfer(tokenOptionMultiTimed.address, _amountStage_1, {from: owner });
			let contractTokenBalance = await token.balanceOf(tokenOptionMultiTimed.address);
			assert.equal(contractTokenBalance.toNumber(), _amountStage_1);

            /// @dev transfer 5 tokens to address
            await tokenOptionMultiTimed.transferTokens(someAddress, _tokensToTransfer_1, { from: optionOwner });
            let tokBalance = await token.balanceOf(someAddress);
            assert.equal(tokBalance.toNumber(), _tokensToTransfer_1);

            let transferredTokens = await tokenOptionMultiTimed.transferredTokens();
            assert.equal(transferredTokens.toNumber(), _tokensToTransfer_1);
        });

        it('should transfer tokens at stage 2', async function() {
            let lastBlock = await lastBlockTime();

            let _minutes2 = 120000;
            let _timePointStage_1 = lastBlock + _minutes2;
            let _amountStage_1 = 4;

            let _minutes4 = 240000;
            let _timePointStage_2 = lastBlock + _minutes4;
            let _amountStage_2 = 5;

            let _tokensToTransfer_1 = 4;
            let _tokensToTransfer_2 = 5;

            let _minutes3 = 180000;

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(1, points.toNumber());

            /// @dev add stage 2
            await tokenOptionMultiTimed.addStage(_timePointStage_2, _amountStage_2, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(2, points.toNumber());

            /// @dev transfer 4 tokens to MultiTimedContract
            await token.transfer(tokenOptionMultiTimed.address, _amountStage_1, {from: owner });
            let contractTokenBalance = await token.balanceOf(tokenOptionMultiTimed.address);
            assert.equal(contractTokenBalance.toNumber(), _amountStage_1);

            /// @dev transfer 5 tokens to MultiTimedContract
            await token.transfer(tokenOptionMultiTimed.address, _amountStage_2, {from: owner });
            contractTokenBalance = await token.balanceOf(tokenOptionMultiTimed.address);
            assert.equal(contractTokenBalance.toNumber(), (_amountStage_1 + _amountStage_2));

            let currentStage = await tokenOptionMultiTimed.getCurrentStage();
            assert.equal(currentStage.toNumber(), 0);

            /// @dev skip 1 stage
            increaseTime(_minutes3);
            currentStage = await tokenOptionMultiTimed.getCurrentStage();
            assert.equal(currentStage.toNumber(), 1);

            /// @dev transfer 5 tokens to address
            await tokenOptionMultiTimed.transferTokens(someAddress, _tokensToTransfer_2, { from: optionOwner });
            let tokBalance = await token.balanceOf(someAddress);
            assert.equal(tokBalance.toNumber(), _tokensToTransfer_2);

            let transferredTokens = await tokenOptionMultiTimed.transferredTokens();
            assert.equal(transferredTokens.toNumber(), _tokensToTransfer_2);
        });

        it('should transfer all tokens after all stages', async function() {
            let lastBlock = await lastBlockTime();

            let _minutes2 = 120000;
            let _timePointStage_1 = lastBlock + _minutes2;
            let _amountStage_1 = 4;
            let _amount = 3;
            let _minutes3 = 180000;

            /// @dev initial time points count
            let points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(0,points.toNumber());

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(1, points.toNumber());

            /// @dev transfer 7 tokens to MultiTimedContract
            await token.transfer(tokenOptionMultiTimed.address, (_amountStage_1 + _amount), {from: owner });
            let contractTokenBalance = await token.balanceOf(tokenOptionMultiTimed.address);
            assert.equal(contractTokenBalance.toNumber(), (_amountStage_1 + _amount));

            /// @dev transfer 4 tokens to address
            await tokenOptionMultiTimed.transferTokens(someAddress, _amountStage_1, { from: optionOwner });
            let tokBalance = await token.balanceOf(someAddress);
            assert.equal(tokBalance.toNumber(), _amountStage_1);

            /// @dev skip 1 stage
            increaseTime(_minutes3);
            let canTransfer = await tokenOptionMultiTimed.canTransferToken(_amount);
            assert.equal(canTransfer, true);
            contractTokenBalance = await token.balanceOf(tokenOptionMultiTimed.address);
            assert.equal(contractTokenBalance.toNumber(), _amount);

            /// @dev transfer remain tokens to address
            await tokenOptionMultiTimed.transferTokens(someAddress, _amount, { from: optionOwner });
            tokBalance = await token.balanceOf(someAddress);
            assert.equal(tokBalance.toNumber(), (_amountStage_1 + _amount));

        })
    });

    describe('Failable tests', function() {
        it('should fail while adding wrong timePoints', async function() {
            let lastBlock = await lastBlockTime();

            let _seconds30 = 30000;
            let _seconds2 = 2000;

            let _timePointStage_1 = lastBlock + _seconds30;
            let _amountStage_1 = 100;

            let _wrongTimePoint = lastBlock + _seconds30;
            let _amountStage_2 = 200;

            /// @dev initial time points count
            let points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(0,points.toNumber());

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(1, points.toNumber());

            /// @dev add wrong time point
            let fail = tokenOptionMultiTimed.addStage(_wrongTimePoint, _amountStage_2, { from: optionOwner });
            await assertThrows(fail, 'Next time point must be greater then previos');
        })

        it('should fail while adding wrong amount', async function() {
            let lastBlock = await lastBlockTime();

            let _seconds30 = 30000;
            let _minutes2 = 120000;

            let _timePointStage_1 = lastBlock + _seconds30;
            let _amountStage_1 = 100;

            let _timePointStage_2 = lastBlock + _minutes2;
            let _wrongAmount = 50;

            /// @dev initial time points count
            let points = await tokenOptionMultiTimed.pointsCount();
            assert.equal(0,points.toNumber());

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount();
            assert.equal(1, points.toNumber());

            /// @dev add wrong amount
            let fail = tokenOptionMultiTimed.addStage(_timePointStage_2, _wrongAmount, { from: optionOwner });
            await assertThrows(fail, 'Next amount must be greater then previos');
            points = await tokenOptionMultiTimed.pointsCount();
            assert.equal(1, points.toNumber());

        });

        it('should fail while adding stage with amount = 0', async function(){
            let lastBlock = await lastBlockTime();

            let _seconds30 = 30000;

            let _timePointStage_1 = lastBlock + _seconds30;
            let _zeroAmount = 0;

            /// @dev initial time points count
            let points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(0, points.toNumber());

            /// @dev add amount = 0
            let fail = tokenOptionMultiTimed.addStage(_timePointStage_1, _zeroAmount, { from: optionOwner });
            await assertThrows(fail, 'Next amount must be greater then previos');

            points = await tokenOptionMultiTimed.pointsCount();
            assert.equal(0, points.toNumber());
        });

        it('should fail to transfer if all stage tokens were transferred', async function() {
            let lastBlock = await lastBlockTime();

            let _minutes2 = 120000;
            let _timePointStage_1 = lastBlock + _minutes2;
            let _amountStage_1 = 4;

            let _tokensToTransfer_1 = 4;
            let _minutes3 = 180000;

            /// @dev add stage 1
            await tokenOptionMultiTimed.addStage(_timePointStage_1, _amountStage_1, { from: optionOwner });
            points = await tokenOptionMultiTimed.pointsCount()
            assert.equal(1, points.toNumber());

            /// @dev transfer 4 tokens to MultiTimedContract
            await token.transfer(tokenOptionMultiTimed.address, _amountStage_1, {from: owner });
            let contractTokenBalance = await token.balanceOf(tokenOptionMultiTimed.address);
            assert.equal(contractTokenBalance.toNumber(), _amountStage_1);

            let currentStage = await tokenOptionMultiTimed.getCurrentStage();
            assert.equal(currentStage.toNumber(), 0);

            /// @dev transfer 4 tokens to address
            let canTransfer = await tokenOptionMultiTimed.canTransferToken(_tokensToTransfer_1);
            assert.equal(canTransfer, true);
            await tokenOptionMultiTimed.transferTokens(someAddress, _tokensToTransfer_1, { from: optionOwner });
            let tokBalance = await token.balanceOf(someAddress);
            assert.equal(tokBalance.toNumber(), _tokensToTransfer_1);

            /// @dev skip 1 stage
            increaseTime(_minutes3);
            currentStage = await tokenOptionMultiTimed.getCurrentStage();
            assert.equal(currentStage.toNumber(), 0);

            /// @dev transfer 4 tokens to address
            let fail = tokenOptionMultiTimed.transferTokens(someAddress, _tokensToTransfer_1, { from: optionOwner });
            await assertThrows(fail, 'Can transfer if amount to transfer less then stage amount');

        });
    });
});
