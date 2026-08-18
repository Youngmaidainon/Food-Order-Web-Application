import express from 'express';
import { sseManager } from '../shared/sse.js';

const eventsRouter = express.Router();

// GET /api/orders/events/:order_number - SSE endpoint for customer real-time updates
eventsRouter.get('/:order_number', (req, res) => {
  const orderNumber = req.params.order_number;
  if (!orderNumber) {
    return res.status(400).json({ success: false, message: 'Order number is required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial connection success event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE connection established for order ' + orderNumber })}\n\n`);

  sseManager.addCustomerClient(orderNumber, res);
});

export { eventsRouter };
