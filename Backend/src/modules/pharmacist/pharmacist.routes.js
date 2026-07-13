import express from "express";
import {
  fetchDispensingQueue,
  searchAlternativesByComposition,
  searchAlternativesByUsecase,
  processFlexibleDispenseCheckout,
  fetchPharmacyBillingLedger,
  collectCashPayment,
  fetchPharmacistDashboardState,
  cancelPharmacyInvoice
} from "./pharmacist.controller.js";
import {
  fetchInventoryCatalog,
  updateInventoryStockCount,
  addNewMedicineToCatalog,
  updateMedicineCatalog
} from "./medicineInventory.controller.js";
import protectRoute, { requireRole } from "../../middleware/authMiddleware.js";

const router = express.Router();
const requirePharmacist = requireRole("pharmacist");

router.get("/pharmacy/dispense-queue", protectRoute, requirePharmacist, fetchDispensingQueue);

router.get(
  "/pharmacy/medicines/search-alternatives",
  protectRoute,
  requirePharmacist,
  searchAlternativesByComposition
);

router.get(
  "/pharmacy/medicines/search-by-usecase",
  protectRoute,
  requirePharmacist,
  searchAlternativesByUsecase
);

router.post(
  "/pharmacy/dispense-secure/:prescriptionId",
  protectRoute,
  requirePharmacist,
  processFlexibleDispenseCheckout
);

router.get("/pharmacy/billing/ledger", protectRoute, requirePharmacist, fetchPharmacyBillingLedger);
router.patch("/pharmacy/billing/:invoiceId/pay-cash", protectRoute, requirePharmacist, collectCashPayment);
router.patch("/pharmacy/billing/:invoiceId/void", protectRoute, requirePharmacist, cancelPharmacyInvoice);

router.get("/pharmacy/inventory", protectRoute, requirePharmacist, fetchInventoryCatalog);
router.patch("/pharmacy/inventory/:medicineId/quantity", protectRoute, requirePharmacist, updateInventoryStockCount);
router.post("/pharmacy/inventory/add", protectRoute, requirePharmacist, addNewMedicineToCatalog);
router.patch("/pharmacy/inventory/:medicineId", protectRoute, requirePharmacist, updateMedicineCatalog);
router.get("/pharmacy/dashboard/summary", protectRoute, requirePharmacist, fetchPharmacistDashboardState);

export default router;