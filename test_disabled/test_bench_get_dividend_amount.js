let BLLNToken = artifacts.require('BLLNToken');
let BLLNDividends = artifacts.require('BLLNDividendTestable');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);

contract('Bench get dividend amount', function (accounts) {
    let dividends;
    let token;

    let owner = accounts[0];
    let acc1 = accounts[1];
    let acc2 = accounts[2];
    let acc3 = accounts[3];

    before(async function () {
        dividends = await BLLNDividends.new(maxTotalSupply);
        token = await BLLNToken.new(dividends.address);
        await dividends.setTokenAddress(token.address);
        await token.mintPresaleAmount(presaleAmount);
    });


    describe('Dividends calculation gas used', function() {
        it('100 purchases', async function() {
            let oneTokenFromOwner = {value: money(170), from: acc1}

			console.log("Buys number;Gas used");
            for (let i = 1; i<=100; ++i) {
                await dividends.buyToken(oneTokenFromOwner);
                let tx = await dividends.getDividendBalance2(owner);
                let balance = await dividends.getDividendBalance(owner);
                console.log(i + ";" + tx.receipt.gasUsed);
            }
        });
    });
});
