const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    poNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    SupplierId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'received', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
    },
    totalPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    expectedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receivedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = PurchaseOrder;
