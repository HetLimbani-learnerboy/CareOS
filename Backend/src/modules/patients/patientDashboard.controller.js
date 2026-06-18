import { compileDashboardMetricsByEmail } from './patientDashboard.service.js';
import PatientDashboard from './patientDashboard.model.js';
import UserIdentity from '../auth/userIdentity.model.js';

export const getAggregatedDashboardData = async (req, res, next) => {
    try {
        const { email } = req.query;
        const metricsSummary = await compileDashboardMetricsByEmail(email);

        return res.status(200).json({
            status: 'success',
            data: metricsSummary
        });
    } catch (error) {
        next(error);
    }
};

export const handleDashboardUpsert = async (req, res, next) => {
    try {
        const { email, allergies, chronic_conditions, vitals_log } = req.body;

        if (!email) {
            return res.status(400).json({ status: 'fail', message: 'Email identifier is required.' });
        }

        const user = await UserIdentity.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User reference not found.' });
        }

        const updatedDashboard = await PatientDashboard.findOneAndUpdate(
            { patient_id: user._id },
            {
                $set: {
                    allergies,
                    chronic_conditions,
                    vitals_log
                }
            },
            { upsert: true, new: true, runValidators: true }
        );

        return res.status(201).json({
            status: 'success',
            message: 'Dashboard clinical parameters populated successfully.',
            data: updatedDashboard
        });

    } catch (error) {
        next(error);
    }
};