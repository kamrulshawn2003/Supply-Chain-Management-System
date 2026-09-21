const hasTable = async (queryInterface, tableName) => {
    const tables = await queryInterface.showAllTables();
    return tables.map((table) => typeof table === 'object' ? table.tableName : table).includes(tableName);
};

module.exports = {
    async up(queryInterface, DataTypes) {
        if (!(await hasTable(queryInterface, 'PurchaseOrders'))) {
            await queryInterface.createTable('PurchaseOrders', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                poNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
                SupplierId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Suppliers', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                warehouseId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Warehouses', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                status: {
                    type: DataTypes.ENUM('draft', 'pending', 'approved', 'received', 'cancelled'),
                    allowNull: false,
                    defaultValue: 'draft'
                },
                totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
                expectedDate: { type: DataTypes.DATEONLY, allowNull: true },
                notes: { type: DataTypes.TEXT, allowNull: true },
                createdBy: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                receivedAt: { type: DataTypes.DATE, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }

        if (!(await hasTable(queryInterface, 'PurchaseOrderItems'))) {
            await queryInterface.createTable('PurchaseOrderItems', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                PurchaseOrderId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'PurchaseOrders', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                ProductId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Products', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                quantity: { type: DataTypes.INTEGER, allowNull: false },
                unitPrice: { type: DataTypes.FLOAT, allowNull: false },
                lineTotal: { type: DataTypes.FLOAT, allowNull: false },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }

        if (!(await hasTable(queryInterface, 'ReturnRequests'))) {
            await queryInterface.createTable('ReturnRequests', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                OrderId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Orders', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                productId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Products', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                quantity: { type: DataTypes.INTEGER, allowNull: false },
                reason: { type: DataTypes.TEXT, allowNull: false },
                status: {
                    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
                    allowNull: false,
                    defaultValue: 'pending'
                },
                createdBy: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                handledBy: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: { model: 'Users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                handledAt: { type: DataTypes.DATE, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }

        if (!(await hasTable(queryInterface, 'Notifications'))) {
            await queryInterface.createTable('Notifications', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                type: { type: DataTypes.STRING, allowNull: false },
                title: { type: DataTypes.STRING, allowNull: false },
                message: { type: DataTypes.TEXT, allowNull: false },
                link: { type: DataTypes.STRING, allowNull: true },
                read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
                readAt: { type: DataTypes.DATE, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }
    }
};
