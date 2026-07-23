import mongoose from "mongoose";
import Billing from "../receptionist/billing.model.js";
import UserIdentity from "../auth/userIdentity.model.js";

const fullName = (user) =>
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "Unknown";

const resolvePatientByEmail = async (patientEmail) => {
    const normalizedEmail = String(patientEmail || "").trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Patient email context parameter is missing.");

    const patient = await UserIdentity.findOne({ email: normalizedEmail, role: "patient" }).lean();
    if (!patient) throw new Error("Patient user account record not found.");

    return patient;
};

export const getPatientBillingHistory = async (patientEmail) => {
    const patient = await resolvePatientByEmail(patientEmail);

    const rows = await Billing.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .lean();

    const doctorIds = [...new Set(rows.map((r) => (r.doctorId ? String(r.doctorId) : null)).filter(Boolean))];
    const doctors = await UserIdentity.find({ _id: { $in: doctorIds } }).lean();
    const doctorMap = new Map(doctors.map((d) => [String(d._id), d]));

    const decorate = (bill) => {
        const doc = doctorMap.get(String(bill.doctorId));
        return {
            ...bill,
            patientName: fullName(patient),
            doctorName: fullName(doc)
        };
    };

    return {
        unpaid: rows.filter((row) => row.paymentStatus === "Unpaid").map(decorate),
        insurancePending: rows.filter((row) => row.paymentStatus === "Insurance_Claim_Pending").map(decorate),
        paid: rows.filter((row) => row.paymentStatus === "Paid").map(decorate),
        cancelled: rows.filter((row) => row.paymentStatus === "Cancelled").map(decorate)
    };
};

export const processPatientOnlinePayment = async (invoiceId, payload, patientEmail) => {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        throw new Error("Invalid invoice reference ID mapping.");
    }

    const patient = await resolvePatientByEmail(patientEmail);

    const bill = await Billing.findOne({ _id: invoiceId, patientId: patient._id });
    if (!bill) {
        throw new Error("Invoice record not found or does not belong to this patient account.");
    }

    if (bill.paymentStatus === "Paid") {
        throw new Error("This invoice is already settled and paid in full.");
    }

    if (bill.paymentStatus === "Cancelled") {
        throw new Error("Cannot process payment for a cancelled invoice.");
    }

    const { paymentMethod, transactionId, cardOrPayerName, paymentTimestamp } = payload;

    const allowedMethods = ["UPI", "Card", "Net_Banking"];
    if (!allowedMethods.includes(paymentMethod)) {
        throw new Error("Invalid payment method. Patients can only pay via UPI, Card, or Net Banking.");
    }

    if (!transactionId || !String(transactionId).trim()) {
        throw new Error("Transaction / UTR reference ID is required to authorize digital payment.");
    }

    if (!cardOrPayerName || !String(cardOrPayerName).trim()) {
        throw new Error("Account holder / Cardholder name is required.");
    }

    // Map payment method to schema enumeration
    const backendPaymentMethod = paymentMethod === "Net_Banking" ? "UPI" : paymentMethod;

    bill.paymentStatus = "Paid";
    bill.paymentMethod = backendPaymentMethod;
    bill.netPayableAmount = 0;

    const auditStamp = `[Digital Online Payment] Method: ${paymentMethod} | TxnID: ${String(transactionId).trim()} | Payer: ${String(cardOrPayerName).trim()} | Timestamp: ${paymentTimestamp || new Date().toISOString()}`;
    bill.extraChargesNotes = bill.extraChargesNotes
        ? `${bill.extraChargesNotes} | ${auditStamp}`
        : auditStamp;

    await bill.save();

    return bill;
};