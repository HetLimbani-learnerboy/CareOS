
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
 
// Public browsing -- no identity required to look up doctors or their availability
router.get('/doctors-by-spec', getDoctorsBySpecialing);
router.get('/doctor-slots-live', getDoctorSlotsAndAvailability);
router.get('/public-doctor-meta', getPublicDoctorMeta);
 
// Identity required -- these act on a specific patient's own records
router.get('/booked-ledger', protectRoute, fetchBookedAppointmentsList);
router.post('/book-request', protectRoute, submitAppointmentRequest);
 
export default router;
 