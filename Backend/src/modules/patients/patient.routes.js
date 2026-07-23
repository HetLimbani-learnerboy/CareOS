import { Router } from 'express';
import express from 'express';
import {
    getProfileDashboardData,
    handleProfileUpdateForm
} from './patient.controller.js';
import {
    getAggregatedDashboardData,
    handleDashboardUpsert
} from './patientDashboard.controller.js';
import { fetchPatientLabReports } from './patientLabReport.controller.js';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';
import {
    fetchPatientPrescriptionHistory,
    fetchSinglePrescriptionDetails
} from './patientPrescription.controller.js';
import {
    fetchPatientHistoricalBilling,
    executePatientCheckout
} from "./patientBilling.controller.js";

const router = Router();
const requirePatient = requireRole('patient');
router.use(protectRoute);

router.get('/dashboard-summary', getAggregatedDashboardData);
router.post('/dashboard-summary', handleDashboardUpsert);
router.get('/prescriptions', fetchPatientPrescriptionHistory);
router.get('/prescriptions/:prescriptionId', fetchSinglePrescriptionDetails);
router.get('/my-reports', protectRoute, requirePatient, fetchPatientLabReports);
router.get('/profile', getProfileDashboardData);
router.put('/profile', handleProfileUpdateForm);
router.get("/billing-history", fetchPatientHistoricalBilling);
router.post("/invoice/:invoiceId/pay", executePatientCheckout);

export default router;