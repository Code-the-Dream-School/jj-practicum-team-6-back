const { ZodError } = require('zod');

module.exports = (schemas = {}) => {
  return (req, _res, next) => {
    try {
      // params
      if (schemas.params) {
        try {
          req.validatedParams = schemas.params.parse(req.params);
        } catch (e) {
          if (e instanceof ZodError) e._source = 'params';
          throw e;
        }
      }

      // query
      if (schemas.query) {
        try {
          req.validatedQuery = schemas.query.parse(req.query);
        } catch (e) {
          if (e instanceof ZodError) e._source = 'query';
          throw e;
        }
      }

      // body
      if (schemas.body) {
        try {
          req.validatedBody = schemas.body.parse(req.body);
        } catch (e) {
          if (e instanceof ZodError) e._source = 'body';
          throw e;
        }
      }

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        err.status = 422;                 // unified 422
        err.code = 'VALIDATION_ERROR';    // unified code
      }
      return next(err);
    }
  };
};
