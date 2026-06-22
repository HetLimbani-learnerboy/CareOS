import DoctorConfig from './doctorConfig.model.js';
import DoctorOverride from './doctorOverride.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import Appointment from '../patients/appointment.model.js';

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const DEFAULT_SLOTS = [
  "10:00 - 10:50", "11:00 - 11:50", "11:50 - 12:40",
  "13:30 - 14:20", "14:20 - 15:10", "16:30 - 17:10"
];

const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const sanitizeSlots = (slots) => {
  if (!Array.isArray(slots)) {
    throw httpError(400, 'Slots must be an array of time labels.');
  }
  return [...new Set(slots.map((slot) => String(slot).trim()).filter(Boolean))];
};

export const resolveDoctorByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw httpError(400, 'Doctor email is required.');

  const doctor = await UserIdentity.findOne({
    email: normalizedEmail,
    role: 'doctor'
  });

  if (!doctor) throw httpError(404, 'Doctor not found.');
  return doctor;
};

const getOrCreateConfig = (doctorId) =>
  DoctorConfig.findOneAndUpdate(
    { doctor_id: doctorId },
    { $setOnInsert: { doctor_id: doctorId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

export const getDoctorSlotsForMonth = async (email, year, month) => {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw httpError(400, 'Year must be between 2000 and 2100.');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw httpError(400, 'Month must be between 1 and 12.');
  }

  const doctor = await resolveDoctorByEmail(email);
  const [config, overrides] = await Promise.all([
    getOrCreateConfig(doctor._id),
    DoctorOverride.find({
      doctor_id: doctor._id,
      date: { $regex: `^${year}-${String(month).padStart(2, '0')}-` }
    }).lean()
  ]);

  const customDayOverrides = Object.fromEntries(
    overrides.map((override) => [override.date, override.slots])
  );

  return {
    defaultWeeklySlots: config.default_weekly_slots || DEFAULT_SLOTS,
    customDayOverrides
  };
};

// Used by the patient booking screen: same as above, plus the doctor's
// currently active (pending/confirmed) bookings for that month so the
// frontend can grey out already-taken slots.
export const getDoctorSlotsForMonthWithBookings = async (email, year, month) => {
  const base = await getDoctorSlotsForMonth(email, year, month);
  const doctor = await resolveDoctorByEmail(email);

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  const activeAppointments = await Appointment.find({
    doctor_id: doctor._id,
    appointment_date: { $regex: `^${monthPrefix}` },
    status: { $in: ['pending', 'confirmed'] }
  })
    .select('appointment_date time_slot')
    .lean();

  const activeBookings = activeAppointments.map((appointment) => ({
    date: appointment.appointment_date,
    time: appointment.time_slot
  }));

  return {
    ...base,
    activeBookings
  };
};

export const getDoctorSlotsForDate = async (doctor, date) => {
  if (!isValidDateString(date)) {
    throw httpError(400, 'Date must be a valid YYYY-MM-DD value.');
  }

  const [config, override] = await Promise.all([
    getOrCreateConfig(doctor._id),
    DoctorOverride.findOne({ doctor_id: doctor._id, date }).lean()
  ]);

  if (override) return override.slots;

  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6 ? [] : (config.default_weekly_slots || DEFAULT_SLOTS);
};

export const saveDayOverrideSlots = async (email, date, slots) => {
  if (!isValidDateString(date)) {
    throw httpError(400, 'Date must be a valid YYYY-MM-DD value.');
  }
  const doctor = await resolveDoctorByEmail(email);

  if (slots === null) {
    await DoctorOverride.deleteOne({ doctor_id: doctor._id, date });
    return { reverted: true, date };
  }

  const cleanSlots = sanitizeSlots(slots);
  return DoctorOverride.findOneAndUpdate(
    { doctor_id: doctor._id, date },
    { $set: { slots: cleanSlots } },
    { upsert: true, new: true, runValidators: true }
  );
};