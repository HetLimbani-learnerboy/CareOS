import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Package,
    Search,
    PlusCircle,
    RefreshCw,
    Barcode,
    Building2,
    Tag,
    DollarSign,
    Layers,
    Calendar,
    FileText,
    AlertCircle,
    Loader2,
    Edit2,
    X,
    ChevronDown,
    ChevronUp,
    Activity,
    Check
} from "lucide-react";
import "../style/MedicineInventory.css";

export default function MedicineInventory() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [expandedMedicineId, setExpandedMedicineId] = useState(null);

    // Form state for onboarding brand new medicines
    const [formData, setFormData] = useState({
        barcode: "",
        medicine_name: "",
        company: "",
        category: "",
        composition: "",
        price: "",
        quantity: "",
        manufacture_date: "",
        expiry_date: "",
        medicine_usecase: "",
        specialization: "General Medicine"
    });

    // Form state for updating an existing medicine item
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [editForm, setEditForm] = useState({
        medicine_name: "",
        company: "",
        category: "",
        composition: "",
        price: "",
        quantity: "",
        manufacture_date: "",
        expiry_date: "",
        medicine_usecase: "",
        specialization: "General Medicine"
    });

    const [formSubmitting, setFormSubmitting] = useState(false);

    const fetchInventory = async (searchVal = "") => {
        try {
            setLoading(true);
            setError("");
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;

            const url = searchVal.trim()
                ? `${API_BASE_URL}/api/v1/pharmacist/pharmacy/inventory?search=${encodeURIComponent(searchVal.trim())}`
                : `${API_BASE_URL}/api/v1/pharmacist/pharmacy/inventory`;

            const res = await axios.get(url, {
                headers: { "x-user-email": userObj?.email }
            });

            if (res.data?.status === "success") {
                setInventory(res.data.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to sync inventory state maps.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInventory(searchQuery);
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleStartEdit = (e, item) => {
        e.stopPropagation();
        setEditingMedicine(item);
        setEditForm({
            medicine_name: item.medicine_name || "",
            company: item.company || "",
            category: item.category || "",
            composition: item.composition || "",
            price: item.price || "",
            quantity: item.quantity || "",
            manufacture_date: item.manufacture_date || "",
            expiry_date: item.expiry_date || "",
            medicine_usecase: item.medicine_usecase || "",
            specialization: item.specialization || "General Medicine"
        });
    };

    const handleUpdateMedicine = async (e) => {
        e.preventDefault();
        try {
            setFormSubmitting(true);
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;

            const res = await axios.patch(
                `${API_BASE_URL}/api/v1/pharmacist/pharmacy/inventory/${editingMedicine._id}`,
                editForm,
                {
                    headers: { "x-user-email": userObj?.email }
                }
            );

            if (res.data?.status === "success") {
                alert("Medicine updated successfully");
                setEditingMedicine(null);
                fetchInventory(searchQuery);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Update failed");
        } finally {
            setFormSubmitting(false);
        }
    };

    // Change handler for onboarding form inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Change handler for edit form inputs
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleRowExpand = (id) => {
        setExpandedMedicineId(expandedMedicineId === id ? null : id);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setFormSubmitting(true);
            setError("");
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            const res = await axios.post(
                `${API_BASE_URL}/api/v1/pharmacist/pharmacy/inventory/add`,
                formData,
                { headers: { "x-user-email": userObj?.email } }
            );

            if (res.data?.status === "success") {
                alert("New pharmaceutical formulation successfully indexed.");
                setFormData({
                    barcode: "",
                    medicine_name: "",
                    company: "",
                    category: "",
                    composition: "",
                    price: "",
                    quantity: "",
                    manufacture_date: "",
                    expiry_date: "",
                    medicine_usecase: "",
                    specialization: "General Medicine"
                });
                fetchInventory(searchQuery);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to process database entry registration.");
        } finally {
            setFormSubmitting(false);
        }
    };

    return (
        <div className="inv-container">
            <div className="inv-header">
                <h2 className="inv-title">
                    <Package size={22} />
                    Pharmacy Medicine Inventory Control Center
                </h2>
                <p className="inv-subtitle">
                    Monitor real-time warehouse volumes, expand individual rows to check clinical configurations, and onboard new assets.
                </p>
            </div>

            {error && (
                <div className="inv-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="inv-split-workspace-grid">
                {/* Left Side: Interactive Catalog Table */}
                <div className="inv-catalog-display-panel">
                    <div className="catalog-control-header-bar">
                        <div className="inv-search-input-box-wrapper">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder="Search by Brand Name, Barcode, Composition..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={() => fetchInventory(searchQuery)} className="inv-sync-btn" title="Force Sync Grid">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    <div className="inv-table-scroll-container">
                        {loading ? (
                            <div className="inv-placeholder-box">
                                <Loader2 size={32} className="inv-loop-spin" />
                                <p>Querying real-time stock matrix rows...</p>
                            </div>
                        ) : inventory.length === 0 ? (
                            <div className="inv-placeholder-box">
                                <Package size={36} />
                                <p>No active formulations match your filter configurations.</p>
                            </div>
                        ) : (
                            <table className="inv-data-grid-table">
                                <thead>
                                    <tr>
                                        <th>Medicine & Formulation Info</th>
                                        <th>Price</th>
                                        <th className="text-center" style={{ width: "8.5rem" }}>Stock Level</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((item) => {
                                        const isExpanded = expandedMedicineId === item._id;
                                        const isLowStock = (item.quantity || 0) < 20;
                                        const isBeingEdited = editingMedicine?._id === item._id;

                                        return (
                                            <React.Fragment key={item._id}>
                                                <tr
                                                    className={`inv-clickable-row-tr ${isLowStock ? "row-warning-indicator" : ""} ${isExpanded ? "row-tr-expanded-active" : ""} ${isBeingEdited ? "row-editing-active" : ""}`}
                                                    onClick={() => toggleRowExpand(item._id)}
                                                >
                                                    <td>
                                                        <div className="inv-brand-layout-inline-head">
                                                            <span className="inv-accordion-indicator-icon">
                                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </span>
                                                            <div className="inv-table-brand-name-text">
                                                                {item.medicine_name}
                                                                {isBeingEdited && <span className="editing-pill-badge">Editing...</span>}
                                                            </div>
                                                        </div>
                                                        <span className="inv-table-subline-text" style={{ paddingLeft: "1.25rem" }}>{item.company} | {item.category}</span>
                                                        <span className="inv-table-barcode-lbl" style={{ marginLeft: "1.25rem" }}>
                                                            <Barcode size={10} /> {item.barcode}
                                                        </span>
                                                    </td>
                                                    <td className="font-semibold text-slate-700">₹{item.price}</td>
                                                    <td className="text-center">
                                                        <span className={`inv-stock-indicator-pill ${isLowStock ? "pill-low-stock" : "pill-sufficient-stock"}`}>
                                                            {item.quantity} units
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <button
                                                            onClick={(e) => handleStartEdit(e, item)}
                                                            className="inv-btn-trigger-edit"
                                                            title="Edit Medicine Details"
                                                            disabled={isBeingEdited}
                                                        >
                                                            <Edit2 size={13} />
                                                            <span>Edit</span>
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* EXPANSION PANEL LAYOUT BLOCK */}
                                                {isExpanded && (
                                                    <tr className="inv-expanded-details-sub-tr">
                                                        <td colSpan="4">
                                                            <div className="inv-row-expanded-drawer-pane animate-slide-down">
                                                                <div className="inv-drawer-details-grid">
                                                                    <div className="inv-drawer-card-box">
                                                                        <span className="inv-drawer-box-lbl"><Calendar size={11} /> Shell Lifespan Metrics</span>
                                                                        <div className="inv-drawer-dates-row">
                                                                            <p><strong>Mfg Date:</strong> {item.manufacture_date || "N/A"}</p>
                                                                            <p><strong>Exp Date:</strong> <span className="text-rose-700 font-semibold">{item.expiry_date || "N/A"}</span></p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="inv-drawer-card-box">
                                                                        <span className="inv-drawer-box-lbl"><Activity size={11} /> Medical Specialization Segment</span>
                                                                        <p className="inv-drawer-text-value text-indigo-700 font-semibold">{item.specialization || "General Medicine"}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="inv-drawer-card-box mt-3">
                                                                    <span className="inv-drawer-box-lbl"><FileText size={11} /> Primary Indications & Clinical Use Case</span>
                                                                    <p className="inv-drawer-text-value text-slate-600 line-height-relaxed">
                                                                        {item.medicine_usecase || "No therapeutic directive use case description has been entered for this medication formulation record."}
                                                                    </p>
                                                                </div>
                                                                {item.composition && (
                                                                    <div className="inv-drawer-card-box mt-3">
                                                                        <span className="inv-drawer-box-lbl"><Layers size={11} /> Formula Composition</span>
                                                                        <p className="inv-drawer-text-value font-mono text-xs text-slate-500">{item.composition}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Side: Form Panel (Swaps context dynamically between onboarding or editing) */}
                <div className="inv-registration-form-panel">
                    {editingMedicine ? (
                        <>
                            <div className="form-panel-title-bar editing-mode-header">
                                <Edit2 size={16} />
                                <span>Modify Formulation: {editingMedicine.medicine_name}</span>
                                <button className="cancel-edit-x-btn" onClick={() => setEditingMedicine(null)}>
                                    <X size={14} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateMedicine} className="inv-onboarding-form">
                                <div className="form-fields-scroll-wrapper">
                                    <div className="form-input-node disabled-node-visual">
                                        <label><Barcode size={11} /> Barcode Token Sequence (Read-only)</label>
                                        <input type="text" value={editingMedicine.barcode} disabled style={{ background: "#f1f5f9", color: "#64748b" }} />
                                    </div>

                                    <div className="form-input-node">
                                        <label><Package size={11} /> Brand Name *</label>
                                        <input type="text" name="medicine_name" value={editForm.medicine_name} onChange={handleEditInputChange} required />
                                    </div>

                                    <div className="form-grid-two-columns">
                                        <div className="form-input-node">
                                            <label><Building2 size={11} /> Manufacturer Company *</label>
                                            <input type="text" name="company" value={editForm.company} onChange={handleEditInputChange} required />
                                        </div>
                                        <div className="form-input-node">
                                            <label><Tag size={11} /> Drug Category *</label>
                                            <input type="text" name="category" value={editForm.category} onChange={handleEditInputChange} required />
                                        </div>
                                    </div>

                                    <div className="form-input-node">
                                        <label><Layers size={11} /> Active Composition Formulation *</label>
                                        <input type="text" name="composition" value={editForm.composition} onChange={handleEditInputChange} required />
                                    </div>

                                    <div className="form-grid-two-columns">
                                        <div className="form-input-node">
                                            <label><DollarSign size={11} /> Retail Unit Price (₹) *</label>
                                            <input type="number" step="0.01" name="price" value={editForm.price} onChange={handleEditInputChange} required />
                                        </div>
                                        <div className="form-input-node">
                                            <label><Package size={11} /> Adjust Stock Volume *</label>
                                            <input type="number" name="quantity" value={editForm.quantity} onChange={handleEditInputChange} required />
                                        </div>
                                    </div>

                                    <div className="form-grid-two-columns">
                                        <div className="form-input-node">
                                            <label><Calendar size={11} /> Manufacture Date *</label>
                                            <input type="date" name="manufacture_date" value={editForm.manufacture_date} onChange={handleEditInputChange} required />
                                        </div>
                                        <div className="form-input-node">
                                            <label><Calendar size={11} /> Expiry Date *</label>
                                            <input type="date" name="expiry_date" value={editForm.expiry_date} onChange={handleEditInputChange} required />
                                        </div>
                                    </div>

                                    <div className="form-input-node">
                                        <label><FileText size={11} /> Primary Clinical Use Case / Indication</label>
                                        <textarea name="medicine_usecase" rows="2" value={editForm.medicine_usecase} onChange={handleEditInputChange}></textarea>
                                    </div>

                                    <div className="form-input-node">
                                        <label><Tag size={11} /> Specialization Segment Mapping *</label>
                                        <select name="specialization" className="form-native-select-element" value={editForm.specialization} onChange={handleEditInputChange} required>
                                            <option value="General Medicine">General Medicine</option>
                                            <option value="Physiotherapy">Physiotherapy</option>
                                            <option value="Cardiology">Cardiology</option>
                                            <option value="Neurology">Neurology</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="edit-action-btn-group">
                                    <button type="submit" className="inv-btn-submit-registration-form update-blue-btn" disabled={formSubmitting}>
                                        {formSubmitting ? <Loader2 size={16} className="inv-loop-spin" /> : <Check size={16} />}
                                        <span>{formSubmitting ? "Saving Matrix Changes..." : "Commit Update Transformations"}</span>
                                    </button>
                                    <button type="button" className="inv-btn-cancel-edit" onClick={() => setEditingMedicine(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="form-panel-title-bar">
                                <PlusCircle size={16} />
                                <span>Onboard New Medication Formulation</span>
                            </div>

                            <form onSubmit={handleFormSubmit} className="inv-onboarding-form">
                                <div className="form-fields-scroll-wrapper">
                                    <div className="form-input-node">
                                        <label><Barcode size={11} /> Barcode Token Sequence *</label>
                                        <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} required placeholder="e.g. 8901138510029" />
                                    </div>

                                    <div className="form-input-node">
                                        <label><Package size={11} /> Brand Name *</label>
                                        <input type="text" name="medicine_name" value={formData.medicine_name} onChange={handleInputChange} required placeholder="e.g. Metformin HCl 500mg" />
                                    </div>

                                    <div className="form-grid-two-columns">
                                        <div className="form-input-node">
                                            <label><Building2 size={11} /> Manufacturer Company *</label>
                                            <input type="text" name="company" value={formData.company} onChange={handleInputChange} required placeholder="Sun Pharma" />
                                        </div>
                                        <div className="form-input-node">
                                            <label><Tag size={11} /> Drug Category *</label>
                                            <input type="text" name="category" value={formData.category} onChange={handleInputChange} required placeholder="Antidiabetic" />
                                        </div>
                                    </div>

                                    <div className="form-input-node">
                                        <label><Layers size={11} /> Active Composition Formulation *</label>
                                        <input type="text" name="composition" value={formData.composition} onChange={handleInputChange} required placeholder="Metformin Hydrochloride IP 500mg" />
                                    </div>

                                    <div className="form-grid-two-columns">
                                        <div className="form-input-node">
                                            <label><DollarSign size={11} /> Retail Unit Price (₹) *</label>
                                            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required placeholder="68" />
                                        </div>
                                        <div className="form-input-node">
                                            <label><Package size={11} /> Initial Stock Volume *</label>
                                            <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required placeholder="240" />
                                        </div>
                                    </div>

                                    <div className="form-grid-two-columns">
                                        <div className="form-input-node">
                                            <label><Calendar size={11} /> Manufacture Date *</label>
                                            <input type="date" name="manufacture_date" value={formData.manufacture_date} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-input-node">
                                            <label><Calendar size={11} /> Expiry Date *</label>
                                            <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} required />
                                        </div>
                                    </div>

                                    <div className="form-input-node">
                                        <label><FileText size={11} /> Primary Clinical Use Case / Indication</label>
                                        <textarea name="medicine_usecase" rows="2" value={formData.medicine_usecase} onChange={handleInputChange} placeholder="Management of Type 2 Diabetes Mellitus..."></textarea>
                                    </div>

                                    <div className="form-input-node">
                                        <label><Tag size={11} /> Specialization Segment Mapping *</label>
                                        <select name="specialization" className="form-native-select-element" value={formData.specialization} onChange={handleInputChange} required>
                                            <option value="General Medicine">General Medicine</option>
                                            <option value="Physiotherapy">Physiotherapy</option>
                                            <option value="Cardiology">Cardiology</option>
                                            <option value="Neurology">Neurology</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="inv-btn-submit-registration-form" disabled={formSubmitting}>
                                    {formSubmitting ? <Loader2 size={16} className="inv-loop-spin" /> : <PlusCircle size={16} />}
                                    <span>{formSubmitting ? "Committing Entry..." : "Register Compound to Catalog"}</span>
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}