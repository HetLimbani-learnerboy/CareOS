import mongoose from 'mongoose';

const patientDashboardSchema = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserIdentity',
        required: true,
        unique: true,
        index: true
    },
    allergies: [{
        substance: { type: String, required: true },
        severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true },
        recorded_at: { type: Date, default: Date.now }
    }],
    chronic_conditions: [{
        condition_name: { type: String, required: true },
        status: { type: String, enum: ['Active', 'In Remission', 'Managed'], default: 'Active' }
    }],
    vitals_log: {
        blood_pressure: { type: String, default: "N/A" },
        heart_rate: { type: Number, default: 0 },
        temperature: { type: Number, default: 0 },
        weight: { type: Number, default: 0 },
        updated_at: { type: Date, default: Date.now }
    }
}, {
    timestamps: true,
    collection: 'patient_dashboards'
});

export default mongoose.model('PatientDashboard', patientDashboardSchema);