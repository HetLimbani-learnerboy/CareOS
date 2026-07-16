import mongoose from "mongoose";

const BillingItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Consultation", "Treatment", "Medicine", "LabReport", "Adjustment"],
      required: true
    },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    prePaid: { type: Boolean, default: false }
  },
  { _id: false }
);

const BillingSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "UserIdentity", required: true, index: true },
    patientEmail: { type: String, required: true, lowercase: true, trim: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "UserIdentity", required: true, index: true },
    consultationFee: { type: Number, default: 0 },
    treatmentCost: { type: Number, default: 0 },
    medicineCost: { type: Number, default: 0 },
    labCost: { type: Number, default: 0 },
    extraCharges: { type: Number, default: 0 },
    extraChargesNotes: { type: String, default: "", trim: true },
    grossTotal: { type: Number, required: true },
    deductionsPrePaid: { type: Number, default: 0 },
    insuranceCoverageAmount: { type: Number, default: 0 },
    netPayableAmount: { type: Number, required: true },
    insurance: {
      provider: { type: String, default: "" },
      policyNumber: { type: String, default: "" },
      isValidated: { type: Boolean, default: false }
    },
    billingItems: [BillingItemSchema],
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Insurance_Claim_Pending", "Cancelled"],
      default: "Unpaid"
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Insurance", "Mixed", "N/A"],
      default: "N/A"
    },
    receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: "UserIdentity", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Billing", BillingSchema);