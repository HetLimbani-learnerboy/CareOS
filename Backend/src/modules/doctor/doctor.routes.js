import express from 'express';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

import { fetchDoctorProfile, saveDoctorProfile } from './doctorProfile.controller.js';
import { fetchDoctorLabReviews } from './doctorLab.controller.js';
import { getDoctorInpatientQueue, submitTreatmentPlanOrder,updateTreatmentPlanOrder } from "./treatment.controller.js";
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
router.use(requireRole('doctor'));

router.get('/profile', fetchDoctorProfile);
router.put('/profile', saveDoctorProfile);

router.get('/lab-reviews', fetchDoctorLabReviews);

router.get('/patients', fetchDoctorPatientRoster);
router.get('/patients/history', fetchPatientHistory);

router.get('/catalogs', fetchCatalogs);
router.post('/e-prescription', createPrescription);
router.patch('/e-prescription/:prescriptionId', updatePrescription);
router.delete('/e-prescription/:prescriptionId', deletePrescription);

router.get('/inpatient/treatment-queue', getDoctorInpatientQueue);
router.post('/inpatient/treatment-plan', submitTreatmentPlanOrder);
router.put("/inpatient/treatment-plan/:planId", updateTreatmentPlanOrder);
export default router;