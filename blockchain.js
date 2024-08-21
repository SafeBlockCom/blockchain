const crypto = require("crypto");
const { Block: BlockModel } = require("./database");

class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.data)
      )
      .digest("hex");
  }

  async save() {
    // Save the block into the database
    await BlockModel.create({
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      hash: this.hash,
    });
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, Date.now().toString(), "Genesis Block", "0");
  }

  async getAllBlocks() {
    // Retrieve all blocks from the database
    const blocks = await BlockModel.findAll({ order: [["index", "ASC"]] });

    // Format the blocks as an array of objects
    return blocks.map((block) => ({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash,
      hash: block.hash,
    }));
  }

  async getLatestBlock() {
    // Get the latest block from the database
    const latestBlock = await BlockModel.findOne({
      order: [["index", "DESC"]],
    });
    if (latestBlock) {
      return new Block(
        latestBlock.index,
        latestBlock.timestamp,
        latestBlock.data,
        latestBlock.previousHash
      );
    }
    return this.chain[0];
  }

  async addBlock(newBlock) {
    const latestBlock = await this.getLatestBlock();
    newBlock.previousHash = latestBlock.hash;
    newBlock.hash = newBlock.calculateHash();
    await newBlock.save();
  }

  async getAllBlocks() {
    // Retrieve all blocks from the database
    const blocks = await BlockModel.findAll({ order: [["index", "ASC"]] });
    return blocks;
  }

  async isChainValid() {
    const blocks = await this.getAllBlocks();
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      if (
        currentBlock.hash !==
        crypto
          .createHash("sha256")
          .update(
            currentBlock.index +
              currentBlock.previousHash +
              currentBlock.timestamp +
              JSON.stringify(currentBlock.data)
          )
          .digest("hex")
      ) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

module.exports = { Blockchain, Block };
