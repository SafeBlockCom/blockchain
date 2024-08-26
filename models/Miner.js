const { DataTypes } = require("sequelize");
const sequelize = require("./database"); // Adjust the path to your Sequelize instance

const Miner = sequelize.define(
  "Miner",
  {
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
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = Miner;
