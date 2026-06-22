import { getProfileByEmail, updateProfileByEmail } from './doctorProfile.service.js';

export const fetchDoctorProfile = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ status: 'fail', message: 'Email identifier required.' });

    const data = await getProfileByEmail(email);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const saveDoctorProfile = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'fail', message: 'Email identifier required.' });

    const updatedData = await updateProfileByEmail(email, req.body);
    return res.status(200).json({ status: 'success', message: 'Profile metrics persistent.', data: updatedData });
  } catch (error) {
    next(error);
  }
};