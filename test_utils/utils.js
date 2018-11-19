let denominationUnit = "szabo";
exports.money = function money(number) {
    let bnNumber = web3.utils.toBN(number);
    return web3.utils.toWei(bnNumber, denominationUnit);
}

exports.BN = function BN(number) {
	return web3.utils.toBN(number);
}

exports.lastBlockTime =  async function lastBlockTime() {
    let block = await web3.eth.getBlock('latest');
	return block.timestamp;
}

exports.assertThrows = function assertThrows(promise, message) {
    return promise.then(() => {
        assert.isNotOk(true, message)
    }).catch((e) => {
        assert.include(e.message, 'VM Exception')
    });
}
