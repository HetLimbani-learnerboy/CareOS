import UserIdentity from '../auth/userIdentity.model.js';
import LabReportHistory from '../lab_technician/labReportHistory.model.js';

export const getPatientLabHistory = async (patientEmail) => {
  const user = await UserIdentity.findOne({ 
    email: patientEmail.toLowerCase().trim(),
    role: 'patient' 
  }).lean();

  if (!user) {
    throw new Error('Patient identity profile not found.');
  }

  const history = await LabReportHistory.find({ patientId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return history.map(item => ({
    historyId: String(item._id),
    requestedTests: item.requestedTests || [],
    status: item.status,
    reportData: item.status === 'completed' ? item.reportData : null,
    statusTimestamps: item.statusTimestamps,
    billingAmount: item.billingAmount || item.amount || 0,
    createdAt: item.createdAt
  }));
};