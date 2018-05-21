let BCOToken = artifacts.require('BCOToken');
let BCODividends = artifacts.require('BCODividendTestable');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 90*(10**6);
let maxTotalSupply = 250*(10**6);
let dividendCoefficient = 2;

contract('Dividends convergence', function(accounts) {
    let dividends;
    let token;

    let owner = accounts[0];
    let acc1 = accounts[1];
	let acc2 = accounts[2];
	let acc3 = accounts[3];
    let acc4 = accounts[4];

    before(async function () {
		dividends = await BCODividends.new(presaleAmount, maxTotalSupply, dividendCoefficient);
		token = await BCOToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await token.mintPresaleAmount(presaleAmount);
	});

	describe('presale amount', function () {
		it('presale amount should be equal presaleAmount', async function() {
			let ownerBalance = await token.balanceOf(owner);
			assert.equal(presaleAmount, ownerBalance.toNumber());
		});
	});

    describe('1-2-3-4-10-23-50', function() {
        it('1 account with tokens', async function(){
            //@dev owner dividends, acc1 buy and dividends = 0
            let _ether = money(550);

            ///@dev acc1 buy tokens
            await dividends.buyToken({value: _ether, from: acc1});

            ///@dev dividend balance owner
            let dividendBalanceOwner = await dividends.getDividendBalance(owner);
            console.log("Dividend balance owner: " + dividendBalanceOwner.toNumber());

            ///@dev dividend balance acc1
            let dividendBalance1 = await dividends.getDividendBalance(acc1);
            console.log("Dividend balance acc1: " + dividendBalance1.toNumber());

            let mainBalance = await dividends.m_mainBalance()
            console.log("Main balance: " + mainBalance.toNumber());

            let sharedDividendBalance = await dividends.m_sharedDividendBalance()
            console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());
            console.log("diff: " + (sharedDividendBalance.toNumber() - dividendBalanceOwner.toNumber()))
        });

        it('2 accounts with tokens', async function() {
            //@dev owner dividends, acc1 dividends, acc2 buy and dividends = 0
            let _ether = money(550);

            ///@dev acc2 buy tokens
            await dividends.buyToken({value: _ether, from: acc2});

            ///@dev dividend balance owner
            let dividendBalanceOwner = await dividends.getDividendBalance(owner);
            console.log("Dividend balance owner: " + dividendBalanceOwner.toNumber());

            ///@dev dividend balance acc1
            let dividendBalance1 = await dividends.getDividendBalance(acc1);
            console.log("Dividend balance acc1: " + dividendBalance1.toNumber());

            ///@dev dividend balance acc2
            let dividendBalance2 = await dividends.getDividendBalance(acc2);
            console.log("Dividend balance acc2: " + dividendBalance2.toNumber());
            // assert.equal(dividendBalance2.toNumber(),0);

            let mainBalance = await dividends.m_mainBalance()
            console.log("Main balance: " + mainBalance.toNumber());

            let sharedDividendBalance = await dividends.m_sharedDividendBalance()
            console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

            ///@dev sum of all users dividendBalances (owner + acc1 + acc2 - changeCommon)
            let changeCommon = await dividends.getCommonChange();
            let sumOfDiv = dividendBalanceOwner.toNumber() + dividendBalance1.toNumber() + dividendBalance2.toNumber() - changeCommon;
            let diff = sharedDividendBalance.toNumber() - sumOfDiv;
			console.log("Change: " + changeCommon.toNumber());
            console.log("Sum of dividends " + sumOfDiv);
            console.log("diff: " + diff);
        });

        it('3 accounts with tokens', async function() {
            //@dev owner dividends, acc1 dividends, acc2 dividends, acc3 buy and dividends = 0
            let _ether = money(550);

            ///@dev acc3 buy tokens
            await dividends.buyToken({value: _ether, from: acc3});

            ///@dev dividend balance owner
            let dividendBalanceOwner = await dividends.getDividendBalance(owner);
            console.log("Dividend balance owner: " + dividendBalanceOwner.toNumber());

            ///@dev dividend balance acc1
            let dividendBalance1 = await dividends.getDividendBalance(acc1);
            console.log("Dividend balance acc1: " + dividendBalance1.toNumber());

            ///@dev dividend balance acc2
            let dividendBalance2 = await dividends.getDividendBalance(acc2);
            console.log("Dividend balance acc2: " + dividendBalance2.toNumber());

            ///@dev dividend balance acc3
            let dividendBalance3 = await dividends.getDividendBalance(acc3);
            console.log("Dividend balance acc3: " + dividendBalance3.toNumber());

            let mainBalance = await dividends.m_mainBalance()
            console.log("Main balance: " + mainBalance.toNumber());

            let sharedDividendBalance = await dividends.m_sharedDividendBalance()
            console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

            ///@dev sum of all users dividendBalances (owner + acc1 + acc2 + acc3 - changeCommon)
            let changeCommon = await dividends.getCommonChange();
            let sumOfDiv = dividendBalanceOwner.toNumber() + dividendBalance1.toNumber() + dividendBalance2.toNumber() + dividendBalance3.toNumber() - changeCommon;
            console.log("Sum of dividends " + sumOfDiv);
			console.log("Change: " + changeCommon.toNumber());
            let diff = sharedDividendBalance.toNumber() - sumOfDiv;
            console.log("diff: " + diff);

        });

        it('4 accounts with tokens', async function() {
            //@dev owner dividends, acc1 dividends, acc2 dividends, acc3 dividends, acc4 buy and dividends = 0
            let _ether = money(550);

            ///@dev acc4 buy tokens
            await dividends.buyToken({value: _ether, from: acc4});

            ///@dev dividend balance owner
            let dividendBalanceOwner = await dividends.getDividendBalance(owner);
            console.log("Dividend balance owner: " + dividendBalanceOwner.toNumber());

            ///@dev dividend balance acc1
            let dividendBalance1 = await dividends.getDividendBalance(acc1);
            console.log("Dividend balance acc1: " + dividendBalance1.toNumber());

            ///@dev dividend balance acc2
            let dividendBalance2 = await dividends.getDividendBalance(acc2);
            console.log("Dividend balance acc2: " + dividendBalance2.toNumber());

            ///@dev dividend balance acc3
            let dividendBalance3 = await dividends.getDividendBalance(acc3);
            console.log("Dividend balance acc3: " + dividendBalance3.toNumber());

            ///@dev dividend balance acc4
            let dividendBalance4 = await dividends.getDividendBalance(acc4);
            console.log("Dividend balance acc4: " + dividendBalance4.toNumber());

            let mainBalance = await dividends.m_mainBalance()
            console.log("Main balance: " + mainBalance.toNumber());

            let sharedDividendBalance = await dividends.m_sharedDividendBalance()
            console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

            ///@dev sum of all users dividendBalances (owner + acc1 + acc2 + acc3 + acc4 - changeCommon)
            let changeCommon = await dividends.getCommonChange();
            let sumOfDiv = dividendBalanceOwner.toNumber() + dividendBalance1.toNumber() + dividendBalance2.toNumber() + dividendBalance3.toNumber() + dividendBalance4.toNumber() - changeCommon;
			console.log("Change: " + changeCommon.toNumber());
            console.log("Sum of dividends " + sumOfDiv);
            let diff = sharedDividendBalance.toNumber() - sumOfDiv;
            console.log("diff: " + diff);
        });

        it('10 accounts with tokens', async function() {
            let sumUserDividends = 0

            ///@dev buy tokens for 10 accounts
            for (var i = 5; i < 11; i++) {
				let eth = money(i*150);
				await dividends.buyToken({value: eth, from: accounts[i]});
            }

            ///@dev Sum all users dividends
            for (var i = 0; i < 11; i++) {
                let dividend = await dividends.getDividendBalance(accounts[i]);
                sumUserDividends += dividend.toNumber();
            }
            console.log("Sum all users dividends: " + sumUserDividends);

            let sharedDividendBalance = await dividends.m_sharedDividendBalance()
            console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

            let changeCommon = await dividends.getCommonChange();
			let mainBalance = await dividends.m_mainBalance();
			console.log("Change: " + changeCommon.toNumber());
            console.log("Main balance: " + mainBalance.toNumber());
            console.log("diff: " + (sharedDividendBalance.toNumber() - (sumUserDividends - changeCommon.toNumber())));
        });


        it('23 accounts with tokens', async function() {
            // let _ether = money(50000);
            let sumUserDividends = 0

            ///@dev buy tokens for 10 accounts
            for (var i = 11; i < 24; i++) {
				 let eth = money(i*150);
                 await dividends.buyToken({value: eth, from: accounts[i]});
            }

            ///@dev Sum all users dividends
            for (var i = 0; i < 24; i++) {
                let dividend = await dividends.getDividendBalance(accounts[i]);
                sumUserDividends += dividend.toNumber();
            }

			console.log("Sum all users dividends: " + sumUserDividends);

            let sharedDividendBalance = await dividends.m_sharedDividendBalance()
            console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

            let changeCommon = await dividends.getCommonChange();
			let mainBalance = await dividends.m_mainBalance();
			console.log("Change: " + changeCommon.toNumber());

            console.log("Main balance: " + mainBalance.toNumber());
            console.log("diff: " + (sharedDividendBalance.toNumber() - (sumUserDividends - changeCommon.toNumber())));
        });

		it('50 accounts with tokens', async function() {
			let sumUserDividends = 0

			///@dev buy tokens for 10 accounts
			for (var i = 24; i < 51; i++) {
				let eth = money(i*150);
			    await dividends.buyToken({value: eth, from: accounts[i]});
			}

			///@dev Sum all users dividends
			for (var i = 0; i < 51; i++) {
				let dividend = await dividends.getDividendBalance(accounts[i]);
				sumUserDividends += dividend.toNumber();
			}

			console.log("Sum all users dividends: " + sumUserDividends);

			let sharedDividendBalance = await dividends.m_sharedDividendBalance()
			console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

			let changeCommon = await dividends.getCommonChange();
			let mainBalance = await dividends.m_mainBalance();

			console.log("Change: " + changeCommon.toNumber());
			console.log("Main balance: " + mainBalance.toNumber());
			console.log("diff: " + (sharedDividendBalance.toNumber() - (sumUserDividends - changeCommon.toNumber())));
		});

		it('76 accounts with tokens', async function() {
			let _ether = money(50000);
			let sumUserDividends = 0

			///@dev buy tokens for 10 accounts
			for (var i = 51; i < 77; i++) {
				let eth = money(i*150);
			    await dividends.buyToken({value: eth, from: accounts[i]});
			}

			///@dev Sum all users dividends
			for (var i = 0; i < 77; i++) {
				let dividend = await dividends.getDividendBalance(accounts[i]);
				sumUserDividends += dividend.toNumber();
			}

			console.log("Sum all users dividends: " + sumUserDividends);

			let sharedDividendBalance = await dividends.m_sharedDividendBalance()
			console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

			let changeCommon = await dividends.getCommonChange();
			let mainBalance = await dividends.m_mainBalance();

			console.log("Change: " + changeCommon.toNumber());
			console.log("Main balance: " + mainBalance.toNumber());
			console.log("diff: " + (sharedDividendBalance.toNumber() - (sumUserDividends - changeCommon.toNumber())));
		});

		it('100 accounts with tokens', async function() {
			let sumUserDividends = 0

			///@dev buy tokens for 10 accounts
			for (var i = 77; i < 100; i++) {
				let eth = money(i*150);
			    await dividends.buyToken({value: eth, from: accounts[i]});
			}

			///@dev Sum all users dividends
			for (var i = 0; i < 100; i++) {
				let dividend = await dividends.getDividendBalance(accounts[i]);
				sumUserDividends += dividend.toNumber();
			}

			console.log("Sum all users dividends: " + sumUserDividends);

			let sharedDividendBalance = await dividends.m_sharedDividendBalance()
			console.log("Shared dividend balance: " + sharedDividendBalance.toNumber());

			let changeCommon = await dividends.getCommonChange();
			let mainBalance = await dividends.m_mainBalance();

			console.log("Change: " + changeCommon.toNumber());
			console.log("Main balance: " + mainBalance.toNumber());
			console.log("diff: " + (sharedDividendBalance.toNumber() - (sumUserDividends - changeCommon.toNumber())));
		});
    });
});
