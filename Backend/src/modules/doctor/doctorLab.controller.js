import * as doctorLabService from './doctorLab.service.js';

export const fetchDoctorLabReviews = async (req, res) => {
    try {
        const doctorEmail = req.user?.email || req.headers?.['x-doctor-email'] || req.query?.email;

        if (!doctorEmail) {
            return res.status(401).json({
                status: 'fail',
                message: 'Doctor authorization context parameters could not be verified.'
            });
        }

        const labReviews = await doctorLabService.getDoctorLabReportLedger(doctorEmail);

        return res.status(200).json({
            status: 'success',
            data: labReviews
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message
        });
    }
};