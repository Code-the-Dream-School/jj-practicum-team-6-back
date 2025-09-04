const { ZodError } = require('zod');

module.exports = (schemas = {}) => {
  return (req, _res, next) => {
    try {
      if (schemas.params) req.validatedParams = schemas.params.parse(req.params);
      if (schemas.query)  req.validatedQuery  = schemas.query.parse(req.query);
      if (schemas.body)   req.validatedBody   = schemas.body.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        err.status = 400; 
        err.code = 'VALIDATION_ERROR';
      }
      return next(err);
    }
  };
};
