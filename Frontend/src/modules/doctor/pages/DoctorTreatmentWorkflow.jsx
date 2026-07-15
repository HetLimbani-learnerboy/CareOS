import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Stethoscope, User, ShieldAlert, Layers, Calendar, Clock,
    Plus, Trash2, CheckCircle, FileText, Loader2, Bed, Pill, Edit3, Search
} from "lucide-react";
import '../style/DoctorTreatmentWorkflow.css';

export default function DoctorTreatmentWorkflow() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [inpatients, setInpatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loadingGrid, setLoadingGrid] = useState(true);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const [selectedPlanMode, setSelectedPlanMode] = useState("new");

    const [treatmentHeading, setTreatmentHeading] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [clinicalNotes, setClinicalNotes] = useState("");
    const [items, setItems] = useState([
        { itemType: "Dosage", itemName: "", dosageConfiguration: "", unitPrice: "", quantity: 1 }
    ]);
    const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");



    const loadActiveInpatientsStream = async () => {
        try {
            setLoadingGrid(true);
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;

            const res = await axios.get(`${API_BASE_URL}/api/v1/doctors/inpatient/treatment-queue`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "x-user-email": userObj?.email
                }
            });
            if (res.data?.status === "success") {
                const patientsData = res.data.data || [];
                setInpatients(patientsData);
                if (patientsData.length > 0) {
                    const currentSelection = patientsData.find(p => p.admissionId === selectedPatient?.admissionId);
                    setSelectedPatient(currentSelection || patientsData[0]);
                }
            }
        } catch (err) {
            console.error("Failed to sync inpatient streams:", err);
        } finally {
            setLoadingGrid(false);
        }
    };

    useEffect(() => { loadActiveInpatientsStream(); }, []);

    useEffect(() => {
        if (!selectedPatient) return;

        if (selectedPlanMode === "new") {
            resetFormFields();
        } else {
            const planToEdit = selectedPatient.existingTreatmentPlans?.find(p => p._id === selectedPlanMode);
            if (planToEdit) {
                setTreatmentHeading(planToEdit.treatmentHeading || "");
                setScheduledDate(planToEdit.scheduledDate || "");
                setScheduledTime(planToEdit.scheduledTime || "");
                setClinicalNotes(planToEdit.clinicalNotes || "");
                setItems(planToEdit.items?.length > 0 ? planToEdit.items : [
                    { itemType: "Dosage", itemName: "", dosageConfiguration: "", unitPrice: "", quantity: 1 }
                ]);
            }
        }
    }, [selectedPlanMode, selectedPatient]);

    const handlePatientSelection = (patient) => {
        setSelectedPatient(patient);
        setSelectedPlanMode("new");
    };

    const resetFormFields = () => {
        setTreatmentHeading("");
        setScheduledDate("");
        setScheduledTime("");
        setClinicalNotes("");
        setItems([{ itemType: "Dosage", itemName: "", dosageConfiguration: "", unitPrice: "", quantity: 1 }]);
    };

    const handleAddItemRow = () => {
        setItems([...items, { itemType: "Dosage", itemName: "", dosageConfiguration: "", unitPrice: "", quantity: 1 }]);
    };

    const handleRemoveItemRow = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const revised = [...items];
        revised[index][field] = value;
        setItems(revised);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            setFormSubmitting(true);
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;

            const payload = {
                admissionId: selectedPatient.admissionId,
                treatmentHeading,
                scheduledDate,
                scheduledTime,
                clinicalNotes,
                items: items.map(i => ({
                    ...i,
                    unitPrice: parseFloat(i.unitPrice) || 0,
                    quantity: parseInt(i.quantity, 10) || 1
                }))
            };

            let res;
            if (selectedPlanMode === "new") {
                res = await axios.post(`${API_BASE_URL}/api/v1/doctors/inpatient/treatment-plan`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-user-email": userObj?.email
                    }
                });
            } else {
                res = await axios.put(`${API_BASE_URL}/api/v1/doctors/inpatient/treatment-plan/${selectedPlanMode}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-user-email": userObj?.email
                    }
                });
            }

            if (res.data?.status === "success") {
                alert(selectedPlanMode === "new" ? "Treatment configuration committed successfully." : "Treatment pathway modified successfully.");
                if (selectedPlanMode === "new") {
                    resetFormFields();
                }
                await loadActiveInpatientsStream();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error deploying clinical pathways.");
        } finally {
            setFormSubmitting(false);
        }
    };

    const filteredInpatients = inpatients.filter(pt => {
        const query = searchQuery.toLowerCase().trim();
        return (
            pt.patientName?.toLowerCase().includes(query) ||
            pt.bedNumber?.toLowerCase().includes(query) ||
            pt.diagnosis?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="tx-workflow-container">
            <div className="tx-workflow-header">
                <div className="tx-header-title-flex">
                    <Stethoscope size={24} className="tx-brand-icon" />
                    <div>
                        <h2>Inpatient Clinical Directives Interface</h2>
                        <p>Construct itemized procedural logs, fluid strategies, and clinical prescriptions for assigned ward patients.</p>
                    </div>
                </div>
            </div>

            <div className="tx-split-panel-grid">
                {/* Left Side Panel: Patient Queue with Search Context */}
                <div className="tx-patient-sidebar-panel">
                    <h3>Currently Admitted Active Ward Roster</h3>

                    <div className="tx-sidebar-search-wrapper">
                        <Search size={16} className="tx-search-icon" />
                        <input
                            type="text"
                            placeholder="Search name, bed, diagnosis..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="tx-sidebar-search-input"
                        />
                    </div>

                    <div className="tx-sidebar-scroll-viewport">
                        {loadingGrid ? (
                            <div className="tx-inner-loader"><Loader2 className="tx-spin" /> <p>Mapping room indices...</p></div>
                        ) : filteredInpatients.length === 0 ? (
                            <div className="tx-empty-notice"><ShieldAlert /> <p>No matching active hospital room records found.</p></div>
                        ) : (
                            filteredInpatients.map((pt) => (
                                <div
                                    key={pt.admissionId}
                                    onClick={() => handlePatientSelection(pt)}
                                    className={`tx-patient-sidebar-strip ${selectedPatient?.admissionId === pt.admissionId ? 'tx-sidebar-strip-active' : ''}`}
                                >
                                    <div className="tx-strip-meta-title">
                                        <span className="tx-patient-badge-name">{pt.patientName}</span>
                                        <span className="tx-bed-badge"><Bed size={12} /> {pt.bedNumber}</span>
                                    </div>
                                    <div className="tx-strip-diag-subtext">Diagnosis: <strong>{pt.diagnosis}</strong></div>
                                    <div className="tx-strip-room-type">{pt.roomType}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side Panel: Main Workspace */}
                <div className="tx-workspace-main-panel">
                    {selectedPatient && (
                        <>
                            <div className="tx-demographics-summary-card">
                                <h4><User size={14} /> Comprehensive Inpatient Registry Context</h4>
                                <div className="tx-demo-matrix-grid">
                                    <p><strong>Name:</strong> {selectedPatient.patientName}</p>
                                    <p><strong>Email:</strong> {selectedPatient.patientEmail}</p>
                                    <p><strong>Room / Bed:</strong> {selectedPatient.roomType} (Bed {selectedPatient.bedNumber})</p>
                                    <p><strong>Admission Date:</strong> {new Date(selectedPatient.admittedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="tx-demo-diagnosis-block">
                                    <p><strong>Primary Diagnosis:</strong> {selectedPatient.diagnosis}</p>
                                    <p className="tx-notes-subtext"><strong>Outpatient Reference Notes:</strong> {selectedPatient.clinicalPrescriptionNotes}</p>
                                </div>
                                <div className="tx-nurse-assignments-row">
                                    <strong>Assigned Caregivers (Nurses):</strong>
                                    {selectedPatient.assignedNurses?.length > 0 ? (
                                        selectedPatient.assignedNurses.map(n => (
                                            <span key={n.nurseId} className="tx-nurse-tag">@{n.name}</span>
                                        ))
                                    ) : <span className="tx-none-text">No nurses assigned to this room segment.</span>}
                                </div>
                            </div>

                            <div className="tx-operation-selector-block" style={{ margin: "0.1rem 0", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>
                                    <Layers size={14} />
                                    Select Directives Workspace Action Mode:
                                </label>
                                <select
                                    value={selectedPlanMode}
                                    onChange={(e) => setSelectedPlanMode(e.target.value)}
                                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="new">➕ Draft and Formulate New Clinical Treatment Plan</option>
                                    {selectedPatient.existingTreatmentPlans?.map((plan) => (
                                        <option key={plan._id} value={plan._id}>
                                            📝 [Modify Plan] {plan.treatmentHeading} — ({plan.administrationStatus || "Pending"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <form onSubmit={handleFormSubmit} className="tx-directive-entry-form">
                                <h3>
                                    {selectedPlanMode === "new" ? <Plus size={16} /> : <Edit3 size={16} />}
                                    {selectedPlanMode === "new" ? "Deploy New Clinical Treatment Pathway" : "Update Existing Clinical Treatment Pathway"}
                                </h3>

                                <div className="tx-form-row-block">
                                    <div className="tx-input-node">
                                        <label>Treatment Heading / Target Objective *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Post-Op Cardiac Protocol, Hydration Therapy Sequence"
                                            value={treatmentHeading}
                                            onChange={(e) => setTreatmentHeading(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="tx-form-grid-three">
                                    <div className="tx-input-node">
                                        <label><Calendar size={12} /> Target Date *</label>
                                        <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
                                    </div>
                                    <div className="tx-input-node">
                                        <label><Clock size={12} /> Target Time *</label>
                                        <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="tx-items-form-section">
                                    <h5>Configured Treatment Formulations, Materials & Devices</h5>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="tx-item-mutation-row animate-row-slide">
                                            <select
                                                value={item.itemType}
                                                onChange={(e) => handleItemChange(idx, "itemType", e.target.value)}
                                                className="tx-select-field"
                                            >
                                                <option value="Injection">Injection</option>
                                                <option value="Dosage">Dosage</option>
                                                <option value="Instrument">Instrument</option>
                                                <option value="Fluid/Glucose">Fluid/Glucose</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Item Name (e.g., Normal Saline, Heart Stent)"
                                                value={item.itemName}
                                                onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                                                required
                                                className="tx-text-input"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Dose Directive (e.g., 500ml, 1x)"
                                                value={item.dosageConfiguration}
                                                onChange={(e) => handleItemChange(idx, "dosageConfiguration", e.target.value)}
                                                required
                                                className="tx-text-input"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price (₹)"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                                                required
                                                min="0"
                                                className="tx-numeric-input"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                                required
                                                min="1"
                                                className="tx-numeric-input-small"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItemRow(idx)}
                                                className="tx-row-delete-btn"
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddItemRow} className="tx-add-row-macro-btn">
                                        <Plus size={12} /> Add Item Formulation Matrix Row
                                    </button>
                                </div>

                                <div className="tx-input-node mt-3">
                                    <label><FileText size={12} /> Special Administration Guidelines / Nursing Care Directive</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Provide specific notes here..."
                                        value={clinicalNotes}
                                        onChange={(e) => setClinicalNotes(e.target.value)}
                                    ></textarea>
                                </div>

                                <button type="submit" className="tx-submit-workflow-btn" disabled={formSubmitting}>
                                    {formSubmitting ? <Loader2 className="tx-spin" /> : <CheckCircle size={16} />}
                                    <span>
                                        {formSubmitting
                                            ? "Processing Directives..."
                                            : selectedPlanMode === "new"
                                                ? "Commit Treatment Pathway to Ward Logs"
                                                : "Save Changes to Active Treatment Plan"
                                        }
                                    </span>
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}