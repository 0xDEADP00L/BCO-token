let BLLNToken = artifacts.require('BLLNToken');
let BLLNDividends = artifacts.require('BLLNDividendTestable');

var BigNumber = require('bignumber.js');

const { exec } = require('child_process');
let fs = require('fs');

let denominationUnit = "szabo";
function money(number) {
	let bnNumber = web3.utils.toBN(number);
	return web3.utils.toWei(bnNumber, denominationUnit);
}

let presaleAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);

contract('BenchDividendsRoundingError', function (accounts) {
    let dividends;
    let token;

    before(async function () {
		dividends = await BLLNDividends.new(maxTotalSupply);
		token = await BLLNToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await token.mintPresale(presaleAmount, accounts[0]);
	});

    describe('Dividends rounding errors', function() {
        it("100 accounts", async function() {
			let filename = "dividendsErrors";
            let file = `/tmp/${filename}.csv`;
            fs.writeFileSync(file, '');
            for (var i = 1; i < 100; ++i) {
				let eth = money(i*170)*1000;
				await dividends.buyToken({value: eth, from: accounts[i]});

                let sumUserDividends = new BigNumber('0');
                for (var k = 0; k <= i; ++k) {
    				let dividend = await dividends.getDividendBalance(accounts[k]);
					sumUserDividends = sumUserDividends.plus(dividend);
    			}

                let changeCommon = await dividends.getCommonChange();
				let sharedDividendBalance = await dividends.m_sharedDividendBalance();
				let difference = sharedDividendBalance.minus(sumUserDividends.minus(changeCommon));
				fs.appendFile(file, `${i+1};${difference.toNumber()}\n`, function () { });
            }
			exec(`open ${file}`);
        });
    });
});
