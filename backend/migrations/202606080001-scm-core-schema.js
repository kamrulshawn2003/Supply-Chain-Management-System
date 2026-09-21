const hasTable = async (queryInterface, tableName) => {
    const tables = await queryInterface.showAllTables();
    return tables.map((table) => typeof table === 'object' ? table.tableName : table).includes(tableName);
};

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
    const table = await queryInterface.describeTable(tableName).catch(() => null);
    if (table && !table[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
};

const addIndexIfMissing = async (queryInterface, tableName, fields, options) => {
    const indexes = await queryInterface.showIndex(tableName).catch(() => []);
    const exists = indexes.some((index) => {
        const indexFields = index.fields.map((field) => field.attribute).join(',');
        return indexFields === fields.join(',');
    });

    if (!exists) {
        await queryInterface.addIndex(tableName, fields, options);
    }
};

module.exports = {
    async up(queryInterface, DataTypes) {
        if (!(await hasTable(queryInterface, 'Suppliers'))) {
            await queryInterface.createTable('Suppliers', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                name: { type: DataTypes.STRING, allowNull: false },
                email: { type: DataTypes.STRING, allowNull: false, unique: true },
                phone: { type: DataTypes.STRING },
                address: { type: DataTypes.STRING },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }

        if (!(await hasTable(queryInterface, 'Warehouses'))) {
            await queryInterface.createTable('Warehouses', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                name: { type: DataTypes.STRING, allowNull: false },
                location: { type: DataTypes.STRING, allowNull: false },
                manager: { type: DataTypes.STRING },
                isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        } else {
            await addColumnIfMissing(queryInterface, 'Warehouses', 'isActive', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            });
        }

        if (!(await hasTable(queryInterface, 'Users'))) {
            await queryInterface.createTable('Users', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                name: { type: DataTypes.STRING, allowNull: false },
                email: { type: DataTypes.STRING, allowNull: false, unique: true },
                password: { type: DataTypes.STRING, allowNull: false },
                role: {
                    type: DataTypes.ENUM('admin', 'supplier', 'warehouse_manager', 'customer', 'driver'),
                    allowNull: false,
                    defaultValue: 'customer'
                },
                warehouseId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: { model: 'Warehouses', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                supplierId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: { model: 'Suppliers', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        } else {
            await addColumnIfMissing(queryInterface, 'Users', 'warehouseId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'Warehouses', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
            await addColumnIfMissing(queryInterface, 'Users', 'supplierId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'Suppliers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
        }

        if (!(await hasTable(queryInterface, 'Products'))) {
            await queryInterface.createTable('Products', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                name: { type: DataTypes.STRING, allowNull: false },
                description: { type: DataTypes.TEXT },
                price: { type: DataTypes.FLOAT, allowNull: false },
                category: { type: DataTypes.STRING },
                SupplierId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: { model: 'Suppliers', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }

        if (!(await hasTable(queryInterface, 'Inventories'))) {
            await queryInterface.createTable('Inventories', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                productId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Products', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                warehouseId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'Warehouses', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
                lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        } else {
            await addColumnIfMissing(queryInterface, 'Inventories', 'productId', { type: DataTypes.INTEGER, allowNull: false });
            await addColumnIfMissing(queryInterface, 'Inventories', 'warehouseId', { type: DataTypes.INTEGER, allowNull: false });
        }
        await addIndexIfMissing(queryInterface, 'Inventories', ['productId', 'warehouseId'], {
            unique: true,
            name: 'inventories_product_warehouse_unique'
        });

        if (!(await hasTable(queryInterface, 'Orders'))) {
            await queryInterface.createTable('Orders', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
                totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
                status: {
                    type: DataTypes.ENUM('pending', 'approved', 'shipped', 'delivered', 'cancelled'),
                    allowNull: false,
                    defaultValue: 'pending'
                },
                shippingAddress: { type: DataTypes.TEXT, allowNull: false },
                ProductId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Products', key: 'id' } },
                WarehouseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Warehouses', key: 'id' } },
                UserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
                DriverId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' } },
                shippedAt: { type: DataTypes.DATE, allowNull: true },
                deliveredAt: { type: DataTypes.DATE, allowNull: true },
                cancelledAt: { type: DataTypes.DATE, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        } else {
            await addColumnIfMissing(queryInterface, 'Orders', 'WarehouseId', {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Warehouses', key: 'id' }
            });
            await addColumnIfMissing(queryInterface, 'Orders', 'shippingAddress', { type: DataTypes.TEXT, allowNull: false });
            await addColumnIfMissing(queryInterface, 'Orders', 'shippedAt', { type: DataTypes.DATE, allowNull: true });
            await addColumnIfMissing(queryInterface, 'Orders', 'deliveredAt', { type: DataTypes.DATE, allowNull: true });
            await addColumnIfMissing(queryInterface, 'Orders', 'cancelledAt', { type: DataTypes.DATE, allowNull: true });
        }

        if (!(await hasTable(queryInterface, 'InventoryMovements'))) {
            await queryInterface.createTable('InventoryMovements', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                type: {
                    type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT'),
                    allowNull: false
                },
                quantity: { type: DataTypes.INTEGER, allowNull: false },
                beforeQuantity: { type: DataTypes.INTEGER, allowNull: false },
                afterQuantity: { type: DataTypes.INTEGER, allowNull: false },
                reason: { type: DataTypes.STRING },
                referenceType: { type: DataTypes.STRING },
                referenceId: { type: DataTypes.INTEGER },
                productId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Products', key: 'id' } },
                warehouseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Warehouses', key: 'id' } },
                performedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' } },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }

        if (!(await hasTable(queryInterface, 'AuditLogs'))) {
            await queryInterface.createTable('AuditLogs', {
                id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
                action: { type: DataTypes.STRING, allowNull: false },
                entityType: { type: DataTypes.STRING, allowNull: false },
                entityId: { type: DataTypes.INTEGER },
                details: { type: DataTypes.JSON },
                performedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' } },
                createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            });
        }
    }
};
