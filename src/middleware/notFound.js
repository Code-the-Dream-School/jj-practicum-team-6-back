const { NotFoundError } = require('../errors');
module.exports = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};
