module.exports = {
    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
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
            gas: 6000000,
            gasPrice: 100
        }
    }
};
