import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Pending", "Responded", "Archived"],
      default: "Pending"
    },
  },
  {
    timestamps: true,
    collection: "consultations"
  }
);

export default mongoose.model("Consultation", consultationSchema);