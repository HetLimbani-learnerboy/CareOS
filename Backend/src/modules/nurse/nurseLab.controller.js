import { getNurseLabReportLedger } from './nurseLab.service.js';

export const fetchNurseLabReviews = async (req, res, next) => {
    try {
        const nurseEmail = req.user?.email || req.headers?.['x-user-email'] || req.query?.email;

        if (!nurseEmail) {
            return res.status(401).json({
                status: 'fail',
                message: 'Nurse authorization context parameters could not be verified.'
            });
        }

        const labReviews = await getNurseLabReportLedger(nurseEmail);

        return res.status(200).json({
            status: 'success',
            data: labReviews
        });
    } catch (error) {
        next(error);
    }
};