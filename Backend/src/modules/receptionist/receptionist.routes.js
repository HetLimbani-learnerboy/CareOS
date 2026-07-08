import express from 'express';
import {
    fetchReceptionistDashboardMetrics,
    fetchAllSystemAppointments,
    receptionistBookWalkInIntake,
    updateAppointmentStatusByReceptionist
} from './receptionist.controller.js';
import { fetchAdmissionDashboard, createAdmissionRecord, completeDischargeCheckout } from "./admissionProcess.controller.js";
import { submitNewConsultRequest, fetchAllRequestsForDesk, updateConsultationStatus } from "./consultation.controller.js";
import protectRoute, { requireRole } from "../../middleware/authMiddleware.js";

const router = express.Router();
const requireReceptionist = requireRole("receptionist");

router.get('/metrics', protectRoute, requireReceptionist, fetchReceptionistDashboardMetrics);
router.get('/appointments', protectRoute, requireReceptionist, fetchAllSystemAppointments);
router.post('/receptionist-book-request', protectRoute, requireReceptionist, receptionistBookWalkInIntake);
router.patch('/appointments/:appointmentId/action', protectRoute, requireReceptionist, updateAppointmentStatusByReceptionist);

router.get("/admission/dashboard", protectRoute, requireReceptionist, fetchAdmissionDashboard);
router.post("/admission/check-in", protectRoute, requireReceptionist, createAdmissionRecord);
router.patch("/admission/:admissionId/discharge", protectRoute, requireReceptionist, completeDischargeCheckout);

router.post("/consultation/request", submitNewConsultRequest);
router.get("/consultation/list", protectRoute, requireRole("receptionist"), fetchAllRequestsForDesk);
router.patch("/consultation/:id/status", protectRoute, requireRole("receptionist"), updateConsultationStatus);

export default router;