const { Sequelize, DataTypes } = require("sequelize");

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "blockchain.db",
});

// Define the Block model
const Block = sequelize.define("Block", {
  index: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  miner: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  previousHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nonce: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reward: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  successfulMinedTransactions: {
    // New field to track successful transactions
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0, // Default to 0 if not provided
  },
});

// Define the Transaction model with a flexible data field
const Transaction = sequelize.define("Transaction", {
  identifier: {
    type: DataTypes.STRING,
    allowNull: false, // Ensure every transaction has an identifier
    unique: true, // Enforce uniqueness constraint
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false, // e.g., "registration" or "order"
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: true, // Could be null for registration or reward transactions
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false, // Recipient of the transaction
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false, // To store dynamic data such as registration details or order details
  },
  blockId: {
    type: DataTypes.INTEGER,
    references: {
      model: Block,
      key: "id",
    },
  },
});

// Define relationships
Block.hasMany(Transaction, { foreignKey: "blockId" });
Transaction.belongsTo(Block, { foreignKey: "blockId" });

// Force sync the database
sequelize.sync({ force: true }).then(() => {
  console.log("Database & tables created!");
});

module.exports = { Block, Transaction, sequelize };
