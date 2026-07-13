import * as pharmacistService from "./pharmacist.service.js";

export const fetchDispensingQueue = async (req, res) => {
    try {
        const queueData = await pharmacistService.getEligibleDispensingPrescriptions();

        return res.status(200).json({
            status: "success",
            count: queueData.length,
            data: queueData
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to retrieve active pharmacy dispensing queue."
        });
    }
};

export const searchAlternativesByUsecase = async (req, res) => {
    try {
        const { usecase, excludeMedicine } = req.query;

        if (!usecase) {
            return res.status(400).json({
                status: "fail",
                message: "Medicine use case is required."
            });
        }

        const matches = await pharmacistService.findMedicinesByUsecase(usecase, excludeMedicine);

        return res.status(200).json({
            status: "success",
            count: matches.length,
            data: matches
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to search alternate medicines."
        });
    }
};

export const searchAlternativesByComposition = async (req, res) => {
    try {
        const { composition } = req.query;

        if (!composition) {
            return res.status(400).json({
                status: "fail",
                message: "Composition query target parameter required."
            });
        }

        const matches = await pharmacistService.findMedicinesByComposition(composition);

        return res.status(200).json({
            status: "success",
            count: matches.length,
            data: matches
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to search alternate medicines."
        });
    }
};

export const processFlexibleDispenseCheckout = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const { substitutions = [] } = req.body;
        const pharmacistEmail = req.user?.email || req.body.pharmacistEmail;

        if (!pharmacistEmail) {
            return res.status(401).json({
                status: "fail",
                message: "Pharmacist email is required."
            });
        }

        const checkoutSummary = await pharmacistService.completeMedicineDispensingWithSubstitutions(
            prescriptionId,
            pharmacistEmail,
            substitutions
        );

        return res.status(200).json({
            status: "success",
            message: "Checkout complete. Stock reconciled and finalized invoice statement updated.",
            data: checkoutSummary
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to complete medicine dispensing."
        });
    }
};

export const fetchPharmacyBillingLedger = async (req, res) => {
    try {
        const splitLedger = await pharmacistService.getPharmacyBillingLedger();
        return res.status(200).json({
            status: "success",
            data: splitLedger
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to retrieve pharmacy statement tracking history."
        });
    }
};

export const collectCashPayment = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const pharmacistEmail = req.user?.email || req.body?.pharmacistEmail;

        if (!pharmacistEmail) {
            return res.status(401).json({ status: "fail", message: "Pharmacist verification identity trace required." });
        }

        const updatedInvoice = await pharmacistService.settleInvoiceViaCash(invoiceId, pharmacistEmail);
        return res.status(200).json({
            status: "success",
            message: "Invoice successfully settled via Cash and archived to historical records ledger.",
            data: updatedInvoice
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Fulfillment operation settlement error."
        });
    }
};

export const cancelPharmacyInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const pharmacistEmail = req.user?.email || req.body?.pharmacistEmail;

        if (!pharmacistEmail) {
            return res.status(401).json({ status: "fail", message: "Pharmacist verification identity trace required." });
        }

        const voidedInvoice = await pharmacistService.voidPharmacyInvoice(invoiceId, pharmacistEmail);
        return res.status(200).json({
            status: "success",
            message: "Invoice cancelled and inventory ticket voided successfully.",
            data: voidedInvoice
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to process cancellation trace sequence."
        });
    }
};

export const fetchPharmacistDashboardState = async (req, res) => {
    try {
        const { search } = req.query;
        const aggregateData = await pharmacistService.getPharmacistDashboardMetricsAndInventory(search);

        return res.status(200).json({
            status: "success",
            data: aggregateData
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to consolidate dashboard telemetry data."
        });
    }
};