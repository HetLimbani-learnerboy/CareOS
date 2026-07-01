
import express from 'express';
import {
    fetchCatalogs,
    createPrescription,
    fetchDoctorPatientRoster,
    fetchPatientHistory,
    updatePrescription,
    deletePrescription
} from './doctorPrescription.controller.js';

import { fetchDoctorLabReviews } from './doctorLab.controller.js';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();
const requireDoctor = requireRole('doctor');

router.get('/catalogs', fetchCatalogs);
router.post('/e-prescription', createPrescription);

router.get('/patients', fetchDoctorPatientRoster);
router.get('/patients/history', fetchPatientHistory);

router.patch('/e-prescription/:prescriptionId', updatePrescription);
router.delete('/e-prescription/:prescriptionId', deletePrescription);
router.get('/lab-reviews', protectRoute, requireDoctor, fetchDoctorLabReviews);


export default router;
