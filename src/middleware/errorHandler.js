module.exports = (err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const payload = {
      success: false,
      error: {
        code: err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : undefined),
        message: err.message || 'Internal Server Error',
      },
      meta: { requestId: req.id },
    };
    if (err.details) payload.error.details = err.details;
    if (process.env.NODE_ENV !== 'production' && err.stack) payload.error.stack = err.stack;
    if (status >= 500) console.error(err);
    res.status(status).json(payload);
  };
  