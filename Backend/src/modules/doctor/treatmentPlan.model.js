import mongoose from "mongoose";

const treatmentItemSchema = new mongoose.Schema({
    itemType: {
        type: String,
        enum: ["Injection", "Dosage", "Instrument", "Fluid/Glucose", "Other"],
        required: true
    },
    itemName: { type: String, required: true },
    dosageConfiguration: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    totalCost: { type: Number, required: true, min: 0 }
}, { _id: false });

const treatmentPlanSchema = new mongoose.Schema({
    admissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdmissionRecord",
        required: true,
        index: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserIdentity",
        required: true
    },
    doctorEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    treatmentHeading: { type: String, required: true },
    items: [treatmentItemSchema],
    totalPlanCost: { type: Number, required: true, default: 0 },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    administrationStatus: {
        type: String,
        enum: ["Pending", "Administered", "Cancelled"],
        default: "Pending"
    },
    administeredByNurseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserIdentity"
    },
    administeredAt: { type: Date },
    clinicalNotes: { type: String }
}, { timestamps: true });

treatmentPlanSchema.pre("save", function (next) {
    this.totalPlanCost = this.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
});

export default mongoose.model("TreatmentPlan", treatmentPlanSchema);