import express from 'express';
import { fetchPatientLabReports } from './patientLabReport.controller.js';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();
const requirePatient = requireRole('patient');

router.get('/my-reports', protectRoute, requirePatient, fetchPatientLabReports);

export default router;