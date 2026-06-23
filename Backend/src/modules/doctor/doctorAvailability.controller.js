import {
  getDoctorSlotsForMonth,
  saveDayOverrideSlots
} from './doctorAvailability.service.js';
import {
  getDoctorAppointments,
  setAppointmentStatus
} from './doctorAppointment.service.js';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const ownsDoctorAccount = (req, email) =>
  req.user?.role === 'doctor' && req.user.email === normalizeEmail(email);

export const fetchScheduleMatrix = async (req, res, next) => {
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

    const data = await getDoctorSlotsForMonth(email, year, month);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

export const updateSingleDaySlots = async (req, res, next) => {
  try {
    const { email, date, slots } = req.body;

    if (!email || !date || slots === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email, date, and slots are required.'
      });
    }
    if (!ownsDoctorAccount(req, email)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only update your own availability.'
      });
    }

    const data = await saveDayOverrideSlots(email, date, slots);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

export const fetchDoctorAppointmentRoster = async (req, res, next) => {
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
    if (!ownsDoctorAccount(req, email)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only view your own appointment roster.'
      });
    }

    const data = await getDoctorAppointments(email, year, month);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { email, status } = req.body;
    if (!ownsDoctorAccount(req, email)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only update your own appointment requests.'
      });
    }

    const data = await setAppointmentStatus({
      email,
      appointmentId: req.params.appointmentId,
      status
    });
    return res.status(200).json({ status: 'success', data });
     } catch (error) {
    return next(error);
  }
};