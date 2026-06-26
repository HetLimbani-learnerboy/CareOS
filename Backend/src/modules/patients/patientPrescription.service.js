import Prescription from '../doctor/prescription.model.js'; // Points to your existing schema file location
import userIdentityModel from '../auth/userIdentity.model.js';
import doctorProfileModel from '../doctor/doctorProfile.model.js';

/**
 * Retrieves all signed electronic prescriptions matching a specific patient email context.
 * @param {String} email - The clean validated patient destination email string tokens.
 * @returns {Promise<Array>} List of formatted prescription object rows.
 */
export const getPrescriptionsByPatientEmail = async (email) => {
  const sanitizedEmail = email.toString().toLowerCase().trim();

  return await Prescription.find({ patientEmail: sanitizedEmail })
    .select('appointmentId patientEmail  doctorEmail doctorName prescriptionName diagnosis notes result medicines labReports created_at')
    .sort({ created_at: -1 }) // Sorts chronologically (Newest items populate at top index)
    .lean();
};