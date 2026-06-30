
import express from 'express';
import {
    fetchAllEligibleLabRosters,
    claimPrescriptionTask,
    updateLabPipelineStatus,
    fetchLabBillingHistory,
    collectInvoicePayment
} from './labTechnician.controller.js';
import protectRoute, { requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();

const requireLabTechnician = requireRole('lab_technician');

router.get('/eligible-patients', protectRoute, requireLabTechnician, fetchAllEligibleLabRosters);
router.post('/claim-task', protectRoute, requireLabTechnician, claimPrescriptionTask);
router.patch('/history/:historyId/pipeline', protectRoute, requireLabTechnician, updateLabPipelineStatus);
router.get('/billing-history', protectRoute, requireLabTechnician, fetchLabBillingHistory);
router.patch('/billing/:historyId/collect', protectRoute, requireLabTechnician, collectInvoicePayment);

export default router;
