var BLLNToken = artifacts.require('BLLNToken');
var BLLNDividends = artifacts.require('BLLNDividend');
var BLLNTokenOption = artifacts.require('BLLNTokenOptionBase');

let denominationUnit = "szabo";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let nearErrorValue = 1;
function nearEqual(given, expected) {
	return given >= expected - nearErrorValue
		&& given <= expected + nearErrorValue;
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let tokenPrice = money(300);
let optionOwner;

contract('Test BLLNTokenOptionBase', function(accounts) {
    let dividends;
    let token;
    let tokenOption;

    let owner = accounts[0];
    let optionOwner = accounts[1];

    beforeEach(async function() {
        dividends = await BLLNDividends.new(maxTotalSupply);
		token = await BLLNToken.new(dividends.address);
		await dividends.setTokenAddress(token.address);
		await dividends.mintPresale(presaleAmount, owner);
        tokenOption = await BLLNTokenOption.new(dividends.address, token.address, { from: optionOwner });
    });

    describe('Owner', function () {
		it('should return correct owner', async function() {
            let contractOwnner =  await tokenOption.owner();
            assert.equal(optionOwner, contractOwnner);
		});

        it('should transfer ownership', async function() {
            let _newOwner = accounts[3];

            /// @dev check old owner
            let contractOwnner =  await tokenOption.owner();
            assert.equal(optionOwner, contractOwnner);

            /// @dev transfer ownership to newOwner
            await tokenOption.transferOwnership(_newOwner, { from: optionOwner });
            contractOwnner =  await tokenOption.owner();
            assert.equal(_newOwner, contractOwnner);
        });
	});

    describe('Test BLLNTokenOption balances', async function() {
        it('should return token balance', async function() {
            _tokensToTransfer = 5
            _optionAddress = tokenOption.address;

            /// @dev check initial tokenBalance
            let tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), 0);

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);
        });

        it('should return dividend balance', async function() {
            let _tenTokensPrice = tokenPrice * 10;
            let _randomAccount = accounts[3]
            let _tokensToTransfer = 5
            let _optionAddress = tokenOption.address;

            /// @dev check initial tokenBalance
            let tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), 0);

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);

            /// @dev check initial dividend balance
            let dividendBalanceOption = await tokenOption.getDividendBalance();
            assert.equal(dividendBalanceOption.toNumber(), 0);

            /// @dev buy 10 tokens
            await dividends.buyToken({value: _tenTokensPrice, from: _randomAccount})
            dividendBalanceOption = await tokenOption.getDividendBalance();
            assert.equal(dividendBalanceOption.toNumber(), 1500000000000000);
        });
    });

    describe('Test BLLNTokenOption transfer', async function() {
        it('should transfer tokens from tokenOption contract to another account', async function() {
            let _ownerInitialTokenBalance = 10;
            let _tokensToTransfer = 5
            let _optionAddress = tokenOption.address;

            /// @dev check initial tokenBalance
            let tokenBalanceOption = await tokenOption.getTokenAmount();
            assert.equal(tokenBalanceOption.toNumber(), 0);
            let ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance);

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance - _tokensToTransfer);
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);

            /// @dev transfer tokens back to owner
            await tokenOption.transferTokens(owner, _tokensToTransfer, {from: optionOwner});
            ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance);
        });
    });

    describe('Test BLLNTokenOption withdraw', async function() {
        it('should withdraw ether', async function() {
            let _tenTokensPrice = tokenPrice * 10;
            let _randomAccount = accounts[3]
            let _ownerInitialTokenBalance = 10;
            let _tokensToTransfer = 5
            let _optionAddress = tokenOption.address;

            /// @dev transfer 5 tokens from owner to tokenOption contract
            await token.transfer(_optionAddress, _tokensToTransfer, { from: owner });
            tokenBalanceOption = await tokenOption.getTokenAmount();
            ownerBalance = await token.balanceOf(owner);
            assert.equal(ownerBalance.toNumber(), _ownerInitialTokenBalance - _tokensToTransfer);
            assert.equal(tokenBalanceOption.toNumber(), _tokensToTransfer);

            /// @dev buy 10 tokens
            await dividends.buyToken({value: _tenTokensPrice, from: _randomAccount})
            dividendBalanceOption = await tokenOption.getDividendBalance();
            assert.equal(dividendBalanceOption.toNumber(), 1500000000000000);

            /// @dev withdraw from option
            let optionOwnerWeiBalanceBeforeWithdraw = web3.eth.getBalance(optionOwner);
            let balanceBeforeInEth = web3.fromWei(optionOwnerWeiBalanceBeforeWithdraw.toNumber(), denominationUnit);

            await tokenOption.withdrawDividends(50000000000000, { from: optionOwner });

            let optionOwnerWeiBalance = web3.eth.getBalance(optionOwner);
            let balanceAfterInEth =  web3.fromWei(optionOwnerWeiBalance.toNumber(), denominationUnit);
            let withdrawAmount = balanceAfterInEth - balanceBeforeInEth;

            let expectedWithdraw = web3.fromWei(50000000000000, denominationUnit);
            nearEqual(withdrawAmount, expectedWithdraw);
        });
    });
});
