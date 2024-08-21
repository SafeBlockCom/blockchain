const { Sequelize, DataTypes } = require("sequelize");

// Create a new instance of Sequelize and connect to an SQLite database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "ecommerce-blockchain.db",
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
  data: {
    type: DataTypes.JSON,
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
});

// Synchronize the models with the database
sequelize.sync();

module.exports = { Block, sequelize };
