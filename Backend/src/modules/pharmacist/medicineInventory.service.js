import { MedicineCatalog } from '../doctor/catalog.model.js';

const httpError = (statuscode, message) => {
    const error = new Error(message);
    error.statusCode = statuscode;
    return error;
};

export const getMedicineInventoryStock = async (searchQuery = "") => {
  const query = {};
  
  if (searchQuery.trim()) {
    const cleanSearch = String(searchQuery).trim();
    const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const textRegex = new RegExp(escapedSearch, "i");
    const isNumeric = /^\d+$/.test(cleanSearch);
    if (isNumeric) {
      query.$or = [
        { barcode: cleanSearch }, 
        { barcode: Number(cleanSearch) }, 
        { medicine_name: { $regex: textRegex } }
      ];
    } else {
      query.$or = [
        { medicine_name: { $regex: textRegex } },
        { composition: { $regex: textRegex } },
        { company: { $regex: textRegex } },
        { category: { $regex: textRegex } }
      ];
    }
  }

  return await MedicineCatalog.find(query)
    .sort({ medicine_name: 1 })
    .lean();
};

export const adjustMedicineStockVolume = async (medicineId, newQuantity) => {
  const targetQty = parseInt(newQuantity, 10);
  if (isNaN(targetQty) || targetQty < 0) {
    throw httpError(400, "Inventory allocation units quantity must be a non-negative integer value.");
  }

  const updatedMedicine = await MedicineCatalog.findByIdAndUpdate(
    medicineId,
    { $set: { quantity: targetQty } },
    { new: true, runValidators: true }
  );

  if (!updatedMedicine) {
    throw httpError(404, "Target medicine inventory stock document not found.");
  }

  return updatedMedicine;
};

export const registerNewStockMedicine = async (medicineData) => {
  const { barcode, medicine_name, company, category, composition, price, quantity, manufacture_date, expiry_date } = medicineData;

  // Enforce required structural safety boundaries
  if (!barcode || !medicine_name || !company || !category || !composition || price === undefined || quantity === undefined || !manufacture_date || !expiry_date) {
    throw httpError(400, "Required schema properties are missing from input payload parameters.");
  }

  // Enforce absolute field uniqueness constraints across barcodes and brand names
  const existingCollision = await MedicineCatalog.findOne({
    $or: [
      { barcode: String(barcode).trim() },
      { medicine_name: { $regex: new RegExp(`^${medicine_name.trim()}$`, "i") } }
    ]
  });

  if (existingCollision) {
    throw httpError(409, "A pharmaceutical listing already exists matching this brand name or barcode token.");
  }

  const newMedicineItem = new MedicineCatalog({
    barcode: String(barcode).trim(),
    medicine_name: String(medicine_name).trim(),
    company: String(company).trim(),
    category: String(category).trim(),
    composition: String(composition).trim(),
    price: Number(price),
    quantity: Number(quantity),
    manufacture_date: String(manufacture_date).trim(),
    expiry_date: String(expiry_date).trim(),
    medicine_usecase: String(medicineData.medicine_usecase || "").trim(),
    specialization: String(medicineData.specialization || "General Medicine").trim()
  });

  return await newMedicineItem.save();
};