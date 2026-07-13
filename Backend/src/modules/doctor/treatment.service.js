import TreatmentPlan from "./treatmentPlan.model.js";
import mongoose from "mongoose";

import Admission from "../receptionist/admission.model.js";
import Prescription from './prescription.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import WardBed from '../receptionist/wardBed.model.js';

export const fetchActiveAdmittedPatientsForDoctor = async (doctorEmail) => {
    const doctorPrescriptions = await Prescription.find({
        doctorEmail: doctorEmail.toLowerCase().trim()
    }).lean();

    if (!doctorPrescriptions.length) return [];
    const prescriptionIds = doctorPrescriptions.map(p => p._id);

    const activeAdmissions = await Admission.find({
        prescriptionId: { $in: prescriptionIds },
        status: "Admitted"
    }).lean();

    if (!activeAdmissions.length) return [];

    const activeQueue = [];
    for (const admission of activeAdmissions) {
        const correspondingPrescription = doctorPrescriptions.find(
            p => String(p._id) === String(admission.prescriptionId)
        );

        const bedInfo = await WardBed.findById(admission.bedId).lean();

        const nurseProfiles = await UserIdentity.find({
            _id: { $in: admission.nurseIds },
            role: "nurse"
        }).select("firstName lastName email phone").lean();

        const activePlans = await TreatmentPlan.find({
            admissionId: admission._id
        }).sort({ createdAt: -1 }).lean();

        activeQueue.push({
            admissionId: String(admission._id),
            prescriptionId: String(admission.prescriptionId),
            patientId: String(admission.patientId),
            patientName: admission.patientName,
            patientEmail: admission.patientEmail,
            roomType: admission.roomType,
            bedNumber: bedInfo ? bedInfo.bedNumber : "N/A",
            admittedAt: admission.admittedAt,
            diagnosis: correspondingPrescription?.diagnosis || "N/A",
            clinicalPrescriptionNotes: correspondingPrescription?.notes || "",
            assignedNurses: nurseProfiles.map(n => ({
                nurseId: String(n._id),
                name: `${n.firstName || ""} ${n.lastName || ""}`.trim(),
                email: n.email
            })),
            existingTreatmentPlans: activePlans
        });
    }

    return activeQueue;
};


export const createNewPatientTreatmentPlan = async (doctorEmail, payload) => {
    const {
        admissionId,
        treatmentHeading,
        items,
        scheduledDate,
        scheduledTime,
        clinicalNotes
    } = payload;

    if (
        !admissionId ||
        !treatmentHeading ||
        !Array.isArray(items) ||
        items.length === 0 ||
        !scheduledDate ||
        !scheduledTime
    ) {
        const error = new Error(
            "Admission ID, treatment heading, treatment items, scheduled date, and scheduled time are required."
        );
        error.statusCode = 400;
        throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(admissionId)) {
        const error = new Error("Invalid admission ID format.");
        error.statusCode = 400;
        throw error;
    }

    const admission = await Admission.findById(admissionId);

    if (!admission) {
        const error = new Error("Admission record not found.");
        error.statusCode = 404;
        throw error;
    }

    let computedTotalPlanCost = 0;

    const processedItems = items.map((item) => {
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 1;
        const totalCost = unitPrice * quantity;

        computedTotalPlanCost += totalCost;

        return {
            itemType: String(item.itemType || "").trim(),
            itemName: String(item.itemName || "").trim(),
            dosageConfiguration: String(
                item.dosageConfiguration || ""
            ).trim(),
            unitPrice,
            quantity,
            totalCost
        };
    });

    const newPlan = new TreatmentPlan({
        admissionId,
        patientId: admission.patientId,
        doctorEmail: String(doctorEmail).toLowerCase().trim(),
        treatmentHeading: String(treatmentHeading).trim(),
        items: processedItems,
        totalPlanCost: computedTotalPlanCost,
        scheduledDate,
        scheduledTime,
        clinicalNotes: String(clinicalNotes || "").trim()
    });
    const savedPlan = await newPlan.save();

    return savedPlan;
};
export const updatePatientTreatmentPlan = async (planId, doctorEmail, payload) => {
    const {
        treatmentHeading,
        items,
        scheduledDate,
        scheduledTime,
        clinicalNotes
    } = payload;

    if (
        !treatmentHeading ||
        !Array.isArray(items) ||
        items.length === 0 ||
        !scheduledDate ||
        !scheduledTime
    ) {
        const error = new Error("Treatment heading, item sets, scheduled date, and scheduled times are structural validation requirements.");
        error.statusCode = 400;
        throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
        const error = new Error("Invalid Treatment Plan ID formatting.");
        error.statusCode = 400;
        throw error;
    }

    const targetPlan = await TreatmentPlan.findById(planId);
    if (!targetPlan) {
        const error = new Error("Requested clinical execution treatment plan record was not discovered.");
        error.statusCode = 404;
        throw error;
    }

    if (targetPlan.administrationStatus !== "Pending") {
        const error = new Error("Modifications rejected. This directive pathway has already been processed or cancelled by ward staff.");
        error.statusCode = 400;
        throw error;
    }

    let computedTotalPlanCost = 0;
    const processedItems = items.map((item) => {
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 1;
        const totalCost = unitPrice * quantity;

        computedTotalPlanCost += totalCost;

        return {
            itemType: String(item.itemType || "").trim(),
            itemName: String(item.itemName || "").trim(),
            dosageConfiguration: String(item.dosageConfiguration || "").trim(),
            unitPrice,
            quantity,
            totalCost
        };
    });

    targetPlan.treatmentHeading = String(treatmentHeading).trim();
    targetPlan.items = processedItems;
    targetPlan.totalPlanCost = computedTotalPlanCost;
    targetPlan.scheduledDate = scheduledDate;
    targetPlan.scheduledTime = scheduledTime;
    targetPlan.clinicalNotes = String(clinicalNotes || "").trim();
    targetPlan.doctorEmail = String(doctorEmail).toLowerCase().trim();

    const savedPlan = await targetPlan.save();
    return savedPlan;
};