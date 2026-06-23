import { Router } from 'express';
import protectRoute, { requireDoctor } from '../../middleware/authMiddleware.js';
import {
  fetchDoctorAppointmentRoster,
  fetchScheduleMatrix,
  updateAppointmentStatus,
  updateSingleDaySlots
} from './doctorAvailability.controller.js';

const router = Router();

// Patients also need to read a doctor's availability while booking.
router.get('/availability', fetchScheduleMatrix);

router.post(
  '/availability/override',
  protectRoute,
  requireDoctor,
  updateSingleDaySlots
);
router.get(
  '/appointments',
  protectRoute,
  requireDoctor,
  fetchDoctorAppointmentRoster
);
router.patch(
  '/appointments/:appointmentId/status',
  protectRoute,
  requireDoctor,
  updateAppointmentStatus
);

export default router;