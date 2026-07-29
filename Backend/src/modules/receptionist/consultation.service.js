import Consultation from "./consultation.model.js";

const httpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const createConsultationRequest = async (requestData) => {
    const { firstName, lastName, email, message } = requestData;

    const trimmedFirstName = String(firstName || "").trim();
    const trimmedLastName = String(lastName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const trimmedMessage = String(message || "").trim();

    if (!trimmedFirstName || !trimmedLastName || !normalizedEmail || !trimmedMessage) {
        throw httpError(400, "First name, last name, business email, and consultancy requirements are required.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        throw httpError(400, "Please provide a valid business email address.");
    }

    const newRequest = new Consultation({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: normalizedEmail,
        message: trimmedMessage,
        status: "Pending"
    });

    return await newRequest.save();
};

export const getAllConsultationsForReceptionist = async () => {
    return await Consultation.find({}).sort({ createdAt: -1 }).lean();
};

export const updateConsultationStatus = async (consultationId, newStatus) => {
    if (!["Pending", "Responded", "Archived"].includes(newStatus)) {
        throw httpError(400, "Invalid status parameter provided.");
    }

    const updatedConsultation = await Consultation.findByIdAndUpdate(
        consultationId,
        { status: newStatus },
        { new: true, runValidators: true }
    );

    if (!updatedConsultation) {
        throw httpError(404, "Consultation request reference not found.");
    }

    return updatedConsultation;
};