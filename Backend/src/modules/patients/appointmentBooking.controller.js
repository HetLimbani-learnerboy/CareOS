import {
    findDoctorsBySpecialization,
    findPublicDoctorProfile,
    findPatientAppointments,
    cancelAppointment,
    saveAppointmentRequest
} from './appointmentBooking.service.js';
import { getDoctorSlotsForMonthWithBookings } from '../doctor/doctorAvailability.service.js';

export const getDoctorsBySpecialing = async (req, res, next) => {
    try {
        const { specialization } = req.query;
        const doctors = await findDoctorsBySpecialization(specialization);
        return res.status(200).json({ status: 'success', data: doctors });
    } catch (error) {
        return next(error);
    }
};

export const getPublicDoctorMeta = async (req, res, next) => {
    try {
        const { email } = req.query;
        const result = await findPublicDoctorProfile(email);
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return next(error);
    }
};

export const getDoctorSlotsAndAvailability = async (req, res, next) => {
    try {
        const { email } = req.query;
        const year = Number(req.query.year);
        const month = Number(req.query.month);

        if (!email || !req.query.year || !req.query.month) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email, year, and month are required.'
            });
        }

        const data = await getDoctorSlotsForMonthWithBookings(email, year, month);
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return next(error);
    }
};

export const fetchBookedAppointmentsList = async (req, res, next) => {
    try {
        const { email } = req.query;
        const appointments = await findPatientAppointments(email);
        return res.status(200).json({ status: 'success', data: appointments });
    } catch (error) {
        return next(error);
    }
};

export const submitAppointmentRequest = async (req, res, next) => {
    try {
        const { patientEmail, doctorEmail, date, time, symptoms, appointmentId } = req.body;

        if (appointmentId && !date && !time) {
            const appointment = await cancelAppointment({ patientEmail, appointmentId });
            return res.status(200).json({ status: 'success', data: appointment });
        }

        const appointment = await saveAppointmentRequest({
            patientEmail,
            doctorEmail,
            date,
            time,
            symptoms,
            appointmentId
        });

        return res.status(appointmentId ? 200 : 201).json({ status: 'success', data: appointment });
    } catch (error) {
        return next(error);
    }
};