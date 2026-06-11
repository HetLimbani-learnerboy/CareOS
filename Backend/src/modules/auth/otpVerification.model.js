import mongoose from 'mongoose';

const OtpVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp_hash: { type: String, required: true },
  attempts_count: { type: Number, default: 0, max: 5 },
  expires_at: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'otp_verifications'
});

OtpVerificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpVerification', OtpVerificationSchema);