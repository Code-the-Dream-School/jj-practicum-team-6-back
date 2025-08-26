class AppError extends Error {
    constructor(message, { status = 500, code = 'INTERNAL_SERVER_ERROR', details } = {}) {
      super(message);
      this.name = this.constructor.name;
      this.status = status;
      this.code = code;
      this.details = details;
      Error.captureStackTrace?.(this, this.constructor);
    }
  }
  
  class BadRequestError extends AppError {
    constructor(message = 'Bad Request', details) {
      super(message, { status: 400, code: 'BAD_REQUEST', details });
    }
  }
  class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', details) {
      super(message, { status: 401, code: 'UNAUTHORIZED', details });
    }
  }
  class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', details) {
      super(message, { status: 403, code: 'FORBIDDEN', details });
    }
  }
  class NotFoundError extends AppError {
    constructor(message = 'Not Found', details) {
      super(message, { status: 404, code: 'RESOURCE_NOT_FOUND', details });
    }
  }
  
  module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
  };
  