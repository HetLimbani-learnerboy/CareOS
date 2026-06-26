import { Router } from 'express';
import {
    getProfileDashboardData,
    handleProfileUpdateForm
} from './patient.controller.js';
import {
    getAggregatedDashboardData,
    handleDashboardUpsert
} from './patientDashboard.controller.js';
import protectRoute from '../../middleware/authMiddleware.js';
import { fetchPatientPrescriptions } from './patientPrescription.controller.js';

const router = Router();

router.use(protectRoute);

router.get('/dashboard-summary', getAggregatedDashboardData);
router.post('/dashboard-summary', handleDashboardUpsert);
router.get('/my-prescriptions', fetchPatientPrescriptions);

router.get('/profile', getProfileDashboardData);
router.put('/profile', handleProfileUpdateForm);

export default router;