const express = require("express");
const bodyParser = require("body-parser");
const { Blockchain } = require("./blockchain");
const { sequelize } = require("./database");

const app = express();
require("dotenv").config();
app.use(bodyParser.json());

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

// Route to get the blockchain
app.get("/blockchain", async (req, res) => {
  const blocks = await sequelize.models.Block.findAll({
    include: sequelize.models.Transaction,
    order: [["index", "ASC"]],
  });
  res.json(blocks);
});

// Route to validate the blockchain
app.get("/validate", async (req, res) => {
  const isValid = ecommerceBlockchain.isChainValid();
  res.send({ isValid });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
