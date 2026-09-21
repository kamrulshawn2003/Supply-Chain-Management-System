const sequelize = require('../config/db');

const User = require('./User');
const Supplier = require('./Supplier');
const Product = require('./Product');
const Warehouse = require('./Warehouse');
const Inventory = require('./Inventory');
const Order = require('./Order');
const InventoryMovement = require('./InventoryMovement');
const AuditLog = require('./AuditLog');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const ReturnRequest = require('./ReturnRequest');
const Notification = require('./Notification');

Supplier.hasMany(Product, { foreignKey: 'SupplierId' });
Product.belongsTo(Supplier, { foreignKey: 'SupplierId' });

Supplier.hasMany(User, { foreignKey: 'supplierId' });
User.belongsTo(Supplier, { foreignKey: 'supplierId' });

Warehouse.hasMany(User, { foreignKey: 'warehouseId' });
User.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

Product.hasMany(Inventory, { foreignKey: 'productId' });
Inventory.belongsTo(Product, { foreignKey: 'productId' });

Warehouse.hasMany(Inventory, { foreignKey: 'warehouseId' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

Product.hasMany(Order, { foreignKey: 'ProductId' });
Order.belongsTo(Product, { foreignKey: 'ProductId' });

Warehouse.hasMany(Order, { foreignKey: 'WarehouseId' });
Order.belongsTo(Warehouse, { foreignKey: 'WarehouseId' });

User.hasMany(Order, { foreignKey: 'UserId' });
Order.belongsTo(User, { foreignKey: 'UserId' });

User.hasMany(Order, {
    foreignKey: 'DriverId',
    as: 'DriverOrders'
});
Order.belongsTo(User, {
    foreignKey: 'DriverId',
    as: 'Driver'
});

Product.hasMany(InventoryMovement, { foreignKey: 'productId' });
InventoryMovement.belongsTo(Product, { foreignKey: 'productId' });

Warehouse.hasMany(InventoryMovement, { foreignKey: 'warehouseId' });
InventoryMovement.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

User.hasMany(InventoryMovement, { foreignKey: 'performedBy' });
InventoryMovement.belongsTo(User, { foreignKey: 'performedBy' });

User.hasMany(AuditLog, { foreignKey: 'performedBy' });
AuditLog.belongsTo(User, { foreignKey: 'performedBy' });

// ---- Procurement: Purchase Orders ----
Supplier.hasMany(PurchaseOrder);
PurchaseOrder.belongsTo(Supplier);

Warehouse.hasMany(PurchaseOrder, { foreignKey: 'warehouseId' });
PurchaseOrder.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

PurchaseOrder.hasMany(PurchaseOrderItem);
PurchaseOrderItem.belongsTo(PurchaseOrder);

Product.hasMany(PurchaseOrderItem);
PurchaseOrderItem.belongsTo(Product);

User.hasMany(PurchaseOrder, { foreignKey: 'createdBy', as: 'CreatedPurchaseOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'CreatedBy' });

// ---- Returns ----
Order.hasMany(ReturnRequest);
ReturnRequest.belongsTo(Order);

Product.hasMany(ReturnRequest, { foreignKey: 'productId' });
ReturnRequest.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(ReturnRequest, { foreignKey: 'createdBy', as: 'CreatedReturns' });
ReturnRequest.belongsTo(User, { foreignKey: 'createdBy', as: 'Customer' });

User.hasMany(ReturnRequest, { foreignKey: 'handledBy', as: 'HandledReturns' });
ReturnRequest.belongsTo(User, { foreignKey: 'handledBy', as: 'Handler' });

// ---- Notifications ----
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    Supplier,
    Product,
    Warehouse,
    Inventory,
    Order,
    InventoryMovement,
    AuditLog,
    PurchaseOrder,
    PurchaseOrderItem,
    ReturnRequest,
    Notification
};
