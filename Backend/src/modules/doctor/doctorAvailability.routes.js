import { Router } from 'express';
import {
  fetchScheduleMatrix,
  updateSingleDaySlots
} from './doctorAvailability.controller.js';

const router = Router();

// Route mappings running without the blocking protectRoute bottleneck
router.get('/availability', fetchScheduleMatrix);
router.post('/availability/override', updateSingleDaySlots);

export default router;