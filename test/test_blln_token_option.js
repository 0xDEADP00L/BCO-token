let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
let BLLNDividends = artifacts.require('BLLNDividend');
let BLLNTokenOption = artifacts.require('BLLNTokenOptionBase');

var utils = require("../test_utils/utils.js");
let denominationUnit = "szabo";
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

function assertNearEqual(given, expected, message) {
	var msg = "";
	if (message != undefined) {
		msg = message + ": " + given + " should be nearly equal to " + expected;
	} else {
		msg = given + " should be nearly equal to " + expected;
	}
	assert.ok(nearEqual(given, expected), msg);
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;

contract('Test BLLNTokenOptionBase', function(accounts) {
    let dividends;
    let token;
	let tokensaleController;
	let tokensale;
    let tokenOption;

    let owner = accounts[0];
    let optionOwner = accounts[1];

    beforeEach(async function() {
		dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)
        tokensale = await BLLNTokensaleBasic.new(tokensaleController.address, tokenPrice);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address)

        await tokensaleController.mintPresale(presaleAmount, owner);
        await tokensaleController.addAddressToWhitelist(tokensale.address);

        tokenOption = await BLLNTokenOption.new(dividends.address, token.address, { from: optionOwner });
    });

    describe('Owner', function () {
		it('should return correct owner', async function() {
            let contractOwnner =  await tokenOption.owner();
            assert.equal(optionOwner, contractOwnner);
		});

        it('should transfer ownership', async function() {
            let _newOwner = accounts[3];

            /// @dev check old owner
            let contractOwnner =  await tokenOption.owner();
            assert.equal(optionOwner, contractOwnner);

            /// @dev transfer ownership to newOwner
            await tokenOption.transferOwnership(_newOwner, { from: optionOwner });
            contractOwnner =  await tokenOption.owner();
            assert.equal(_newOwner, contractOwnner);
        });
	});

    describe('Test BLLNTokenOption balances', async function() {
        it('should return token balance', async function() {
            _tokensToTransfer = 5
            _optionAddress = tokenOption.address;

            /// @dev check initial tokenBalance
            let tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), 0);

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);
        });

        it('should return dividend balance', async function() {
            let _tenTokensPrice = tokenPrice * 10;
            let _randomAccount = accounts[3]
            let _tokensToTransfer = 5
            let _optionAddress = tokenOption.address;

            /// @dev check initial tokenBalance
            let tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), 0);

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);

            /// @dev check initial dividend balance
            let dividendBalanceOption = await tokenOption.getDividendBalance();
            assert.equal(dividendBalanceOption.toNumber(), 0);

            /// @dev buy 10 tokens
            await tokensale.sendTransaction({value: _tenTokensPrice, from: _randomAccount})
            dividendBalanceOption = await tokenOption.getDividendBalance();
            assert.equal(dividendBalanceOption.toNumber(), 1500000000000000);
        });
    });

    describe('Test BLLNTokenOption transfer', async function() {
        it('should transfer tokens from tokenOption contract to another account', async function() {
            let _ownerInitialTokenBalance = 10;
            let _tokensToTransfer = 5
            let _optionAddress = tokenOption.address;

            /// @dev check initial tokenBalance
            let tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), 0);
            let ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance);

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance - _tokensToTransfer);
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);

            /// @dev transfer tokens back to owner
            await tokenOption.transferTokens(owner, _tokensToTransfer, {from: optionOwner});
            ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance);
        });
    });

    describe('Test BLLNTokenOption withdraw', async function() {
        it('should withdraw ether', async function() {
            let _tenTokensPrice = tokenPrice * 10;
            let _randomAccount = accounts[3]
            let _ownerInitialTokenBalance = 10;
            let _tokensToTransfer = 5
            let _optionAddress = tokenOption.address;

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance - _tokensToTransfer);
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);

            /// @dev buy 10 tokens
            await tokensale.sendTransaction({value: _tenTokensPrice, from: _randomAccount})
            dividendBalanceOption = await tokenOption.getDividendBalance();
			let expectedDividendBalance = _tenTokensPrice/2;
            assert.equal(dividendBalanceOption.toNumber(), expectedDividendBalance);

            /// @dev withdraw from option
            let balanceBefore = BN(await web3.eth.getBalance(optionOwner));
            let hash = await tokenOption.withdrawDividends({ from: optionOwner });

			let balanceAfter = BN(await web3.eth.getBalance(optionOwner));
            let tx = await web3.eth.getTransaction(hash.receipt.transactionHash);
			let gasCost = BN(tx.gasPrice).mul(BN(hash.receipt.gasUsed));
			let withdrawAmount = balanceAfter.sub(balanceBefore).add(gasCost);

			let withdrawAmountInEth = web3.utils.fromWei(withdrawAmount, denominationUnit);
            let expectedWithdraw = web3.utils.fromWei(BN(expectedDividendBalance), denominationUnit);
            assert.equal(withdrawAmountInEth, expectedWithdraw);
        });
    });
});
