import LabReportHistory from '../lab_technician/labReportHistory.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import Prescription from '../doctor/prescription.model.js';
import Admission from '../receptionist/admission.model.js';

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const getNurseLabReportLedger = async (nurseEmail) => {
    if (!nurseEmail) {
        throw httpError(400, 'Nurse identity session email trace parameter missing.');
    }

    const nurseUser = await UserIdentity.findOne({
        email: String(nurseEmail).toLowerCase().trim(),
        role: 'nurse'
    }).lean();

    if (!nurseUser) {
        throw httpError(404, 'No active nurse account registration found matching this email.');
    }

    const activeAdmissions = await Admission.find({
        nurseIds: nurseUser._id,
        status: 'Admitted'
    }).lean();

    if (!activeAdmissions || activeAdmissions.length === 0) {
        return [];
    }

    const patientIds = activeAdmissions.map(item => item.patientId);

    const labHistories = await LabReportHistory.find({
        patientId: { $in: patientIds }
    })
        .sort({ createdAt: -1 })
        .lean();

    if (labHistories.length === 0) {
        return [];
    }

    const patientProfiles = await UserIdentity.find({
        _id: { $in: patientIds }
    }).lean();

    const patientMap = {};
    patientProfiles.forEach(p => {
        patientMap[String(p._id)] = p;
    });

    const prescriptionIds = [...new Set(labHistories.map(h => h.prescriptionId).filter(Boolean))];
    const prescriptions = await Prescription.find({
        _id: { $in: prescriptionIds }
    }).lean();

    const prescriptionMap = {};
    prescriptions.forEach(pres => {
        prescriptionMap[String(pres._id)] = pres;
    });

    return labHistories.map(report => {
        const matchedPatient = patientMap[String(report.patientId)];
        const matchedPres = prescriptionMap[String(report.prescriptionId)];

        return {
            historyId: String(report._id),
            prescriptionId: String(report.prescriptionId || ''),
            appointmentId: String(report.appointmentId || ''),
            patientId: String(report.patientId),
            status: report.status,
            billingAmount: report.billingAmount || 0,
            isBilled: report.isBilled || false,
            statusTimestamps: report.statusTimestamps || {},
            requestedTests: report.requestedTests || [],
            createdAt: report.createdAt,

            patientDetails: {
                firstName: matchedPatient?.firstName || 'N/A',
                lastName: matchedPatient?.lastName || 'N/A',
                email: matchedPatient?.email || 'N/A',
                phone: matchedPatient?.phone || 'N/A'
            },

            prescriptionDetails: {
                prescriptionName: matchedPres?.prescriptionName || 'Standard Management Pack',
                diagnosis: matchedPres?.diagnosis || 'N/A',
                notes: matchedPres?.notes || 'N/A',
                result: matchedPres?.result || 'N/A',
                medicines: matchedPres?.medicines || [],
                labReports: matchedPres?.labReports || []
            },

            reportData: report.status === 'completed' ? {
                findings: report.reportData?.findings || 'N/A',
                notes: report.reportData?.notes || 'N/A',
                generatedAt: report.reportData?.generatedAt
            } : null
        };
    });
};