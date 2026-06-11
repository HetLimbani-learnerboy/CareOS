export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  return res.status(statusCode).json({
    status: statusCode === 500 ? 'error' : 'fail',
    message: err.message || 'Internal processing error'
  });
};