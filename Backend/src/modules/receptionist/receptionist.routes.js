import express from 'express';
import {
  fetchReceptionistDashboardMetrics,
  fetchAllSystemAppointments,
  receptionistBookWalkInIntake,
  updateAppointmentStatusByReceptionist
} from './receptionist.controller.js';

const router = express.Router();

router.get('/metrics', fetchReceptionistDashboardMetrics);
router.get('/appointments', fetchAllSystemAppointments);
router.post('/receptionist-book-request', receptionistBookWalkInIntake);
router.patch('/appointments/:appointmentId/action', updateAppointmentStatusByReceptionist);

export default router;