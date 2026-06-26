import mongoose from 'mongoose';
import Appointment from '../patients/appointment.model.js';
import { resolveDoctorByEmail } from './doctorAvailability.service.js';

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const mapAppointment = (appointment) => ({
    id: String(appointment._id),
    patient: `${appointment.patient_id?.firstName || ''} ${appointment.patient_id?.lastName || ''}`.trim() || 'Patient',
    patientEmail: appointment.patient_id?.email || '',
    reason: appointment.reason_for_visit,
    specialization: appointment.specialization,
    date: appointment.appointment_date,
    time: appointment.time_slot,
    status: appointment.status
});

export const getDoctorAppointments = async (email, year, month) => {
    const doctor = await resolveDoctorByEmail(email);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw httpError(400, 'Year must be between 2000 and 2100.');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw httpError(400, 'Month must be between 1 and 12.');
    }

    const query = {
        doctor_id: doctor._id,
        status: { $in: ['pending', 'confirmed'] },
        appointment_date: {
            $regex: `^${year}-${String(month).padStart(2, '0')}-`
        }
    };

    const appointments = await Appointment.find(query)
        .populate('patient_id', 'firstName lastName email')
        .sort({ appointment_date: 1, time_slot: 1 })
        .lean();

    const mapped = appointments.map(mapAppointment);
    return {
        pendingRequests: mapped.filter((appointment) => appointment.status === 'pending'),
        appointments: mapped.filter((appointment) => appointment.status === 'confirmed')
    };
};

export const setAppointmentStatus = async ({
    email,
    appointmentId,
    status
}) => {
    if (!mongoose.isValidObjectId(appointmentId)) {
        throw httpError(400, 'A valid appointment ID is required.');
    }
    if (!['confirmed', 'rejected'].includes(status)) {
        throw httpError(400, 'Status must be confirmed or rejected.');
    }

    const doctor = await resolveDoctorByEmail(email);
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctor_id: doctor._id,
        status: 'pending'
    });

    if (!appointment) throw httpError(404, 'Pending appointment request not found.');

    if (status === 'confirmed') {
        const collision = await Appointment.exists({
            _id: { $ne: appointment._id },
            doctor_id: doctor._id,
            appointment_date: appointment.appointment_date,
            time_slot: appointment.time_slot,
            status: 'confirmed'
        });

        if (collision) throw httpError(409, 'Another appointment already occupies this slot.');
    }

    appointment.status = status;
    await appointment.save();
    await appointment.populate('patient_id', 'firstName lastName email');
    return mapAppointment(appointment);
};