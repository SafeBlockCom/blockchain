const crypto = require("crypto");
const {
  Block: BlockModel,
  Transaction: TransactionModel,
  TransactionMinedBlockIds: TransactionMinedBlockIdsModel,
  Miner: MinerModel,
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
    transaction.identifier = `TX-${Date.now()}-${transactionId}`; // Create a unique identifier
    console.log(transaction);
    // Save the transaction to the database using Sequelize
    const savedTransaction = await TransactionModel.create({
      identifier: `TX-${Date.now()}-${transactionId}`,
      type: transaction.type,
      sender: transaction.sender,
      recipient: transaction.recipient,
      amount: transaction.amount,
      data: transaction.data,
      blockId: null, // This will be updated once the transaction is mined
    });

    return { transaction: savedTransaction, transactionId };
  }

  async registerOrUpdateMiner(
    minerAddress,
    nonce,
    successfulMinedTransactions,
    reward
  ) {
    const [miner, created] = await MinerModel.findOrCreate({
      where: { minerAddress },
      defaults: {
        nonce,
        successfulMinedTransactions,
        reward,
      },
    });

    if (!created) {
      // Update the existing miner's record if they already exist
      miner.nonce += nonce;
      miner.successfulMinedTransactions += successfulMinedTransactions;
      miner.reward += reward;
      await miner.save();
    }

    return miner;
  }

  async minePendingTransactions(minerAddress) {
    console.log("--minePendingTransactions--");
    console.log("minerAddress: ", minerAddress);

    // Find transactions where there is no blockId listed for the given miner in TransactionMinedBlockIds
    const pendingTransactionsFromDb = await TransactionModel.findAll({
      where: {
        blockId: null,
      },
      include: [
        {
          model: TransactionMinedBlockIdsModel,
          required: false,
          where: {
            minerAddress: minerAddress,
          },
        },
      ],
    });

    const validTransactions = pendingTransactionsFromDb.filter(
      (transaction) => !transaction.TransactionMinedBlockIdsModel
    );

    console.log("Valid transactions from database:", validTransactions.length);

    if (validTransactions.length === 0) {
      console.log("No transactions to mine.");
      return;
    }

    // Mine a new block if there are valid transactions
    const transactionCount = validTransactions.length;

    let block = new Block(
      this.chain.length, // index
      Date.now().toString(), // timestamp
      minerAddress, // miner
      validTransactions, // transactions
      this.getLatestBlock().hash, // previousHash
      this.miningReward, // reward
      this.difficulty // difficulty
    );

    block.mineBlock(this.difficulty);
    console.log("Block successfully mined!");

    // Save the block to the database using the Sequelize model
    const savedBlock = await BlockModel.create({
      index: block.index,
      timestamp: block.timestamp,
      miner: block.miner,
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      reward: block.reward,
      successfulMinedTransactions: transactionCount, // Save successful transactions count
    });

    // Associate valid transactions with the block and update the database
    for (const transaction of validTransactions) {
      // transaction.blockId = savedBlock.id;
      // await transaction.save();

      // Record the mining details
      await TransactionMinedBlockIdsModel.create({
        transactionId: transaction.id,
        blockId: savedBlock.id,
        minerAddress: minerAddress,
      });
    }

    this.chain.push(block);

    // Register or update the miner's information after all transactions are mined
    await this.registerOrUpdateMiner(
      minerAddress,
      block.nonce,
      transactionCount,
      block.reward
    );

    console.log("Mining process completed and block saved to the database.");
  }

  async validateTransactionAcrossMiners(transaction) {
    console.log("--validateTransactionAcrossMiners--");

    console.log(
      `transaction with ref: ${transaction.identifier} has data: ${
        transaction.data
      } with type  ${typeof transaction.data}`
    );
    // const parsedData = JSON.parse(transaction.data);
    // const orderId = parsedData?.orderId;
    /*
    try {
      const response = await fetch(
        `http://safeblockcom.test/v1/order/status/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("data: ", data);
      return data;
    } catch (error) {
      console.error("Error validating transaction:", error);
      return false;
    }
    */
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
