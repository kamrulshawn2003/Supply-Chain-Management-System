const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/admin', auth, role('admin'), (req, res) => {
    res.json({
        message: "You are an ADMIN and have access",
        user: req.user
    });
});

module.exports = router;