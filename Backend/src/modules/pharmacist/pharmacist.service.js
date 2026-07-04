import mongoose from "mongoose";
import Prescription from "../doctor/prescription.model.js";
import UserIdentity from "../auth/userIdentity.model.js";
import MedicineHistory from "./medicineHistory.model.js";
import PharmacyInvoice from "./pharmacyInvoice.model.js";
import { MedicineCatalog } from "../doctor/catalog.model.js";

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeText = (value) => String(value || "").trim();
const escapeRegex = (value) => normalizeText(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getRequiredQuantity = (item, customQuantity) => {
    const customQtyNum = Number(customQuantity);
    if (Number.isFinite(customQtyNum) && customQtyNum > 0) return customQtyNum;

    const directQuantity = Number(item.quantity || item.qty || item.quantityDispensed);
    if (Number.isFinite(directQuantity) && directQuantity > 0) return directQuantity;

    const days = Number(item.days);
    if (Number.isFinite(days) && days > 0) return days;

    return 1;
};

const getActiveStockQuery = () => ({
    quantity: { $gt: 0 },
    $or: [
        { expiry_date: { $exists: false } },
        { expiry_date: null },
        { expiry_date: { $gt: new Date() } }
    ]
});

export const findMedicinesByComposition = async (compositionName) => {
    const composition = normalizeText(compositionName);
    if (!composition) return [];

    return MedicineCatalog.find({
        ...getActiveStockQuery(),
        composition: { $regex: new RegExp(escapeRegex(composition), "i") }
    })
        .sort({ medicine_name: 1 })
        .lean();
};

export const findMedicinesByUsecase = async (usecase, excludeMedicine = "") => {
    const medicineUsecase = normalizeText(usecase);
    const excluded = normalizeText(excludeMedicine);

    if (!medicineUsecase) return [];

    const query = {
        ...getActiveStockQuery(),
        medicine_usecase: { $regex: new RegExp(escapeRegex(medicineUsecase), "i") }
    };

    if (excluded) {
        query.medicine_name = { $ne: excluded };
    }

    return MedicineCatalog.find(query)
        .sort({ quantity: -1, price: 1, medicine_name: 1 })
        .lean();
};

const getMedicineStockSummary = async (medicineItem) => {
    const medicineName = normalizeText(medicineItem.medicine);
    const quantityNeeded = getRequiredQuantity(medicineItem);

    const stock = await MedicineCatalog.findOne({
        medicine_name: medicineName
    }).lean();

    const usecase = stock?.medicine_usecase || medicineItem.medicine_usecase || medicineItem.usecase || "";

    const alternatives = usecase
        ? await findMedicinesByUsecase(usecase, medicineName)
        : [];

    const hasEnoughStock = !!stock && Number(stock.quantity || 0) >= quantityNeeded;

    return {
        ...medicineItem,
        medicine: medicineName,
        quantityNeeded,
        stockStatus: stock
            ? hasEnoughStock
                ? "sufficient"
                : "insufficient"
            : "unavailable",
        availableQuantity: stock?.quantity || 0,
        unitPrice: stock?.price || 0,
        medicineUsecase: usecase,
        composition: stock?.composition || "",
        canDispenseOriginal: hasEnoughStock,
        alternatives: alternatives.map((alt) => ({
            medicineId: String(alt._id),
            medicineName: alt.medicine_name,
            company: alt.company,
            category: alt.category,
            composition: alt.composition,
            medicineUsecase: alt.medicine_usecase,
            price: alt.price || 0,
            availableQuantity: alt.quantity || 0,
            expiryDate: alt.expiry_date
        }))
    };
};

export const getEligibleDispensingPrescriptions = async () => {
    const prescriptions = await Prescription.find({
        medicines: { $exists: true, $not: { $size: 0 } }
    })
        .sort({ updatedAt: -1, updated_at: -1, createdAt: -1, created_at: -1 })
        .lean();

    if (!prescriptions.length) return [];

    const prescriptionIds = prescriptions.map((prescription) => prescription._id);

    const historyLogs = await MedicineHistory.find({
        prescriptionId: { $in: prescriptionIds }
    }).lean();

    const historyMap = {};
    historyLogs.forEach((log) => {
        historyMap[String(log.prescriptionId)] = log;
    });

    const uniqueEmails = [
        ...new Set(
            prescriptions
                .map((prescription) => String(prescription.patientEmail || "").toLowerCase().trim())
                .filter(Boolean)
        )
    ];

    const patients = await UserIdentity.find({
        email: { $in: uniqueEmails },
        role: 'patient'
    }).lean();

    const patientMap = {};
    patients.forEach((patient) => {
        patientMap[String(patient.email).toLowerCase().trim()] = patient;
    });

    const activeQueue = [];

    for (const prescription of prescriptions) {
        const history = historyMap[String(prescription._id)];

        const prescriptionTime = new Date(
            prescription.updatedAt ||
            prescription.updated_at ||
            prescription.createdAt ||
            prescription.created_at ||
            Date.now()
        ).getTime();

        if (history?.dispensedAt) {
            const dispensedTime = new Date(history.dispensedAt).getTime();
            if (prescriptionTime <= dispensedTime) continue;
        }

        const patient = patientMap[String(prescription.patientEmail || "").toLowerCase().trim()];

        const medicinesWithStock = await Promise.all(
            (prescription.medicines || []).map((medicine) => getMedicineStockSummary(medicine))
        );

        activeQueue.push({
            prescriptionId: String(prescription._id),
            appointmentId: prescription.appointmentId ? String(prescription.appointmentId) : null,
            patientEmail: prescription.patientEmail,
            patientName: patient
                ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
                : "Patient",
            patientPhone: patient?.phone || "N/A",
            doctorEmail: prescription.doctorEmail,
            doctorName: prescription.doctorName || "Doctor",
            prescriptionName: prescription.prescriptionName || "Standard Pack",
            diagnosis: prescription.diagnosis || "N/A",
            notes: prescription.notes || "",
            medicines: medicinesWithStock,
            labReports: prescription.labReports || [],
            isReentryUpdate: !!history,
            lastActionTimestamp:
                prescription.updatedAt ||
                prescription.updated_at ||
                prescription.createdAt ||
                prescription.created_at
        });
    }

    return activeQueue;
};

const buildSubstitutionMap = (substitutions = []) => {
    const substitutionMap = {};

    substitutions.forEach((substitution) => {
        const originalMedicine = normalizeText(substitution.originalMedicine);

        if (!originalMedicine) return;

        substitutionMap[originalMedicine.toLowerCase()] = {
            chosenAlternate: normalizeText(substitution.chosenAlternate),
            patientAllowed: substitution.patientAllowed !== false,
            customQuantity: substitution.customQuantity
        };
    });

    return substitutionMap;
};

const resolveStockForDispensing = async ({
    originalItem,
    substitution,
    session
}) => {
    const originalMedicineName = normalizeText(originalItem.medicine);

    const quantityNeeded = getRequiredQuantity(originalItem, substitution?.customQuantity);

    const originalStock = await MedicineCatalog.findOne({
        medicine_name: originalMedicineName
    }).session(session);

    if (originalStock && Number(originalStock.quantity || 0) >= quantityNeeded) {
        return {
            stock: originalStock,
            quantityNeeded,
            usedSubstitution: false,
            skipped: false,
            skipReason: ""
        };
    }

    if (substitution && substitution.patientAllowed === false) {
        return {
            stock: null,
            quantityNeeded,
            usedSubstitution: false,
            skipped: true,
            skipReason: "Patient did not allow substitution."
        };
    }

    const alternateName = normalizeText(substitution?.chosenAlternate);

    if (!alternateName) {
        return {
            stock: null,
            quantityNeeded,
            usedSubstitution: false,
            skipped: true,
            skipReason: originalStock ? "Original medicine has insufficient stock." : "Original medicine is unavailable."
        };
    }

    const alternateStock = await MedicineCatalog.findOne({
        medicine_name: alternateName,
        ...getActiveStockQuery()
    }).session(session);

    if (!alternateStock) {
        return {
            stock: null,
            quantityNeeded,
            usedSubstitution: true,
            skipped: true,
            skipReason: "Selected alternate medicine is unavailable."
        };
    }

    if (Number(alternateStock.quantity || 0) < quantityNeeded) {
        return {
            stock: null,
            quantityNeeded,
            usedSubstitution: true,
            skipped: true,
            skipReason: "Selected alternate medicine has insufficient stock."
        };
    }

    const originalUsecase = originalStock?.medicine_usecase || originalItem.medicine_usecase || originalItem.usecase || "";

    if (
        originalUsecase &&
        alternateStock.medicine_usecase &&
        String(originalUsecase).trim().toLowerCase() !== String(alternateStock.medicine_usecase).trim().toLowerCase()
    ) {
        throw httpError(
            400,
            `${alternateStock.medicine_name} cannot replace ${originalMedicineName}. Medicine use case does not match.`
        );
    }

    return {
        stock: alternateStock,
        quantityNeeded,
        usedSubstitution: true,
        skipped: false,
        skipReason: ""
    };
};

export const completeMedicineDispensingWithSubstitutions = async (
    prescriptionId,
    pharmacistEmail,
    substitutions = []
) => {
    if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
        throw httpError(400, "Invalid prescription id.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const prescription = await Prescription.findById(prescriptionId).session(session);

        if (!prescription) {
            throw httpError(404, "Prescription not found.");
        }

        const patient = await UserIdentity.findOne({
            email: String(prescription.patientEmail || "").toLowerCase().trim(),
            role: "patient"
        })
            .session(session)
            .lean();

        const substitutionMap = buildSubstitutionMap(substitutions);

        let totalBillAmount = 0;
        const itemsBilled = [];
        const dispensedMedicines = [];
        const skippedMedicines = [];

        for (const item of prescription.medicines || []) {
            const originalMedicineName = normalizeText(item.medicine);
            const substitution = substitutionMap[originalMedicineName.toLowerCase()];

            const resolved = await resolveStockForDispensing({
                originalItem: item,
                substitution,
                session
            });

            if (resolved.skipped) {
                skippedMedicines.push({
                    originalMedicine: originalMedicineName,
                    requestedQuantity: resolved.quantityNeeded,
                    reason: resolved.skipReason
                });
                continue;
            }

            const stock = resolved.stock;
            const quantityNeeded = resolved.quantityNeeded;

            stock.quantity = Number(stock.quantity || 0) - quantityNeeded;
            await stock.save({ session });

            const unitPrice = Number(stock.price || 0);
            const lineCost = unitPrice * quantityNeeded;

            totalBillAmount += lineCost;

            itemsBilled.push({
                medicineId: stock._id,
                originalMedicine: originalMedicineName,
                medicineName: stock.medicine_name,
                usedSubstitution: resolved.usedSubstitution,
                unitPrice,
                quantityDispensed: quantityNeeded,
                totalPrice: lineCost
            });

            dispensedMedicines.push({
                originalMedicine: originalMedicineName,
                medicine: stock.medicine_name,
                dosage: item.dosage,
                days: item.days,
                quantityDispensed: quantityNeeded,
                usedSubstitution: resolved.usedSubstitution
            });
        }

        if (!itemsBilled.length) {
            throw httpError(
                400,
                "No medicines were dispensed. All requested medicines were unavailable, insufficient, or skipped."
            );
        }

        const history = await MedicineHistory.findOneAndUpdate(
            { prescriptionId: prescription._id },
            {
                $set: {
                    prescriptionId: prescription._id,
                    appointmentId: prescription.appointmentId,
                    patientId: patient?._id || null,
                    patientEmail: prescription.patientEmail,
                    pharmacistEmail,
                    dispensedMedicines,
                    skippedMedicines,
                    dispensedAt: new Date()
                }
            },
            {
                upsert: true,
                new: true,
                session
            }
        );

        const [invoice] = await PharmacyInvoice.create(
            [
                {
                    prescriptionId: prescription._id,
                    appointmentId: prescription.appointmentId,
                    patientId: patient?._id || null,
                    patientEmail: prescription.patientEmail,
                    pharmacistEmail,
                    items: itemsBilled,
                    skippedMedicines,
                    totalAmount: totalBillAmount,
                    paymentStatus: "Pending",
                    generatedAt: new Date()
                }
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            history,
            invoice,
            summary: {
                dispensedCount: itemsBilled.length,
                skippedCount: skippedMedicines.length,
                totalAmount: totalBillAmount,
                dispensedMedicines,
                skippedMedicines
            }
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const getPharmacyBillingLedger = async () => {
    const invoices = await PharmacyInvoice.find({})
        .sort({ createdAt: -1 })
        .lean();

    if (!invoices.length) {
        return { pending: [], paid: [], cancelled: [] };
    }

    const emails = [...new Set(invoices.map((inv) => String(inv.patientEmail).toLowerCase().trim()))];
    const patients = await UserIdentity.find({ email: { $in: emails }, role: "patient" }).lean();

    const patientMap = {};
    patients.forEach((p) => {
        patientMap[String(p.email).toLowerCase().trim()] = `${p.firstName || ""} ${p.lastName || ""}`.trim();
    });

    const ledger = { pending: [], paid: [], cancelled: [] };

    invoices.forEach((inv) => {
        const formatted = {
            invoiceId: String(inv._id),
            prescriptionId: String(inv.prescriptionId),
            appointmentId: inv.appointmentId ? String(inv.appointmentId) : null,
            patientEmail: inv.patientEmail,
            patientName: patientMap[String(inv.patientEmail).toLowerCase().trim()] || "Patient",
            pharmacistEmail: inv.pharmacistEmail || "N/A",
            items: inv.items || [],
            skippedMedicines: inv.skippedMedicines || [],
            totalAmount: inv.totalAmount || 0,
            paymentStatus: inv.paymentStatus,
            generatedAt: inv.generatedAt || inv.createdAt
        };

        if (inv.paymentStatus === "Pending") ledger.pending.push(formatted);
        else if (inv.paymentStatus === "Paid") ledger.paid.push(formatted);
        else if (inv.paymentStatus === "Cancelled") ledger.cancelled.push(formatted);
    });

    return ledger;
};

export const settleInvoiceViaCash = async (invoiceId, pharmacistEmail) => {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        throw httpError(400, "Invalid invoice reference identifier.");
    }

    const invoice = await PharmacyInvoice.findById(invoiceId);
    if (!invoice) {
        throw httpError(404, "Active pharmacy invoice statement not found.");
    }

    if (invoice.paymentStatus !== "Pending") {
        throw httpError(400, `Cannot settle this receipt. Current status is already set to ${invoice.paymentStatus}.`);
    }

    invoice.paymentStatus = "Paid";
    if (pharmacistEmail) invoice.pharmacistEmail = pharmacistEmail.toLowerCase().trim();

    await invoice.save();
    return invoice;
};

export const voidPharmacyInvoice = async (invoiceId, pharmacistEmail) => {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        throw httpError(400, "Invalid invoice reference identifier.");
    }

    const invoice = await PharmacyInvoice.findById(invoiceId);
    if (!invoice) {
        throw httpError(404, "Active pharmacy invoice statement not found.");
    }

    if (invoice.paymentStatus !== "Pending") {
        throw httpError(400, `Cannot void this receipt. Current status is already set to ${invoice.paymentStatus}.`);
    }

    invoice.paymentStatus = "Cancelled";
    if (pharmacistEmail) invoice.pharmacistEmail = pharmacistEmail.toLowerCase().trim();

    await invoice.save();
    return invoice;
};