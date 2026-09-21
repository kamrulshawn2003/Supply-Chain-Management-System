const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');

const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const returnRoutes = require('./routes/returnRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

// Check required environment variables
const requiredEnv = ['DB_NAME', 'DB_USER', 'DB_HOST', 'DB_PASSWORD', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const app = express();

// Fixed CORS: Allow all local frontend origins temporarily to resolve network/CORS errors
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('SCMS Backend Running');
});

// Health endpoint required by docs/manual-smoke-tests.md Phase 1
app.get('/api/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({
            success: true,
            uptime: process.uptime(),
            db: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            uptime: process.uptime(),
            db: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// All API route mounts unchanged
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/notifications', notificationRoutes);

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error middleware
app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5000;

// Database connect & server start logic unchanged
const start = async () => {
    await sequelize.authenticate();
    console.log('Database connected');
    console.log('Schema sync is disabled. Run npm run migrate to apply database changes.');

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Set PORT to another value or stop the running server.`);
            process.exit(1);
        }

        throw error;
    });
};

start().catch((error) => {
    console.error('Startup failed:', error.message);
    process.exit(1);
});