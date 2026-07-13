import * as treatmentService from "./treatment.service.js";

export const getDoctorInpatientQueue = async (req, res) => {
    try {
        const doctorEmail = req.user?.email || req.headers?.['x-doctor-email'] || req.body?.doctorEmail;
        if (!doctorEmail) {
            return res.status(401).json({ status: "fail", message: "Doctor identification tracing profile required." });
        }

        const activeQueue = await treatmentService.fetchActiveAdmittedPatientsForDoctor(doctorEmail);
        return res.status(200).json({ status: "success", count: activeQueue.length, data: activeQueue });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: "error", message: error.message });
    }
};

export const submitTreatmentPlanOrder = async (req, res) => {
    try {
        const doctorEmail =
            req.user?.email ||
            req.headers?.["x-doctor-email"] ||
            req.body?.doctorEmail;

        const planRecord =
            await treatmentService.createNewPatientTreatmentPlan(
                doctorEmail,
                req.body
            );

        return res.status(201).json({
            status: "success",
            data: planRecord
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message
        });
    }
};

export const updateTreatmentPlanOrder = async (req, res) => {
    try {
        const { planId } = req.params;
        const doctorEmail =
            req.user?.email ||
            req.headers?.["x-doctor-email"] ||
            req.body?.doctorEmail;

        if (!planId) {
            return res.status(400).json({ status: "fail", message: "Treatment plan ID param is tracking mandatory tracking context." });
        }

        const modifiedRecord = await treatmentService.updatePatientTreatmentPlan(
            planId,
            doctorEmail,
            req.body
        );

        return res.status(200).json({
            status: "success",
            data: modifiedRecord
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message
        });
    }
};