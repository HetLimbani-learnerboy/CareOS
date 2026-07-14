import * as treatmentService from "./treatment.service.js";

export const getNurseInpatientQueue = async (req, res) => {
    try {
        const nurseEmail = req.user?.email || req.headers?.['x-user-email'] || req.body?.nurseEmail;
        if (!nurseEmail) {
            return res.status(401).json({ status: "fail", message: "Nurse identification session context missing." });
        }

        const assignedQueue = await treatmentService.fetchActiveAdmittedPatientsForNurse(nurseEmail);
        return res.status(200).json({ status: "success", count: assignedQueue.length, data: assignedQueue });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: "error", message: error.message });
    }
};

export const administerTreatmentPlanPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const nurseEmail = req.user?.email || req.headers?.['x-user-email'] || req.body?.nurseEmail;

        if (!planId) {
            return res.status(400).json({ status: "fail", message: "Treatment Plan ID parameter required." });
        }

        const updatedPlan = await treatmentService.executeTreatmentAdministration(planId, nurseEmail);
        return res.status(200).json({ status: "success", data: updatedPlan });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: "error", message: error.message });
    }
};