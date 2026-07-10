import Admission from '../receptionist/admission.model.js';
import UserIdentity from '../auth/userIdentity.model.js';
import WardBed from '../receptionist/wardBed.model.js'; // Adjust path locations to your project structure

export const findNurseByEmail = async (email) => {
    return await UserIdentity.findOne({
        email: String(email || '').trim().toLowerCase(),
        role: 'nurse'
    });
};

export const getActiveAdmissionsForNurse = async (nurseId) => {
    return await Admission.find({
        nurseIds: nurseId,
        status: 'Admitted'
    })
        .populate({
            path: 'prescriptionId',
            select: 'doctorName prescriptionName diagnosis notes result medicines labReports'
        })
        .populate({
            path: 'bedId',
            select: 'bedNumber roomType price'
        })
        .sort({ admittedAt: -1 })
        .lean();
};

export const updateAdmissionDischargeStatus = async (admissionId) => {
    const record = await Admission.findById(admissionId);
    if (!record) {
        const err = new Error('Target admission active structural monitoring profile missing.');
        err.statusCode = 404;
        throw err;
    }

    if (record.status === 'Discharged') {
        const err = new Error('Cannot cycle status timeline variables on an already concluded profile session.');
        err.statusCode = 400;
        throw err;
    }

    record.dischargeEligibleAt = new Date();
    await record.save();
    return record;
};

export const completeFinalDischargeCheckout = async (admissionId) => {
    const record = await Admission.findById(admissionId);
    if (!record) {
        const err = new Error('Target admission active tracking profile missing.');
        err.statusCode = 404;
        throw err;
    }

    if (record.status === 'Discharged') {
        const err = new Error('This admission has already been officially discharged.');
        err.statusCode = 400;
        throw err;
    }

    record.status = 'Discharged';
    await record.save();

    if (record.bedId) {
        await WardBed.findByIdAndUpdate(record.bedId, {
            status: 'Available',
            $unset: { currentAdmissionId: "" }
        });
    }

    return record;
};

export const appendPatientVitalsRecord = async (admissionId, vitalsData) => {
    const bloodPressure = String(vitalsData.bloodPressure || '').trim();
    const heartRate = Number(vitalsData.heartRate);
    const temperature = Number(vitalsData.temperature);

    if (!bloodPressure || isNaN(heartRate) || isNaN(temperature)) {
        const err = new Error('Incomplete or invalid physiological vitals matrix metrics values submitted.');
        err.statusCode = 400;
        throw err;
    }

    // Atomic update query using $push adds directly to the document array in MongoDB
    const updatedRecord = await Admission.findByIdAndUpdate(
        admissionId,
        {
            $push: {
                vitalsHistory: {
                    bloodPressure,
                    heartRate,
                    temperature,
                    recordedAt: new Date()
                }
            }
        },
        { new: true, runValidators: true }
    ).populate({
        path: 'prescriptionId',
        select: 'doctorName prescriptionName diagnosis notes result medicines labReports'
    }).populate({
        path: 'bedId',
        select: 'bedNumber roomType price'
    });

    if (!updatedRecord) {
        const err = new Error('Target admission operational tracker file reference details missing.');
        err.statusCode = 404;
        throw err;
    }

    return updatedRecord;
};