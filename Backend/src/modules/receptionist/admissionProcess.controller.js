import * as receptionistService from "./admissionProcess.service.js";

export const fetchAdmissionDashboard = async (req, res) => {
    try {
        const dashboard = await receptionistService.getAdmissionDashboardData();
        return res.status(200).json({ status: "success", data: dashboard });
    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }
};

export const createAdmissionRecord = async (req, res) => {
    try {
        const logs = await receptionistService.processPatientAdmission(req.body);
        return res.status(201).json({ status: "success", message: "Patient admitted and bed locked.", data: logs });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ status: "error", message: err.message });
    }
};

export const completeDischargeCheckout = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const logs = await receptionistService.processPatientDischarge(admissionId);
        return res.status(200).json({ status: "success", message: "Discharge workflow logged safely.", data: logs });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ status: "error", message: err.message });
    }
};