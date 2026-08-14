import { appLogger } from '../logger.js';
import { AppError } from '../errors.js';

export function globalErrorHandler(err, req, res, next) {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      title: err.code,
      status: err.statusCode,
      detail: err.message,
      request_id: req.id,
    });
  }
  
  appLogger.error({ error: err.message, stack: err.stack, request_id: req.id }, 'Unexpected error');
  res.status(500).json({ title: 'Internal Error', status: 500, request_id: req.id });
}
