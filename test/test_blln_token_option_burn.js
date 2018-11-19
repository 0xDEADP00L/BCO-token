let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
let BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionBurn = artifacts.require('BLLNTokenOptionBurn');
var BLLNTokenBurnPit = artifacts.require('BLLNTokenBurnPit');

var utils = require("../test_utils/utils.js");
let denominationUnit = "szabo";
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;

contract('Test BLLNTokenOptionBurn', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let tokensale;
    let tokenOptionBurn;
    let burnPit;

    let owner = acc[0];
    let optionOwner = acc[1];

    beforeEach(async function() {
        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)
        tokensale = await BLLNTokensaleBasic.new(tokensaleController.address, tokenPrice);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address);

        await tokensaleController.mintPresale(presaleAmount, owner);
        await tokensaleController.addAddressToWhitelist(tokensale.address);

        burnPit = await BLLNTokenBurnPit.new();
        tokenOptionBurn = await BLLNTokenOptionBurn.new(dividends.address, token.address, burnPit.address, { from: optionOwner });
    });

    describe('Option', function() {
        it('should return true for canTransferTokens', async function() {
            let canTransfer = await tokenOptionBurn.canTransferTokens({ from: optionOwner });
            assert.equal(canTransfer, true);
        });
    });

    describe('Token transfers', function () {
        let _ownerInitialTokenBalance = 10;
        let _tokensToTransfer = 5;

        beforeEach(async function() {
            /// @dev check initial tokenBalance
            let tokenBalanceOption = await tokenOptionBurn.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), 0);

            let ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance);

            /// @dev transfer 5 tokens from owner to tokenOptionBurn contract
            await token.transfer(tokenOptionBurn.address, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOptionBurn.getTokenAmount();
            ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance - _tokensToTransfer);
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);
        });

        it('should disallow arbitrary token transfer', async function() {
            /// @dev try transfer tokens back to owner
            let tokenTransfer = tokenOptionBurn.transferTokens(owner, _tokensToTransfer, {from: optionOwner});
            await assertThrows(tokenTransfer, "Token transfers should be disallowed for burn option contract");
        });

        it('should send tokens to burn pit', async function() {
            /// @dev try transfer tokens back to owner
            await tokenOptionBurn.burnTokens(_tokensToTransfer, {from: optionOwner});
            let tokenOptionBalance = await tokenOptionBurn.getTokenAmount();
            assert.equal(tokenOptionBalance.toNumber(), 0);
            let burnPitTokenBalance = await token.balanceOf(burnPit.address);
            assert.equal(burnPitTokenBalance.toNumber(), _tokensToTransfer);
        });

        it('should allow dividends withdrawal', async function() {
            let _tenTokensPrice = tokenPrice * 10;
            let _randomAccount = acc[3]

            /// @dev buy 10 tokens
            await tokensale.sendTransaction({value: _tenTokensPrice, from: _randomAccount})
            dividendBalanceOption = await tokenOptionBurn.getDividendBalance();
			let expectedDividendBalance = _tenTokensPrice/2;
            assert.equal(dividendBalanceOption.toNumber(), expectedDividendBalance);

            /// @dev withdraw from option
            let balanceBefore = BN(await web3.eth.getBalance(optionOwner));
            let hash = await tokenOptionBurn.withdrawDividends({ from: optionOwner });

			let balanceAfter = BN(await web3.eth.getBalance(optionOwner));
            let tx = await web3.eth.getTransaction(hash.receipt.transactionHash);
			let gasCost = BN(tx.gasPrice).mul(BN(hash.receipt.gasUsed));
			let withdrawAmount = balanceAfter.sub(balanceBefore).add(gasCost);

			let withdrawAmountInEth = web3.utils.fromWei(withdrawAmount, denominationUnit);
            let expectedWithdraw = web3.utils.fromWei(BN(expectedDividendBalance), denominationUnit);
            assert.equal(withdrawAmountInEth, expectedWithdraw);
        });
    });

	describe('Presale', function () {
        it('should mint tokens to optionTimed contract', async function() {
            let tokenAmount = 1488;

            await tokensaleController.mintPresale(tokenAmount, tokenOptionBurn.address);
            let tokenBalanceOption = await tokenOptionBurn.getTokenAmount();

            assert.equal(tokenBalanceOption.toNumber(), tokenAmount);
        });
    });
});
