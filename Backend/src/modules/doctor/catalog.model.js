import mongoose from 'mongoose';

const MedicineCatalogSchema = new mongoose.Schema({
  barcode: { type: Number, required: true, unique: true },
  medicine_name: { type: String, required: true },
  company: { type: String },
  category: { type: String },
  composition: { type: String },
  price: { type: Number },
  quantity: { type: Number },
  manufacture_date: { type: Date },
  expiry_date: { type: Date },
  medicine_usecase: { type: String },
  specialization: { type: String, required: true }
});

const LabReportCatalogSchema = new mongoose.Schema({
  report_code: { type: String, required: true, unique: true },
  report_name: { type: String, required: true },
  category: { type: String },
  sample_type: { type: String },
  price: { type: Number },
  tat_hours: { type: Number },
  description: { type: String },
  specialization: { type: String, required: true }
});

export const MedicineCatalog = mongoose.model('medicines', MedicineCatalogSchema);
export const LabReportCatalog = mongoose.model('lab_reports', LabReportCatalogSchema);