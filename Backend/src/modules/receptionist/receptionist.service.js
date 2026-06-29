import Appointment from '../patients/appointment.model.js';
import Prescription from '../doctor/prescription.model.js'; // Assumed path relative to project structure
import UserIdentity from '../auth/userIdentity.model.js';

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getSystemDashboardMetrics = async () => {
  const allAppointments = await Appointment.find({}).lean();
  const allPrescriptionAptIds = await Prescription.distinct('appointmentId');
  const prescriptionSet = new Set(allPrescriptionAptIds.map(id => String(id)));

  let confirmedCount = 0; // Upcoming Confirmed Sessions
  let awaitingCount = 0;  // Upcoming Awaiting Signoff (Pending actions)
  let concludedCount = 0; // Concluded / Visited Sessions (Has Prescription match)
  let declinedCount = 0;  // Declined & Cancelled Logs

  for (const app of allAppointments) {
    const appStatus = String(app.status);
    const appIdStr = String(app._id);

    if (prescriptionSet.has(appIdStr)) {
      concludedCount++;
    } else if (appStatus === 'confirmed') {
      confirmedCount++;
    } else if (appStatus === 'pending') {
      awaitingCount++;
    } else if (appStatus === 'rejected' || appStatus === 'cancelled') {
      declinedCount++;
    }
  }

  return {
    upcomingConfirmed: confirmedCount,
    awaitingSignoff: awaitingCount,
    concludedVisited: concludedCount,
    declinedCancelled: declinedCount
  };
};

export const getAllAppointmentsOverview = async (filterStatus, searchString) => {
  const query = {};

  // Handle baseline collection level routing match logic
  if (filterStatus === 'concluded') {
    const concludedIds = await Prescription.distinct('appointmentId');
    query._id = { $in: concludedIds };
  } else if (filterStatus === 'declined') {
    query.status = { $in: ['rejected', 'cancelled'] };
  } else if (filterStatus === 'confirmed' || filterStatus === 'pending') {
    query.status = filterStatus;
    // Ensure concluded items don't leak back down into pending/confirmed tabs
    const concludedIds = await Prescription.distinct('appointmentId');
    query._id = { $nin: concludedIds };
  }

  // Populate references to build deep profile search conditions
  let appointments = await Appointment.find(query)
    .populate('patient_id', 'firstName lastName email')
    .populate('doctor_id', 'firstName lastName email')
    .sort({ appointment_date: 1, time_slot: 1 })
    .lean();

  // Handle structural search parameters across fields
  if (searchString && searchString.trim() !== '') {
    const regex = new RegExp(searchString.trim(), 'i');
    appointments = appointments.filter(app => {
      const pName = `${app.patient_id?.firstName || ''} ${app.patient_id?.lastName || ''}`;
      const dName = `${app.doctor_id?.firstName || ''} ${app.doctor_id?.lastName || ''}`;
      const pEmail = app.patient_id?.email || '';
      const dEmail = app.doctor_id?.email || '';
      const reason = app.reason_for_visit || '';

      return regex.test(pName) || regex.test(dName) || regex.test(pEmail) || regex.test(dEmail) || regex.test(reason);
    });
  }

  return appointments.map(app => ({
    id: String(app._id),
    patientName: `${app.patient_id?.firstName || 'Anonymous'} ${app.patient_id?.lastName || ''}`.trim(),
    patientEmail: app.patient_id?.email || 'N/A',
    doctorName: `Dr. ${app.doctor_id?.firstName || 'Unknown'} ${app.doctor_id?.lastName || ''}`.trim(),
    doctorEmail: app.doctor_id?.email || 'N/A',
    date: app.appointment_date,
    time: app.time_slot,
    status: app.status,
    reason: app.reason_for_visit
  }));
};

export const processAppointmentAction = async (appointmentId, action) => {
  if (!/^[a-fA-F0-9]{24}$/.test(String(appointmentId))) {
    throw httpError(400, 'Invalid appointment reference verification tracking identity.');
  }

  let targetStatus;
  if (action === 'confirm') {
    targetStatus = 'confirmed';
  } else if (action === 'reject') {
    targetStatus = 'rejected';
  } else {
    throw httpError(400, "Invalid action processing demand. Expects 'confirm' or 'reject'.");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw httpError(404, 'Appointment target record file details missing.');
  }

  // Double mutation block checks
  if (appointment.status === 'cancelled') {
    throw httpError(400, 'Cannot process an administrative status update on a patient-cancelled session.');
  }

  appointment.status = targetStatus;
  await appointment.save();

  return appointment;
};