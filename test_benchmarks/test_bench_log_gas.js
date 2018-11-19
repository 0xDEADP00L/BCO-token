var Log = artifacts.require('LogTestable');

const { exec } = require('child_process');
let fs = require('fs');

function num(x) {
    let bnX = web3.utils.toBN(x);
    return web3.utils.toWei(bnX, 'ether');
}

let nearErrorValue = 1000;
function nearEqual(given, expected) {
	return given >= expected - nearErrorValue
		&& given <= expected + nearErrorValue;
}
function assertNearEqual(given, expected, message) {
	var msg = "";
	if (message != undefined) {
		msg = message + ": " + given + " should be nearly equal to " + expected;
	} else {
		msg = given + " should be nearly equal to " + expected;
	}
	assert.ok(nearEqual(given, expected), msg);
}

contract('BenchLogGas', function(accounts) {
	let log;

    before(async function () {
        log = await Log.new();
    });

    describe('Logarithm', function () {
        it('calc ln gas usage', async function() {
            let filename = "lngas";
            let file = `/tmp/${filename}.csv`;
            fs.writeFileSync(file, '');

            for (var i = 1.001; i < 10.0; i += 0.01) {
                let ln = await log.ln(num(i));
                assertNearEqual(ln.toNumber(), num(Math.log(i).toFixed(18)), "ln(" + i + ") != " +  Math.log(i));

                let tx = await log.lngas(num(i));
                fs.appendFile(file, `${i};${tx.receipt.gasUsed-21000}\n`, function () { });
            }
            exec(`open ${file}`);
        });
    });
});
