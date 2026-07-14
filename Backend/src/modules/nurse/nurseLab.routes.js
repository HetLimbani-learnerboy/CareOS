import express from 'express';
import {
    fetchCatalogs,
    createPrescription,
    fetchDoctorPatientRoster,
    fetchPatientHistory,
    updatePrescription,
    deletePrescription
} from './nursePrescription.controller.js';
import {
     getDoctorInpatientQueue, 
    submitTreatmentPlanOrder, 
    updateTreatmentPlanOrder 
} from '../doctor/treatment.controller.js'
import { getNurseInpatientQueue, administerTreatmentPlanPlan } from "./treatment.controller.js";

import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();
const requireNurse = requireRole('nurse');

router.get('/catalogs', protectRoute, requireNurse, fetchCatalogs);
router.post('/e-prescription', protectRoute, requireNurse, createPrescription);

router.get('/patients', protectRoute, requireNurse, fetchDoctorPatientRoster);
router.get('/patients/history', protectRoute, requireNurse, fetchPatientHistory);

router.patch('/e-prescription/:prescriptionId', protectRoute, requireNurse, updatePrescription);
router.delete('/e-prescription/:prescriptionId', protectRoute, requireNurse, deletePrescription);

router.get("/inpatient-queue",protectRoute, requireNurse, getNurseInpatientQueue);
router.patch("/treatment-plan/:planId/administer", protectRoute, requireNurse, administerTreatmentPlanPlan);


router.get('/inpatient/treatment-queue', protectRoute,requireNurse, getDoctorInpatientQueue);
router.post('/inpatient/treatment-plan',protectRoute, requireNurse, submitTreatmentPlanOrder);
router.put("/inpatient/treatment-plan/:planId",protectRoute, requireNurse, updateTreatmentPlanOrder);

export default router;