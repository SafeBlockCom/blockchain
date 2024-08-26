const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Transaction = sequelize.define("Transaction", {
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
      type: DataTypes.INTEGER,
      references: {
        model: "Block",
        key: "id",
      },
    },
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Block, { foreignKey: "blockId" });
  };

  return Transaction;
};
