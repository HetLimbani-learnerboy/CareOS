import * as patientLabService from './patientLabReport.service.js';

export const fetchPatientLabReports = async (req, res) => {
  try {
    const patientEmail = req.user?.email;

    if (!patientEmail) {
      return res.status(401).json({ status: 'fail', message: 'User context missing.' });
    }

    const reports = await patientLabService.getPatientLabHistory(patientEmail);
    return res.status(200).json({ status: 'success', data: reports });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};