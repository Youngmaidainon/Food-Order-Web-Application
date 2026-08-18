import express from 'express';
import { authenticateAdminSession } from '../shared/middleware/auth.js';
import { sseManager } from '../shared/sse.js';

const eventsRouter = express.Router();

// GET /api/admin/events - SSE endpoint for admin real-time updates
eventsRouter.get('/', authenticateAdminSession, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial connection success event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE connection established' })}\n\n`);

  sseManager.addAdminClient(res);
});

export { eventsRouter };
