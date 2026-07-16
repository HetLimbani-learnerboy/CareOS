import {
    getCompletedAppointmentsList,
    aggregateDraftInvoiceData,
    saveConfirmedLedgerBill,
    getPartitionedBillingHistory,
    updateInvoiceStatusState
} from "./billing.service.js";

export const fetchVisitedQueue = async (req, res) => {
    try {
        const data = await getCompletedAppointmentsList();
        return res.status(200).json({ status: "success", data });
    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }
};

export const buildInvoiceDraft = async (req, res) => {
    try {
        const data = await aggregateDraftInvoiceData(req.params.appointmentId);
        return res.status(200).json({ status: "success", data });
    } catch (err) {
        return res.status(400).json({ status: "fail", message: err.message });
    }
};

export const commitFinalBillRecord = async (req, res) => {
    try {
        const userEmail = req.user?.email || req.headers["x-user-email"] || req.body.receptionistEmail;
        if (!userEmail) {
            return res.status(401).json({ status: "fail", message: "Receptionist session verification required." });
        }

        const data = await saveConfirmedLedgerBill(req.body, userEmail);
        return res.status(201).json({ status: "success", data });
    } catch (err) {
        return res.status(400).json({ status: "fail", message: err.message });
    }
};

export const fetchHistoricalPartitions = async (req, res) => {
    try {
        const data = await getPartitionedBillingHistory();
        return res.status(200).json({ status: "success", data });
    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }
};

export const patchInvoiceStatus = async (req, res) => {
    try {
        const data = await updateInvoiceStatusState(req.params.invoiceId, req.body);
        return res.status(200).json({ status: "success", data });
    } catch (err) {
        return res.status(400).json({ status: "fail", message: err.message });
    }
};