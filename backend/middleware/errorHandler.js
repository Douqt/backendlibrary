// Error handling middleware
// This catches any errors that happen in your routes
const errorHandler = (err, req, res, next) => {
  // Log the error to the console so you can see what went wrong
  console.error('Error:', err.message);

  // Get the status code (default to 500 if not set)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Send error response to the client
  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only show error stack in development mode (helpful for debugging)
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
