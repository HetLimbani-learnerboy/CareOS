import mongoose from "mongoose";
import Billing from "./billing.model.js";
import Appointment from "../patients/appointment.model.js";
import Prescription from "../doctor/prescription.model.js";
import TreatmentPlan from "../doctor/treatmentPlan.model.js";
import DoctorProfile from "../doctor/doctorProfile.model.js";
import LabReportHistory from "../lab_technician/labReportHistory.model.js";
import PatientProfile from "../patients/patient.model.js";
import PharmacyInvoice from "../pharmacist/pharmacyInvoice.model.js";
import UserIdentity from "../auth/userIdentity.model.js";
import Admission from "./admission.model.js";

const objectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid appointment id.");
    return new mongoose.Types.ObjectId(id);
};

const money = (value) => Number(Number(value || 0).toFixed(2));

const badStatuses = ["rejected", "reject", "declined", "cancelled", "canceled", "void", "failed"];

const isBad = (value) => badStatuses.includes(String(value || "").trim().toLowerCase());

const isPaid = (value) => String(value || "").trim().toLowerCase() === "paid";

const pick = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const fullName = (user) =>
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "Unknown";

const invoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

const validRelatedRecord = (record) => {
    const statuses = [
        record?.status,
        record?.paymentStatus,
        record?.reportStatus,
        record?.invoiceStatus,
        record?.adminStatus,
        record?.approvalStatus
    ];
    return !statuses.some(isBad);
};

const completedLabRecord = (record) => {
    const status = String(
        pick(record?.status, record?.reportStatus, record?.pipelineStatus, record?.currentStatus, record?.currentPipelineStatus) || ""
    ).toLowerCase();
    return validRelatedRecord(record) && ["completed", "complete", "delivered", "paid"].includes(status);
};

const syncPaidRelatedRecords = async (appointmentId) => {
    if (!appointmentId) return;
    await Promise.all([
        PharmacyInvoice.updateMany(
            { appointmentId },
            { $set: { paymentStatus: "Paid" } }
        ),
        LabReportHistory.updateMany(
            { appointmentId },
            { $set: { isBilled: true } }
        )
    ]);
};

const getUnbilledAppointmentIds = async () => {
    const [pendingPharmacy, unbilledLabs] = await Promise.all([
        PharmacyInvoice.find({ paymentStatus: "Pending" }).distinct("appointmentId"),
        LabReportHistory.find({ status: "completed", isBilled: false }).distinct("appointmentId")
    ]);
    return [...new Set([...pendingPharmacy, ...unbilledLabs].map((id) => String(id)).filter(Boolean))];
};

const getInsurance = (profile) => {
    const provider = pick(
        profile?.insurance_provider,
        profile?.insurance?.provider,
        profile?.insuranceProvider,
        profile?.insurance_company,
        profile?.provider
    );

    const policyNumber = pick(
        profile?.insurance_policynumber,
        profile?.insurance?.policyNumber,
        profile?.insurancePolicyNumber,
        profile?.insurance_policy_number,
        profile?.policyNumber,
        profile?.policy_number
    );

    return {
        provider: provider || "N/A",
        policyNumber: policyNumber || "N/A",
        isValidated: false
    };
};

export const getCompletedAppointmentsList = async () => {
    const billedRows = await Billing.find({ paymentStatus: { $ne: "Cancelled" } }).select("appointmentId").lean();
    const fullyBilledIds = billedRows.map((row) => String(row.appointmentId));
    const unbilledApptIds = await getUnbilledAppointmentIds();

    const appointments = await Appointment.find({
        $or: [
            { _id: { $nin: fullyBilledIds } },
            { _id: { $in: unbilledApptIds } }
        ],
        status: { $in: ["confirmed", "visited", "completed"] }
    })
        .sort({ appointment_date: -1, updatedAt: -1 })
        .lean();

    const patientIds = [...new Set(appointments.map((row) => String(row.patient_id)).filter(Boolean))];
    const doctorIds = [...new Set(appointments.map((row) => String(row.doctor_id)).filter(Boolean))];

    const [patients, doctors] = await Promise.all([
        UserIdentity.find({ _id: { $in: patientIds } }).lean(),
        UserIdentity.find({ _id: { $in: doctorIds } }).lean()
    ]);

    const patientMap = new Map(patients.map((row) => [String(row._id), row]));
    const doctorMap = new Map(doctors.map((row) => [String(row._id), row]));

    return appointments.map((appointment) => {
        const patient = patientMap.get(String(appointment.patient_id));
        const doctor = doctorMap.get(String(appointment.doctor_id));

        return {
            _id: appointment._id,
            appointmentId: appointment._id,
            appointment_date: appointment.appointment_date,
            appointmentDate: appointment.appointment_date,
            appointmentTime: appointment.time_slot || appointment.appointment_time || "",
            time_slot: appointment.time_slot || appointment.appointment_time || "",
            status: appointment.status,
            reason_for_visit: appointment.reason_for_visit || "",
            patientId: appointment.patient_id,
            patientName: fullName(patient),
            patientEmail: patient?.email || appointment.patient_email || ""
        };
    });
};

export const aggregateDraftInvoiceData = async (appointmentId) => {
    const appointmentObjectId = objectId(appointmentId);

    const appointment = await Appointment.findById(appointmentObjectId).lean();
    if (!appointment) throw new Error("Appointment not found.");

    const [patient, doctor, patientProfile, doctorProfile] = await Promise.all([
        UserIdentity.findById(appointment.patient_id).lean(),
        UserIdentity.findById(appointment.doctor_id).lean(),
        PatientProfile.findOne({ patient_id: appointment.patient_id }).lean(),
        DoctorProfile.findOne({ doctor_id: appointment.doctor_id }).lean()
    ]);

    const prescriptions = await Prescription.find({ appointmentId: appointmentObjectId }).lean();
    const cleanPrescriptions = prescriptions.filter(validRelatedRecord);
    const prescriptionIds = cleanPrescriptions.map((p) => p._id);

    const [admissions, pharmacyInvoices, labHistories] = await Promise.all([
        Admission.find({ prescriptionId: { $in: prescriptionIds } }).lean(),
        PharmacyInvoice.find({ appointmentId: appointmentObjectId }).lean(),
        LabReportHistory.find({ appointmentId: appointmentObjectId }).lean()
    ]);

    const admissionIds = admissions.map((a) => a._id);
    const treatmentPlans = await TreatmentPlan.find({
        admissionId: { $in: admissionIds },
        administrationStatus: "Administered"
    }).lean();

    const cleanTreatmentPlans = treatmentPlans.filter(validRelatedRecord);
    const cleanPharmacyInvoices = pharmacyInvoices.filter(validRelatedRecord);
    const cleanLabHistories = labHistories.filter(completedLabRecord);

    const consultationFee = money(doctorProfile?.consultation_fee || appointment.consultation_fee || 0);

    const billingItems = [];
    if (consultationFee > 0) {
        billingItems.push({
            name: `Consultation - Dr. ${fullName(doctor)}`,
            category: "Consultation",
            unitPrice: consultationFee,
            quantity: 1,
            totalPrice: consultationFee,
            prePaid: false
        });
    }

    let treatmentCost = 0;
    cleanTreatmentPlans.forEach((plan) => {
        const rows = Array.isArray(plan.items) ? plan.items : Array.isArray(plan.treatments) ? plan.treatments : [plan];
        rows.forEach((row) => {
            if (isBad(row?.status) || isBad(row?.administrationStatus)) return;
            const name = pick(row?.itemName, row?.name, row?.treatmentHeading, "Clinical Treatment Plan Service");
            const quantity = Math.max(1, Number(pick(row?.quantity, row?.qty, 1)));
            const unitPrice = money(pick(row?.unitPrice, row?.price, row?.cost, 0));
            const totalPrice = money(unitPrice * quantity);
            if (totalPrice <= 0) return;
            treatmentCost += totalPrice;
            billingItems.push({ name, category: "Treatment", unitPrice, quantity, totalPrice, prePaid: false });
        });
    });

    let medicineCost = 0;
    let medicinePrePaid = 0;
    cleanPharmacyInvoices.forEach((invoice) => {
        const prePaid = isPaid(invoice.paymentStatus);
        const rows = Array.isArray(invoice.items) ? invoice.items : Array.isArray(invoice.medicines) ? invoice.medicines : [];
        if (rows.length) {
            rows.forEach((row) => {
                if (isBad(row?.status)) return;
                const quantity = Math.max(1, Number(pick(row?.quantityDispensed, row?.quantity, row?.qty, 1)));
                const unitPrice = money(pick(row?.unitPrice, row?.price, 0));
                const totalPrice = money(pick(row?.totalPrice, unitPrice * quantity));
                if (totalPrice <= 0) return;
                medicineCost += totalPrice;
                if (prePaid) medicinePrePaid += totalPrice;
                billingItems.push({
                    name: pick(row?.medicineName, row?.medicine, row?.name, "Prescribed Medication"),
                    category: "Medicine",
                    unitPrice,
                    quantity,
                    totalPrice,
                    prePaid
                });
            });
        } else {
            const totalPrice = money(pick(invoice.totalAmount, invoice.grandTotal, 0));
            if (totalPrice > 0) {
                medicineCost += totalPrice;
                if (prePaid) medicinePrePaid += totalPrice;
                billingItems.push({
                    name: "Pharmacy Order Invoice Bundle",
                    category: "Medicine",
                    unitPrice: totalPrice,
                    quantity: 1,
                    totalPrice,
                    prePaid
                });
            }
        }
    });

    let labCost = 0;
    let labPrePaid = 0;
    cleanLabHistories.forEach((report) => {
        const totalPrice = money(pick(report.billingAmount, report.totalAmount, report.amount, 0));
        if (totalPrice <= 0) return;
        const prePaid = report.isBilled === true || isPaid(report.status);
        labCost += totalPrice;
        if (prePaid) labPrePaid += totalPrice;
        billingItems.push({
            name: pick(report.requestedTests?.join(", "), report.reportName, "Diagnostic Laboratory Evaluation"),
            category: "LabReport",
            unitPrice: totalPrice,
            quantity: 1,
            totalPrice,
            prePaid
        });
    });

    const grossTotal = money(consultationFee + treatmentCost + medicineCost + labCost);
    const deductionsPrePaid = money(medicinePrePaid + labPrePaid);

    return {
        appointmentId: appointment._id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time || appointment.time_slot || "",
        patientId: appointment.patient_id,
        patientName: fullName(patient),
        patientEmail: patient?.email || appointment.patient_email || "",
        doctorId: appointment.doctor_id,
        doctorName: fullName(doctor),
        prescriptions: cleanPrescriptions,
        insurance: getInsurance(patientProfile),
        costs: {
            consultationFee,
            treatmentCost: money(treatmentCost),
            medicineCost: money(medicineCost),
            labCost: money(labCost),
            grossTotal,
            deductionsPrePaid,
            netBeforeInsurance: money(Math.max(grossTotal - deductionsPrePaid, 0))
        },
        billingItems,
        sourceCounts: {
            prescriptions: cleanPrescriptions.length,
            treatmentPlans: cleanTreatmentPlans.length,
            pharmacyInvoices: cleanPharmacyInvoices.length,
            labReportHistories: cleanLabHistories.length
        }
    };
};

export const upsertBillingFromDraft = async (appointmentId, options = {}) => {
    if (!appointmentId) throw new Error("Appointment id required for billing upsert.");

    const draft = await aggregateDraftInvoiceData(appointmentId);
    const extraCharges = money(options.extraCharges || 0);
    const extraChargesNotes = String(options.extraChargesNotes || "").trim();

    const grossTotal = money(draft.costs.grossTotal + extraCharges);
    const deductionsPrePaid = money(draft.costs.deductionsPrePaid);

    let existing = await Billing.findOne({ appointmentId: draft.appointmentId, paymentStatus: { $ne: "Cancelled" } });

    const insurance = existing?.insurance || draft.insurance || getInsurance({});
    const isInsurancePayment = existing?.paymentMethod === "Insurance" || (insurance?.isValidated && insurance.provider && insurance.provider !== "N/A");

    const deskBalance = money(Math.max(grossTotal - deductionsPrePaid, 0));

    let insuranceCoverageAmount = 0;
    let netPayableAmount = 0;
    let paidAmount = money(existing?.paidAmount || 0);

    if (isInsurancePayment) {
        insuranceCoverageAmount = deskBalance;
        netPayableAmount = 0;
    } else {
        netPayableAmount = money(Math.max(deskBalance - paidAmount, 0));
    }

    let paymentStatus;
    if (netPayableAmount <= 0) {
        paymentStatus = isInsurancePayment ? "Insurance_Claim_Pending" : "Paid";
    } else if (paidAmount > 0) {
        paymentStatus = "Partially_Paid"; 
    } else {
        paymentStatus = isInsurancePayment ? "Insurance_Claim_Pending" : "Unpaid";
    }

    const billingItems = [...draft.billingItems];
    if (extraCharges > 0) {
        billingItems.push({
            name: extraChargesNotes || "Administrative Adjustment Fee",
            category: "Adjustment",
            unitPrice: extraCharges,
            quantity: 1,
            totalPrice: extraCharges,
            prePaid: false
        });
    }

    if (existing) {
        existing.consultationFee = draft.costs.consultationFee;
        existing.treatmentCost = draft.costs.treatmentCost;
        existing.medicineCost = draft.costs.medicineCost;
        existing.labCost = draft.costs.labCost;
        existing.extraCharges = extraCharges;
        existing.extraChargesNotes = extraChargesNotes;
        existing.grossTotal = grossTotal;
        existing.deductionsPrePaid = deductionsPrePaid;
        existing.insuranceCoverageAmount = insuranceCoverageAmount;
        existing.netPayableAmount = netPayableAmount;
        existing.remainingBalance = netPayableAmount;
        existing.insurance = insurance;
        existing.billingItems = billingItems;
        existing.paymentStatus = paymentStatus;

        await existing.save();
        return existing;
    }

    const created = await Billing.create({
        invoiceNumber: invoiceNumber(),
        appointmentId: draft.appointmentId,
        patientId: draft.patientId,
        patientEmail: draft.patientEmail,
        doctorId: draft.doctorId,
        consultationFee: draft.costs.consultationFee,
        treatmentCost: draft.costs.treatmentCost,
        medicineCost: draft.costs.medicineCost,
        labCost: draft.costs.labCost,
        extraCharges,
        extraChargesNotes,
        grossTotal,
        deductionsPrePaid,
        insuranceCoverageAmount,
        netPayableAmount,
        insurance,
        billingItems,
        paymentStatus,
        paymentMethod: isInsurancePayment ? "Insurance" : "N/A",
        paidAmount: 0,
        remainingBalance: netPayableAmount
    });

    return created;
};


export const saveConfirmedLedgerBill = async (payload, receptionistEmail) => {
    const receptionist = await UserIdentity.findOne({
        email: String(receptionistEmail || "").toLowerCase(),
        role: "receptionist"
    }).lean();
    if (!receptionist) throw new Error("Receptionist profile session context missing.");

    const existing = await Billing.findOne({
        appointmentId: payload.appointmentId,
        paymentStatus: { $ne: "Cancelled" }
    });

    const draft = await aggregateDraftInvoiceData(payload.appointmentId);
    const extraCharges = money(payload.extraCharges);
    const extraChargesNotes = String(payload.extraChargesNotes || "").trim();

    const billingItems = [...draft.billingItems];
    if (extraCharges > 0) {
        billingItems.push({
            name: extraChargesNotes || "Administrative Adjustment Fee",
            category: "Adjustment",
            unitPrice: extraCharges,
            quantity: 1,
            totalPrice: extraCharges,
            prePaid: false
        });
    }

    const grossTotal = money(draft.costs.grossTotal + extraCharges);
    const deductionsPrePaid = money(draft.costs.deductionsPrePaid);

    const insurance = {
        provider: payload.insurance?.provider || draft.insurance.provider || "",
        policyNumber: payload.insurance?.policyNumber || draft.insurance.policyNumber || "",
        isValidated: Boolean(payload.insurance?.isValidated)
    };

    const insuranceUsable =
        insurance.isValidated &&
        insurance.provider &&
        insurance.provider !== "N/A" &&
        insurance.policyNumber &&
        insurance.policyNumber !== "N/A";

    const deskBalance = money(Math.max(grossTotal - deductionsPrePaid, 0));
    const insuranceCoverageAmount = insuranceUsable ? deskBalance : 0;
    const netPayableAmount = insuranceUsable ? 0 : deskBalance;

    let paymentStatus;
    let paymentMethod;

    if (insuranceUsable) {
        paymentStatus = "Insurance_Claim_Pending";
        paymentMethod = "Insurance";
    } else if (netPayableAmount > 0) {
        paymentStatus = "Unpaid";
        paymentMethod = payload.paymentMethod || "Cash";
    } else {
        paymentStatus = "Paid";
        paymentMethod = payload.paymentMethod || "Cash";
    }

    let bill;
    if (existing) {
        const previousPaid = money(existing.paidAmount || 0);

        existing.consultationFee = draft.costs.consultationFee;
        existing.treatmentCost = draft.costs.treatmentCost;
        existing.medicineCost = draft.costs.medicineCost;
        existing.labCost = draft.costs.labCost;
        existing.extraCharges = extraCharges;
        existing.extraChargesNotes = extraChargesNotes;
        existing.grossTotal = grossTotal;
        existing.deductionsPrePaid = deductionsPrePaid;
        existing.insuranceCoverageAmount = insuranceCoverageAmount;
        existing.netPayableAmount = money(Math.max(grossTotal - deductionsPrePaid - insuranceCoverageAmount - previousPaid, 0));
        existing.paidAmount = previousPaid;
        existing.remainingBalance = existing.netPayableAmount;
        existing.insurance = insurance;
        existing.billingItems = billingItems;
        existing.paymentMethod = paymentMethod;
        existing.receptionistId = receptionist._id;

        if (insuranceUsable) {
            existing.paymentStatus = "Insurance_Claim_Pending";
            existing.paymentMethod = "Insurance";
        } else if (existing.netPayableAmount <= 0) {
            existing.paymentStatus = "Paid";
        } else if (existing.paidAmount > 0) {
            existing.paymentStatus = "Partially_Paid";
        } else {
            existing.paymentStatus = "Unpaid";
        }

        bill = await existing.save();
    } else {
        bill = await Billing.create({
            invoiceNumber: invoiceNumber(),
            appointmentId: draft.appointmentId,
            patientId: draft.patientId,
            patientEmail: draft.patientEmail,
            doctorId: draft.doctorId,
            consultationFee: draft.costs.consultationFee,
            treatmentCost: draft.costs.treatmentCost,
            medicineCost: draft.costs.medicineCost,
            labCost: draft.costs.labCost,
            extraCharges,
            extraChargesNotes,
            grossTotal,
            deductionsPrePaid,
            insuranceCoverageAmount,
            netPayableAmount,
            insurance,
            billingItems,
            paymentStatus,
            paymentMethod,
            receptionistId: receptionist._id,
            paidAmount: 0,
            remainingBalance: netPayableAmount
        });
    }

    if (paymentStatus === "Paid") {
        await syncPaidRelatedRecords(draft.appointmentId);
    }

    return bill;
};

export const getPartitionedBillingHistory = async () => {
    const rows = await Billing.find({}).sort({ createdAt: -1 }).lean();

    const patientIds = [...new Set(rows.map((r) => (r.patientId ? String(r.patientId) : null)).filter(Boolean))];
    const doctorIds = [...new Set(rows.map((r) => (r.doctorId ? String(r.doctorId) : null)).filter(Boolean))];

    const [patients, doctors] = await Promise.all([
        UserIdentity.find({ _id: { $in: patientIds } }).lean(),
        UserIdentity.find({ _id: { $in: doctorIds } }).lean()
    ]);

    const patientMap = new Map(patients.map((p) => [String(p._id), p]));
    const doctorMap = new Map(doctors.map((d) => [String(d._id), d]));

    const decorate = (bill) => {
        const pt = patientMap.get(String(bill.patientId));
        const doc = doctorMap.get(String(bill.doctorId));
        return {
            ...bill,
            patientName: fullName(pt),
            doctorName: fullName(doc)
        };
    };

    const unbilledApptIds = await getUnbilledAppointmentIds();
    const billedRows = await Billing.find({ paymentStatus: { $ne: "Cancelled" } }).select("appointmentId").lean();
    const billedIds = billedRows.map((row) => String(row.appointmentId));

    const pendingAppointments = await Appointment.find({
        $or: [
            { _id: { $nin: billedIds } },
            { _id: { $in: unbilledApptIds } }
        ],
        status: { $in: ["confirmed", "visited", "completed"] }
    })
        .sort({ appointment_date: -1, updatedAt: -1 })
        .lean();

    const existingUnpaidApptIds = new Set(
        rows.filter((r) => r.paymentStatus === "Unpaid").map((r) => String(r.appointmentId))
    );

    const pendingPatientIds = [...new Set(pendingAppointments.map((row) => String(row.patient_id)).filter(Boolean))];
    const pendingDoctorIds = [...new Set(pendingAppointments.map((row) => String(row.doctor_id)).filter(Boolean))];

    const [pendingPatients, pendingDoctors] = await Promise.all([
        UserIdentity.find({ _id: { $in: pendingPatientIds } }).lean(),
        UserIdentity.find({ _id: { $in: pendingDoctorIds } }).lean()
    ]);

    const pendingPatientMap = new Map(pendingPatients.map((row) => [String(row._id), row]));
    const pendingDoctorMap = new Map(pendingDoctors.map((row) => [String(row._id), row]));

    const unbilledDrafts = pendingAppointments
        .filter((apt) => !existingUnpaidApptIds.has(String(apt._id)))
        .map((apt) => {
            const patient = pendingPatientMap.get(String(apt.patient_id));
            const doctor = pendingDoctorMap.get(String(apt.doctor_id));

            return {
                _id: `DRAFT-${apt._id}`,
                appointmentId: apt._id,
                patientId: apt.patient_id,
                patientName: fullName(patient),
                patientEmail: patient?.email || apt.patient_email || "",
                doctorName: fullName(doctor),
                invoiceNumber: "UNBILLED BACKLOG",
                paymentStatus: "Unbilled_Queue",
                grossTotal: 0,
                deductionsPrePaid: 0,
                netPayableAmount: 0,
                billingItems: [],
                isDraftBacklog: true,
                createdAt: apt.updatedAt || apt.appointment_date
            };
        });

    const existingUnpaid = rows.filter((row) => row.paymentStatus === "Unpaid").map(decorate);

    return {
        unpaid: [...unbilledDrafts, ...existingUnpaid],
        insurancePending: rows.filter((row) => row.paymentStatus === "Insurance_Claim_Pending").map(decorate),
        paid: rows.filter((row) => row.paymentStatus === "Paid").map(decorate),
        cancelled: rows.filter((row) => row.paymentStatus === "Cancelled").map(decorate)
    };
};

export const updateInvoiceStatusState = async (invoiceId, payload) => {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) throw new Error("Invalid invoice reference id mapping.");

    const nextStatus = payload.paymentStatus || payload.status;
    if (!["Unpaid", "Partially_Paid", "Paid", "Insurance_Claim_Pending", "Cancelled"].includes(nextStatus)) {
        throw new Error("Invalid categorical invoice parameter adjustment payload.");
    }

    const existingBill = await Billing.findById(invoiceId);
    if (!existingBill) throw new Error("Invoice tracking context target missing.");

    const update = { paymentStatus: nextStatus };

    if (nextStatus === "Paid") {
        if (existingBill.paymentStatus === "Insurance_Claim_Pending" || existingBill.paymentMethod === "Insurance" || payload.paymentMethod === "Insurance") {
            update.paymentMethod = "Insurance";
        } else {
            update.paymentMethod = payload.paymentMethod || "Cash";
        }

        const previousPaid = money(existingBill.paidAmount || 0);
        const remaining = money(existingBill.netPayableAmount || 0);
        update.paidAmount = money(previousPaid + remaining);
        update.netPayableAmount = 0;
        update.remainingBalance = 0;
    }

    if (nextStatus === "Insurance_Claim_Pending") {
        update.paymentMethod = "Insurance";
    }

    if (nextStatus === "Cancelled") {
        update.paymentMethod = "N/A";
    }

    const bill = await Billing.findByIdAndUpdate(invoiceId, update, { new: true, runValidators: true });
    if (!bill) throw new Error("Invoice tracking context target missing.");

    if (nextStatus === "Paid") {
        await syncPaidRelatedRecords(bill.appointmentId);
    }

    return bill;
};