import { MedicineCatalog, LabReportCatalog } from '../doctor/catalog.model.js';
import Prescription from '../doctor/prescription.model.js';
import Admission from '../receptionist/admission.model.js';
import UserIdentity from '../auth/userIdentity.model.js';

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

function mongoose_isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(String(id));
}

const resolveNurseByEmail = async (nurseEmail) => {
    const normalizedEmail = normalizeEmail(nurseEmail);
    if (!normalizedEmail) throw httpError(400, 'Nurse session identification trace parameters are missing.');

    const nurse = await UserIdentity.findOne({ email: normalizedEmail, role: 'nurse' }).lean();
    if (!nurse) throw httpError(404, 'Nurse profile authorization records mismatch.');
    return nurse;
};

export const getCatalogDataBySpecialization = async (specialization) => {
    if (!specialization) {
        throw httpError(400, 'Specialization criteria mapping missing.');
    }

    const [medicines, labReports] = await Promise.all([
        MedicineCatalog.find({ specialization }).select('medicine_name category composition price -_id').lean(),
        LabReportCatalog.find({ specialization }).select('report_name category sample_type price -_id').lean()
    ]);

    return { medicines, labReports };
};

export const savePatientEPrescription = async (prescriptionData) => {
    const {
        appointmentId,
        patientEmail,
        prescriptionName,
        diagnosis,
        notes,
        result,
        medicines,
        labReports
    } = prescriptionData;

    if (!patientEmail || !result) {
        throw httpError(400, 'Mandatory properties missing. Summary outcome findings and patient verification keys required.');
    }

    const cleanMedicines = (medicines || []).filter(m => m.medicine && m.medicine.trim() !== "");
    const cleanLabReports = (labReports || []).filter(l => l && l.trim() !== "");

    return await Prescription.create({
        appointmentId,
        patientEmail: normalizeEmail(patientEmail),
        prescriptionName,
        diagnosis,
        notes,
        result,
        medicines: cleanMedicines,
        labReports: cleanLabReports
    });
};

export const getNursePatientRoster = async (nurseEmail) => {
    const nurse = await resolveNurseByEmail(nurseEmail);

    const admissions = await Admission.find({
        nurseIds: nurse._id,
        status: { $ne: 'Discharged' }
    })
        .sort({ admittedAt: -1 })
        .lean();

    if (!admissions || admissions.length === 0) {
        return [];
    }

    const byPatient = new Map();
    for (const adm of admissions) {
        const email = normalizeEmail(adm.patientEmail);
        if (!byPatient.has(email)) {
            byPatient.set(email, {
                patientEmail: email,
                patientName: adm.patientName,
                lastVisitDate: adm.admittedAt,
                lastVisitTime: "Ward Admission Check-In",
                totalVisits: 0,
                totalPrescriptions: 0
            });
        }
        const entry = byPatient.get(email);
        entry.totalVisits += 1;
        if (adm.admittedAt > entry.lastVisitDate) {
            entry.lastVisitDate = adm.admittedAt;
        }
    }

    const patientEmails = Array.from(byPatient.keys());

    const prescriptionCounts = await Prescription.aggregate([
        { $match: { patientEmail: { $in: patientEmails } } },
        { $group: { _id: '$patientEmail', count: { $sum: 1 } } }
    ]);

    const countMap = new Map(prescriptionCounts.map(p => [p._id, p.count]));
    const roster = Array.from(byPatient.values());

    return roster.map(entry => ({
        ...entry,
        totalPrescriptions: countMap.get(entry.patientEmail) || 0
    }));
};

export const getPatientHistoryForNurse = async (nurseEmail, patientEmail) => {
    const nurse = await resolveNurseByEmail(nurseEmail);
    const normalizedPatientEmail = normalizeEmail(patientEmail);

    if (!normalizedPatientEmail) {
        throw httpError(400, 'Target patient evaluation identity missing.');
    }

    const admissions = await Admission.find({
        nurseIds: nurse._id,
        patientEmail: normalizedPatientEmail
    })
        .sort({ admittedAt: -1 })
        .lean();

    const prescriptionIds = admissions.map(a => a.prescriptionId).filter(Boolean);

    const prescriptions = await Prescription.find({
        _id: { $in: prescriptionIds }
    })
        .sort({ createdAt: -1 })
        .lean();

    const prescriptionsMap = new Map(prescriptions.map(p => [String(p._id), p]));

    const timeline = admissions.map(adm => ({
        appointmentId: String(adm._id),
        date: adm.admittedAt,
        time: "Inpatient Ward Session",
        reason: `${adm.roomType} Placement`,
        status: adm.status,
        prescription: prescriptionsMap.get(String(adm.prescriptionId)) || null
    }));

    return {
        patient: {
            name: admissions[0]?.patientName || "Identified Ward Patient",
            email: normalizedPatientEmail
        },
        timeline,
        prescriptions
    };
};

export const updatePrescriptionForNurse = async (prescriptionId, nurseEmail, updates) => {
    if (!mongoose_isValidObjectId(prescriptionId)) {
        throw httpError(400, 'A valid prescription ID is required.');
    }

    const nurse = await resolveNurseByEmail(nurseEmail);
    const authorizationVerify = await Admission.exists({ prescriptionId, nurseIds: nurse._id });
    if (!authorizationVerify) {
        throw httpError(403, 'Permission denied. This prescription tracking log falls outside your assigned duty rosters.');
    }

    const allowedFields = ['prescriptionName', 'diagnosis', 'notes', 'result', 'medicines', 'labReports'];
    const sanitizedUpdates = {};
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            sanitizedUpdates[field] = updates[field];
        }
    }

    if (sanitizedUpdates.medicines) {
        sanitizedUpdates.medicines = sanitizedUpdates.medicines.filter(m => m.medicine && m.medicine.trim() !== "");
    }
    if (sanitizedUpdates.labReports) {
        sanitizedUpdates.labReports = sanitizedUpdates.labReports.filter(l => l && l.trim() !== "");
    }

    const prescription = await Prescription.findByIdAndUpdate(
        prescriptionId,
        { $set: sanitizedUpdates },
        { new: true, runValidators: true }
    );

    return prescription;
};

export const deletePrescriptionForNurse = async (prescriptionId, nurseEmail) => {
    if (!mongoose_isValidObjectId(prescriptionId)) {
        throw httpError(400, 'A valid prescription ID is required.');
    }

    const nurse = await resolveNurseByEmail(nurseEmail);
    const authorizationVerify = await Admission.exists({ prescriptionId, nurseIds: nurse._id });
    if (!authorizationVerify) {
        throw httpError(403, 'Administrative execution denied. Structural mapping rights restriction criteria active.');
    }

    await Prescription.findByIdAndDelete(prescriptionId);

    // Clear out tracking reference variables inside the corresponding admission tracker
    await Admission.updateMany({ prescriptionId }, { $unset: { prescriptionId: "" } });

    return { deleted: true, prescriptionId };
};