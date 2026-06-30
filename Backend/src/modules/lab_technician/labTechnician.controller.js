import * as labService from './labTechnician.service.js';

export const fetchAllEligibleLabRosters = async (req, res) => {
    try {
        const currentLabTechId = req.user?.id || req.body?.labTechId || req.query?.labTechId;
        if (!currentLabTechId) {
            return res.status(401).json({ status: 'fail', message: 'User verification tracking context missing.' });
        }

        const roster = await labService.getEligibleLabPatients(currentLabTechId);
        return res.status(200).json({ status: 'success', data: roster });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};

export const claimPrescriptionTask = async (req, res) => {
    try {
        const { prescriptionId, labTechId } = req.body || {};
        const currentLabTechId = req.user?.id || labTechId;

        if (!prescriptionId) {
            return res.status(400).json({ status: 'fail', message: 'Prescription context key target reference missing.' });
        }
        if (!currentLabTechId) {
            return res.status(401).json({ status: 'fail', message: 'Lab technician identity reference trace missing.' });
        }

        const record = await labService.claimPrescriptionForLab(prescriptionId, currentLabTechId);
        return res.status(201).json({ status: 'success', message: 'Task claimed successfully.', data: record });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};

export const updateLabPipelineStatus = async (req, res) => {
    try {
        const { historyId } = req.params;
        const { status, findings, notes, billingAmount, labTechId } = req.body || {};
        const currentLabTechId = req.user?.id || labTechId;

        if (!currentLabTechId) {
            return res.status(401).json({ status: 'fail', message: 'Lab technician identifier track validation missing.' });
        }

        const updatedRecord = await labService.advanceLabStatusPipeline(historyId, currentLabTechId, status, {
            findings,
            notes,
            billingAmount
        });

        return res.status(200).json({
            status: 'success',
            message: `Pipeline status set to: ${status}.`,
            data: updatedRecord
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};

export const fetchLabBillingHistory = async (req, res) => {
    try {
        const currentLabTechId = req.user?.id || req.body?.labTechId || req.query?.labTechId;

        if (!currentLabTechId) {
            return res.status(401).json({ status: 'fail', message: 'User verification tracking identifier missing.' });
        }
        
        const ledger = await labService.getLabBillingLedger(currentLabTechId);
        return res.status(200).json({ status: 'success', data: ledger });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};

export const collectInvoicePayment = async (req, res) => {
    try {
        const { historyId } = req.params;
        const currentLabTechId = req.user?.id || req.body?.labTechId;

        if (!currentLabTechId) {
            return res.status(401).json({ status: 'fail', message: 'Lab technician verification credential missing.' });
        }

        const updatedRecord = await labService.updateInvoiceToPaid(historyId, currentLabTechId);
        return res.status(200).json({
            status: 'success',
            message: 'Payment verified. Invoice successfully settled and archived.',
            data: updatedRecord
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
    }
};