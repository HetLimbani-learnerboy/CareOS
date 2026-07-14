import Prescription from '../doctor/prescription.model.js';
import Appointment from './appointment.model.js';

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

function isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(String(id));
}

export const getPrescriptionHistoryForPatient = async (patientEmail) => {
    const normalizedPatientEmail = normalizeEmail(patientEmail);
    if (!normalizedPatientEmail) {
        throw httpError(400, 'Patient email context verification parameter is required.');
    }

    return await Prescription.find({ patientEmail: normalizedPatientEmail })
        .populate({
            path: 'appointmentId',
            select: 'appointment_date time_slot reason_for_visit status',

            match: { status: { $nin: ['rejected', 'cancelled'] } }
        })
        .sort({ created_at: -1 })
        .lean();
};

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

    if (prescription.patientEmail !== normalizedPatientEmail) {
        throw httpError(403, 'Access denied exception. You are unauthorized to read this medical record line file.');
    }

    return prescription;
};