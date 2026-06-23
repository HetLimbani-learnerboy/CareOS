import mongoose from 'mongoose';

export const DEFAULT_SLOTS = [
  '10:00 - 10:50',
  '11:00 - 11:50',
  '11:50 - 12:40',
  '13:30 - 14:20',
  '14:20 - 15:10',
  '16:30 - 17:10'
];

const doctorConfigSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserIdentity',
      required: true,
      unique: true,
      index: true
    },
    default_weekly_slots: {
      type: [String],
      default: () => [...DEFAULT_SLOTS]
    }
  },
  { timestamps: true }
);

export default mongoose.model('DoctorConfig', doctorConfigSchema);