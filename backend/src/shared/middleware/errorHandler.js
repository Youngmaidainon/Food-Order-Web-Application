import { appLogger } from '../logger.js';
import { AppError } from '../errors.js';

// Global Error Handler ควบคุมการคืนค่า Error ให้ไคลเอนต์ (Resilience & Security)
export function globalErrorHandler(err, req, res, next) {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      title: err.code,
      status: err.statusCode,
      detail: err.message,
      request_id: req.id,
    });
  }
  
  // บันทึก Log สำหรับบั๊กที่ไม่คาดคิด ป้องกันไม่ให้ Stack Trace หลุดไปหน้าบ้าน (Prevent Info Leakage)
  appLogger.error({ error: err.message, stack: err.stack, request_id: req.id }, 'Unexpected error');
  res.status(500).json({ title: 'Internal Error', status: 500, request_id: req.id });
}
