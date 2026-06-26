import * as patientPrescriptionService from './patientPrescription.service.js';

export const fetchPatientPrescriptionHistory = async (req, res, next) => {
    try {
        const patientEmail = req.query.patientEmail || req.headers['x-patient-email'];

        const records = await patientPrescriptionService.getPrescriptionHistoryForPatient(patientEmail);

        return res.status(200).json({
            status: 'success',
            count: records.length,
            data: records
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            status: 'error',
            message: error.message
        });
    }
};

export const fetchSinglePrescriptionDetails = async (req, res, next) => {
    try {
        const { prescriptionId } = req.params;
        const patientEmail = req.query.patientEmail || req.headers['x-patient-email'];

        const prescription = await patientPrescriptionService.getSinglePrescriptionForPatient(
            prescriptionId,
            patientEmail
        );

        return res.status(200).json({
            status: 'success',
            data: prescription
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            status: 'error',
            message: error.message
        });
    }
};