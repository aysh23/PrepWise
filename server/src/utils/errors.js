export class AppError extends Error {
  constructor(statusCode, message, code = 'APP_ERROR', details) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function notFoundHandler(req, res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'))
}

export function errorHandler(error, req, res, next) {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      message: 'Request body contains invalid JSON',
      code: 'INVALID_JSON',
    })
    return
  }

  const statusCode = error.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: error.message || 'An unexpected server error occurred',
    code: error.code || 'INTERNAL_SERVER_ERROR',
    ...(error.details ? { details: error.details } : {}),
  })
}
