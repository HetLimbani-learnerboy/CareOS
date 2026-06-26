import { MedicineCatalog, LabReportCatalog } from './catalog.model.js';
import Prescription from './prescription.model.js';
import Appointment from '../patients/appointment.model.js';
import UserIdentity from '../auth/userIdentity.model.js';

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const getCatalogDataBySpecialization = async (specialization) => {
    if (!specialization) {
        throw httpError(400, 'Specialization field parameter is required.');
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
        doctorEmail,
        prescriptionName,
        diagnosis,
        notes,
        result,
        medicines,
        labReports
    } = prescriptionData;

    if (!appointmentId || !patientEmail || !doctorEmail || !result) {
        throw httpError(400, 'Missing mandatory properties. Appointment ID, Patient Email, Doctor Email, and Result are required.');
    }

    // Double creation safeguard evaluation verification check
    const duplicateCheck = await Prescription.findOne({ appointmentId }).lean();
    if (duplicateCheck) {
        throw httpError(409, 'An electronic medical prescription record profile stands tracked for this scheduled visit already.');
    }

    const cleanMedicines = (medicines || []).filter(m => m.medicine && m.medicine.trim() !== "");
    const cleanLabReports = (labReports || []).filter(l => l && l.trim() !== "");

    const doctorUser = await UserIdentity.findOne({ email: normalizeEmail(doctorEmail), role: 'doctor' }).lean();
    if (!doctorUser) {
        throw httpError(404, 'Doctor account identity mapping record not found.');
    }

    const doctorName = `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`.trim();

    return await Prescription.create({
        appointmentId,
        patientEmail: normalizeEmail(patientEmail),
        doctorEmail: normalizeEmail(doctorEmail),
        doctorName,
        prescriptionName,
        diagnosis,
        notes,
        result,
        medicines: cleanMedicines,
        labReports: cleanLabReports
    });
};

const resolveDoctorByEmail = async (doctorEmail) => {
    const normalizedEmail = normalizeEmail(doctorEmail);
    if (!normalizedEmail) throw httpError(400, 'Doctor email is required.');

    const doctor = await UserIdentity.findOne({ email: normalizedEmail, role: 'doctor' }).lean();
    if (!doctor) throw httpError(404, 'Doctor account not found.');
    return doctor;
};

export const getDoctorPatientRoster = async (doctorEmail) => {
    const doctor = await resolveDoctorByEmail(doctorEmail);

    const appointments = await Appointment.find({
        doctor_id: doctor._id,
        status: { $in: ['confirmed', 'pending', 'rejected', 'cancelled'] }
    })
        .populate('patient_id', 'firstName lastName email')
        .sort({ appointment_date: -1 })
        .lean();

    const consulted = appointments.filter(a => a.status === 'confirmed' && a.patient_id);

    const byPatient = new Map();
    for (const apt of consulted) {
        const email = apt.patient_id.email;
        if (!byPatient.has(email)) {
            byPatient.set(email, {
                patientEmail: email,
                patientName: `${apt.patient_id.firstName} ${apt.patient_id.lastName}`.trim(),
                lastVisitDate: apt.appointment_date,
                lastVisitTime: apt.time_slot,
                totalVisits: 0
            });
        }
        const entry = byPatient.get(email);
        entry.totalVisits += 1;
        if (apt.appointment_date > entry.lastVisitDate) {
            entry.lastVisitDate = apt.appointment_date;
            entry.lastVisitTime = apt.time_slot;
        }
    }

    const roster = Array.from(byPatient.values());

    const prescriptionCounts = await Prescription.aggregate([
        { $match: { doctorEmail: normalizeEmail(doctorEmail) } },
        { $group: { _id: '$patientEmail', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(prescriptionCounts.map(p => [p._id, p.count]));

    return roster
        .map(entry => ({
            ...entry,
            totalPrescriptions: countMap.get(entry.patientEmail) || 0
        }))
        .sort((a, b) => (a.lastVisitDate < b.lastVisitDate ? 1 : -1));
};

// 2. Full clinical history for one patient, scoped to this doctor only.
//    Excludes 'rejected' and 'cancelled' appointment statuses from the timeline.
export const getPatientHistoryForDoctor = async (doctorEmail, patientEmail) => {
    const doctor = await resolveDoctorByEmail(doctorEmail);
    const normalizedPatientEmail = normalizeEmail(patientEmail);

    if (!normalizedPatientEmail) {
        throw httpError(400, 'Patient email is required.');
    }

    const patient = await UserIdentity.findOne({ email: normalizedPatientEmail, role: 'patient' }).lean();
    if (!patient) throw httpError(404, 'Patient not found.');

    const [appointments, prescriptions] = await Promise.all([
        Appointment.find({
            doctor_id: doctor._id,
            patient_id: patient._id,
            // CRITICAL FIX: Only fetch valid appointments. Exclude 'rejected' and 'cancelled'
            status: { $nin: ['rejected', 'cancelled'] }
        })
            .sort({ appointment_date: -1 })
            .lean(),
        Prescription.find({
            doctorEmail: normalizeEmail(doctorEmail),
            patientEmail: normalizedPatientEmail
        })
            .sort({ created_at: -1 })
            .lean()
    ]);

    const prescriptionsByAppointment = new Map(
        prescriptions.map(p => [String(p.appointmentId), p])
    );

    const timeline = appointments.map(apt => ({
        appointmentId: String(apt._id),
        date: apt.appointment_date,
        time: apt.time_slot,
        reason: apt.reason_for_visit,
        status: apt.status,
        prescription: prescriptionsByAppointment.get(String(apt._id)) || null
    }));

    return {
        patient: {
            name: `${patient.firstName} ${patient.lastName}`.trim(),
            email: patient.email
        },
        timeline,
        prescriptions
    };
};

export const updatePrescriptionForDoctor = async (prescriptionId, doctorEmail, updates) => {
    if (!mongoose_isValidObjectId(prescriptionId)) {
        throw httpError(400, 'A valid prescription ID is required.');
    }

    const normalizedDoctorEmail = normalizeEmail(doctorEmail);

    const allowedFields = ['prescriptionName', 'diagnosis', 'notes', 'result', 'medicines', 'labReports'];
    const sanitizedUpdates = {};
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            sanitizedUpdates[field] = updates[field];
        }
    }

    if (sanitizedUpdates.medicines) {
        sanitizedUpdates.medicines = sanitizedUpdates.medicines.filter(
            m => m.medicine && m.medicine.trim() !== ""
        );
    }
    if (sanitizedUpdates.labReports) {
        sanitizedUpdates.labReports = sanitizedUpdates.labReports.filter(
            l => l && l.trim() !== ""
        );
    }

    const prescription = await Prescription.findOneAndUpdate(
        { _id: prescriptionId, doctorEmail: normalizedDoctorEmail },
        { $set: sanitizedUpdates },
        { new: true, runValidators: true }
    );

    if (!prescription) {
        throw httpError(404, 'Prescription not found or you do not have permission to edit it.');
    }

    return prescription;
};

export const deletePrescriptionForDoctor = async (prescriptionId, doctorEmail) => {
    if (!mongoose_isValidObjectId(prescriptionId)) {
        throw httpError(400, 'A valid prescription ID is required.');
    }

    const normalizedDoctorEmail = normalizeEmail(doctorEmail);

    const result = await Prescription.findOneAndDelete({
        _id: prescriptionId,
        doctorEmail: normalizedDoctorEmail
    });

    if (!result) {
        throw httpError(404, 'Prescription not found or you do not have permission to delete it.');
    }

    return { deleted: true, prescriptionId };
};

function mongoose_isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(String(id));
}