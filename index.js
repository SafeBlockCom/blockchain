const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Blockchain } = require("./blockchain");
const { sequelize } = require("./database");

const app = express();
require("dotenv").config();
app.use(bodyParser.json());
// Enable CORS for all routes
app.use(cors());

const ecommerceBlockchain = new Blockchain();

// Route to add a new transaction (for both registration and order management)
app.post("/addTransaction", async (req, res) => {
  const { type, sender, recipient, amount, data } = req.body;
  let transaction = await ecommerceBlockchain.createTransaction({
    type,
    sender,
    recipient,
    amount,
    data,
  });
  res.send({
    message: "Transaction added successfully.",
    data: transaction,
  });
});

// Route to mine pending transactions
app.post("/minePendingTransactions", async (req, res) => {
  console.log("api endpoint minePendingTransactions");
  console.log(req.body);
  const { minerAddress } = req.body;
  let _res = await ecommerceBlockchain.minePendingTransactions(minerAddress);

  const blocks = await sequelize.models.Block.findAll({
    include: sequelize.models.Transaction,
    order: [["index", "ASC"]],
  });
  res.send({ message: "Block mined successfully.", data: [blocks, _res] });
});

app.get("/blockchain", cors(), async (req, res) => {
  try {
    const blocks = await sequelize.models.Block.findAll({
      include: [
        {
          model: sequelize.models.TransactionMinedBlockIds,
          as: "MinedBlockIds",
          required: true,
          include: [
            {
              model: sequelize.models.Transaction,
              as: "Transaction",
              required: true,
            },
          ],
        },
      ],
      order: [["index", "ASC"]],
    });

    // Transform the blocks data into the desired format
    const formattedBlocks = blocks.map((block, index) => {
      // Determine if the block is the first block (head)
      const isHead = index === 0;

      // Determine if the block is the last block (isLast)
      const isLast = index === blocks.length - 1;

      // Flatten and collect all transactions from the MinedBlockIds
      const transactions = block.MinedBlockIds.flatMap((minedBlockId) =>
        minedBlockId.Transaction
          ? {
              sender: { publicKey: minedBlockId.Transaction.sender || "0" },
              receiver: minedBlockId.Transaction.recipient,
              receiverAddress:
                minedBlockId.Transaction.recipientAddress || "N/A",
              amount: minedBlockId.Transaction.amount,
            }
          : []
      );

      // Determine if the block has the maximum number of transactions (isLongest)
      const maxTransactions = Math.max(
        ...blocks.map((b) =>
          b.MinedBlockIds.reduce(
            (count, minedBlockId) => count + (minedBlockId.Transaction ? 1 : 0),
            0
          )
        )
      );
      const isLongest = transactions.length === maxTransactions;

      return {
        number: block.index, // Assuming 'index' is equivalent to 'number'
        timestamp: block.timestamp, // Use correct field for timestamp
        miner: block.miner, // Assuming 'miner' is directly available
        head: isHead, // Mark as head if it's the first block
        isLast: isLast, // Mark as isLast if it's the last block
        isLongest: isLongest, // Mark isLongest if it has the max number of transactions
        transactions: transactions, // List of transactions formatted
        previousHash: block.previousHash, // Assuming 'previousHash' is available
        nonce: block.nonce, // Assuming 'nonce' is directly available
        hash: block.hash, // Assuming 'hash' is directly available
        valid: block.valid || true, // Adjust based on your logic for validity
      };
    });

    res.send({ message: "Blockchain is ready.", data: formattedBlocks });
  } catch (error) {
    console.error("Error fetching blockchain data:", error);
    res.status(500).send({ message: "Error fetching blockchain data." });
  }
});

// Route to validate the blockchain
app.get("/validate", async (req, res) => {
  const isValid = ecommerceBlockchain.isChainValid();
  res.send({ isValid });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
