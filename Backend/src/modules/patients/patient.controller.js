import { fetchUnifiedProfileByemailId, saveOrUpdatePatientRecords } from './patient.service.js';

export const getProfileDashboardData = async (req, res, next) => {
    try {
        const email = req.user.email;

        const profileSummary = await fetchUnifiedProfileByemailId(email);

        return res.status(200).json({
            status: "success",
            data: profileSummary
        });
    } catch (error) {
        next(error);
    }
};

export const handleProfileUpdateForm = async (req, res, next) => {
    try {
        const email = req.user.email;

        const updateResult = await saveOrUpdatePatientRecords(email, req.body);

        return res.status(200).json({
            status: "success",
            message: "Profile metadata synchronized and saved successfully.",
            medical: updateResult
        });
    } catch (error) {
        next(error);
    }
};