const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

exports.getUsers = asyncHandler(async (req, res) => {
    const users = await userService.listUsers();

    res.json({
        success: true,
        data: users
    });
});

exports.getUser = asyncHandler(async (req, res) => {
    const user = await userService.getUser(req.params.id);

    res.json({
        success: true,
        data: user
    });
});

exports.createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser({
        payload: req.body,
        performedBy: req.user.id
    });

    res.status(201).json({
        success: true,
        message: 'User created',
        user
    });
});

exports.updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser({
        id: req.params.id,
        payload: req.body,
        performedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'User updated',
        user
    });
});

exports.deleteUser = asyncHandler(async (req, res) => {
    await userService.deleteUser({
        id: req.params.id,
        performedBy: req.user.id
    });

    res.json({
        success: true,
        message: 'User deleted'
    });
});
