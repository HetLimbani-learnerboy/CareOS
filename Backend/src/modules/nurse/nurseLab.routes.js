import express from 'express';
import {
    fetchCatalogs,
    createPrescription,
    fetchDoctorPatientRoster,
    fetchPatientHistory,
    updatePrescription,
    deletePrescription
} from './nursePrescription.controller.js';

import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();
const requireNurse = requireRole('nurse');

router.get('/catalogs', protectRoute, requireNurse, fetchCatalogs);
router.post('/e-prescription', protectRoute, requireNurse, createPrescription);

router.get('/patients', protectRoute, requireNurse, fetchDoctorPatientRoster);
router.get('/patients/history', protectRoute, requireNurse, fetchPatientHistory);

router.patch('/e-prescription/:prescriptionId', protectRoute, requireNurse, updatePrescription);
router.delete('/e-prescription/:prescriptionId', protectRoute, requireNurse, deletePrescription);

export default router;