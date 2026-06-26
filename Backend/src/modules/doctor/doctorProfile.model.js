import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserIdentity',
        required: true,
        unique: true,
        index: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    qualification: {
        type: String,
        required: true,
        trim: true
    },
    experience_start_date: {
        type: Date,
        required: true
    },
    consultation_fee: {
        type: Number,
        required: true,
        default: 0
    },
    bio: {
        type: String,
        maxLength: 1000,
        trim: true
    },
    clinic_address: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

export default mongoose.model('DoctorProfile', doctorProfileSchema);