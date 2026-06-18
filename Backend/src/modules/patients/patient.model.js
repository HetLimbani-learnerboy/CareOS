import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserIdentity',
    required: true,
    unique: true,
    index: true
  },
  birth_date: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  blood_group: {
    type: String,
    required: true,
    maxlength: 5
  },
  address: {
    type: String,
    required: true,
    maxlength: 200
  },
  emergency_contact_name1: { type: String, required: true, maxlength: 50 },
  emergency_contact_phoneno1: { type: String, required: true, maxlength: 15 },
  emergency_contact_relation1: { type: String, required: true, maxlength: 15 },
  
  emergency_contact_name2: { type: String, maxlength: 50, default: "" },
  emergency_contact_phoneno2: { type: String, maxlength: 15, default: "" },
  emergency_contact_relation3: { type: String, maxlength: 15, default: "" },
  
  insurance_provider: { type: String, maxlength: 50, default: "" },
  insurance_policynumber: { type: String, maxlength: 20, default: "" }
}, { 
  timestamps: true,
  collection: 'patient_profiles'
});

export default mongoose.model('PatientProfile', patientProfileSchema);