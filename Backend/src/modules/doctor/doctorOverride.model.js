import mongoose from 'mongoose';

const doctorOverrideSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserIdentity',
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    slots: {
      type: [String],
      required: true,
      default: []
    }
  },
  { timestamps: true }
);

doctorOverrideSchema.index({ doctor_id: 1, date: 1 }, { unique: true });

export default mongoose.model('DoctorOverride', doctorOverrideSchema);