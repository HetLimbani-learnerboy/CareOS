import TreatmentPlan from "../doctor/treatmentPlan.model.js";
import Admission from "../receptionist/admission.model.js";
import Prescription from '../doctor/prescription.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import WardBed from '../receptionist/wardBed.model.js';
import mongoose from "mongoose";

export const fetchActiveAdmittedPatientsForNurse = async (nurseEmail) => {
    const nurseUser = await UserIdentity.findOne({ 
        email: nurseEmail.toLowerCase().trim(), 
        role: "nurse" 
    }).lean();

    if (!nurseUser) return [];

    const activeAdmissions = await Admission.find({
        nurseIds: nurseUser._id,
        status: "Admitted"
    }).lean();

    if (!activeAdmissions.length) return [];

    const assignedQueue = [];
    for (const admission of activeAdmissions) {
        const correspondingPrescription = await Prescription.findById(admission.prescriptionId).lean();
        const bedInfo = await WardBed.findById(admission.bedId).lean();

        const allAssignedNurses = await UserIdentity.find({
            _id: { $in: admission.nurseIds },
            role: "nurse"
        }).select("firstName lastName email").lean();

        const activePlans = await TreatmentPlan.find({
            admissionId: admission._id
        }).sort({ createdAt: -1 }).lean();

        assignedQueue.push({
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
            assignedNurses: allAssignedNurses.map(n => ({
                nurseId: String(n._id),
                name: `${n.firstName || ""} ${n.lastName || ""}`.trim(),
                email: n.email
            })),
            existingTreatmentPlans: activePlans
        });
    }
    return assignedQueue;
};

export const executeTreatmentAdministration = async (planId, nurseEmail) => {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
        const error = new Error("Invalid Treatment Plan structural tracking format.");
        error.statusCode = 400;
        throw error;
    }

    const nurseUser = await UserIdentity.findOne({ email: nurseEmail.toLowerCase().trim(), role: "nurse" });
    if (!nurseUser) {
        const error = new Error("Nurse identification credentials not located inside system register.");
        error.statusCode = 403;
        throw error;
    }

    const plan = await TreatmentPlan.findById(planId);
    if (!plan) {
        const error = new Error("Target treatment tracking record was missing.");
        error.statusCode = 404;
        throw error;
    }

    if (plan.administrationStatus !== "Pending") {
        const error = new Error("Action rejected. Directives cannot be signed off twice.");
        error.statusCode = 400;
        throw error;
    }

    plan.administrationStatus = "Administered";
    plan.administeredByNurseId = nurseUser._id;
    plan.administeredAt = new Date();

    const verifiedLog = await plan.save();
    return verifiedLog;
};