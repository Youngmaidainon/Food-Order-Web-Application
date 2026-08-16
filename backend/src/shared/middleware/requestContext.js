import { v4 as uuidv4 } from 'uuid';
import { appLogger } from '../logger.js';

// สร้าง Request Context เพื่อให้ติดตาม (Trace) Log ได้ง่ายขึ้น 
export function requestContext(req, res, next) {
  // รองรับ Request ID เดิม หรือสร้าง UUID ใหม่
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // บันทึก Log ขาเข้าด้วย Structured JSON Logging
  appLogger.info({ msg: 'Incoming Request', method: req.method, url: req.url, request_id: req.id });
  
  res.setHeader('X-Request-Id', req.id);
  next();
}
