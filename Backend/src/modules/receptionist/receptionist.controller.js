import * as receptionistService from './receptionist.service.js';

export const fetchReceptionistDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await receptionistService.getSystemDashboardMetrics();
    return res.status(200).json({
      status: 'success',
      data: metrics
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      status: 'error',
      message: error.message
    });
  }
};

export const fetchAllSystemAppointments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const records = await receptionistService.getAllAppointmentsOverview(status, search);
    
    return res.status(200).json({
      status: 'success',
      count: records.length,
      data: records
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      status: 'error',
      message: error.message
    });
  }
};

export const updateAppointmentStatusByReceptionist = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { action } = req.body; // Expects 'confirm' or 'reject'

    const updatedAppointment = await receptionistService.processAppointmentAction(appointmentId, action);

    return res.status(200).json({
      status: 'success',
      message: `Appointment successfully ${updatedAppointment.status}.`,
      data: updatedAppointment
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      status: 'error',
      message: error.message
    });
  }
};