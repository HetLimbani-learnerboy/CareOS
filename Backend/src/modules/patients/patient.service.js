import PatientProfile from './patient.model.js';
import UserIdentity from '../auth/userIdentity.model.js';

export const fetchUnifiedProfileByemailId = async (email) => {
  if (!email) {
    const error = new Error('Target profile email param is required.');
    error.statusCode = 400;
    throw error;
  }
  const userBase = await UserIdentity.findOne({ email: email.toLowerCase() }).select('-password');
  if (!userBase) {
    const error = new Error('Identity account with this email does not exist.');
    error.statusCode = 404;
    throw error;
  }

  let medicalProfile = await PatientProfile.findOne({ patient_id: userBase._id });
  if (!medicalProfile) {
    medicalProfile = {};
  }

  return { identity: userBase, medical: medicalProfile };
};

export const saveOrUpdatePatientRecords = async (email, updatePayload) => {
  if (!email) {
    const error = new Error('Target profile identity email is missing.');
    error.statusCode = 400;
    throw error;
  }

  const userBase = await UserIdentity.findOne({ email: email.toLowerCase() });
  if (!userBase) {
    const error = new Error('Identity reference not found.');
    error.statusCode = 404;
    throw error;
  }

  const { phone, profile_image, ...medicalFields } = updatePayload;

  if (phone || profile_image) {
    await UserIdentity.findByIdAndUpdate(userBase._id, {
      $set: {
        ...(phone && { phone }),
        ...(profile_image && { profile_image })
      }
    }, { runValidators: true });
  }

  const committedMedicalProfile = await PatientProfile.findOneAndUpdate(
    { patient_id: userBase._id },
    { $set: medicalFields },
    { upsert: true, new: true, runValidators: true }
  );

  return committedMedicalProfile;
};