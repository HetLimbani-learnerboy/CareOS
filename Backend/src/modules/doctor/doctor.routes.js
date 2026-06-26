
import express from 'express';
import {
  fetchCatalogs,
  createPrescription,
  fetchDoctorPatientRoster,
  fetchPatientHistory,
  updatePrescription,
  deletePrescription
} from './doctorPrescription.controller.js';
 
const router = express.Router();
 
router.get('/catalogs', fetchCatalogs);
router.post('/e-prescription', createPrescription);
 
// Patient record access for a doctor
router.get('/patients', fetchDoctorPatientRoster);
router.get('/patients/history', fetchPatientHistory);
 
// Update / delete an existing prescription (doctor-owned only)
router.patch('/e-prescription/:prescriptionId', updatePrescription);
router.delete('/e-prescription/:prescriptionId', deletePrescription);
 
export default router;
 