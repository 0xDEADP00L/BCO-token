let BLLNToken = artifacts.require('BLLNToken');
let BLLNDividends = artifacts.require('BLLNDividendTestable');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let ownerAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);
let tokenPrice = money(300);

contract('TestBulkDiscount', function(accounts) {
    let dividends;
    let token;

	let owner = accounts[0];
    let acc1 = accounts[1];
    let acc2 = accounts[2];
    let acc3 = accounts[3];
    let acc4 = accounts[4];

    beforeEach(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
		token = await BLLNToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await dividends.mintPresale(ownerAmount, owner);
    });

    describe('bulk sale', function() {
        it('should not activate until 10k tokens buy', async function() {
			await dividends.setTokenDiscountThreshold(10**4);

            let eth = tokenPrice * (10**4 - 1);

            await dividends.buyToken({value: eth, from: acc1});
            let div = await dividends.getDividendBalance(acc1);
            assert.equal(div.toNumber(), 0, "Dividend balance should be zero.");
        });

        it('should activate on 10k tokens buy', async function() {
            let eth = tokenPrice * 10**4;

            await dividends.buyToken({value: eth, from: acc1});
            let div = await dividends.getDividendBalance(acc1);
            assert.ok(div.toNumber() > 0, "Dividend balance should be nonzero.");
        });

        it('should decrease on tokensale progress', async function() {
            let eth = tokenPrice * 10**4 * 10;

            await dividends.buyToken({value: eth, from: acc1});
            let div1 = await dividends.getDividendBalance(acc1);

            await dividends.buyToken({value: eth, from: acc2});
            let div2 = await dividends.getDividendBalance(acc2);

            await dividends.buyToken({value: eth, from: acc3});
            let div3 = await dividends.getDividendBalance(acc3);

            await dividends.buyToken({value: eth, from: acc4});
            let div4 = await dividends.getDividendBalance(acc4);

            assert.ok(div1.toNumber() > div2.toNumber(), "acc1 should get more discount than acc2");
            assert.ok(div2.toNumber() > div3.toNumber(), "acc2 should get more discount than acc3");
            assert.ok(div3.toNumber() > div4.toNumber(), "acc3 should get more discount than acc4");
        });
    });
});
