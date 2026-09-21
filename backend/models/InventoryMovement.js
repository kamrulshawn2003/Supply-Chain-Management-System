const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventoryMovement = sequelize.define('InventoryMovement', {
    type: {
        type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT'),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    beforeQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    afterQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    referenceType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    performedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = InventoryMovement;
