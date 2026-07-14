import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Stethoscope, User, ShieldAlert, Layers, Calendar, Clock,
    Plus, Trash2, CheckCircle, FileText, Loader2, Bed, Pill, Search, ClipboardList
} from "lucide-react";
import '../style/DoctorTreatmentWorkflow.css';

export default function NurseTreatmentWorkflow() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [inpatients, setInpatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loadingGrid, setLoadingGrid] = useState(true);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const [treatmentHeading, setTreatmentHeading] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [clinicalNotes, setClinicalNotes] = useState("");
    const [items, setItems] = useState([
        { itemType: "Dosage", itemName: "", dosageConfiguration: "", unitPrice: "", quantity: 1 }
    ]);

    const loadNurseAssignedQueue = async () => {
        try {
            setLoadingGrid(true);
            const storedUser = localStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;

            const res = await axios.get(`${API_BASE_URL}/api/v1/nurse/inpatient-queue`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "x-user-email": userObj?.email
                }
            });
            if (res.data?.status === "success") {
                const patientsData = res.data.data || [];
                setInpatients(patientsData);
                if (patientsData.length > 0) {
                    const currentSelection = patientsData.find(p => p.admissionId === selectedPatient?.admissionId);
                    setSelectedPatient(currentSelection || patientsData[0]);
                } else {
                    setSelectedPatient(null);
                }
            }
        } catch (err) {
            console.error("Failed syncing assigned nurse queues:", err);
        } finally {
            setLoadingGrid(false);
        }
    };

    useEffect(() => { loadNurseAssignedQueue(); }, []);

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
            const storedUser = localStorage.getItem("user");
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

            const res = await axios.post(`${API_BASE_URL}/api/v1/nurse/inpatient/treatment-plan`, payload, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "x-user-email": userObj?.email
                }
            });

            if (res.data?.status === "success") {
                alert("Treatment plan entry created successfully.");
                resetFormFields();
                await loadNurseAssignedQueue();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error deploying clinical pathways.");
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleAdministerAction = async (planId) => {
        if (!window.confirm("Verify formulation parameters. Mark this plan entry as Administered?")) return;

        try {
            setActionSubmitting(true);
            const storedUser = localStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;

            const res = await axios.patch(`${API_BASE_URL}/api/v1/nurse/treatment-plan/${planId}/administer`, {}, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "x-user-email": userObj?.email
                }
            });

            if (res.data?.status === "success") {
                alert("Treatment administration logged successfully.");
                await loadNurseAssignedQueue();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error finalizing task metrics.");
        } finally {
            setActionSubmitting(false);
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
                    <Stethoscope size={24} className="tx-brand-icon" style={{ color: "#0d9488", background: "#f0fdfa" }} />
                    <div>
                        <h2>Inpatient Care Administration & Registry Center</h2>
                        <p>Deploy clinical updates, track parameters, and record administration status logs for assigned room segments.</p>
                    </div>
                </div>
            </div>

            <div className="tx-split-panel-grid">
                {/* Left Side Sidebar Panel */}
                <div className="tx-patient-sidebar-panel">
                    <h3>Your Assigned Ward Patients</h3>

                    <div className="tx-sidebar-search-wrapper">
                        <Search size={16} className="tx-search-icon" />
                        <input
                            type="text"
                            placeholder="Search assigned records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="tx-sidebar-search-input"
                        />
                    </div>

                    <div className="tx-sidebar-scroll-viewport">
                        {loadingGrid ? (
                            <div className="tx-inner-loader"><Loader2 className="tx-spin" /> <p>Loading assignments...</p></div>
                        ) : filteredInpatients.length === 0 ? (
                            <div className="tx-empty-notice"><ShieldAlert /> <p>No matching active care assignments discovered.</p></div>
                        ) : (
                            filteredInpatients.map((pt) => (
                                <div
                                    key={pt.admissionId}
                                    onClick={() => { setSelectedPatient(pt); resetFormFields(); }}
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

                {/* Right Side Main Workspaces */}
                <div className="tx-workspace-main-panel">
                    {selectedPatient ? (
                        <>
                            {/* Patient Context Card */}
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
                            </div>

                            {/* Section A: Formulation Generation Intake Module */}
                            <form onSubmit={handleFormSubmit} className="tx-directive-entry-form">
                                <h3><Plus size={16} /> Formulate and Deploy New Treatment Log</h3>

                                <div className="tx-form-row-block">
                                    <div className="tx-input-node">
                                        <label>Treatment Heading / Target Objective *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Nurse Bedside Care, Direct Hydration Renewal, Fluid Replenishment"
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
                                                placeholder="Item Name"
                                                value={item.itemName}
                                                onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                                                required
                                                className="tx-text-input"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Dose Directive"
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
                                    <label><FileText size={12} /> Administration Guidelines / Ward Tracking Notes</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Provide itemization or execution logs..."
                                        value={clinicalNotes}
                                        onChange={(e) => setClinicalNotes(e.target.value)}
                                    ></textarea>
                                </div>

                                <button type="submit" className="tx-submit-workflow-btn" disabled={formSubmitting} style={{ background: "#0d9488" }}>
                                    {formSubmitting ? <Loader2 className="tx-spin" /> : <CheckCircle size={16} />}
                                    <span>Commit Treatment Pathway to Ward Logs</span>
                                </button>
                            </form>

                            {/* Section B: Existing Prescribed Pathway Execution Roster */}
                            <div className="tx-directive-entry-form" style={{ marginTop: "1.5rem" }}>
                                <h3><ClipboardList size={16} /> Active Ordered Treatment Logs</h3>

                                {selectedPatient.existingTreatmentPlans?.length === 0 ? (
                                    <div className="tx-empty-notice" style={{ padding: "2rem" }}>
                                        <Pill size={24} />
                                        <p>No active formulation pathways found on record.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                        {selectedPatient.existingTreatmentPlans.map((plan) => (
                                            <div
                                                key={plan._id}
                                                className="animate-row-slide"
                                                style={{
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "8px",
                                                    padding: "1.25rem",
                                                    background: plan.administrationStatus === "Administered" ? "#f0fdf4" : "#ffffff"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a" }}>{plan.treatmentHeading}</h4>
                                                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem", fontSize: "0.8rem", color: "#64748b" }}>
                                                            <span><Calendar size={12} /> {plan.scheduledDate}</span>
                                                            <span><Clock size={12} /> {plan.scheduledTime}</span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            fontWeight: "600",
                                                            padding: "0.25rem 0.5rem",
                                                            borderRadius: "4px",
                                                            background: plan.administrationStatus === "Administered" ? "#bbf7d0" : "#fef08a",
                                                            color: plan.administrationStatus === "Administered" ? "#166534" : "#854d0e"
                                                        }}
                                                    >
                                                        {plan.administrationStatus}
                                                    </span>
                                                </div>

                                                {plan.clinicalNotes && (
                                                    <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", fontSize: "0.85rem", color: "#475569", marginBottom: "1rem", borderLeft: "3px solid #cbd5e1" }}>
                                                        <strong>Administration Directives:</strong> {plan.clinicalNotes}
                                                    </div>
                                                )}

                                                <div style={{ overflowX: "auto" }}>
                                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left", marginBottom: "1rem" }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                                                                <th style={{ padding: "0.5rem" }}>Type</th>
                                                                <th style={{ padding: "0.5rem" }}>Item Name</th>
                                                                <th style={{ padding: "0.5rem" }}>Directive</th>
                                                                <th style={{ padding: "0.5rem", textAlign: "right" }}>Qty</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {plan.items?.map((item, i) => (
                                                                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                                    <td style={{ padding: "0.5rem" }}><span style={{ background: "#e0f2fe", color: "#0369a1", padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.75rem" }}>{item.itemType}</span></td>
                                                                    <td style={{ padding: "0.5rem", fontWeight: "500" }}>{item.itemName}</td>
                                                                    <td style={{ padding: "0.5rem", color: "#64748b" }}>{item.dosageConfiguration}</td>
                                                                    <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: "600" }}>{item.quantity}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {plan.administrationStatus === "Pending" ? (
                                                    <button
                                                        type="button"
                                                        disabled={actionSubmitting}
                                                        onClick={() => handleAdministerAction(plan._id)}
                                                        className="tx-submit-workflow-btn"
                                                        style={{ margin: 0, background: "#0d9488", padding: "0.6rem 1.2rem", width: "auto" }}
                                                    >
                                                        {actionSubmitting ? <Loader2 className="tx-spin" /> : <CheckCircle size={14} />}
                                                        <span>Completed Treatment Plans</span>
                                                    </button>
                                                ) : (
                                                    <div style={{ fontSize: "0.8rem", color: "#15803d", display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: "500" }}>
                                                        <CheckCircle size={14} /> Logged and updated in clinical distribution archives.
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="tx-empty-notice" style={{ background: "#ffffff", padding: "4rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <ClipboardList size={40} style={{ color: "#cbd5e1" }} />
                            <p style={{ fontSize: "1rem", color: "#64748b" }}>Select a ward assignment from the active roster list grid view to handle care logs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}