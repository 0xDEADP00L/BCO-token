let BLLNToken = artifacts.require('BLLNToken');
let BLLNDividends = artifacts.require('BLLNDividendTestable');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);
let dividendCoefficient = 2;

contract('Benchmarks1', function(accounts) {
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

    describe('1-10-25-50-100-200-300', function() {
        let _ether1 = money(5500);

        it('Buy tokens with 1 account', async function() {
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);

        });

        it('Buy tokens with 10 accounts', async function() {
            await dividends.genAddressesWithTokens(2, 11)
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
        });

        it('Buy tokens with 25 accounts', async function() {
            await dividends.genAddressesWithTokens(11, 26);
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
        });

        it('Buy tokens with 50 accounts', async function() {
            await dividends.genAddressesWithTokens(26, 51);
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
        });

        it('Buy tokens with 100 accounts', async function() {
            await dividends.genAddressesWithTokens(51, 101);
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
        });

        it('Buy tokens with 200 accounts', async function() {
            await dividends.genAddressesWithTokens(101, 151);
			await dividends.genAddressesWithTokens(151, 201);
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
        });

        it('Buy tokens with 300 accounts', async function() {
            await dividends.genAddressesWithTokens(201, 251);
			await dividends.genAddressesWithTokens(251, 301);
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
        });

		it('Buy tokens with 500 accounts', async function() {
            await dividends.genAddressesWithTokens(301,351);
			await dividends.genAddressesWithTokens(351,401);
			await dividends.genAddressesWithTokens(401,451);
			await dividends.genAddressesWithTokens(451,501);
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
        });

		it('Buy tokens with 1000 accounts', async function() {
			for (var i = 501; i < 1001; i += 100) {
				await dividends.genAddressesWithTokens(i, i+100);
			}
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
		});

		it('Buy tokens with 10000 accounts', async function() {
			for (var i = 1001; i < 10001; i += 500) {
				await dividends.genAddressesWithTokens(i, i+500);
			}
            let tx = await dividends.buyToken({value: _ether1, from: acc2});
            console.log("Gas used: " +tx.receipt.gasUsed);
		});
    });
});
