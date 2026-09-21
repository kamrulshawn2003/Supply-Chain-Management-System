const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inventory = sequelize.define('Inventory', {
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    lowStockThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['productId', 'warehouseId']
        }
    ]
});

module.exports = Inventory;
