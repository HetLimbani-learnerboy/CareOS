import express from 'express';
import { 
    fetchNurseAssignedAdmissions, 
    markReadyForDischarge, 
    executeDischargeCheckout,
    recordPatientVitals 
} from './nurseWard.controller.js';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();
const requireNurse = requireRole('nurse');

router.get('/my-admissions', protectRoute, requireNurse, fetchNurseAssignedAdmissions);
router.patch('/:admissionId/ready-discharge', protectRoute, requireNurse, markReadyForDischarge);
router.patch('/:admissionId/complete-discharge', protectRoute, requireNurse, executeDischargeCheckout);
router.post('/:admissionId/vitals', protectRoute, requireNurse, recordPatientVitals);

export default router;