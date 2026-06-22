import {
  getDoctorSlotsForMonth,
  saveDayOverrideSlots
} from './doctorAvailability.service.js';

const isSameEmail = (left, right) =>
  String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

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

    const timetable = await getDoctorSlotsForMonth(email, year, month);
    return res.status(200).json({ status: 'success', data: timetable });
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

    // Defensive check to avoid crashing if authentication middleware is disabled or bypassed
    if (req.user && req.user.email) {
      if (!isSameEmail(req.user.email, email)) {
        return res.status(403).json({
          status: 'fail',
          message: 'You can only update your own availability.'
        });
      }
    }

    const payload = await saveDayOverrideSlots(email, date, slots);
    return res.status(200).json({ status: 'success', data: payload });
  } catch (error) {
    return next(error);
  }
};