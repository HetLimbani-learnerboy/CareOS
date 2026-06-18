import PatientDashboard from './patientDashboard.model.js';
import UserIdentity from '../auth/userIdentity.model.js';

export const compileDashboardMetricsByEmail = async (email) => {
    if (!email) {
        const error = new Error('Email identifier parameter is required.');
        error.statusCode = 400;
        throw error;
    }

    const user = await UserIdentity.findOne({ email: email.toLowerCase().trim() }).select('-password');
    if (!user) {
        const error = new Error('Account target context missing.');
        error.statusCode = 404;
        throw error;
    }

    let clinicalData = await PatientDashboard.findOne({ patient_id: user._id });
    if (!clinicalData) {
        clinicalData = await PatientDashboard.create({
            patient_id: user._id,
            allergies: [],
            chronic_conditions: [],
            vitals_log: { blood_pressure: "120/80", heart_rate: 72, temperature: 98.6, weight: 70 }
        });
    }

    return {
        patient: {
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            phone: user.phone
        },
        clinical: clinicalData
    };
};