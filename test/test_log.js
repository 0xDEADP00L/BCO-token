var Log = artifacts.require('Log');

var BigNumber = require('bignumber.js');

function num(x) {
    return web3.toWei(x, 'ether');
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
function assertThrows(promise, message) {
    return promise.then(() => {
        assert.isNotOk(true, message)
    }).catch((e) => {
        assert.include(e.message, 'VM Exception')
    })
}

contract('TestLog', function(accounts) {
	let log;

    before(async function () {
        log = await Log.new();
    });

    describe('Logarithm', function () {
        it('calc ln1to2', async function() {
            let _nums = [1.5, 1.75, 1.67, 1.01, 1, 2, 1.9999];
            let _numlns = [
                0.405465108108164381, // ln(1.5)
                0.559615787935422686, // ln(1.75)
                0.512823626428663739, // ln(1.67)
                0.009950330853168082, // ln(1.01)
                0, // ln(1)
                0.693147180559945309, // ln(2)
                0.693097179309903641  // ln(1.9999)
            ];

            for (var i = 0; i < _nums.length; ++i) {
                let ln = await log.ln(num(_nums[i]));
                assertNearEqual(ln.toNumber(), num(_numlns[i]), "ln(" + _nums[i] + ") != " +  _numlns[i]);
            }
        });

        it('calc ln', async function() {
            let _nums = [2.5, 15, 100500, 3, 123, 2.01, 10, 10**10];
            let _numlns = [
                0.916290731874155065, // ln(2.5)
                2.708050201102210065, // ln(15)
                11.517913006481267493, // ln(100500)
                1.098612288668109691, // ln(3)
                4.812184355372417495, // ln(123)
                0.698134722070984383, // ln(2.01)
                2.302585092994045684, // ln(10)
                23.025850929940456840 // ln(10e10)
            ];

            for (var i = 0; i < _nums.length; ++i) {
                let ln = await log.ln(num(_nums[i]));
                assertNearEqual(ln.toNumber(), num(_numlns[i]), "ln(" + _nums[i] + ") != " +  _numlns[i]);
            }
        });

        it('calc ln limits', async function() {
            let low = num(0.0000000009);
            let big = -1;

            let failLow = log.ln(low);
            await assertThrows(failLow, "Low numbers should be rejected");
            let failBig = log.ln(big);
            await assertThrows(failBig, "Big numbers should be rejected");
        });
    });
});
