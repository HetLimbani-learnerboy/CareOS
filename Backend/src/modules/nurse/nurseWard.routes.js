import express from 'express';
import { 
    fetchNurseAssignedAdmissions, 
    markReadyForDischarge, 
    executeDischargeCheckout,
    recordPatientVitals,
    // fetchCatalogs,
    // createPrescription,
    // updatePrescription,
    // deletePrescription,
    // fetchDoctorPatientRoster,
    // fetchPatientHistory
} from './nurseWard.controller.js';
import { fetchNurseLabReviews } from './nurseLab.controller.js';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();
const requireNurse = requireRole('nurse');

router.get('/my-admissions', protectRoute, requireNurse, fetchNurseAssignedAdmissions);
router.patch('/:admissionId/ready-discharge', protectRoute, requireNurse, markReadyForDischarge);
router.patch('/:admissionId/complete-discharge', protectRoute, requireNurse, executeDischargeCheckout);
router.post('/:admissionId/vitals', protectRoute, requireNurse, recordPatientVitals);

// router.get('/catalogs', protectRoute, fetchCatalogs);
// router.post('/e-prescription', protectRoute, createPrescription);
// router.patch('/e-prescription/:prescriptionId', protectRoute, updatePrescription);
// router.delete('/e-prescription/:prescriptionId', protectRoute, deletePrescription);

// router.get('/patients', protectRoute, fetchDoctorPatientRoster);
// router.get('/patients/history', protectRoute, fetchPatientHistory);

router.get('/lab-reviews', protectRoute, requireNurse, fetchNurseLabReviews);

export default router;