import { Router } from 'express';
import { getProfileDashboardData, handleProfileUpdateForm } from './patient.controller.js';
import protectRoute from '../../middleware/authMiddleware.js';

const router = Router();

router.use(protectRoute);

router.get('/profile', getProfileDashboardData);
router.put('/profile', handleProfileUpdateForm);

export default router;