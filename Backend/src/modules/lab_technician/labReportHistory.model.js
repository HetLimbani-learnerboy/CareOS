import mongoose from 'mongoose';

const labReportHistorySchema = new mongoose.Schema({
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
        required: true,
        unique: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserIdentity',
        required: true
    },
    labTechnicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserIdentity',
        required: true
    },
    requestedTests: [{
        type: String,
        required: true
    }],
    status: {
        type: String,
        enum: ['initialized', 'confirmed', 'collected', 'pending', 'completed'],
        default: 'initialized'
    },
    statusTimestamps: {
        initializedAt: { type: Date, default: Date.now },
        confirmedAt: Date,
        collectedAt: Date,
        pendingAt: Date,
        completedAt: Date
    },
    reportData: {
        findings: String,
        notes: String,
        generatedAt: Date
    },
    billingAmount: {
        type: Number,
        default: 0
    },
    isBilled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const LabReportHistory = mongoose.model('LabReportHistory', labReportHistorySchema);
export default LabReportHistory;