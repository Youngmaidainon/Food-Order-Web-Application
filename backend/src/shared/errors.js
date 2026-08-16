// สร้าง Typed Error Hierarchy กำหนดรูปแบบ Error ทั้งระบบแทนที่จะส่ง Error ธรรมดา
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
    super(`${resource} not found${id ? ': ' + id : ''}`, 'NOT_FOUND', 404);
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
