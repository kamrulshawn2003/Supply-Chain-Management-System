const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM(
            'admin',
            'supplier',
            'warehouse_manager',
            'customer',
            'driver'
        ),
        allowNull: false,
        defaultValue: 'customer'
    },
    warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    supplierId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = User;
