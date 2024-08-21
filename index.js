const express = require("express");
const bodyParser = require("body-parser");
const { Blockchain, Block } = require("./blockchain");

const app = express();
app.use(bodyParser.json());

const ecommerceBlockchain = new Blockchain();

app.get("/blockchain", async (req, res) => {
  try {
    const blocks = await ecommerceBlockchain.getAllBlocks();
    res.json(blocks);
  } catch (error) {
    res.status(500).send("An error occurred while retrieving the blockchain.");
  }
});
app.post("/addPaymentBlock", async (req, res) => {
  const { paymentValidation } = req.body;

  if (paymentValidation.isValid) {
    const paymentData = paymentValidation.data;

    // Step 3: Create a new block with the payment data
    const newBlock = new Block(
      ecommerceBlockchain.chain.length,
      Date.now().toString(),
      paymentData
    );

    await ecommerceBlockchain.addBlock(newBlock);
    res.send(newBlock);
  } else {
    res.status(400).send({ error: "Invalid payment or payment not confirmed" });
  }
});

app.post("/addBlock", async (req, res) => {
  const { data } = req.body;
  const newBlock = new Block(
    ecommerceBlockchain.chain.length,
    Date.now().toString(),
    data
  );
  await ecommerceBlockchain.addBlock(newBlock);
  res.send(newBlock);
});

app.get("/validate", async (req, res) => {
  const isValid = await ecommerceBlockchain.isChainValid();
  res.send({ isValid });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
