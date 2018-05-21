#!/bin/bash

# Starts geth on current folder (geth should be initialized)
# And unlocks first account wit password provided as command line argument
# Also starts console cli and starts mining in 1 thread
# Logs are located in $GETH_LOGFILE

GETH_ACCOUNT="$(geth --datadir=./chaindata account list | grep -m 1 "Account" | awk '{print substr($3, 2, length($3) - 2)}')"
GETH_PASSWORD=${1}
GETH_LOGFILE=/tmp/geth.log

echo $GETH_PASSWORD >/tmp/geth_password.txt
geth console --datadir=./chaindata \
	 --rpc \
	 --rpcapi eth,web3,personal,miner,admin,net,debug \
	 --unlock $GETH_ACCOUNT \
	 --password /tmp/geth_password.txt \
	 --mine \
	 --networkid 15 \
	 --minerthreads 1 \
	 --rpccorsdomain "*" \
	 2>$GETH_LOGFILE
