import mongoose from 'mongoose';

const doctorOverrideSchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserIdentity',
    required: true,
    index: true
  },
  date: {
    type: String, // Stored explicitly as 'YYYY-MM-DD' to prevent timezone shifts
    required: true,
    index: true
  },
  slots: {
    type: [String], // Array of active hours strings for this date
    required: true
  }
}, { timestamps: true });

// Ensure a doctor can only have one override document per explicit calendar date
doctorOverrideSchema.index({ doctor_id: 1, date: 1 }, { unique: true });

export default mongoose.model('DoctorOverride', doctorOverrideSchema);