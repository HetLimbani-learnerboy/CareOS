import Appointment from '../patients/appointment.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import DoctorConfig, { DEFAULT_SLOTS } from './doctorConfig.model.js';
import DoctorOverride from './doctorOverride.model.js';

const ACTIVE_STATUSES = ['pending', 'confirmed'];

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

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

  return [...new Set(slots.map((slot) => String(slot).trim()).filter(Boolean))].sort();
};

const getOrCreateConfig = (doctorId) =>
  DoctorConfig.findOneAndUpdate(
    { doctor_id: doctorId },
    { $setOnInsert: { doctor_id: doctorId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const getDefaultSlotsForDate = (config, date) => {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6
    ? []
    : (Array.isArray(config.default_weekly_slots)
      ? config.default_weekly_slots
      : DEFAULT_SLOTS);
};

const assertBookedSlotsRemainAvailable = async (doctorId, date, nextSlots) => {
  const bookedSlots = await Appointment.distinct('time_slot', {
    doctor_id: doctorId,
    appointment_date: date,
    status: { $in: ACTIVE_STATUSES }
  });

  const removedBookedSlot = bookedSlots.find((slot) => !nextSlots.includes(slot));
  if (removedBookedSlot) {
    throw httpError(
      409,
      `Cannot disable ${removedBookedSlot}; an active appointment uses this slot.`
    );
  }
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

export const getDoctorSlotsForMonth = async (email, year, month) => {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw httpError(400, 'Year must be between 2000 and 2100.');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw httpError(400, 'Month must be between 1 and 12.');
  }

  const doctor = await resolveDoctorByEmail(email);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  const [config, overrides] = await Promise.all([
    getOrCreateConfig(doctor._id),
    DoctorOverride.find({
      doctor_id: doctor._id,
      date: { $regex: `^${monthPrefix}` }
    }).lean()
  ]);
  return {
    defaultWeeklySlots: Array.isArray(config.default_weekly_slots)
      ? config.default_weekly_slots
      : DEFAULT_SLOTS,
    customDayOverrides: Object.fromEntries(
      overrides.map((override) => [override.date, override.slots])
    )
  };
};

export const getDoctorSlotsForMonthWithBookings = async (email, year, month) => {
  const base = await getDoctorSlotsForMonth(email, year, month);
  const doctor = await resolveDoctorByEmail(email);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  const appointments = await Appointment.find({
    doctor_id: doctor._id,
    appointment_date: { $regex: `^${monthPrefix}` },
    status: { $in: ACTIVE_STATUSES }
  })
    .select('appointment_date time_slot')
    .lean();

  return {
    ...base,
    activeBookings: appointments.map((appointment) => ({
      date: appointment.appointment_date,
      time: appointment.time_slot
    }))
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

  return override ? override.slots : getDefaultSlotsForDate(config, date);
};

export const saveDayOverrideSlots = async (email, date, slots) => {
  if (!isValidDateString(date)) {
    throw httpError(400, 'Date must be a valid YYYY-MM-DD value.');
  }

  const doctor = await resolveDoctorByEmail(email);

  if (slots === null) {
    const config = await getOrCreateConfig(doctor._id);
    const defaultSlots = getDefaultSlotsForDate(config, date);
    await assertBookedSlotsRemainAvailable(doctor._id, date, defaultSlots);
    await DoctorOverride.deleteOne({ doctor_id: doctor._id, date });
    return { reverted: true, date };
  }

  const cleanSlots = sanitizeSlots(slots);
  await assertBookedSlotsRemainAvailable(doctor._id, date, cleanSlots);

  return DoctorOverride.findOneAndUpdate(
    { doctor_id: doctor._id, date },
    { $set: { slots: cleanSlots } },
    { upsert: true, new: true, runValidators: true }
  );
};