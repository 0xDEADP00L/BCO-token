# Solidity environment installation guide

## Prerequisites

* Homebrew
* [Mist](https://github.com/ethereum/mist/releases)
* [Ganache](http://truffleframework.com/ganache/)

## Geth installation

    brew tap ethereum/ethereum
    brew update
    brew install ethereum

## Truffle installation

First, install npm, if it is not yet installed:

    brew update
    brew install -y npm

Configure PATH to include npm binaries dir

    NPM_PATH="$(npm prefix -g)/bin"
    echo 'export PATH="' + $NPM_PATH + ':$PATH"' >> ~/.bash_profile
    source ~/.bash_profile

Install truffle with npm globally (-g key)

    npm install -g truffle

## Truffle Initialization

Create new **empty** directory `%new-dir%` and navigate to it. Then run `truffle init`.

    mkdir test_token
    cd test_token
    truffle init

## OpenZeppelin library installation

If you don't need OpenZeppelin contracts library, skip this step.

This will install zeppelin contracts to `node_modules/zeppelin-solidity/contracts` subdirectory.

    npm init -y
    npm i -E zeppelin-solidity

## Project configuration

In file `truffle.js` there are several lines regarding network configuration.

This file should contain something like this:

```javascript
module.exports = {
    networks: {
        dev: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
            gas: 4712388
        },
        ganache: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*",
            gas: 4712388
        }
    }
};
```

Where `"*"` stands for 'Any network id', this is ok for private
chain configuration.
Host and port are located in corresponding ethereum node configuration.
For ganache this setting is default.

We will use Ganache for test running environment and private geth node
for internal overall testing.

After reconfiguring networks it is essential to run `truffle networks --clean` before migration or testing.

## Getting started

Create new contract. The following will create `TestContract.sol` file
in `contracts` directory with new contact stub in it:

    truffle create contract TestContract

Compile contract:

    truffle compile

Create new migrations file `migrations/2_deploy_contracts.js`
and make it look like:

```javascript
const Test = artifacts.require('TestContract');

module.exports = async function(deployer) {
    await deployer.deploy(Test);
};
```

Then run Ganache, you can use basic configuration.
But check that server and chain settings match listed in `truffle.js` file.

After that you can migrate your contract to the network:

    truffle migrate --network ganache

## Testing contracts

Tests for truffle can be written in two languages: solidity and javascript.  
After several tryouts we decided to write tests in javascript.

To create new test one should type `truffle create test TestTest`.
This will create file `test/test_test.js` with test stub.

A typical test should look like this:

```javascript
// Artifact retrieval from JSON just like in migration file
var Test = artifacts.require('TestContract');

let denominationUnit = "finney";
function money(number) {
	return web3.toWei(number, denominationUnit);
}

let presaleAmount = 10;
let maxTotalSupply = 100;
let shareCoefficient = 1/2;

// Test name
contract('TestTest', function(accounts) {
    // Function has params    ^^^^^^^^ in this case
    // these are accounts available in test environment
	let token;
    let dividends;

	let acc1 = accounts[1];
	let acc2 = accounts[2];
	let acc3 = accounts[3];

    // BeforeEach function will be called just before each 'it' function
	beforeEach(async function () {
        dividends = await BCODividends.new(presaleAmount, maxTotalSupply);
		token = await BCOToken.new(dividends.address, presaleAmount);
		await dividends.setTokenAddress(token.address);
	});

    // Describe section used to group some tests
	describe('account', function () {

        // it section represents a single test
		it('should have zero token balance at start', async function() {
			let tokenBalance = await token.balanceOf(acc1);
			assert.equal(tokenBalance, 0);
		});

		it('should get bought tokens increasing in price', async function () {
			let _tokens2 = 10;
			let _tokens3 = 10;
			let _ethers2 = money(55);
			let _ethers3 = money(155);
			let _totalEthers = Number(_ethers2) + Number(_ethers3);

			let tokenBalance2_empty = await token.balanceOf(acc2);
			assert.equal(tokenBalance2_empty.toNumber(), 0);
			let tokenBalance3_empty = await token.balanceOf(acc3);
			assert.equal(tokenBalance3_empty.toNumber(), 0);

			await dividends.buyToken({value: _ethers2, from: acc2});
			await dividends.buyToken({value: _ethers3, from: acc3});

			assert.equal(web3.eth.getBalance(dividends.address).toNumber(), _totalEthers);

			let tokenBalance2 = await token.balanceOf(acc2);
			assert.equal(tokenBalance2.toNumber(), _tokens2);
			let tokenBalance3 = await token.balanceOf(acc3);
			assert.equal(tokenBalance3.toNumber(), _tokens3);
		});
	});
});
```

Then run tests:

    truffle test --network ganache

This should deploy your contracts to Ganache and run all the tests
in `test` directory. Tests usually create a whole bunch of transactions,
so it is recommended to run them on virtual environment like Ganache
instead of private blockchain with mining.

## Running private blockchain

Create new folder that will contain your private blockchain data:

    mkdir blockchain
    cd blockchain
    touch Genesis.json

`Genesis.json` contents should be like:

```javascript
{
	"difficulty": "0x20000",
	"extraData": "",
	"gasLimit": "0x8000000",
	"alloc": {},
	"config": {
		"chainId": 15,
		"homesteadBlock": 0,
		"eip155Block": 0,
		"eip158Block": 0
	}
}
```
Then you should initialize blockchain with

    geth init --datadir=./chaindata ./Genesis.json

Even if you pass very high amount as `gasLimit` variable real `gasLimit`
will slowly degrade to it's default value `4712388`. This can be
overriden with `geth` key `--targetgaslimit`. See [geth Command Line Options](https://github.com/ethereumproject/go-ethereum/wiki/Command-Line-Options) for details.

To run your new private node run:

    geth --datadir=./chaindata --rpc —-rpcapi eth,web3,personal

You can use provided script start_geth.sh to run geth with console, miner
and unlocked account 0.

Script contents:

```bash
GETH_ACCOUNT="$(geth --datadir=./chaindata account list | grep -m 1 "Account" | awk '{print substr($3, 2, length($3) - 2)}')"
GETH_PASSWORD=${1}
GETH_LOGFILE=/tmp/geth.log

echo $GETH_PASSWORD >/tmp/geth_password.txt
geth console --datadir=./chaindata \
	 --rpc \
	 --rpcapi eth,web3,personal,miner,admin,net \
	 --unlock $GETH_ACCOUNT \
	 --password /tmp/geth_password.txt \
	 --mine \
	 --minerthreads 1 \
	 2>$GETH_LOGFILE
```

To connect to your private blockchain run Mist from command line when node
is running:

    /Applications/Mist.app/Contents/MacOS/Mist --rpc http://127.0.0.1:8545

Mist will alert you about insecure connection - close it.

In Mist you can create accounts, send transactions and add contracts
in your private blockchain with GUI.

## Deploying contract to private blockchain

To deploy your newly created contract to your newly created private blockchain
you should run when node is running:

    truffle migrate --network dev

This should deploy all your contracts to your blockchain using account #0
as owner. This is why account should be unlocked.

After deployment run `truffle console --network dev` and type:

    > Test.address
    > JSON.stringify(Test.abi)

This will print you your contract address and ABI string ready to import
to Mist. Then you can proceed to Mist contracts section and add this contract
to watch list.
