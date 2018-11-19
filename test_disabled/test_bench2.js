let BLLNToken = artifacts.require('BLLNToken');
let BLLNDividends = artifacts.require('BLLNDividendTestable');

let denominationUnit = "ether";
function money(number) {
	return web3.utils.toWei(number, denominationUnit);
}

let presaleAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);
let dividendCoefficient = 2;

contract('Benchmarks2', function(accounts) {
    let dividends;
    let token;

    let acc1 = accounts[1];
    let acc2 = accounts[2];
    let acc3 = accounts[3];

    before(async function () {
        dividends = await BLLNDividends.new(dividendCoefficient);
		token = await BLLNToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await token.mintPresaleAmount(presaleAmount);
    });

    describe('Buy tokens on 1Eth', function() {
        it('100 accounts', async function() {
            let _1Ether = money(1);

            ///@dev generate 100 fake users
            await dividends.genAddressesWith1Tokens(2,101);

            ///@dev acc2 buy tokens on 1 Ether
            let tx = await dividends.buyToken({value: _1Ether, from: acc2});
            console.log("Gas used: " + tx.receipt.gasUsed);
            let tokenBalance2 = await token.balanceOf(acc2);
            console.log("Token balance acc2 " + tokenBalance2.toNumber());
        });

        it('1000 accounts', async function() {
            let _1Ether = money(1);

            ///@dev generate 1000 fake users
            await dividends.genAddressesWith1Tokens(2,501);
            await dividends.genAddressesWith1Tokens(501,1001);

            ///@dev acc1 buy tokens on 1 Ether
            let tx = await dividends.buyToken({value: _1Ether, from: acc1});
            console.log("Gas used: " +tx.receipt.gasUsed);
            let tokenBalance1 = await token.balanceOf(acc1);
            console.log("Token balance acc1 " + tokenBalance1.toNumber());
        });
    });
});
