import Prescription from "../doctor/prescription.model.js";
import UserIdentity from "../auth/userIdentity.model.js";
import WardBed from "./wardBed.model.js";
import Admission from "./admission.model.js";
import mongoose from "mongoose";

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const seedWardBedsIfEmpty = async () => {
    const count = await WardBed.countDocuments();
    if (count > 0) return;

    const bedsToCreate = [];
    for (let i = 1; i <= 8; i++) bedsToCreate.push({ bedNumber: `GR-${100 + i}`, roomType: "General Room", price: 1000, status: "Available" });
    for (let i = 1; i <= 6; i++) bedsToCreate.push({ bedNumber: `SD-${200 + i}`, roomType: "Semi-Deluxe Room", price: 2000, status: "Available" });
    for (let i = 1; i <= 6; i++) bedsToCreate.push({ bedNumber: `DL-${300 + i}`, roomType: "Deluxe Room", price: 3500, status: "Available" });
    for (let i = 1; i <= 5; i++) bedsToCreate.push({ bedNumber: `ICU-${400 + i}`, roomType: "ICU", price: 5000, status: "Available" });

    await WardBed.insertMany(bedsToCreate);
};

export const getAdmissionDashboardData = async () => {
    await seedWardBedsIfEmpty();

    const beds = await WardBed.find({}).sort({ bedNumber: 1 }).lean();

    const activeAdmissionPrescriptionIds = await Admission.find({ status: "Admitted" }).distinct("prescriptionId");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const rawPrescriptions = await Prescription.find({
        _id: { $nin: activeAdmissionPrescriptionIds },
        $or: [
            { updated_at: { $gte: sevenDaysAgo } },
            { updatedAt: { $gte: sevenDaysAgo } },
            { created_at: { $gte: sevenDaysAgo } },
            { createdAt: { $gte: sevenDaysAgo } }
        ]
    }).sort({ createdAt: -1, created_at: -1 }).lean();

    const emails = rawPrescriptions
        .map(p => String(p.patientEmail || "").toLowerCase().trim())
        .filter(Boolean);

    const patients = await UserIdentity.find({
        email: { $in: emails },
        role: "patient"
    }).lean();

    const patientMap = {};
    patients.forEach(p => {
        patientMap[String(p.email).toLowerCase().trim()] = p;
    });

    const incomingQueue = rawPrescriptions.map(pres => {
        const matchedPat = patientMap[String(pres.patientEmail || "").toLowerCase().trim()];
        return {
            prescriptionId: String(pres._id),
            patientId: matchedPat ? String(matchedPat._id) : null,
            patientName: matchedPat ? `${matchedPat.firstName || ""} ${matchedPat.lastName || ""}`.trim() : "Patient Account",
            patientEmail: pres.patientEmail,
            doctorName: pres.doctorName || "N/A",
            doctorEmail: pres.doctorEmail || "N/A",
            diagnosis: pres.diagnosis || "N/A",
            prescriptionName: pres.prescriptionName || "Standard Pack",
            resultSummary: pres.result || "N/A",
            updatedAt: pres.updated_at || pres.updatedAt || pres.created_at || pres.createdAt
        };
    });

    const currentAdmissions = await Admission.find({ status: "Admitted" })
        .populate({
            path: "nurseIds",
            select: "_id firstName lastName email",
            model: UserIdentity
        })
        .populate({
            path: "prescriptionId",
            select: "doctorName doctorEmail prescriptionName diagnosis result",
            model: Prescription
        })
        .sort({ admittedAt: -1 })
        .lean();

    const activeNurses = await UserIdentity.find({ role: "nurse" })
        .select("_id firstName lastName email")
        .sort({ firstName: 1 })
        .lean();

    return {
        beds,
        incomingQueue,
        currentAdmissions,
        nurses: activeNurses.map(n => ({
            nurseId: String(n._id),
            name: `${n.firstName || ""} ${n.lastName || ""}`.trim(),
            email: n.email
        }))
    };
};

export const processPatientAdmission = async (admissionData) => {
    const { prescriptionId, patientId, patientName, patientEmail, roomType, nurseIds } = admissionData;

    if (!prescriptionId || !patientName || !patientEmail || !roomType || !nurseIds || !Array.isArray(nurseIds)) {
        throw httpError(400, "Required property variables missing from admission payload body parameters.");
    }

    if (nurseIds.length < 1) {
        throw httpError(400, "At least one nurse must be assigned to the patient.");
    }

    if (nurseIds.length > 3) {
        throw httpError(400, "A maximum of 3 nurses can be assigned to a patient.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const availableBed = await WardBed.findOne({ roomType, status: "Available" }).session(session);
        if (!availableBed) {
            throw httpError(422, `No vacant beds available under the selected ${roomType} room type.`);
        }

        const validNurses = await UserIdentity.find({
            _id: { $in: nurseIds.map(id => mongoose.Types.ObjectId.createFromHexString(id)) },
            role: "nurse"
        }).session(session);

        if (validNurses.length !== nurseIds.length) {
            throw httpError(400, "One or more selected nurses are invalid.");
        }

        const checkInTime = new Date();
        const dischargeTime = new Date();
        dischargeTime.setDate(checkInTime.getDate() + 1);

        const newAdmission = new Admission({
            prescriptionId: mongoose.Types.ObjectId.createFromHexString(prescriptionId),
            patientId: patientId ? mongoose.Types.ObjectId.createFromHexString(patientId) : new mongoose.Types.ObjectId(),
            patientName: String(patientName).trim(),
            patientEmail: String(patientEmail).toLowerCase().trim(),
            nurseIds: nurseIds.map(id => mongoose.Types.ObjectId.createFromHexString(id)),
            bedId: availableBed._id,
            roomType,
            admittedAt: checkInTime,
            dischargeEligibleAt: dischargeTime,
            status: "Admitted"
        });

        await newAdmission.save({ session });

        availableBed.status = "Occupied";
        availableBed.currentAdmissionId = newAdmission._id;
        await availableBed.save({ session });

        await session.commitTransaction();
        return newAdmission;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export const processPatientDischarge = async (admissionId) => {
    if (!mongoose.Types.ObjectId.isValid(admissionId)) {
        throw httpError(400, "Invalid admission reference token format identifier.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const admission = await Admission.findById(admissionId).session(session);
        if (!admission || admission.status === "Discharged") {
            throw httpError(404, "Active admission profile tracking line not found or already discharged.");
        }

        admission.status = "Discharged";
        await admission.save({ session });

        await WardBed.findByIdAndUpdate(
            admission.bedId,
            { $set: { status: "Available", currentAdmissionId: null } },
            { session }
        );

        await session.commitTransaction();
        return admission;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};