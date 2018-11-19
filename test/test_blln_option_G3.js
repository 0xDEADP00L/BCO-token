let BLLNToken = artifacts.require('BLLNToken');
let BLLNTokensaleController = artifacts.require('BLLNTokensaleController');
let BLLNTokensaleBasic = artifacts.require('BLLNTokensaleBasic');
let BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionG3 = artifacts.require('BLLNTokenOptionG3');

var utils = require("../test_utils/utils.js");
var money = utils.money;
var BN = utils.BN;
var lastBlockTime = utils.lastBlockTime;
var assertThrows = utils.assertThrows;

let presaleAmount = BN(10);
let maxTotalSupply = BN(100);
let tokenPrice = money(300);
let optionOwner;
let closingTime;

contract('Test BLLNTokenOptionG3', function(acc) {
    let dividends;
    let token;
    let tokensaleController;
    let tokensale;
    let tokenOptionG3;

    let owner = acc[0];
    let optionOwner = acc[1];
    let delegatedAddress = acc[2];
    let g3Address = acc[3];

    /// @dev configure presale duration
    let presaleDuration = 0;

    beforeEach(async function() {
		let lastBlock = await lastBlockTime();
		closingTime = lastBlock + presaleDuration;

        dividends = await BLLNDividends.new();
        token = await BLLNToken.new(dividends.address);
        tokensaleController = await BLLNTokensaleController.new(maxTotalSupply, dividends.address, token.address)
        tokensale = await BLLNTokensaleBasic.new(tokensaleController.address, tokenPrice);

        await dividends.setTokenAddress(token.address);
        await token.setTokensaleControllerAddress(tokensaleController.address);

        await tokensaleController.mintPresale(presaleAmount, owner);
        await tokensaleController.addAddressToWhitelist(tokensale.address);

		tokenOptionG3 = await BLLNTokenOptionG3.new(dividends.address,
                                                   token.address,
                                                   closingTime,
                                                   delegatedAddress,
                                                   g3Address,
                                                   { from: optionOwner })
    })

    describe('G3', function() {
        it('should return correct g3Address', async function() {
            let _g3 = await tokenOptionG3.g3Address()
            assert.equal(_g3, g3Address)
        });

        it('should revert transaction', async function() {

            let _ethers = tokenPrice.mul(BN(10));

            /// @dev initial token balance is zero
            let optionOwnerTokenBalance = await token.balanceOf(optionOwner);
            assert.equal(optionOwnerTokenBalance.toNumber(), 0)

            /// @dev optionOwner buy 10 tokens
            await tokensale.sendTransaction({value: _ethers, from: optionOwner});
            optionOwnerTokenBalance = await token.balanceOf(optionOwner);
            assert.equal(optionOwnerTokenBalance.toNumber(), 10)

            let fail = tokenOptionG3.transferTokens(delegatedAddress, 10, { from: optionOwner });
            await assertThrows(fail, 'revert base function');

        });

        it('should fail by owner modifier', async function() {
            let _ethers = tokenPrice.mul(BN(10));

            /// @dev initial token balance is zero
            let delegatedAddressTokenBalance = await token.balanceOf(delegatedAddress);
            assert.equal(delegatedAddressTokenBalance.toNumber(), 0)

            /// @dev delegatedAddress buy 10 tokens
            await tokensale.sendTransaction({value: _ethers, from: delegatedAddress});
            delegatedAddressTokenBalance = await token.balanceOf(delegatedAddress);
            assert.equal(delegatedAddressTokenBalance.toNumber(), 10)

            let fail = tokenOptionG3.transferToken(1, { from: delegatedAddress });
            await assertThrows(fail, 'only onwner can transfer tokens');
        });

        it('should transfer tokens', async function () {
            let _ethers = tokenPrice.mul(BN(10));
            let optionOwnerTokenBalance
            let g3contractTokenBalance

            /// @dev initial token balance is zero
            g3AddressTokenBalance = await token.balanceOf(g3Address);
            assert.equal(g3AddressTokenBalance.toNumber(), 0);
            optionOwnerTokenBalance = await token.balanceOf(optionOwner);
            assert.equal(optionOwnerTokenBalance.toNumber(), 0);

            /// @dev optionOwner buy 10 tokens
            await tokensale.sendTransaction({value: _ethers, from: optionOwner});
            optionOwnerTokenBalance = await token.balanceOf(optionOwner);
            assert.equal(optionOwnerTokenBalance.toNumber(), 10);

            /// @dev transfer 5 tokens to optionnG3 contract
            await token.transfer(tokenOptionG3.address, 5, { from: optionOwner });
            g3contractTokenBalance = await token.balanceOf(tokenOptionG3.address);
            assert.equal(g3contractTokenBalance.toNumber(), 5);

            let can = await tokenOptionG3.canTransferTokens({ from: optionOwner });
            assert.equal(can, true);

            await tokenOptionG3.transferToken(5, { from: optionOwner });
            g3AddressTokenBalance = await token.balanceOf(g3Address);
            assert.equal(g3AddressTokenBalance.toNumber(), 5);
        })
    });
})
