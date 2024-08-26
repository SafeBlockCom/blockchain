const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
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
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  Block.associate = (models) => {
    Block.hasMany(models.Transaction, { foreignKey: "blockId" });
  };

  return Block;
};
