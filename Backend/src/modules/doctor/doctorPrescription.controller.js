import * as prescriptionService from './doctorPrescription.service.js';

export const fetchCatalogs = async (req, res, next) => {
  try {
    const { specialization } = req.query;
    const records = await prescriptionService.getCatalogDataBySpecialization(specialization);
    
    return res.status(200).json({ 
      status: 'success', 
      data: records 
    });
  } catch (error) {
    return res.status(400).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

export const createPrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.savePatientEPrescription(req.body);
    
    return res.status(201).json({ 
      status: 'success', 
      data: prescription 
    });
  } catch (error) {
    return res.status(400).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};