import {
    getPatientBillingHistory,
    processPatientOnlinePayment
} from "./patientBilling.service.js";

export const fetchPatientHistoricalBilling = async (req, res) => {
    try {
        const patientEmail = req.user?.email || req.headers["x-user-email"] || req.query.patientEmail;
        if (!patientEmail) {
            return res.status(401).json({ status: "fail", message: "Patient session verification required." });
        }

        const data = await getPatientBillingHistory(patientEmail);
        return res.status(200).json({ status: "success", data });
    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }
};

export const executePatientCheckout = async (req, res) => {
    try {
        const patientEmail = req.user?.email || req.headers["x-user-email"] || req.body.patientEmail;
        if (!patientEmail) {
            return res.status(401).json({ status: "fail", message: "Patient session verification required." });
        }

        const data = await processPatientOnlinePayment(req.params.invoiceId, req.body, patientEmail);
        return res.status(200).json({ status: "success", message: "Payment processed successfully.", data });
    } catch (err) {
        return res.status(400).json({ status: "fail", message: err.message });
    }
};