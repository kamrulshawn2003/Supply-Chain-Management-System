const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    details: {
        type: DataTypes.JSON,
        allowNull: true
    },
    performedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = AuditLog;
