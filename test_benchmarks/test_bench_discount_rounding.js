let BCOToken = artifacts.require('BCOToken');
let BCODividends = artifacts.require('BCODividendTestable');

var BigNumber = require('bignumber.js');

const { exec } = require('child_process');
let fs = require('fs');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);
let tokenPrice = money(170);

contract('BenchDiscountRounding', function (accounts) {
    let dividends;
    let token;

    let acc1 = accounts[1];

    before(async function () {
		dividends = await BCODividends.new(presaleAmount, maxTotalSupply);
		token = await BCOToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await token.mintPresale(presaleAmount, accounts[0]);
	});

    describe('Bulk sale discount rounding errors', function() {
        it("100 accounts", async function() {
			let filename = "discoungRounding";
            let file = `/tmp/${filename}.csv`;
            fs.writeFileSync(file, '#;Gas used;Dividends;Discount;Difference\n');

            for (var i = 1; i <= 1000; ++i) {
                let eth = tokenPrice * 100;
                let buyTx = await dividends.buyToken({value: eth, from: acc1});

                let div = await dividends.getDividendBalance(acc1);
				let discountPrice = await dividends.priceWithDiscount(i * 100, presaleAmount);
                let nonDiscountPrice = eth * i;

                let discount = nonDiscountPrice - discountPrice;
                let discountPercent = discount / nonDiscountPrice;
                let diff = discount - div;
                fs.appendFile(file, `${i * 100};${buyTx.receipt.gasUsed};${web3.fromWei(div, 'ether').toFixed(18)};${web3.fromWei(discount, 'ether')};${web3.fromWei(diff, 'ether')}\n`
                                    .replace('.', ',').replace('.', ',').replace('.', ',')
                                    , function () { });
            }

			exec(`open ${file}`);
        });
    });
});
