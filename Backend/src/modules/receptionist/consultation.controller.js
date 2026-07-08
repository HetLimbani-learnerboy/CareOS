import * as consultService from "./consultation.service.js";

export const submitNewConsultRequest = async (req, res) => {
  try {
    const record = await consultService.createConsultationRequest(req.body);
    return res.status(201).json({ status: "success", data: record });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
};

export const fetchAllRequestsForDesk = async (req, res) => {
  try {
    const records = await consultService.getAllConsultationsForReceptionist();
    return res.status(200).json({ status: "success", data: records });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRecord = await consultService.updateConsultationStatus(id, status);
    return res.status(200).json({ status: "success", data: updatedRecord });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
};
