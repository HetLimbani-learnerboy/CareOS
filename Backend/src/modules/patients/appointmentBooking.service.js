import mongoose from 'mongoose';
import UserIdentity from '../auth/userIdentity.model.js';
import DoctorProfile from '../doctor/doctorProfile.model.js';
import { getDoctorSlotsForDate, resolveDoctorByEmail } from '../doctor/doctorAvailability.service.js';
import Appointment from './appointment.model.js';

const ACTIVE_STATUSES = ['pending', 'confirmed'];

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolvePatient = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw httpError(400, 'Patient email is required.');

  const patient = await UserIdentity.findOne({
    email: normalizedEmail,
    role: 'patient'
  });

  if (!patient) throw httpError(404, 'Patient not found.');
  return patient;
};

export const findDoctorsBySpecialization = async (specialization) => {
  const value = String(specialization || '').trim();
  if (!value) throw httpError(400, 'Specialization is required.');

  const profiles = await DoctorProfile.find({
    specialization: { $regex: `^${escapeRegex(value)}$`, $options: 'i' }
  })
    .populate('doctor_id', 'firstName lastName email role')
    .lean();

  return profiles
    .filter((profile) => profile.doctor_id?.role === 'doctor')
    .map((profile) => ({
      name: `Dr. ${profile.doctor_id.firstName} ${profile.doctor_id.lastName}`.trim(),
      email: profile.doctor_id.email
    }));
};

export const findPublicDoctorProfile = async (email) => {
  const doctor = await resolveDoctorByEmail(email);
  const profile = await DoctorProfile.findOne({ doctor_id: doctor._id })
    .select('-__v -createdAt -updatedAt')
    .lean();

  if (!profile) throw httpError(404, 'Doctor profile not found.');

  return {
    doctor: {
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`.trim(),
      email: doctor.email
    },
    profileData: profile
  };
};

export const findPatientAppointments = async (email) => {
  const patient = await resolvePatient(email);

  const appointments = await Appointment.find({
    patient_id: patient._id,
    status: { $ne: 'cancelled' }
  })
    .populate('doctor_id', 'firstName lastName email')
    .sort({ appointment_date: 1, time_slot: 1 })
    .lean();

  const filteredAppointments = appointments.filter((app) => app.doctor_id);

  const structuredAppointments = await Promise.all(
    filteredAppointments.map(async (appointment) => {
      const profile = await DoctorProfile.findOne({ doctor_id: appointment.doctor_id._id })
        .select('clinic_address consultation_fee qualification')
        .lean();

      return {
        id: String(appointment._id),
        doctorName: `Dr. ${appointment.doctor_id.firstName} ${appointment.doctor_id.lastName}`.trim(),
        doctorEmail: appointment.doctor_id.email,
        specialization: appointment.specialization,
        date: appointment.appointment_date,
        time: appointment.time_slot,
        status: appointment.status,
        reason_for_visit: appointment.reason_for_visit || "",
        qualification: profile?.qualification || "N/A",
        consultation_fee: profile?.consultation_fee || 0,
        clinic_address: profile?.clinic_address || "N/A"
      };
    })
  );

  return structuredAppointments;
};
export const cancelAppointment = async ({ patientEmail, appointmentId }) => {
  if (!mongoose.isValidObjectId(appointmentId)) {
    throw httpError(400, 'A valid appointment ID is required.');
  }

  const patient = await resolvePatient(patientEmail);
  const appointment = await Appointment.findOneAndUpdate(
    { _id: appointmentId, patient_id: patient._id, status: { $in: ACTIVE_STATUSES } },
    { $set: { status: 'cancelled' } },
    { new: true, runValidators: true }
  );
  if (!appointment) throw httpError(404, 'Active appointment not found.');
  return appointment;
};

export const saveAppointmentRequest = async ({
  patientEmail,
  doctorEmail,
  date,
  time,
  symptoms,
  appointmentId
}) => {
  if (!date || !time || !symptoms) {
    throw httpError(400, 'Date, time, and symptoms are required.');
  }

  const [patient, doctor] = await Promise.all([
    resolvePatient(patientEmail),
    resolveDoctorByEmail(doctorEmail)
  ]);

  const profile = await DoctorProfile.findOne({ doctor_id: doctor._id }).lean();
  if (!profile) throw httpError(404, 'Doctor profile not found.');

  const availableSlots = await getDoctorSlotsForDate(doctor, date);
  if (!availableSlots.includes(String(time).trim())) {
    throw httpError(400, 'The selected time is not available on this date.');
  }

  let existingAppointment = null;
  if (appointmentId) {
    if (!mongoose.isValidObjectId(appointmentId)) {
      throw httpError(400, 'Invalid appointment ID.');
    }

    existingAppointment = await Appointment.findOne({
      _id: appointmentId,
      patient_id: patient._id,
      status: { $in: ACTIVE_STATUSES }
    });

    if (!existingAppointment) throw httpError(404, 'Active appointment not found.');
  }

  const collision = await Appointment.exists({
    doctor_id: doctor._id,
    appointment_date: date,
    time_slot: String(time).trim(),
    status: { $in: ACTIVE_STATUSES },
    ...(existingAppointment ? { _id: { $ne: existingAppointment._id } } : {})
  });

  if (collision) throw httpError(409, 'This time slot has already been booked.');

  const values = {
    patient_id: patient._id,
    doctor_id: doctor._id,
    specialization: profile.specialization,
    reason_for_visit: String(symptoms).trim(),
    appointment_date: date,
    time_slot: String(time).trim(),
    status: 'pending'
  };

  if (existingAppointment) {
    existingAppointment.set(values);
    return existingAppointment.save();
  }

  return Appointment.create(values);
};