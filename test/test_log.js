var Log = artifacts.require('Log');

var BigNumber = require('bignumber.js');

function BN(a) {
    return web3.utils.toBN(a);
}

function num(x) {
    let bnX = BN(x);
    return web3.utils.toWei(bnX, 'ether');
}

let nearErrorValue = BN(100);
function nearEqual(given, expected) {
	return given.gte(expected.sub(nearErrorValue))
		&& given.lte(expected.add(nearErrorValue));
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

let bn10 = BN(10);

contract('TestLog', function(accounts) {
	let log;

    before(async function () {
        log = await Log.new();
    });

    describe('Logarithm', function () {
        it('calc ln1to2', async function() {
            let _nums = [
                BN(15).mul(bn10.pow(BN(17))), // 1.5
                BN(175).mul(bn10.pow(BN(16))), // 1.75
                BN(167).mul(bn10.pow(BN(16))), // 1.67
                BN(101).mul(bn10.pow(BN(16))), // 1.01
                BN(1).mul(bn10.pow(BN(18))), // 1
                BN(2).mul(bn10.pow(BN(18))), // 2
                BN(19999).mul(bn10.pow(BN(14))) // 1.9999
            ];
            let _numlns = [
                BN("405465108108164381"), // ln(1.5)
                BN("559615787935422686"), // ln(1.75)
                BN("512823626428663739"), // ln(1.67)
                BN("9950330853168082"), // ln(1.01)
                BN(0), // ln(1)
                BN("693147180559945309"), // ln(2)
                BN("693097179309903641")  // ln(1.9999)
            ];

            for (var i = 0; i < _nums.length; ++i) {
                let ln = await log.ln(_nums[i]);
                assertNearEqual(ln, _numlns[i], "ln(" + _nums[i].toString(10) + ") != " +  _numlns[i].toString(10));
            }
        });

        it('calc ln', async function() {
            let _nums = [
                BN(25).mul(bn10.pow(BN(17))), // 2.5
                BN(15).mul(bn10.pow(BN(18))), // 15
                BN(100500).mul(bn10.pow(BN(18))), // 100500
                BN(3).mul(bn10.pow(BN(18))), // 3
                BN(123).mul(bn10.pow(BN(18))), // 123
                BN(201).mul(bn10.pow(BN(16))), // 2.01
                BN(10).mul(bn10.pow(BN(18))), // 10
                bn10.pow(bn10).mul(bn10.pow(BN(18))) // 10**10
            ];
            let _numlns = [
                BN("916290731874155065"), // ln(2.5)
                BN("2708050201102210065"), // ln(15)
                BN("11517913006481267493"), // ln(100500)
                BN("1098612288668109691"), // ln(3)
                BN("4812184355372417495"), // ln(123)
                BN("698134722070984383"), // ln(2.01)
                BN("2302585092994045684"), // ln(10)
                BN("23025850929940456840") // ln(10^10)
            ];

            for (var i = 0; i < _nums.length; ++i) {
                let ln = await log.ln(_nums[i]);
                assertNearEqual(ln, _numlns[i], "ln(" + _nums[i].toString(10) + ") != " +  _numlns[i].toString(10));
            }
        });

        it('calc ln limits', async function() {
            let low = BN(9).mul(bn10.pow(BN(8)));
            let big = -1;

            let failLow = log.ln(low);
            await assertThrows(failLow, "Low numbers should be rejected");
            let failBig = log.ln(big);
            await assertThrows(failBig, "Big numbers should be rejected");
        });
    });
});
