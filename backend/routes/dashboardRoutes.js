const express = require('express');
const router = express.Router();


const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/admin', auth, role('admin'), dashboardController.adminDashboard);
router.get('/warehouse', auth, role('admin','warehouse_manager'), dashboardController.warehouseDashboard);
router.get('/driver', auth, role('admin','driver'), dashboardController.driverDashboard);

module.exports = router;
