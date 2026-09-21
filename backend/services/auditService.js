const { AuditLog } = require('../models');

exports.log = async ({ action, entityType, entityId, details, performedBy, transaction }) => {
    return AuditLog.create({
        action,
        entityType,
        entityId,
        details,
        performedBy
    }, { transaction });
};
