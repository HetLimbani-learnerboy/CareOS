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

const router = Router();

router.use(protectRoute);

router.get('/dashboard-summary', getAggregatedDashboardData);
router.post('/dashboard-summary', handleDashboardUpsert);

router.get('/profile', getProfileDashboardData);
router.put('/profile', handleProfileUpdateForm);

export default router;