import { Router } from 'express';
import { fetchDoctorProfile, saveDoctorProfile } from './doctorProfile.controller.js';
import protectRoute from '../../middleware/authMiddleware.js';

const router = Router();
router.use(protectRoute);

router.get('/profile', fetchDoctorProfile);
router.put('/profile', saveDoctorProfile);

export default router;