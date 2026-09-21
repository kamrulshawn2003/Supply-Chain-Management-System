const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ReturnRequest = sequelize.define('ReturnRequest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    OrderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
        allowNull: false,
        defaultValue: 'pending'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    handledBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    handledAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = ReturnRequest;
