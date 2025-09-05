const { ZodError } = require('zod');

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Zod validation -> 422 with consistent shape
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => {
      const src = err._source ? `${err._source}.` : ''; // e.g. "query." | "params." | "body."
      const path =
        issue.path && issue.path.length
          ? src + issue.path.join('.')
          : err._source || undefined;

      return {
        path,                     
        code: issue.code,         
        message: issue.message,   
        expected: issue.expected, 
        received: issue.received, 
      };
    });

    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
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
