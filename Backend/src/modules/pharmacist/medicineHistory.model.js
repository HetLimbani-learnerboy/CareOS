import mongoose from "mongoose";

const dispensedMedicineSchema = new mongoose.Schema(
    {
        originalMedicine: { type: String },
        medicine: { type: String, required: true },
        dosage: { type: String },
        days: { type: mongoose.Schema.Types.Mixed },
        quantityDispensed: { type: Number, required: true, min: 1 },
        usedSubstitution: { type: Boolean, default: false }
    },
    { _id: false }
);

const skippedMedicineSchema = new mongoose.Schema(
    {
        originalMedicine: { type: String, required: true },
        requestedQuantity: { type: Number, default: 1 },
        reason: { type: String, required: true }
    },
    { _id: false }
);

const medicineHistorySchema = new mongoose.Schema(
    {
        prescriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prescription",
            required: true,
            unique: true,
            index: true
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment"
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserIdentity"
        },
        patientEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        pharmacistEmail: {
            type: String,
            lowercase: true,
            trim: true
        },
        dispensedMedicines: [dispensedMedicineSchema],
        skippedMedicines: [skippedMedicineSchema],
        dispensedAt: {
            type: Date,
            default: Date.now
        },
        isPaymentCompleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("MedicineHistory", medicineHistorySchema);