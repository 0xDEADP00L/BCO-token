var BLLNToken = artifacts.require('BLLNToken');
var BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOptionG3 = artifacts.require('BLLNTokenOptionG3');

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

contract('Test BLLNTokenOptionG3', function(acc) {
    let dividends;
    let token;
    let tokenOptionG3;

    let owner = acc[0];
    let optionOwner = acc[1];
    let delegatedAddress = acc[2];
    let g3Address = acc[3];

    /// @dev configure presale duration
    let lastBlock = lastBlockTime();
    let presaleDuration = 0
    closingTime = lastBlock + presaleDuration

    beforeEach(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
        token = await BLLNToken.new(dividends.address);
        await dividends.setTokenAddress(token.address);
        await dividends.mintPresale(presaleAmount, owner);

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

            let _ethers = tokenPrice * 10

            /// @dev initial token balance is zero
            let optionOwnerTokenBalance = await token.balanceOf(optionOwner);
            assert.equal(optionOwnerTokenBalance.toNumber(), 0)

            /// @dev optionOwner buy 10 tokens
            await dividends.buyToken({value: _ethers, from: optionOwner});
            optionOwnerTokenBalance = await token.balanceOf(optionOwner);
            assert.equal(optionOwnerTokenBalance.toNumber(), 10)

            let fail = tokenOptionG3.transferTokens(delegatedAddress, 10, { from: optionOwner });
            await assertThrows(fail, 'revert base function');

        });

        it('should fail by owner modifier', async function() {
            let _ethers = tokenPrice * 10

            /// @dev initial token balance is zero
            let delegatedAddressTokenBalance = await token.balanceOf(delegatedAddress);
            assert.equal(delegatedAddressTokenBalance.toNumber(), 0)

            /// @dev delegatedAddress buy 10 tokens
            await dividends.buyToken({value: _ethers, from: delegatedAddress});
            delegatedAddressTokenBalance = await token.balanceOf(delegatedAddress);
            assert.equal(delegatedAddressTokenBalance.toNumber(), 10)

            let fail = tokenOptionG3.transferToken(1, { from: delegatedAddress });
            await assertThrows(fail, 'only onwner can transfer tokens');
        });

        it('should transfer tokens', async function () {
            let _ethers = tokenPrice * 10
            let optionOwnerTokenBalance
            let g3contractTokenBalance

            /// @dev initial token balance is zero
            g3AddressTokenBalance = await token.balanceOf(g3Address);
            assert.equal(g3AddressTokenBalance.toNumber(), 0);
            optionOwnerTokenBalance = await token.balanceOf(optionOwner);
            assert.equal(optionOwnerTokenBalance.toNumber(), 0);

            /// @dev optionOwner buy 10 tokens
            await dividends.buyToken({value: _ethers, from: optionOwner});
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
