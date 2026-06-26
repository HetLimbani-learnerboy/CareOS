import UserIdentity from '../auth/userIdentity.model.js';
import DoctorProfile from './doctorProfile.model.js';

export const getProfileByEmail = async (email) => {
    const user = await UserIdentity.findOne({ email: email.toLowerCase().trim() }).select('-password');
    if (!user) {
        const error = new Error('Doctor identity parameters not found.');
        error.statusCode = 404;
        throw error;
    }

    let profile = await DoctorProfile.findOne({ doctor_id: user._id });
    return { user, profile };
};

export const updateProfileByEmail = async (email, updateData) => {
    const user = await UserIdentity.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        const error = new Error('Doctor reference broken.');
        error.statusCode = 404;
        throw error;
    }

    if (updateData.phone) user.phone = updateData.phone;
    if (updateData.firstName || updateData.first_name) user.firstName = updateData.firstName || updateData.first_name;
    if (updateData.lastName || updateData.last_name) user.lastName = updateData.lastName || updateData.last_name;
    await user.save();

    const profile = await DoctorProfile.findOneAndUpdate(
        { doctor_id: user._id },
        {
            $set: {
                specialization: updateData.specialization,
                qualification: updateData.qualification,
                experience_start_date: updateData.experience_start_date,
                consultation_fee: Number(updateData.consultation_fee || 0),
                bio: updateData.bio || "",
                clinic_address: updateData.clinic_address
            }
        },
        { upsert: true, new: true, runValidators: true }
    );

    return {
        user: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email
        },
        profile
    };
};