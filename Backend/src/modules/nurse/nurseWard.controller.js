import { 
    findNurseByEmail, 
    getActiveAdmissionsForNurse, 
    updateAdmissionDischargeStatus, 
    completeFinalDischargeCheckout,
    appendPatientVitalsRecord 
} from './nurseWard.service.js';

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const fetchNurseAssignedAdmissions = async (req, res, next) => {
    try {
        const nurseEmail = req.headers['x-user-email'];
        if (!nurseEmail) {
            throw httpError(400, 'Nurse structural processing identification tracking context missing.');
        }

        const nurse = await findNurseByEmail(nurseEmail);
        if (!nurse) {
            throw httpError(404, 'Nurse processing tracking operational layout directory profile details missing.');
        }

        const activeAdmissions = await getActiveAdmissionsForNurse(nurse._id);
        
        return res.status(200).json({ 
            success: true, 
            data: activeAdmissions 
        });
    } catch (err) {
        next(err);
    }
};

export const markReadyForDischarge = async (req, res, next) => {
    try {
        const { admissionId } = req.params;
        if (!/^[a-fA-F0-9]{24}$/.test(String(admissionId))) {
            throw httpError(400, 'Invalid structural reference validation key sequence.');
        }

        const updatedRecord = await updateAdmissionDischargeStatus(admissionId);

        return res.status(200).json({ 
            success: true, 
            message: 'Patient profile discharge eligibility timestamp updated.', 
            data: updatedRecord 
        });
    } catch (err) {
        next(err);
    }
};

export const executeDischargeCheckout = async (req, res, next) => {
    try {
        const { admissionId } = req.params;
        if (!/^[a-fA-F0-9]{24}$/.test(String(admissionId))) {
            throw httpError(400, 'Invalid administrative tracking key reference formatting.');
        }

        const dischargedRecord = await completeFinalDischargeCheckout(admissionId);

        return res.status(200).json({
            success: true,
            message: 'Patient completely discharged. Corresponding ward unit space state is now set to Available.',
            data: dischargedRecord
        });
    } catch (err) {
        next(err);
    }
};

export const recordPatientVitals = async (req, res, next) => {
    try {
        const { admissionId } = req.params;
        const { bloodPressure, heartRate, temperature } = req.body;

        if (!/^[a-fA-F0-9]{24}$/.test(String(admissionId))) {
            throw httpError(400, 'Invalid administrative tracker ID mapping reference logic.');
        }

        if (!bloodPressure || heartRate === undefined || temperature === undefined) {
            throw httpError(400, 'Missing core elements. BP structural text mapping, heart rate, and temperature indices are mandatory.');
        }

        const updatedRecord = await appendPatientVitalsRecord(admissionId, {
            bloodPressure,
            heartRate,
            temperature
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Patient clinical vitals matrices track logged successfully.', 
            data: updatedRecord 
        });
    } catch (err) {
        next(err);
    }
};