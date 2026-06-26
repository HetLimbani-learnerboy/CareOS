import mongoose from 'mongoose';

const PrescribedMedicineSchema = new mongoose.Schema({
  medicine: { type: String, required: true },
  dosage: { type: String, required: true },
  days: { type: Number, required: true }
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientEmail: { type: String, required: true, lowercase: true, trim: true },
  doctorEmail: { type: String, required: true, lowercase: true, trim: true },
  doctorName: { type: String, required: true },
  prescriptionName: { type: String, default: "" },
  diagnosis: { type: String, default: "" },
  notes: { type: String, default: "" },
  result: { type: String, required: true },
  medicines: [PrescribedMedicineSchema],
  labReports: [{ type: String }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('Prescription', PrescriptionSchema);