module.exports = (req, _res, next) => {
  const err = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  err.status = 404;
  err.code = 'RESOURCE_NOT_FOUND';
  next(err);
};
