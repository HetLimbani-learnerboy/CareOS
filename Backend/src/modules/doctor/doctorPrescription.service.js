import { MedicineCatalog, LabReportCatalog } from './catalog.model.js';
import Prescription from './prescription.model.js';
import UserIdentity from '../auth/userIdentity.model.js'; 

export const getCatalogDataBySpecialization = async (specialization) => {
  if (!specialization) {
    throw new Error('Specialization field parameter is required.');
  }

  const [medicines, labReports] = await Promise.all([
    MedicineCatalog.find({ specialization }).select('medicine_name category composition price -_id').lean(),
    LabReportCatalog.find({ specialization }).select('report_name category sample_type price -_id').lean()
  ]);

  return { medicines, labReports };
};

export const savePatientEPrescription = async (prescriptionData) => {
  const {
    appointmentId,
    patientEmail,
    doctorEmail,
    prescriptionName,
    diagnosis,
    notes,
    result,
    medicines,
    labReports
  } = prescriptionData;

  if (!appointmentId || !patientEmail || !doctorEmail || !result) {
    throw new Error('Missing mandatory properties. Appointment ID, Patient Email, Doctor Email, and Result are required.');
  }

  // Sanitize incoming array matrices to drop empty placeholder values from frontend
  const cleanMedicines = (medicines || []).filter(m => m.medicine && m.medicine.trim() !== "");
  const cleanLabReports = (labReports || []).filter(l => l && l.trim() !== "");

  const doctorUser = await UserIdentity.findOne({ email: doctorEmail.toLowerCase().trim(), role: 'doctor' }).lean();
  if (!doctorUser) {
    throw new Error('Doctor account identity mapping record not found.');
  }

  const doctorName = `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`.trim();

  return await Prescription.create({
    appointmentId,
    patientEmail,
    doctorEmail,
    doctorName,
    prescriptionName,
    diagnosis,
    notes,
    result,
    medicines: cleanMedicines,
    labReports: cleanLabReports
  });
};
