const crypto = require("crypto");
const {
  Block: BlockModel,
  Transaction: TransactionModel,
} = require("./database");

class Block {
  constructor(
    index,
    timestamp,
    miner,
    transactions,
    previousHash = "",
    reward = 3.125,
    difficulty = 4
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.miner = miner;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.reward = reward;
    this.hash = this.calculateHash();
    this.nonce = 0;
    this.difficulty = difficulty;
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          this.miner +
          JSON.stringify(this.transactions) +
          this.nonce
      )
      .digest("hex");
  }

  mineBlock() {
    while (
      this.hash.substring(0, this.difficulty) !==
      Array(this.difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }

  async save() {
    const blockRecord = await BlockModel.create({
      index: this.index,
      timestamp: this.timestamp,
      miner: this.miner,
      previousHash: this.previousHash,
      hash: this.hash,
      nonce: this.nonce,
      reward: this.reward,
    });

    for (const transaction of this.transactions) {
      const transactionId = crypto.randomUUID(); // Generate a unique ID for the transaction
      const identifier = `TX-${Date.now()}-${transactionId}`; // Create a unique identifier

      await TransactionModel.create({
        type: transaction.type,
        identifier,
        sender: transaction.sender,
        recipient: transaction.recipient,
        amount: transaction.amount,
        data: transaction.data,
        blockId: blockRecord.id,
      });
    }
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.miningReward = 3.125;
  }

  createGenesisBlock() {
    return new Block(
      0,
      Date.now().toString(),
      "genesis",
      [],
      "0",
      this.miningReward,
      this.difficulty
    );
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  async createTransaction(transaction) {
    const transactionId = crypto.randomUUID(); // Generate a unique ID for the transaction

    let _transaction = transaction;
    // _transaction.id = transactionId; // Assign the ID to the transaction object
    _transaction.identifier = `TX-${Date.now()}-${transactionId}`; // Create a unique identifier
    this.pendingTransactions.push(_transaction);
    return { transaction, transactionId }; // Return the transaction and transaction ID
  }

  async mineSpecificTransaction(minerAddress, transactionId) {
    console.log("transactionId: ", transactionId);
    // Filter to find the specific transaction by ID
    const transactionToMine = this.pendingTransactions.find(
      (tx) => tx.identifier === transactionId
    );

    if (!transactionToMine) {
      throw new Error("Transaction not found in pending transactions.");
    }

    // Remove the specific transaction from pending transactions
    this.pendingTransactions = this.pendingTransactions.filter(
      (tx) => tx.id !== transactionId
    );

    // Add mining reward transaction
    const rewardTx = {
      id: crypto.randomUUID(),
      type: "reward",
      sender: null,
      recipient: minerAddress,
      amount: this.miningReward,
      data: { description: "Block Reward" },
    };

    const block = new Block(
      this.chain.length,
      Date.now().toString(),
      minerAddress,
      [transactionToMine, rewardTx], // Mine the specific transaction with the reward transaction
      this.getLatestBlock().hash,
      this.miningReward,
      this.difficulty
    );

    block.mineBlock();

    await block.save();
    this.chain.push(block);
    return block;
  }

  async minePendingTransactions(minerAddress) {
    console.log("--minePendingTransactions--");
    const validTransactions = [];
    console.log("pending transactions: ", this.pendingTransactions);

    // Validate each transaction by checking the order/status API
    for (const transaction of this.pendingTransactions) {
      try {
        const isValid = await this.validateTransactionAcrossMiners(transaction);
        console.log("isValid: ", isValid);
        if (isValid) {
          validTransactions.push(transaction);
        }
      } catch (error) {
        console.error(
          `Error validating transaction ${transaction.identifier}:`,
          error
        );
      }
    }

    if (validTransactions.length === 0) {
      console.log("No valid transactions to mine.");
      return;
    } else {
      const transactionCount = validTransactions.length;

      let block = new Block({
        timestamp: Date.now().toString(),
        transactions: validTransactions,
        previousHash: this.getLatestBlock().hash,
        successfulMinedTransactions: transactionCount, // Set the count here
      });

      block.mineBlock(this.difficulty);
      console.log("Block successfully mined!");

      // Save the block to the database using the Sequelize model
      const savedBlock = await BlockModel.create({
        index: block.index,
        timestamp: block.timestamp,
        miner: minerAddress,
        previousHash: block.previousHash,
        hash: block.hash,
        nonce: block.nonce,
        reward: this.miningReward,
        successfulMinedTransactions: transactionCount, // Save successful transactions count
      });

      // Associate valid transactions with the block
      for (const transaction of validTransactions) {
        await TransactionModel.create({
          identifier: transaction.identifier,
          type: transaction.type,
          sender: transaction.sender,
          recipient: transaction.recipient,
          amount: transaction.amount,
          data: transaction.data,
          blockId: savedBlock.id,
        });
      }

      this.chain.push(block);

      // Reset pending transactions and add the mining reward transaction
      this.pendingTransactions = [
        {
          type: "reward",
          sender: null,
          recipient: minerAddress,
          amount: this.miningReward,
          data: { description: "Block Reward" },
        },
      ];
    }
  }

  async validateTransactionAcrossMiners(transaction) {
    console.log("--validateTransactionAcrossMiners--");
    console.log(transaction);
    // Make a call to your order/status API or other validation mechanism here
    try {
      const response = await fetch(
        `http://safeblockcom.test/v1/order/status/${transaction.data?.orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log("data: ", data);
      return data.status === 200; // Assuming the API returns a status field
    } catch (error) {
      console.error("Error validating transaction:", error);
      return false;
    }
  }

  async getBalanceOfAddress(address) {
    let balance = 0;
    const blocks = await BlockModel.findAll({
      include: TransactionModel,
      order: [["index", "ASC"]],
    });

    for (const block of blocks) {
      for (const trans of block.Transactions) {
        if (trans.sender === address) {
          balance -= trans.amount;
        }

        if (trans.recipient === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
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
