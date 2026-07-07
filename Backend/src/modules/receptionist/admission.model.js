import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema(
  {
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "UserIdentity", required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true, lowercase: true, trim: true },
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: "WardBed", required: true },
    roomType: { type: String, required: true },
    admittedAt: { type: Date, default: Date.now },
    dischargeEligibleAt: { type: Date, required: true },
    status: { type: String, enum: ["Admitted", "Discharged"], default: "Admitted" }
  },
  { timestamps: true }
);

export default mongoose.model("Admission", admissionSchema);