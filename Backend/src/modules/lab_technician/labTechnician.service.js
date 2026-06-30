import Prescription from '../doctor/prescription.model.js';
import LabReportHistory from './labReportHistory.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import mongoose from 'mongoose';

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const getEligibleLabPatients = async (currentLabTechId) => {
    const prescriptionsWithLabs = await Prescription.find({
        labReports: { $exists: true, $not: { $size: 0 } }
    })
        .sort({ createdAt: -1 })
        .lean();

    const activeLabHistories = await LabReportHistory.find({}).lean();

    const historyMap = {};
    activeLabHistories.forEach(hist => {
        historyMap[String(hist.prescriptionId)] = hist;
    });

    const patientEmails = [...new Set(prescriptionsWithLabs.map(p => String(p.patientEmail || '').toLowerCase().trim()))];
    const patientUsers = await UserIdentity.find({
        email: { $in: patientEmails },
        role: 'patient'
    }).lean();

    const userMap = {};
    patientUsers.forEach(u => {
        userMap[String(u.email).toLowerCase().trim()] = u;
    });

    return prescriptionsWithLabs.map(pres => {
        const matchedHistory = historyMap[String(pres._id)];
        const normalizedEmail = String(pres.patientEmail || '').toLowerCase().trim();
        const matchedUser = userMap[normalizedEmail];

        let ownershipStatus = 'available';
        let labHistoryId = null;
        let currentPipelineStatus = null;
        let billingAmount = 0;

        if (matchedHistory) {
            labHistoryId = String(matchedHistory._id);
            currentPipelineStatus = matchedHistory.status;
            billingAmount = matchedHistory.billingAmount;

            if (String(matchedHistory.labTechnicianId) === String(currentLabTechId)) {
                ownershipStatus = 'claimed_by_me';
            } else {
                ownershipStatus = 'claimed_by_other';
            }
        }

        const computedPatientName = matchedUser
            ? `${matchedUser.firstName || ''} ${matchedUser.lastName || ''}`.trim()
            : (pres.patientName || 'Patient');

        return {
            prescriptionId: String(pres._id),
            appointmentId: pres.appointmentId ? String(pres.appointmentId) : null,
            patientName: computedPatientName,
            patientEmail: pres.patientEmail || 'N/A',
            doctorName: pres.doctorName || 'Doctor',
            doctorEmail: pres.doctorEmail || 'N/A',
            labTests: pres.labReports || [],
            ownershipStatus,
            labHistoryId,
            currentPipelineStatus,
            billingAmount
        };
    });
};

export const claimPrescriptionForLab = async (prescriptionId, labTechId) => {
    if (!mongoose.isValidObjectId(prescriptionId)) {
        throw httpError(400, 'Invalid prescription reference ID.');
    }

    const absoluteCollision = await LabReportHistory.exists({ prescriptionId });
    if (absoluteCollision) {
        throw httpError(409, 'This prescription test pipeline has already been claimed.');
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
        throw httpError(404, 'Prescription target record missing.');
    }

    const patientUser = await UserIdentity.findOne({
        email: String(prescription.patientEmail || '').toLowerCase().trim(),
        role: 'patient'
    }).lean();

    if (!patientUser) {
        throw httpError(404, 'Patient account identity mapping record not found for this prescription.');
    }

    const newHistoryItem = await LabReportHistory.create({
        prescriptionId: prescription._id,
        appointmentId: prescription.appointmentId,
        patientId: patientUser._id,
        labTechnicianId: labTechId,
        requestedTests: prescription.labReports,
        status: 'initialized'
    });

    return newHistoryItem;
};

export const advanceLabStatusPipeline = async (historyId, currentLabTechId, targetStatus, payload = {}) => {
    if (!mongoose.isValidObjectId(historyId)) {
        throw httpError(400, 'Invalid lab history path reference ID.');
    }

    const history = await LabReportHistory.findById(historyId);
    if (!history) {
        throw httpError(404, 'Active tracking document missing.');
    }

    if (String(history.labTechnicianId) !== String(currentLabTechId)) {
        throw httpError(403, 'Unauthorized modification access verification fault.');
    }

    history.status = targetStatus;

    if (targetStatus === 'confirmed') history.statusTimestamps.confirmedAt = Date.now();
    if (targetStatus === 'collected') history.statusTimestamps.collectedAt = Date.now();
    if (targetStatus === 'pending') history.statusTimestamps.pendingAt = Date.now();

    if (targetStatus === 'completed') {
        const { findings, notes, billingAmount } = payload;
        if (!billingAmount || isNaN(billingAmount) || Number(billingAmount) <= 0) {
            throw httpError(400, 'A valid financial numeric billing amount is required for signoff.');
        }

        history.statusTimestamps.completedAt = Date.now();
        history.billingAmount = Number(billingAmount);
        history.reportData = {
            findings: findings || 'Diagnostics evaluated.',
            notes: notes || '',
            generatedAt: Date.now()
        };
    }

    await history.save();
    return history;
};



export const getLabBillingLedger = async (currentLabTechId) => {
    if (!currentLabTechId) {
        throw new Error('Lab Technician identity context missing.');
    }
    const reports = await LabReportHistory.find({
        labTechnicianId: currentLabTechId,
        status: 'completed'
    })
        .sort({ 'statusTimestamps.completedAt': -1 })
        .lean();

    const patientIds = [...new Set(reports.map(r => r.patientId).filter(Boolean))];

    const patientProfiles = await UserIdentity.find({
        _id: { $in: patientIds },
        role: 'patient'
    }).lean();

    const userMap = {};
    patientProfiles.forEach(user => {
        userMap[String(user._id)] = user;
    });

    const formattedLedger = reports.map(report => {
        const matchedUser = userMap[String(report.patientId)];
        const computedName = matchedUser
            ? `${matchedUser.firstName || ''} ${matchedUser.lastName || ''}`.trim()
            : 'Patient';

        return {
            historyId: String(report._id),
            prescriptionId: String(report.prescriptionId),
            appointmentId: String(report.appointmentId),
            patientId: String(report.patientId),
            patientName: computedName,
            labTechnicianId: String(report.labTechnicianId),
            requestedTests: report.requestedTests || [],
            status: report.status,
            billingAmount: report.billingAmount || 0,
            isBilled: report.isBilled || false,
            completedAt: report.statusTimestamps?.completedAt,
            reportData: {
                findings: report.reportData?.findings || 'N/A',
                notes: report.reportData?.notes || 'N/A'
            }
        };
    });

    return {
        pendingBilling: formattedLedger.filter(b => !b.isBilled),
        completedBilling: formattedLedger.filter(b => b.isBilled)
    };
};

export const updateInvoiceToPaid = async (historyId, currentLabTechId) => {
    if (!mongoose.isValidObjectId(historyId)) {
        throw httpError(400, 'Invalid lab history path reference ID.');
    }

    const report = await LabReportHistory.findById(historyId);
    if (!report) {
        throw httpError(404, 'Active diagnostic billing record missing.');
    }

    if (String(report.labTechnicianId) !== String(currentLabTechId)) {
        throw httpError(403, 'Unauthorized operation context: Locked to another technician.');
    }

    if (report.status !== 'completed') {
        throw httpError(400, 'Cannot finalize billing for an uncompleted lab test pipeline.');
    }

    if (report.isBilled) {
        throw httpError(409, 'This invoice tracking record has already been paid and settled.');
    }

    report.isBilled = true;
    await report.save();

    return report;
};