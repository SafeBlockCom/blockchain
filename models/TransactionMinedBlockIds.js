const { DataTypes } = require("sequelize");
const sequelize = require("./database"); // Adjust the path to your Sequelize instance

const TransactionMinedBlockIds = sequelize.define(
  "TransactionMinedBlockIds",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    blockId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    minerAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["transactionId", "minerAddress"],
      },
    ],
  }
);

module.exports = TransactionMinedBlockIds;
