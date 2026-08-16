import { appLogger } from '../logger.js';

// Base Error Class: ระบุโครงสร้างของ Error แบบ Typed Hierarchy
export class AppError extends Error {
  constructor(message, code, statusCode, isOperational = true) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message || 'Validation failed', 'VALIDATION_ERROR', 422);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || 'Unauthorized', 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Forbidden', 'FORBIDDEN', 403);
  }
}

// Global Error Handler: ดักจับ Error และส่งกลับเป็นมาตรฐาน RFC 9457 ป้องกัน Information Leakage
export function globalErrorHandler(err, req, res, next) {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      title: err.code,
      status: err.statusCode,
      detail: err.message,
      request_id: req.id,
    });
  }
  
  // บันทึก Log สำหรับ Error ที่ไม่คาดคิด (Generic 500) ห้ามคืนค่า Stack Trace สู่ Client เด็ดขาด
  appLogger.error({ error: err.message, stack: err.stack, request_id: req.id }, 'Unexpected error');
  res.status(500).json({ title: 'Internal Error', status: 500, request_id: req.id });
}
