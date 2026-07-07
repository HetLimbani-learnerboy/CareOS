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

  // 1. General Rooms (8 Beds: GR-101 to GR-108)
  for (let i = 1; i <= 8; i++) {
    bedsToCreate.push({
      bedNumber: `GR-${100 + i}`,
      roomType: "General Room",
      status: "Available"
    });
  }

  // 2. Semi-Deluxe Rooms (6 Beds: SD-201 to SD-206)
  for (let i = 1; i <= 6; i++) {
    bedsToCreate.push({
      bedNumber: `SD-${200 + i}`,
      roomType: "Semi-Deluxe Room",
      status: "Available"
    });
  }

  // 3. Deluxe Rooms (6 Beds: DL-301 to DL-306)
  for (let i = 1; i <= 6; i++) {
    bedsToCreate.push({
      bedNumber: `DL-${300 + i}`,
      roomType: "Deluxe Room",
      status: "Available"
    });
  }

  // 4. ICU (5 Beds: ICU-401 to ICU-405)
  for (let i = 1; i <= 5; i++) {
    bedsToCreate.push({
      bedNumber: `ICU-${400 + i}`,
      roomType: "ICU",
      status: "Available"
    });
  }

  await WardBed.insertMany(bedsToCreate);
};

export const getAdmissionDashboardData = async () => {
  await seedWardBedsIfEmpty();

  // 1. Get entire bed tracking inventory matrix sorted by prefix groupings
  const beds = await WardBed.find({}).sort({ bedNumber: 1 }).lean();

  // 2. Fetch active admission pointers to clean out already checked-in cases
  const activeAdmissionPrescriptionIds = await Admission.find({ 
    status: "Admitted" 
  }).distinct("prescriptionId");
  
  const rawPrescriptions = await Prescription.find({
    _id: { $nin: activeAdmissionPrescriptionIds }
  }).sort({ createdAt: -1, created_at: -1 }).lean();

  // 3. Extract unique emails and optimize with lookups
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
      diagnosis: pres.diagnosis || "N/A",
      prescriptionName: pres.prescriptionName || "Standard Pack"
    };
  });

  // 4. Extract active inpatient documents directly
  const currentAdmissions = await Admission.find({ status: "Admitted" })
    .sort({ admittedAt: -1 })
    .lean();

  return { 
    beds, 
    incomingQueue, 
    currentAdmissions 
  };
};

export const processPatientAdmission = async (admissionData) => {
  const { prescriptionId, patientId, patientName, patientEmail, roomType } = admissionData;

  if (!prescriptionId || !patientName || !patientEmail || !roomType) {
    throw httpError(400, "Required property variables missing from admission payload body parameters.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Look up the first vacant bed frame matching the chosen room profile class within the session context
    const availableBed = await WardBed.findOne({ roomType, status: "Available" }).session(session);
    if (!availableBed) {
      throw httpError(422, `No vacant beds available under the select ${roomType} tier configuration layout.`);
    }

    const checkInTime = new Date();
    const dischargeTime = new Date();
    dischargeTime.setDate(checkInTime.getDate() + 1); // Exact 1-Day automated eligibility timeline offset parameter

    const newAdmission = new Admission({
      prescriptionId: mongoose.Types.ObjectId.createFromHexString(prescriptionId),
      patientId: patientId ? mongoose.Types.ObjectId.createFromHexString(patientId) : new mongoose.Types.ObjectId(),
      patientName: String(patientName).trim(),
      patientEmail: String(patientEmail).toLowerCase().trim(),
      bedId: availableBed._id,
      roomType,
      admittedAt: checkInTime,
      dischargeEligibleAt: dischargeTime,
      status: "Admitted"
    });

    await newAdmission.save({ session });

    // Mutate and lock bed state mappings
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

    // Toggle active occupant tracking properties to Discharged status mappings
    admission.status = "Discharged";
    await admission.save({ session });

    // Re-up and release lock mappings back onto the ward beds configuration index logs
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