const asyncHandler = require('../utils/asyncHandler');
const returnService = require('../services/returnService');

exports.createReturn = asyncHandler(async (req, res) => {
    const returnRequest = await returnService.createReturn({
        user: req.user,
        payload: req.body
    });

    res.status(201).json({
        success: true,
        message: 'Return request submitted',
        data: returnRequest
    });
});

exports.getReturns = asyncHandler(async (req, res) => {
    const returns = await returnService.listReturns({ user: req.user });

    res.json({
        success: true,
        data: returns
    });
});

exports.handleReturn = asyncHandler(async (req, res) => {
    const returnRequest = await returnService.handleReturn({
        id: req.params.id,
        status: req.body.status,
        user: req.user
    });

    res.json({
        success: true,
        message: `Return request ${req.body.status}`,
        data: returnRequest
    });
});
