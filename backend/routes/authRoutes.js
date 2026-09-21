const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.post('/register', validators.register, validateRequest, authController.register);
router.post('/login', validators.login, validateRequest, authController.login);

module.exports = router;
