import * as prescriptionService from './doctorPrescription.service.js';

export const fetchCatalogs = async (req, res, next) => {
    try {
        const { specialization } = req.query;
        const records = await prescriptionService.getCatalogDataBySpecialization(specialization);

        return res.status(200).json({
            status: 'success',
            data: records
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            status: 'error',
            message: error.message
        });
    }
};

export const createPrescription = async (req, res, next) => {
    try {
        const prescription = await prescriptionService.savePatientEPrescription(req.body);

        return res.status(201).json({
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

export const fetchDoctorPatientRoster = async (req, res, next) => {
    try {
        const doctorEmail = req.query.doctorEmail || req.query.email;
        const roster = await prescriptionService.getDoctorPatientRoster(doctorEmail);

        return res.status(200).json({
            status: 'success',
            data: roster
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            status: 'error',
            message: error.message
        });
    }
};

export const fetchPatientHistory = async (req, res, next) => {
    try {
        const doctorEmail = req.query.doctorEmail || req.query.email;
        const { patientEmail } = req.query;

        const history = await prescriptionService.getPatientHistoryForDoctor(doctorEmail, patientEmail);

        return res.status(200).json({
            status: 'success',
            data: history
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            status: 'error',
            message: error.message
        });
    }
};

export const updatePrescription = async (req, res, next) => {
    try {
        const { prescriptionId } = req.params;
        const doctorEmail = req.body.doctorEmail || req.query.doctorEmail || req.query.email;

        const prescription = await prescriptionService.updatePrescriptionForDoctor(
            prescriptionId,
            doctorEmail,
            req.body
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

export const deletePrescription = async (req, res, next) => {
    try {
        const { prescriptionId } = req.params;
        const doctorEmail = req.query.doctorEmail || req.query.email || req.body.doctorEmail;

        const result = await prescriptionService.deletePrescriptionForDoctor(prescriptionId, doctorEmail);

        return res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            status: 'error',
            message: error.message
        });
    }
};