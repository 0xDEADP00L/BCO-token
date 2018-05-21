let BCOToken = artifacts.require('BCOToken');
let BCODividends = artifacts.require('BCODividend');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let ownerAmount = 100;
let presaleAmounts = [10, 20, 10, 30];
let maxTotalSupply = 10000;


function assertThrows(promise, message) {
    return promise.then(() => {
        assert.isNotOk(true, message)
    }).catch((e) => {
        assert.include(e.message, 'VM Exception')
    })
}

contract('TestPresale', function(accounts) {
    let dividends;
    let token;

	let owner = accounts[0];
    let acc1 = accounts[1];
	let acc2 = accounts[2];
	let acc3 = accounts[3];
    let acc4 = accounts[4];

    beforeEach(async function() {
        dividends = await BCODividends.new(ownerAmount, maxTotalSupply);
		token = await BCOToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await token.mintPresale(ownerAmount, owner);
    });

    describe('presale', function() {
        it('only owner should be able to presale', async function() {
            let amount = 10;

            let acc1MintPresale = token.mintPresale(10, acc1, {from: acc1});
            let acc2MintPresale = token.mintPresale(10, acc2, {from: acc2});
            assertThrows(acc1MintPresale, "Acc1 cannot mint presale");
            assertThrows(acc2MintPresale, "Acc2 cannot mint presale");

            let ok1 = await token.mintPresale(10, acc1, {from: owner});
			assert.equal(ok1.receipt.status, '0x01');

            let ok2 = await token.mintPresale(10, acc2, {from: owner});
            assert.equal(ok2.receipt.status, '0x01');
        });

        it('only owner should be able to stop', async function() {
            let acc1FinishPresale = token.finishPresale({from: acc1});
            let acc2FinishPresale = token.finishPresale({from: acc2});
            assertThrows(acc1FinishPresale, "Acc1 cannot finish presale");
            assertThrows(acc2FinishPresale, "Acc2 cannot finish presale");

            let ok = await token.finishPresale({from: owner});
            assert.equal(ok.receipt.status, '0x01');
        });

        it('should be unable to presale after finish', async function() {
            let ok = await token.finishPresale({from: owner});
            assert.equal(ok.receipt.status, '0x01');

            let finishAgain = token.finishPresale({from: owner});
            assertThrows(finishAgain, "Unable to finish twice");
        });
    });

    describe('prebuyers', function() {
        beforeEach(async function() {
            for (var i = 1; i <= presaleAmounts.length; ++i) {
                await token.mintPresale(presaleAmounts[i-1], accounts[i], {from: owner});
            }
        });

        it('should get presold tokens', async function() {
            let ownerTokens = await token.balanceOf(owner);
            assert.equal(ownerTokens.toNumber(), ownerAmount);

            for (var i = 1; i <= presaleAmounts.length; ++i) {
                let acciTokens = await token.balanceOf(accounts[i]);
                assert.equal(acciTokens.toNumber(), presaleAmounts[i-1], "Account " + i + " token balance mismatch");
            }
		});

        it('should not get dividends from presale', async function() {
            let ownerBalance = await dividends.getDividendBalance(owner);
            assert.equal(ownerBalance.toNumber(), 0);

            for (var i = 1; i <= presaleAmounts.length; ++i) {
                let acciBalance = await dividends.getDividendBalance(accounts[i]);
                assert.equal(acciBalance.toNumber(), 0, "Account " + i + " dividend balance should be zero");
            }
        });

        it('should get correct dividend amount from public sale', async function() {
            let _ether = money(170)*10;
            let _ownerDividends = (_ether*100/170).toFixed();
            let _accDividends = [
                (_ether*10/170).toFixed(),
                (_ether*20/170).toFixed(),
                (_ether*10/170).toFixed(),
                (_ether*30/170).toFixed()
            ];

            await dividends.buyToken({value: _ether, from: accounts[5]});

            let ownerBalance = await dividends.getDividendBalance(owner);
            assert.equal(ownerBalance.toNumber(), _ownerDividends);

            for (var i = 1; i <= presaleAmounts.length; ++i) {
                let acciBalance = await dividends.getDividendBalance(accounts[i]);
                assert.equal(acciBalance.toNumber(), _accDividends[i-1], "Account " + i + " dividend balance mismatch");
            }
        });
    });
});
