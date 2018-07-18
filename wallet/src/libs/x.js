    const devp2p = require('ethereumjs-devp2p');
    const EthereumTx = require('ethereumjs-tx')
    const EthereumBlock = require('ethereumjs-block')
    const LRUCache = require('lru-cache')
    const ms = require('ms')
    const chalk = require('chalk')
    const assert = require('assert')
    const { randomBytes } = require('crypto')
    const rlp = require('rlp-encoding')
    const Buffer = require('buffer').Buffer  //add

    const PRIVATE_KEY = randomBytes(32)
    const DAO_FORK_SUPPORT = true
    const blocksCache = new LRUCache({ max: 100 })
    const CHAIN_ID = 1; //Mainnet 1, testnet 3

    const BOOTNODES = require('ethereum-common').bootstrapNodes.map((node) => {
        return {
            address: node.ip,
            udpPort: node.port,
            tcpPort: node.port
        }
    })

    const ETH_1920000 = '4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb'
    const ETH_1920000_HEADER = rlp.decode(Buffer.from('f9020da0a218e2c611f21232d857e3c8cecdcdf1f65f25a4477f98f6f47e4063807f2308a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d4934794bcdfc35b86bedf72f0cda046a3c16829a2ef41d1a0c5e389416116e3696cce82ec4533cce33efccb24ce245ae9546a4b8f0d5e9a75a07701df8e07169452554d14aadd7bfa256d4a1d0355c1d174ab373e3e2d0a3743a026cf9d9422e9dd95aedc7914db690b92bab6902f5221d62694a2fa5d065f534bb90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008638c3bf2616aa831d4c008347e7c08301482084578f7aa88d64616f2d686172642d666f726ba05b5acbf4bf305f948bd7be176047b20623e1417f75597341a059729165b9239788bede87201de42426', 'hex'))
    const ETC_1920000 = '94365e3a8c0b35089c1d1195081fe7489b528a84b22199c916180db8b28ade7f'

  
    // DPT
    const dpt = new devp2p.DPT(PRIVATE_KEY, {
        refreshInterval: 30000,
        endpoint: {
        address: '0.0.0.0',
        udpPort: null,
        tcpPort: null
        }
    })


    dpt.on('error', (err) => console.error(chalk.red(`DPT error: ${err}`)))

    // RLPx
    const rlpx = new devp2p.RLPx(PRIVATE_KEY, {
        dpt: dpt,
        maxPeers: 25,
        capabilities: [
        devp2p.ETH.eth63,
        devp2p.ETH.eth62
        ],
        listenPort: null
    })

    console.log(rlpx);
    console.log(dpt);

    const getPeerAddr = (peer) => `${peer._socket.remoteAddress}:${peer._socket.remotePort}`

    rlpx.on('error', (err) => console.error(chalk.red(`RLPx error: ${err.stack || err}`)))

    rlpx.on('peer:added', (peer) => {
        const addr = getPeerAddr(peer)
        const eth = peer.getProtocols()[0]
        const requests = { headers: [], bodies: [] }

        const clientId = peer.getHelloMessage().clientId
        console.log(chalk.green(`Add peer: ${addr} ${clientId} (eth${eth.getVersion()}) (total: ${rlpx.getPeers().length})`))

        eth.sendStatus({
        networkId: CHAIN_ID,
        td: devp2p._util.int2buffer(17179869184), // total difficulty in genesis block
        bestHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex'),
        genesisHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex')
        })

        // check DAO
        let forkDrop = null
        let forkVerified = false
        eth.once('status', () => {
        if (DAO_FORK_SUPPORT === null) return
        eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [ 1920000, 1, 0, 0 ])
        forkDrop = setTimeout(() => {
            peer.disconnect(devp2p.RLPx.DISCONNECT_REASONS.USELESS_PEER)
        }, ms('15s'))
        peer.once('close', () => clearTimeout(forkDrop))
        })

        eth.on('message', async (code, payload) => {
        console.log(`new message (${addr}) ${code} ${rlp.encode(payload).toString('hex')}`)
        console.log("CODE"+ code);
        // console.log(devp2p);
        //console.log(eth);
        switch (code) {
            case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK_HASHES:
            if (DAO_FORK_SUPPORT !== null && !forkVerified) break

            for (let item of payload) {
                const blockHash = item[0]
                if (blocksCache.has(blockHash.toString('hex'))) continue
                // console.log("BlockHash: "+JSON.stringify(blockHash));
                setTimeout(() => {

                // console.log(devp2p.ETH.MESSAGE_CODES);
                eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [ blockHash, 1, 0, 0 ])
                requests.headers.push(blockHash)
                }, ms('0.1s'))
            }
            break

            case devp2p.ETH.MESSAGE_CODES.TX:
            if (DAO_FORK_SUPPORT !== null && !forkVerified) break

            for (let item of payload) {
                const tx = new EthereumTx(item)
                //console.log(tx);
                if (isValidTx(tx)) onNewTx(tx, peer)
            }

            break

            case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS:
            const headers = []
            // hack
            if (DAO_FORK_SUPPORT && devp2p._util.buffer2int(payload[0]) === 1920000) {
                headers.push(ETH_1920000_HEADER)
            }

            eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS, headers)
            break

            case devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS:
            if (DAO_FORK_SUPPORT !== null && !forkVerified) {
                if (payload.length !== 1) {
                console.log(`${addr} expected one header for DAO fork verify (received: ${payload.length})`)
                break
                }

                const expectedHash = DAO_FORK_SUPPORT ? ETH_1920000 : ETC_1920000
                const header = new EthereumBlock.Header(payload[0])
                if (header.hash().toString('hex') === expectedHash) {
                console.log(`${addr} verified to be on the same side of the DAO fork`)
                clearTimeout(forkDrop)
                forkVerified = true
                }
            } else {
                if (payload.length > 1) {
                console.log(`${addr} not more than one block header expected (received: ${payload.length})`)
                break
                }

                let isValidPayload = false
                const header = new EthereumBlock.Header(payload[0])
                while (requests.headers.length > 0) {
                const blockHash = requests.headers.shift()
                if (header.hash().equals(blockHash)) {
                    isValidPayload = true
                    setTimeout(() => {
                    eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES, [ blockHash ])
                    requests.bodies.push(header)
                    }, ms('0.1s'))
                    break
                }
                }

                if (!isValidPayload) {
                console.log(`${addr} received wrong block header ${header.hash().toString('hex')}`)
                }
            }

            break

            case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES:
            eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES, [])
            break

            case devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES:
            if (DAO_FORK_SUPPORT !== null && !forkVerified) break

            if (payload.length !== 1) {
                console.log(`${addr} not more than one block body expected (received: ${payload.length})`)
                break
            }

            let isValidPayload = false
            while (requests.bodies.length > 0) {
                const header = requests.bodies.shift()
                const block = new EthereumBlock([header.raw, payload[0][0], payload[0][1]])
                const isValid = await isValidBlock(block)
                if (isValid) {
                isValidPayload = true
                onNewBlock(block, peer)
                break
                }
            }

            if (!isValidPayload) {
                console.log(`${addr} received wrong block body`)
            }

            break

            case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK:
            if (DAO_FORK_SUPPORT !== null && !forkVerified) break

            const newBlock = new EthereumBlock(payload[0])
            const isValidNewBlock = await isValidBlock(newBlock)
            if (isValidNewBlock) onNewBlock(newBlock, peer)

            break

            case devp2p.ETH.MESSAGE_CODES.GET_NODE_DATA:
            eth.sendMessage(devp2p.ETH.MESSAGE_CODES.NODE_DATA, [])
            break

            case devp2p.ETH.MESSAGE_CODES.NODE_DATA:
            break

            case devp2p.ETH.MESSAGE_CODES.GET_RECEIPTS:
            eth.sendMessage(devp2p.ETH.MESSAGE_CODES.RECEIPTS, [])
            break

            case devp2p.ETH.MESSAGE_CODES.RECEIPTS:
            break
        }
        })


        /*var rawtx="f886808203e8830186a094d3cda913deb6f67967b99d67acdfa1712c29360180a47f74657374320000000000000000000000000000000000000000000000000000006000571ca0936dd49515125169c3e05e928b41ca93c53de2f22092b07c294aadd174412455a0741734ea413a194ec0db1d81379f14d0119b1dc2268b17ea38f31d0316cb279d";
        let raw2 = "f86902843b9aca008255f094e961c9ad41f8a7722eadf856fb326d626613b8f1860da475abf000801ca032522b002bdb933e42de5bef7d553dfdd4e25cf6e701f15763017a1c0c591738a008c650f1ab2d68523aff2029d48f9637a1f44ab5b1bd0d4c90ed34e9637838d1"
        eth.sendMessage(devp2p.ETH.MESSAGE_CODES.TX, [raw2]);
        console.log(eth.sendMessage(devp2p.ETH.MESSAGE_CODES.TX, [raw2]));*/
        

    })

    rlpx.on('peer:removed', (peer, reason, disconnectWe) => {
        const who = disconnectWe ? 'we disconnect' : 'peer disconnect'
        const total = rlpx.getPeers().length
        console.log(chalk.yellow(`Remove peer: ${getPeerAddr(peer)} (${who}, reason code: ${String(reason)}) (total: ${total})`))
    })

    rlpx.on('peer:error', (peer, err) => {
        if (err.code === 'ECONNRESET') return

        if (err instanceof assert.AssertionError) {
        const peerId = peer.getId()
        if (peerId !== null) dpt.banPeer(peerId, ms('5m'))

        console.error(chalk.red(`Peer error (${getPeerAddr(peer)}): ${err.message}`))
        return
        }

        console.error(chalk.red(`Peer error (${getPeerAddr(peer)}): ${err.stack || err}`))
    })

    // uncomment, if you want accept incoming connections
    rlpx.listen(30304, '0.0.0.0')
    dpt.bind(30304, '0.0.0.0')


    for (let bootnode of BOOTNODES) {
        dpt.bootstrap(bootnode).catch((err) => {
        console.error(chalk.bold.red(`DPT bootstrap error: ${err.stack || err}`))
        })
    }

    // connect to local ethereum node (debug)

    dpt.addPeer({ address: '127.0.0.1', udpPort: 30303, tcpPort: 30303 })
        .then((peer) => {
        return rlpx.connect({
            id: peer.id,
            address: peer.address,
            port: peer.tcpPort
        })
        })
        .catch((err) => console.log(`error on connection to local node: ${err.stack || err}`))


    const txCache = new LRUCache({ max: 1000 })

    setInterval(() => {
        const peersCount = dpt.getPeers().length
        const openSlots = rlpx._getOpenSlots()
        const queueLength = rlpx._peersQueue.length
        const queueLength2 = rlpx._peersQueue.filter((o) => o.ts <= Date.now()).length
        

        console.log(chalk.yellow(`Total nodes in DPT: ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`))
    }, ms('30s'))

    //private static methods that can be used internally

    function isValidTx (tx) {
        return tx.validate(false)
      }
    async function isValidBlock (block) {
        if (!block.validateUnclesHash()) return false
        if (!block.transactions.every(isValidTx)) return false
        return new Promise((resolve, reject) => {
          block.genTxTrie(() => {
            try {
              resolve(block.validateTransactionsTrie())
            } catch (err) {
              reject(err)
            }
          })
        })
      }
    function onNewTx (tx, peer) {
        const txHashHex = tx.hash().toString('hex')
        //console.log(tx.toJSON());
        if (txCache.has(txHashHex)) return

        txCache.set(txHashHex, true)
        //console.log(`new tx: ${txHashHex} (from ${getPeerAddr(peer)})`)
    }
    
    function onNewBlock (block, peer) {
        const blockHashHex = block.hash().toString('hex')
        console.log("Block : "+blockHashHex);
        if (blocksCache.has(blockHashHex)) return

        blocksCache.set(blockHashHex, true)
        console.log(`new block: ${blockHashHex} (from ${getPeerAddr(peer)})`)
        for (let tx of block.transactions) onNewTx(tx, peer)
    }

    //Define SomeClass (js uses functions as class constructors, utilized with the "new" keyword)

 
    //create a public static method for SomeClass
    exports.getPeers = function() {
        return rlpx.getPeers();
    }
    exports.sendTx = function(raw) {
        var dataAcc = raw;        
        rlpx.getPeers().forEach(function(element) {
            console.log("ELEMENT", element);
            const eth2 = element.getProtocols()[0];
            console.log("pruebaaaaaaa")  
            eth2.sendMessage(devp2p.ETH.MESSAGE_CODES.TX, [dataAcc]);
        });
    }
