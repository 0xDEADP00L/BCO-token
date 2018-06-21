let BLLNToken = artifacts.require('BLLNToken');
let BLLNDividends = artifacts.require('BLLNDividendTestable');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(170);

contract('Test withdraw main balance', function (accounts) {
    let dividends;
    let token;

    let owner = accounts[0];
    let acc1 = accounts[1];
    let acc2 = accounts[2];
    let acc3 = accounts[3];

    before(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
        token = await BLLNToken.new(dividends.address);
        await dividends.setTokenAddress(token.address);
        await token.mintPresale(presaleAmount, owner);
    });

    describe('Withdraw', function() {
        it('should withdraw main balance', async function() {
            ///@test _given
            let _tokensFromAcc1 = {value: tokenPrice*2, from: acc1};
            let _tokensFromAcc2 = {value: tokenPrice*10, from: acc2};
            let _moneyToWithdrawFromMainBalance = money(100);

            ///@test _then
            let _expectedMainBalanceAfterAcc1 = tokenPrice * 2 / dividendCoefficient;
            let _expectedMainBalanceAfterWithdraw = tokenPrice * 12 / dividendCoefficient - money(100);

            ///@dev Initial main balance is zero
            let balance = await dividends.m_mainBalance();
            assert.equal(balance.toNumber(), 0);

            ///@dev acc1 buy tokens
            await dividends.buyToken(_tokensFromAcc1);
            balance = await dividends.m_mainBalance();
			let tokBalance = await token.balanceOf(acc1);
            assert.equal(balance.toNumber(), _expectedMainBalanceAfterAcc1);

            ///@dev acc2 buy tokens
            await dividends.buyToken(_tokensFromAcc2);
            balance = await dividends.m_mainBalance();

            let change = await dividends.getCommonChange();
            let _mainBalance = (tokenPrice * 12 - change.toNumber())/dividendCoefficient;
            assert.equal(balance.toNumber(), _mainBalance);

            await dividends.withdrawMainBalance(_moneyToWithdrawFromMainBalance, {from: owner});
            balance = await dividends.m_mainBalance();
            assert.equal(_expectedMainBalanceAfterWithdraw, balance.toNumber());

            ///@dev withdraw the remaining money from main balance
            await dividends.withdrawMainBalance(tokenPrice * 6 - money(100), {from: owner});
            balance = await dividends.m_mainBalance();
            assert.equal(0, balance.toNumber());
        });
    });
});
