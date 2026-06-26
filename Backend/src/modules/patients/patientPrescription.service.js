import Prescription from '../doctor/prescription.model.js';
import Appointment from './appointment.model.js'; // Assumed track reference path

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

function isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(String(id));
}

// 1. Fetch entire historical timeline of prescriptions written for this specific patient
export const getPrescriptionHistoryForPatient = async (patientEmail) => {
    const normalizedPatientEmail = normalizeEmail(patientEmail);
    if (!normalizedPatientEmail) {
        throw httpError(400, 'Patient email context verification parameter is required.');
    }

    // Finds all signed historical records belonging to this patient email address
    return await Prescription.find({ patientEmail: normalizedPatientEmail })
        .populate({
            path: 'appointmentId',
            select: 'appointment_date time_slot reason_for_visit status',
            // Ensure canceled or rejected administrative tracking points are caught if necessary
            match: { status: { $nin: ['rejected', 'cancelled'] } }
        })
        .sort({ created_at: -1 })
        .lean();
};

// 2. Fetch targeted precise detail mappings for a single clinical summary script document
export const getSinglePrescriptionForPatient = async (prescriptionId, patientEmail) => {
    if (!isValidObjectId(prescriptionId)) {
        throw httpError(400, 'A valid prescription document identifier token is required.');
    }

    const normalizedPatientEmail = normalizeEmail(patientEmail);
    if (!normalizedPatientEmail) {
        throw httpError(400, 'Patient security validation matching context email required.');
    }

    const prescription = await Prescription.findById(prescriptionId)
        .populate('appointmentId', 'appointment_date time_slot reason_for_visit status')
        .lean();

    if (!prescription) {
        throw httpError(404, 'Requested medical prescription entry sheet records could not be found.');
    }

    // Security Access Guardrail Validation Rule Check
    if (prescription.patientEmail !== normalizedPatientEmail) {
        throw httpError(403, 'Access denied exception. You are unauthorized to read this medical record line file.');
    }

    return prescription;
};