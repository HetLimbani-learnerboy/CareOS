import UserIdentity from '../auth/userIdentity.model.js';
import LabReportHistory from '../lab_technician/labReportHistory.model.js';

export const getPatientLabHistory = async (patientEmail) => {
  // 1. Find the user identity by email to get the correct patientId
  const user = await UserIdentity.findOne({ 
    email: patientEmail.toLowerCase().trim(),
    role: 'patient' 
  }).lean();

  if (!user) {
    throw new Error('Patient identity profile not found.');
  }

  // 2. Fetch all lab histories associated with this patientId
  const history = await LabReportHistory.find({ patientId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  // 3. Map the data to a clean structure for the frontend
  return history.map(item => ({
    historyId: String(item._id),
    requestedTests: item.requestedTests || [],
    status: item.status,
    // If status is completed, return the data, otherwise mask it
    reportData: item.status === 'completed' ? item.reportData : null,
    statusTimestamps: item.statusTimestamps,
    createdAt: item.createdAt
  }));
};