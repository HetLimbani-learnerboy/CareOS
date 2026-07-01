import LabReportHistory from '../lab_technician/labReportHistory.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import Appointment from '../patients/appointment.model.js';
import Prescription from '../doctor/prescription.model.js';
import mongoose from 'mongoose';

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getDoctorLabReportLedger = async (doctorEmail) => {
  if (!doctorEmail) {
    throw httpError(400, 'Doctor identity session email trace parameter missing.');
  }

  // 1. Resolve Doctor Identity profile
  const doctorUser = await UserIdentity.findOne({
    email: String(doctorEmail).toLowerCase().trim(),
    role: 'doctor'
  }).lean();

  if (!doctorUser) {
    throw httpError(404, 'No active doctor account registration found matching this email.');
  }

  // 2. Fetch all appointments booked under this doctor
  const appointments = await Appointment.find({
    doctor_id: doctorUser._id
  }).lean();

  if (!appointments || appointments.length === 0) {
    return [];
  }

  const appointmentIds = appointments.map(app => app._id);
  const appointmentMap = {};
  appointments.forEach(app => {
    appointmentMap[String(app._id)] = app;
  });

  // 3. Query all Lab Histories linked to those appointments
  const labHistories = await LabReportHistory.find({
    appointmentId: { $in: appointmentIds }
  })
  .sort({ createdAt: -1 })
  .lean();

  if (labHistories.length === 0) {
    return [];
  }

  // 4. Batch resolve full Patient User details in a single query
  const patientIds = [...new Set(labHistories.map(h => h.patientId).filter(Boolean))];
  const patientProfiles = await UserIdentity.find({
    _id: { $in: patientIds },
    role: 'patient'
  }).lean();

  const patientMap = {};
  patientProfiles.forEach(p => {
    patientMap[String(p._id)] = p;
  });

  // 5. Batch resolve associated Prescription details
  const prescriptionIds = [...new Set(labHistories.map(h => h.prescriptionId).filter(Boolean))];
  const prescriptions = await Prescription.find({
    _id: { $in: prescriptionIds }
  }).lean();

  const prescriptionMap = {};
  prescriptions.forEach(pres => {
    prescriptionMap[String(pres._id)] = pres;
  });

  // 6. Assemble the rich composite payload data stream
  return labHistories.map(report => {
    const matchedPatient = patientMap[String(report.patientId)];
    const matchedAppt = appointmentMap[String(report.appointmentId)];
    const matchedPres = prescriptionMap[String(report.prescriptionId)];

    return {
      historyId: String(report._id),
      prescriptionId: String(report.prescriptionId),
      appointmentId: String(report.appointmentId),
      patientId: String(report.patientId),
      status: report.status,
      billingAmount: report.billingAmount || 0,
      isBilled: report.isBilled || false,
      statusTimestamps: report.statusTimestamps || {},
      
      patientDetails: {
        firstName: matchedPatient?.firstName || 'N/A',
        lastName: matchedPatient?.lastName || 'N/A',
        email: matchedPatient?.email || 'N/A',
        phone: matchedPatient?.phone || 'N/A'
      },

      appointmentDetails: {
        reason_for_visit: matchedAppt?.reason_for_visit || 'Routine Checkup',
        appointment_date: matchedAppt?.appointment_date || 'N/A',
        time_slot: matchedAppt?.time_slot || 'N/A'
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