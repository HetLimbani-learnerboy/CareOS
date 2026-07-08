import Consultation from "./consultation.model.js";

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};


export const createConsultationRequest = async (requestData) => {
    const { firstName, lastName, email, message } = requestData;
    if (!firstName || !lastName || !email || !message) {
        throw httpError(400, "All data fields are required to process a consultancy request.");
    }
    const newRequest = new Consultation({
        firstName,
        lastName,
        email,
        message
    });

    return await newRequest.save();
};

export const getAllConsultationsForReceptionist = async () => {
    return await Consultation.find({}).sort({ createdAt: -1 }).lean();
};

export const updateConsultationStatus = async (consultationId, newStatus) => {
    if (!["Pending", "Responded", "Archived"].includes(newStatus)) {
        throw httpError(400, "Invalid status value.");
    }

    const updatedConsultation = await Consultation.findByIdAndUpdate(
        consultationId,
        { status: newStatus },
        { new: true }
    );

    if (!updatedConsultation) {
        throw httpError(404, "Consultation request not found.");
    }

    return updatedConsultation;
}
