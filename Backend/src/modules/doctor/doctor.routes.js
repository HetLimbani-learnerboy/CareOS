import express from 'express';
import { fetchCatalogs, createPrescription } from './doctorPrescription.controller.js';

const router = express.Router();

router.get('/catalogs', fetchCatalogs);
router.post('/e-prescription', createPrescription);

export default router;