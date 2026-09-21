const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        message: err.isOperational ? err.message : 'Internal server error'
    };

    if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
        response.error = err.message;
    }

    res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
