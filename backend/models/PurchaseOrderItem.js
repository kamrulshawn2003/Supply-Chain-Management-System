const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    PurchaseOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ProductId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unitPrice: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    lineTotal: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

module.exports = PurchaseOrderItem;
