import * as patientPrescriptionService from './patientPrescription.service.js';

export const fetchPatientPrescriptions = async (req, res, next) => {
  try {
    // Looks for identity parameters via query parameter or fallback custom verification headers
    const patientEmail = req.query.patientEmail || req.headers['x-patient-email'];

    if (!patientEmail) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Authentication Context Missing: Please provide patientEmail via parameters or headers.' 
      });
    }

    const prescriptions = await patientPrescriptionService.getPrescriptionsByPatientEmail(patientEmail);

    return res.status(200).json({
      status: 'success',
      results: prescriptions.length,
      data: {
        prescriptions
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal pipeline execution anomaly occurred while tracing prescriptions.'
    });
  }
};