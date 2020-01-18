//Dependencies
const SHA256 = require('crypto-js/sha256');
const level = require('level');
const Block = require('./block');

const chainDB = './chainData';

let db = level(chainDB);

class BlockChain {
    constructor() {
        //Genesis block creation
        this.createGenesisBlock();
    }

    createGenesisBlock() {
        this.addBlock(new Block('Genesis Block'));
    }

    async addBlock(block) {

        //Block details
        block.height = await this.getBlockHeight();
        block.time = new Date().getTime().toString();

        if (block.height > 0) {
            let prev = await this.getBlock(block.height - 1);
            block.previousBlockHash = prev.hash;
        }
        else
            block.previousBlockHash = ''; //Genesis block only

        block.hash = SHA256(JSON.stringify(block)).toString();

        await this.addBlockToDB(block.height, JSON.stringify(block));
    }

    //Validation functionality

    validateBlock(block) {
        const blockHash = block.hash;
        block.hash = '';

        const checkHash = SHA256(JSON.stringify(block)).toString();

        if (checkHash !== blockHash)
            return false;
        else
            return true;
    }

    async validateChain() {
        let errorLogs;
        let previousHash = '';
        let block;
        const height = await this.getBlockHeight();

        for (let i = 0; i < height; i++) {
            block = await this.getBlock(i);

            if (!this.validateBlock(block))
                errorLogs.push(i);
            else {
                if (block.hash !== previousHash)
                    errorLogs.push(i);
            }

            previousHash = block.hash;

            if (i == height - 1) {
                if (errorLogs.length > 0) {
                    console.log(`Errors in: ${errorLogs.length} blocks`);
                    console.log(`Blocks: ${errorLogs}`);
                }
            }
        }

    }

    //Data persistence mechanism

    addBlockToDB(key, value) {
        return new Promise(function (resolve, reject) {
            db.put(key, value, function (err) {
                if (err)
                    reject(err);
                else {
                    console.log("Block #", key, " added successfully!");
                    resolve("Block #", key, " added successfully!");
                }
            })
        })
    }

    getBlock(key) {
        return new Promise(function (resolve, reject) {
            db.get(key, function (err, value) {
                if (err)
                    reject(err);
                else
                    resolve(JSON.parse(value));
            })
        });
    }

    getBlockHeight() {

        return new Promise(function (resolve, reject) {
            let height = 0;

            db.createReadStream()
                .on('data', function (data) {
                    height++;
                })
                .on('error', function (err) {
                    reject(err);
                })
                .on('close', function () {
                    resolve(height);
                });
        });

    }
}

//Make Blockchain
let blockchain = new BlockChain();

//Add Blocks
(function theLoop (i) {
    setTimeout(() => {
      blockchain.addBlock(new Block(`Test data ${i}`)).then(() => {
        if (--i) {
          theLoop(i)
        }
      })
    }, 250);
  })(9);
 
//UN-COMMENT FOR VALIDATION CHECK
//blockchain.validateChain();

//UN-COMMENT TO DISPLAY THE BLOCKS
//Chain display
// console.log("Complete Chain: ");

// db.createReadStream()
//     .on('data', function (data) {
//         console.log(data.key, '=', JSON.parse(data.value))
//     })
//     .on('error', function (err) {
//         console.log('Oh my!', err)
//     })
//     .on('close', function () {
//         console.log('Stream closed')
//     })
//     .on('end', function () {
//         console.log('Stream ended')
//     })