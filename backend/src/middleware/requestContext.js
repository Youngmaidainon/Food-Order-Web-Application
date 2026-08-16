import { v4 as uuidv4 } from 'uuid';
import { appLogger } from '../logger.js';

// Middleware สร้างและกระจาย Request ID (Observability)
export function requestContext(req, res, next) {
  // รับ ID เดิม (กรณีส่งมาจาก API Gateway) หรือสร้างใหม่
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // บันทึก Structured JSON Logging พร้อม Request ID (Traceability)
  appLogger.info({ msg: 'Incoming Request', method: req.method, url: req.url, request_id: req.id });
  
  res.setHeader('X-Request-Id', req.id);
  next();
}
