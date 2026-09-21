const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get('/', auth, role('admin'), userController.getUsers);
router.get('/:id', auth, role('admin'), validators.idParam, validateRequest, userController.getUser);
router.post('/', auth, role('admin'), validators.createUser, validateRequest, userController.createUser);
router.patch('/:id', auth, role('admin'), validators.updateUser, validateRequest, userController.updateUser);
router.delete('/:id', auth, role('admin'), validators.idParam, validateRequest, userController.deleteUser);

module.exports = router;
