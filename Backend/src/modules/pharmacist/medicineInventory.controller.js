import * as pharmacistService from "./medicineInventory.service.js";

export const fetchInventoryCatalog = async (req, res) => {
    try {
        const { search } = req.query;
        const inventory = await pharmacistService.getMedicineInventoryStock(search);

        return res.status(200).json({
            status: "success",
            count: inventory.length,
            data: inventory
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to extract current pharmacy inventory metrics catalogs."
        });
    }
};

export const updateInventoryStockCount = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const { quantity } = req.body;

        if (!medicineId) {
            return res.status(400).json({ status: "fail", message: "Target medicine object reference token required." });
        }

        const modifiedItem = await pharmacistService.adjustMedicineStockVolume(medicineId, quantity);
        return res.status(200).json({
            status: "success",
            message: "Inventory volume metrics reconciled completely.",
            data: modifiedItem
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Stock quantity transformation failure execution sequence encountered."
        });
    }
};

export const addNewMedicineToCatalog = async (req, res) => {
    try {
        const registeredItem = await pharmacistService.registerNewStockMedicine(req.body);
        return res.status(201).json({
            status: "success",
            message: "New pharmaceutical formulation successfully introduced into global active catalog rosters.",
            data: registeredItem
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Failed to commit compound object creation records matrix."
        });
    }
};