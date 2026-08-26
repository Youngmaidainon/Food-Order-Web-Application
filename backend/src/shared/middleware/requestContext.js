import { v4 as uuidv4 } from 'uuid';
import { appLogger } from '../logger.js';

// Attach Request-ID and log incoming request
export function requestContext(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  appLogger.info({ msg: 'Incoming Request', method: req.method, url: req.url, request_id: req.id });
  res.setHeader('X-Request-Id', req.id);
  next();
}
