// Centralized error handler and 404 handler
module.exports.errorHandler = (err, req, res, _next) => {
  // Friendly CSRF error response
  if (err && (err.code === 'EBADCSRFTOKEN' || err.message === 'invalid csrf token')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid CSRF token. Please refresh and try again.',
    });
  }

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    console.error('Internal Error:', err);
  }

  res.status(status).json({
    error: err.name || 'Error',
    message: err.message || 'Unexpected server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
};

module.exports.notFound = (req, res, _next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
};
