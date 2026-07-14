import express from 'express';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

import { fetchDoctorProfile, saveDoctorProfile } from './doctorProfile.controller.js';
import { fetchDoctorLabReviews } from './doctorLab.controller.js';
import {
    getDoctorInpatientQueue,
    submitTreatmentPlanOrder,
    updateTreatmentPlanOrder
} from "./treatment.controller.js";
import {
    fetchCatalogs,
    createPrescription,
    fetchDoctorPatientRoster,
    fetchPatientHistory,
    updatePrescription,
    deletePrescription
} from './doctorPrescription.controller.js';

const router = express.Router();

router.use(protectRoute);

router.get('/profile', requireRole('doctor'), fetchDoctorProfile);
router.put('/profile', requireRole('doctor'), saveDoctorProfile);

router.get('/lab-reviews', requireRole('doctor'), fetchDoctorLabReviews);

router.get('/patients', requireRole('doctor'), fetchDoctorPatientRoster);
router.get('/patients/history', requireRole('doctor'), fetchPatientHistory);

router.get('/catalogs', requireRole('doctor'), fetchCatalogs);
router.post('/e-prescription', requireRole('doctor'), createPrescription);
router.patch('/e-prescription/:prescriptionId', requireRole('doctor'), updatePrescription);
router.delete('/e-prescription/:prescriptionId', requireRole('doctor'), deletePrescription);

router.get('/inpatient/treatment-queue', requireRole('doctor'), getDoctorInpatientQueue);
router.post('/inpatient/treatment-plan', requireRole('doctor'), submitTreatmentPlanOrder);
router.put("/inpatient/treatment-plan/:planId", requireRole('doctor'), updateTreatmentPlanOrder);

export default router;