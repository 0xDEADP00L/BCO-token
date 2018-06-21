var BLLNToken = artifacts.require('BLLNToken');
var BLLNDividends = artifacts.require('BLLNDividendTestable');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);

contract ('Test token reclaim', function(accounts) {
    let dividends;
    let token;

    let owner = accounts[0];
    let acc1 = accounts[1];
    let acc2 = accounts[2];
    let acc3 = accounts[3];

    beforeEach(async function () {
		dividends = await BLLNDividends.new(maxTotalSupply);
		token = await BLLNToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await dividends.mintPresale(presaleAmount, owner);
	});

    describe('Reclaim BLLNToken', function() {
        it('should reclaim token to acc1', async function() {
            let _tenTokensPrice = tokenPrice * 10;
            let _contractAddress = token.address;

            /// @dev initial balance of acc1 is zero
            let tokenBalance = await token.balanceOf(acc1);
			assert.equal(tokenBalance, 0);

            /// @dev initial balance of owner is 10
            let ownerBalance = await token.balanceOf(owner);

            /// @dev acc1 buy 10 tokens
            await dividends.buyToken({ value: _tenTokensPrice, from: acc1 });
            tokenBalance = await token.balanceOf(acc1);
            assert.equal(tokenBalance, 10);

            /// @dev acc1 transfer 4 tokens to BLLNDividend address
            await token.transfer(_contractAddress, 4, { from: acc1 });
            tokenBalance = await token.balanceOf(acc1);
            let contractTokenBalance = await token.balanceOf(_contractAddress)
            assert(tokenBalance, 6);
            assert(contractTokenBalance, 4);

            /// @dev perform reclaim tokens to owner
            await token.reclaimToken(_contractAddress, { from: owner });
            ownerBalance = await token.balanceOf(owner);
            contractTokenBalance = await token.balanceOf(_contractAddress)
            assert.equal(contractTokenBalance, 0);
            assert.equal(ownerBalance, 14);
        });
    });
});
