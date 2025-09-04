const { ZodError } = require('zod');

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: JSON.stringify(err.issues, null, 2),
      },
      meta: { requestId: req.id },
    });
  }

  const status = err.status || err.statusCode || 500;

  const STATUS_CODE = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'RESOURCE_NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
  };

  const code = err.code || STATUS_CODE[status] || 'INTERNAL_SERVER_ERROR';
  const message = err.publicMessage || err.message || 'Unexpected error';

  const payload = {
    success: false,
    error: { code, message },
    meta: { requestId: req.id },
  };

  if (err.details) payload.error.details = err.details;
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.error.stack = err.stack;
  }
  if (status >= 500) console.error(err);

  res.status(status).json(payload);
};
