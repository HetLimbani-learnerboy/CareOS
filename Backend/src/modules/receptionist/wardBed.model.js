import mongoose from "mongoose";

const wardBedSchema = new mongoose.Schema(
  {
    bedNumber: { type: String, required: true, unique: true },
    roomType: { 
      type: String, 
      enum: ["General Room", "Semi-Deluxe Room", "Deluxe Room", "ICU"], 
      required: true 
    },
    status: { type: String, enum: ["Available", "Occupied"], default: "Available" },
    currentAdmissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission" }
  },
  { timestamps: true }
);

export default mongoose.model("WardBed", wardBedSchema);