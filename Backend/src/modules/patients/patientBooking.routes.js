
import { Router } from 'express';
import {
  getDoctorsBySpecialing,
  getDoctorSlotsAndAvailability,
  fetchBookedAppointmentsList,
  submitAppointmentRequest,
  getPublicDoctorMeta
} from './appointmentBooking.controller.js';
import protectRoute from '../../middleware/authMiddleware.js';
 
const router = Router();
 
router.get('/doctors-by-spec', getDoctorsBySpecialing);
router.get('/doctor-slots-live', getDoctorSlotsAndAvailability);
router.get('/public-doctor-meta', getPublicDoctorMeta);
 
router.get('/booked-ledger', protectRoute, fetchBookedAppointmentsList);
router.post('/book-request', protectRoute, submitAppointmentRequest);
 
export default router;
 