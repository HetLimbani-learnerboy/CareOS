import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema(
    {
        prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", required: true },
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: "UserIdentity", required: true },
        nurseIds: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "UserIdentity"
                }
            ],
            validate: {
                validator: (value) =>
                    value.length >= 1 &&
                    value.length <= 3,
                message:
                    "Patient must have between 1 and 3 assigned nurses."
            }
        },
        patientName: { type: String, required: true },
        patientEmail: { type: String, required: true, lowercase: true, trim: true },
        bedId: { type: mongoose.Schema.Types.ObjectId, ref: "WardBed", required: true },
        roomType: { type: String, required: true },
        admittedAt: { type: Date, default: Date.now },
        dischargeEligibleAt: { type: Date, required: true },
        status: { type: String, enum: ["Admitted", "Discharged"], default: "Admitted" },
        vitalsHistory: [
            {
                bloodPressure: { type: String, required: true },
                heartRate: { type: Number, required: true },
                temperature: { type: Number, required: true },
                recordedAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model("Admission", admissionSchema);