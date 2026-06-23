import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserIdentity',
        required: true,
        index: true
    },
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserIdentity',
        required: true,
        index: true
    },
    reason_for_visit: {
        type: String,
        required: true,
        trim: true
    },
    appointment_date: {
        type: String,
        required: true,
        index: true
    },
    time_slot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
        default: 'pending',
        index: true
    }
}, { timestamps: true });

appointmentSchema.index({ doctor_id: 1, appointment_date: 1, time_slot: 1, status: 1 });

export default mongoose.model('Appointment', appointmentSchema);