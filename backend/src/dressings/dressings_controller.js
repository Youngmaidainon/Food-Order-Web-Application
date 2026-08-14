import express from 'express';
import { DressingsRepository } from './dressings_repository.js';
import { DressingsService } from './dressings_service.js';

const dressingsRouter = express.Router();

const dressingsRepository = new DressingsRepository();
const dressingsService = new DressingsService(dressingsRepository);

// GET /api/dressings - Get all available salad dressings
dressingsRouter.get('/', async (req, res, next) => {
  try {
    const data = await dressingsService.getDressings();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { dressingsRouter };
