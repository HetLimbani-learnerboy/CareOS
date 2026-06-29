import express from 'express';
import {
  fetchReceptionistDashboardMetrics,
  fetchAllSystemAppointments,
  updateAppointmentStatusByReceptionist
} from './receptionist.controller.js';

const router = express.Router();

router.get('/metrics', fetchReceptionistDashboardMetrics);
router.get('/appointments', fetchAllSystemAppointments);
router.patch('/appointments/:appointmentId/action', updateAppointmentStatusByReceptionist);

export default router;