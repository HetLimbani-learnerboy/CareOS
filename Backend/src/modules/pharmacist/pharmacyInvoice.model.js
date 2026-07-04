import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
    {
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicineCatalog",
            required: true
        },
        originalMedicine: { type: String },
        medicineName: { type: String, required: true },
        usedSubstitution: { type: Boolean, default: false },
        unitPrice: { type: Number, required: true, min: 0 },
        quantityDispensed: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true, min: 0 }
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

const pharmacyInvoiceSchema = new mongoose.Schema(
    {
        prescriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prescription",
            required: true,
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
        items: [invoiceItemSchema],
        skippedMedicines: [skippedMedicineSchema],
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Cancelled"],
            default: "Pending"
        },
        generatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

export default mongoose.model("PharmacyInvoice", pharmacyInvoiceSchema);