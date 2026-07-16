import express from 'express';
import {
    fetchReceptionistDashboardMetrics,
    fetchAllSystemAppointments,
    receptionistBookWalkInIntake,
    updateAppointmentStatusByReceptionist
} from './receptionist.controller.js';
import { fetchAdmissionDashboard, createAdmissionRecord, completeDischargeCheckout } from "./admissionProcess.controller.js";
import { submitNewConsultRequest, fetchAllRequestsForDesk, updateConsultationStatus } from "./consultation.controller.js";
import {
    fetchVisitedQueue,
    buildInvoiceDraft,
    commitFinalBillRecord,
    fetchHistoricalPartitions,
  patchInvoiceStatus
} from "./billing.controller.js";
import protectRoute from "../../middleware/authMiddleware.js";

const router = express.Router();

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: "fail",
                message: "Unauthorized"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        next();
    };
};

router.get(
    '/metrics',
    protectRoute,
    requireRole('receptionist', 'doctor'),
    fetchReceptionistDashboardMetrics
);

router.get(
    '/appointments',
    protectRoute,
    requireRole('receptionist', 'doctor'),
    fetchAllSystemAppointments
);

router.post(
    '/receptionist-book-request',
    protectRoute,
    requireRole('receptionist', 'doctor'),
    receptionistBookWalkInIntake
);

router.patch(
    '/appointments/:appointmentId/action',
    protectRoute,
    requireRole('receptionist', 'doctor'),
    updateAppointmentStatusByReceptionist
);

router.get("/admission/dashboard", protectRoute, requireRole("receptionist", "doctor"), fetchAdmissionDashboard);
router.post("/admission/check-in", protectRoute, requireRole("receptionist", "doctor"), createAdmissionRecord);
router.patch("/admission/:admissionId/discharge", protectRoute, requireRole("receptionist", "doctor"), completeDischargeCheckout);

router.post("/consultation/request", protectRoute, requireRole("receptionist", "doctor"), submitNewConsultRequest);
router.get("/consultation/list", protectRoute, requireRole("receptionist", "doctor"), fetchAllRequestsForDesk);
router.patch("/consultation/:id/status", protectRoute, requireRole("receptionist", "doctor"), updateConsultationStatus);

router.get("/visited-appointments", protectRoute, requireRole("receptionist"), fetchVisitedQueue);
router.get("/draft-invoice/:appointmentId", protectRoute, requireRole("receptionist"), buildInvoiceDraft);
router.post("/finalize-invoice", protectRoute, requireRole("receptionist"), commitFinalBillRecord);
router.get("/billing-history-partition", protectRoute, requireRole("receptionist"), fetchHistoricalPartitions);
router.patch("/invoice/:invoiceId/status", protectRoute, requireRole("receptionist"), patchInvoiceStatus);

export default router;