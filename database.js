const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// Initialize Sequelize
const sequelize = new Sequelize(
  "u650424307_bchain_safe",
  "u650424307_bchain_safe",
  "&Dp]tHL9Wy",
  {
    host: "srv1478.hstgr.io", // Replace with your database server address if not localhost
    dialect: "mysql", // or 'mariadb'
    logging: console.log,
    define: {
      charset: "utf8",
      collate: "utf8_general_ci",
    },
  }
);

// Define the Block model
const Block = sequelize.define("Block", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
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
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

// Define the Transaction model
const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  identifier: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  blockId: {
    type: DataTypes.UUID,
    references: {
      model: Block,
      key: "id",
    },
  },
});

// Define the TransactionMinedBlockIds model
const TransactionMinedBlockIds = sequelize.define("TransactionMinedBlockIds", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Transaction,
      key: "id",
    },
  },
  blockId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Block,
      key: "id",
    },
  },
  minerAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define the Miner model
const Miner = sequelize.define("Miner", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  minerAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nonce: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  successfulMinedTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reward: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define relationships
Block.hasMany(Transaction, { foreignKey: "blockId" });
Transaction.belongsTo(Block, { foreignKey: "blockId" });

Transaction.hasMany(TransactionMinedBlockIds, { foreignKey: "transactionId" });
TransactionMinedBlockIds.belongsTo(Transaction, {
  foreignKey: "transactionId",
});

Block.hasMany(TransactionMinedBlockIds, { foreignKey: "blockId" });
TransactionMinedBlockIds.belongsTo(Block, { foreignKey: "blockId" });

// Force sync the database
// sequelize.sync({ force: true }).then(() => {
//   console.log("Database & tables created!");
// });

module.exports = {
  Block,
  Transaction,
  Miner,
  TransactionMinedBlockIds,
  sequelize,
};
