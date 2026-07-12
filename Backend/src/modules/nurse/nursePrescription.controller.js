import * as prescriptionService from './nursePrescription.service.js';

export const fetchCatalogs = async (req, res, next) => {
    try {
        const nurseEmail = req.headers['x-user-email'] || req.query.nurseEmail;
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
        const nurseEmail = req.headers['x-user-email'];
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
        const nurseEmail = req.headers['x-user-email'] || req.query.nurseEmail;
        const roster = await prescriptionService.getNursePatientRoster(nurseEmail);

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
        const nurseEmail = req.headers['x-user-email'] || req.query.nurseEmail;
        const { patientEmail } = req.query;

        const history = await prescriptionService.getPatientHistoryForNurse(nurseEmail, patientEmail);

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
        const nurseEmail = req.headers['x-user-email'] || req.body.nurseEmail;

        const prescription = await prescriptionService.updatePrescriptionForNurse(
            prescriptionId,
            nurseEmail,
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
        const nurseEmail = req.headers['x-user-email'] || req.query.nurseEmail;

        const result = await prescriptionService.deletePrescriptionForNurse(prescriptionId, nurseEmail);

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