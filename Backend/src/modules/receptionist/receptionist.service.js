import Appointment from '../patients/appointment.model.js';
import Prescription from '../doctor/prescription.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import DoctorProfile from '../doctor/doctorProfile.model.js';
import { sendRescheduleNotificationEmail, sendAppointmentStatusEmail } from '../../service/email.service.js';
import { getDoctorSlotsForDate, resolveDoctorByEmail } from '../doctor/doctorAvailability.service.js';

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const getSystemDashboardMetrics = async () => {
  const allAppointments = await Appointment.find({}).lean();
  const allPrescriptionAptIds = await Prescription.distinct('appointmentId');
  const prescriptionSet = new Set(allPrescriptionAptIds.map(id => String(id)));

  let confirmedCount = 0;
  let awaitingCount = 0;
  let concludedCount = 0;
  let declinedCount = 0;

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

  if (filterStatus === 'concluded') {
    const concludedIds = await Prescription.distinct('appointmentId');
    query._id = { $in: concludedIds };
  } else if (filterStatus === 'declined') {
    query.status = { $in: ['rejected', 'cancelled'] };
  } else if (filterStatus === 'confirmed' || filterStatus === 'pending') {
    query.status = filterStatus;
    const concludedIds = await Prescription.distinct('appointmentId');
    query._id = { $nin: concludedIds };
  }

  let appointments = await Appointment.find(query)
    .populate('patient_id', 'firstName lastName email')
    .populate('doctor_id', 'firstName lastName email')
    .sort({ appointment_date: 1, time_slot: 1 })
    .lean();

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

  const doctorIds = [...new Set(appointments.map(app => app.doctor_id?._id).filter(Boolean))];
  const profiles = await DoctorProfile.find({ doctor_id: { $in: doctorIds } }, 'doctor_id qualification specialization').lean();

  const doctorMetaMap = {};
  profiles.forEach(p => {
    doctorMetaMap[String(p.doctor_id)] = {
      qualification: p.qualification || 'N/A',
      specialization: p.specialization || 'N/A'
    };
  });

  return appointments.map(app => {
    const doctorIdStr = app.doctor_id ? String(app.doctor_id._id) : null;
    const meta = doctorIdStr ? doctorMetaMap[doctorIdStr] : null;

    return {
      id: String(app._id),
      patientName: `${app.patient_id?.firstName || 'Anonymous'} ${app.patient_id?.lastName || ''}`.trim(),
      patientEmail: app.patient_id?.email || 'N/A',
      doctorName: `Dr. ${app.doctor_id?.firstName || 'Unknown'} ${app.doctor_id?.lastName || ''}`.trim(),
      doctorEmail: app.doctor_id?.email || 'N/A',
      doctorqualification: meta ? meta.qualification : 'N/A',
      specialization: meta ? meta.specialization : 'N/A',
      date: app.appointment_date,
      time: app.time_slot,
      status: app.status,
      reason: app.reason_for_visit
    };
  });
};

export const processAppointmentAction = async (appointmentId, action) => {
  if (!/^[a-fA-F0-9]{24}$/.test(String(appointmentId))) {
    throw httpError(400, 'Invalid appointment reference identity.');
  }

  let targetStatus;
  if (action === 'confirm') {
    targetStatus = 'confirmed';
  } else if (action === 'reject') {
    targetStatus = 'rejected';
  } else if (action === 'cancel') {
    targetStatus = 'cancelled';
  } else {
    throw httpError(400, "Invalid action processing demand. Expects 'confirm', 'reject', or 'cancel'.");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw httpError(404, 'Appointment target record file details missing.');
  }

  if (appointment.status === 'cancelled' && action !== 'cancel') {
    throw httpError(400, 'Cannot process status changes on an already cancelled session.');
  }

  appointment.status = targetStatus;
  await appointment.save();

  await appointment.populate([
    { path: 'patient_id', select: 'firstName lastName email' },
    { path: 'doctor_id', select: 'firstName lastName' }
  ]);

  const patientEmail = appointment.patient_id?.email;
  const patientFirst = appointment.patient_id?.firstName || 'Patient';
  const doctorFullName = `${appointment.doctor_id?.firstName || 'Unknown'} ${appointment.doctor_id?.lastName || ''}`.trim();

  if (patientEmail) {
    sendAppointmentStatusEmail(patientEmail, patientFirst.trim(), doctorFullName, appointment.appointment_date, appointment.time_slot, targetStatus)
      .catch(err => console.error('[Receptionist Action Notification Pipeline Exception]:', err.message));
  }

  return appointment;
};

export const saveReceptionistWalkInBooking = async (bookingData) => {
  const { 
    firstName, 
    lastName, 
    patientEmail, 
    doctorEmail, 
    date, 
    time, 
    symptoms,
    appointmentId
  } = bookingData;

  const normalizedPatientEmail = normalizeEmail(patientEmail);
  const normalizedDoctorEmail = normalizeEmail(doctorEmail);

  const doctorUser = await resolveDoctorByEmail(normalizedDoctorEmail);
  if (!doctorUser) {
    throw httpError(404, 'Practitioner with the requested profile could not be located.');
  }
  const doctorFullName = `${doctorUser.firstName || 'Unknown'} ${doctorUser.lastName || ''}`.trim();

  if (appointmentId) {
    if (!/^[a-fA-F0-9]{24}$/.test(String(appointmentId))) {
      throw httpError(400, 'Invalid appointment reference configuration identity.');
    }

    const appointment = await Appointment.findById(appointmentId).populate('patient_id', 'firstName lastName email');
    if (!appointment) {
      throw httpError(404, 'Appointment target record file details missing.');
    }

    const collision = await Appointment.exists({
      _id: { $ne: appointmentId },
      doctor_id: doctorUser._id,
      appointment_date: date,
      time_slot: String(time).trim(),
      status: { $in: ['pending', 'confirmed'] }
    });

    if (collision) {
      throw httpError(409, 'Operational tracking conflict. This chosen interval is already reserved.');
    }

    appointment.appointment_date = date;
    appointment.time_slot = String(time).trim();
    appointment.reason_for_visit = String(symptoms || appointment.reason_for_visit).trim();
    appointment.status = 'confirmed'; 
    await appointment.save();

    const patientFirst = appointment.patient_id?.firstName || firstName || 'Patient';
    const clientEmail = appointment.patient_id?.email || normalizedPatientEmail;

    sendRescheduleNotificationEmail(clientEmail, patientFirst.trim(), doctorFullName, date, time)
      .catch(err => console.error('[Notification Pipeline Exception]:', err.message));

    return appointment;
  }

  if (!firstName || !patientEmail || !doctorEmail || !date || !time || !symptoms) {
    throw httpError(400, 'Missing core elements. Patient names, email, doctor context, date, time, and symptoms are required.');
  }

  let patientUser = await UserIdentity.findOne({ email: normalizedPatientEmail, role: 'patient' });

  if (!patientUser) {
    patientUser = await UserIdentity.create({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      email: normalizedPatientEmail,
      role: 'patient',
      password: 'WALK_IN_PLACEHOLDER_PASS'
    });
  }

  const doctorProfile = await DoctorProfile.findOne({ doctor_id: doctorUser._id }).lean();
  if (!doctorProfile) {
    throw httpError(404, 'Doctor configuration profile structure mapping missing.');
  }

  const collision = await Appointment.exists({
    doctor_id: doctorUser._id,
    appointment_date: date,
    time_slot: String(time).trim(),
    status: { $in: ['pending', 'confirmed'] }
  });

  if (collision) {
    throw httpError(409, 'Operational tracking conflict. This chosen interval is already reserved.');
  }

  const appointmentRecord = await Appointment.create({
    patient_id: patientUser._id,
    doctor_id: doctorUser._id,
    specialization: doctorProfile.specialization,
    reason_for_visit: String(symptoms).trim(),
    appointment_date: date,
    time_slot: String(time).trim(),
    status: 'confirmed' 
  });

  return appointmentRecord;
};