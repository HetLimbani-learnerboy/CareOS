import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    FileText, User, Plus, Trash2, Save, Sparkles, X,
    Activity, Clipboard, Beaker, FileSpreadsheet, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
    Clock
} from "lucide-react";
import "../style/EPrescriptionConsole.css";

const formatDisplayDate = (dateString) => {
    if (!dateString) return "N/A";
    return dateString.toString().includes("T") ? dateString.split("T")[0] : dateString;
};

const isWithinPast24Hours = (appointmentDate, timeSlotString) => {
    if (!appointmentDate || !timeSlotString) return false;
    try {
        const cleanDateStr = formatDisplayDate(appointmentDate);
        const startTimeStr = timeSlotString.split("-")[0].trim();
        const [hours, minutes] = startTimeStr.split(":").map(Number);
        const [year, month, day] = cleanDateStr.split("-").map(Number);

        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
        const currentDateTime = new Date();

        const timeDifferenceMs = currentDateTime - appointmentDateTime;
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;

        return timeDifferenceMs >= 0 && timeDifferenceMs <= twentyFourHoursMs;
    } catch (err) {
        return false;
    }
};

export default function EPrescriptionConsole() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [appointments, setAppointments] = useState([]);
    const [selectedApt, setSelectedApt] = useState(null);
    const [doctorEmail, setDoctorEmail] = useState("");
    const [doctorSpec, setDoctorSpec] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [dbMedicines, setDbMedicines] = useState([]);
    const [dbLabReports, setDbLabReports] = useState([]);

    const [medQueries, setMedQueries] = useState({});
    const [labQueries, setLabQueries] = useState({});

    const [prescriptionForm, setPrescriptionForm] = useState({
        prescriptionName: "", diagnosis: "", notes: "", result: "",
        medicines: [{ medicine: "", dosage: "", days: "" }],
        labReports: [""]
    });

    useEffect(() => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user?.email) {
                setDoctorEmail(user.email.trim().toLowerCase());
                setDoctorSpec(user.specialization || "General Medicine");
            }
        }
    }, []);

    useEffect(() => {
        if (!doctorEmail || !doctorSpec) return;

        const fetchClinicalData = async () => {
            try {
                setLoading(true);
                const current = new Date();

                const customHeaders = { "x-doctor-email": doctorEmail };
                const emailQuery = encodeURIComponent(doctorEmail);
                const specQuery = encodeURIComponent(doctorSpec);

                const [rosterRes, catalogRes] = await Promise.all([
                    axios.get(
                        `${API_BASE_URL}/api/v1/doctors/appointments?email=${emailQuery}&doctorEmail=${emailQuery}&year=${current.getFullYear()}&month=${current.getMonth() + 1}`,
                        { headers: customHeaders }
                    ),
                    axios.get(
                        `${API_BASE_URL}/api/v1/doctors/catalogs?specialization=${specQuery}&doctorEmail=${emailQuery}`,
                        { headers: customHeaders }
                    )
                ]);

                const roster = rosterRes.data?.data?.appointments || rosterRes.data?.appointments || [];
                setAppointments(roster);
                setDbMedicines(catalogRes.data?.data?.medicines || catalogRes.data?.medicines || []);
                setDbLabReports(catalogRes.data?.data?.labReports || catalogRes.data?.labReports || []);

                const filtered = roster.filter(apt => isWithinPast24Hours(apt.date, apt.time));
                if (filtered.length > 0) {
                    setSelectedApt(filtered[0]);
                }
            } catch (err) {
                setMessage({ type: "error", text: "Failed to sync clinical ecosystem medical catalogs." });
            } finally {
                setLoading(false);
            }
        };

        fetchClinicalData();
    }, [doctorEmail, doctorSpec, API_BASE_URL]);

    const activeRoster24h = useMemo(() => {
        return (appointments || []).filter(apt => isWithinPast24Hours(apt.date, apt.time));
    }, [appointments]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setPrescriptionForm(prev => ({ ...prev, [name]: value }));
    };

    const handleMedicineChange = (index, field, value) => {
        const updated = [...prescriptionForm.medicines];
        updated[index] = { ...updated[index], [field]: value };
        setPrescriptionForm(prev => ({ ...prev, medicines: updated }));
    };

    const handleMedTyping = (index, val) => {
        const updated = [...prescriptionForm.medicines];
        updated[index] = { ...updated[index], medicine: val };
        setPrescriptionForm(prev => ({ ...prev, medicines: updated }));
        setMedQueries(prev => ({ ...prev, [index]: true }));
    };

    const selectMedSuggestion = (index, name) => {
        const updated = [...prescriptionForm.medicines];
        updated[index] = { ...updated[index], medicine: name };
        setPrescriptionForm(prev => ({ ...prev, medicines: updated }));
        setMedQueries(prev => ({ ...prev, [index]: false }));
    };

    const handleLabTyping = (index, val) => {
        const updated = [...prescriptionForm.labReports];
        updated[index] = val;
        setPrescriptionForm(prev => ({ ...prev, labReports: updated }));
        setLabQueries(prev => ({ ...prev, [index]: true }));
    };

    const selectLabSuggestion = (index, name) => {
        const updated = [...prescriptionForm.labReports];
        updated[index] = name;
        setPrescriptionForm(prev => ({ ...prev, labReports: updated }));
        setLabQueries(prev => ({ ...prev, [index]: false }));
    };

    const addMedicineRow = () => {
        setPrescriptionForm(prev => ({
            ...prev,
            medicines: [...prev.medicines, { medicine: "", dosage: "", days: "" }]
        }));
    };

    const removeMedicineRow = (index) => {
        const updated = prescriptionForm.medicines.filter((_, i) => i !== index);
        setPrescriptionForm(prev => ({ ...prev, medicines: updated }));
    };

    const addLabReportRow = () => {
        setPrescriptionForm(prev => ({ ...prev, labReports: [...prev.labReports, ""] }));
    };

    const removeLabReportRow = (index) => {
        const updated = prescriptionForm.labReports.filter((_, i) => i !== index);
        setPrescriptionForm(prev => ({ ...prev, labReports: updated }));
    };

    const handleSubmitPrescription = async (e) => {
        e.preventDefault();
        if (!prescriptionForm.result?.trim()) {
            setMessage({ type: "error", text: "Outcome verification status description is required." });
            return;
        }

        if (!selectedApt) {
            setMessage({ type: "error", text: "No appointment selected for this prescription." });
            return;
        }

        try {
            setSubmitting(true);
            setMessage({ type: "", text: "" });

            await axios.post(
                `${API_BASE_URL}/api/v1/doctors/e-prescription`,
                {
                    appointmentId: selectedApt.id || selectedApt._id,
                    patientEmail: selectedApt.patientEmail,
                    doctorEmail,
                    ...prescriptionForm
                },
                { headers: { "x-doctor-email": doctorEmail } }
            );

            setMessage({ type: "success", text: "Clinical prescription template committed." });
            alert("E-Prescription submitted successfully.");

            setPrescriptionForm({
                prescriptionName: "", diagnosis: "", notes: "", result: "",
                medicines: [{ medicine: "", dosage: "", days: "" }],
                labReports: [""]
            });
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Transmission server error." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !appointments.length) {
        return (
            <div className="ep-console-root">
                <div className="skeleton-hero-block" />
                <div className="ep-split-workspace">
                    <div className="skeleton-sidebar-node" style={{ height: "450px" }} />
                    <div className="skeleton-form-node" style={{ height: "450px" }} />
                </div>
            </div>
        );
    }

    return (
        <div className="ep-console-root animate-fade-in">
            <div className="ep-console-header">
                <div className="header-meta">
                    <h1>Clinical Records & E-Prescription Engine</h1>
                    <p>Trace daily medical consult rosters and manage electronic prescription records securely.</p>
                </div>
            </div>

            {message.text && (
                <div className={`ep-alert ${message.type === "error" ? "error-style" : "success-style"}`}>
                    {message.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="ep-split-workspace">
                <div className="ep-patients-sidebar-card">
                    <div className="sidebar-title"><User size={16} /> Rolling 24-Hour Active Patient Ledger ({activeRoster24h.length})</div>
                    <div className="patients-nodes-stack">
                        {activeRoster24h.length > 0 ? (
                            activeRoster24h.map((apt) => {
                                const aptKey = apt.id || apt._id;
                                const isTargetSelected = selectedApt && (selectedApt.id || selectedApt._id) === (apt.id || apt._id);
                                return (
                                    <div
                                        key={aptKey}
                                        className={`patient-roster-node ${isTargetSelected ? 'active' : ''}`}
                                        onClick={() => { setSelectedApt(apt); setMessage({ type: "", text: "" }); }}
                                    >
                                        <div className="patient-headline-meta">
                                            <strong>{apt.patient || "Anonymous Patient"}</strong>
                                            <span><Clock size={12} /> {apt.time} ({formatDisplayDate(apt.date)})</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-sidebar-fallback">
                                <Activity size={32} />
                                <p>No recorded consultations match the 24-hour authorization time boundary rules.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ep-form-canvas-card">
                    {!selectedApt ? (
                        <div className="form-placeholder-overlay">
                            <Clipboard size={44} />
                            <h3>No Selected Patient File</h3>
                            <p>Please click on a patient roster row on the left panel to display and mount the entry sheet canvas.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitPrescription} className="prescription-intake-form animate-fade-in">
                            <div className="patient-context-strip">
                                <div><strong>Patient Target:</strong> {selectedApt.patient}</div>
                                <div><strong>Consult Date:</strong> {formatDisplayDate(selectedApt.date)}</div>
                                <div><strong>Time Slot:</strong> {selectedApt.time}</div>
                                <div className="span-full-strip">
                                    <strong>Chief Indication:</strong> {selectedApt.reason || selectedApt.reason_for_visit || "General review tracker checkup profile."}
                                </div>
                            </div>

                            <div className="form-grid-layout">
                                <div className="input-field-block">
                                    <label>Prescription Sheet Header</label>
                                    <input type="text" name="prescriptionName" placeholder="e.g. Standard Respiratory Management Pack" value={prescriptionForm.prescriptionName} onChange={handleFormChange} />
                                </div>
                                <div className="input-field-block">
                                    <label>Clinical Primary Diagnosis</label>
                                    <input type="text" name="diagnosis" placeholder="e.g. Acute Bacterial Sinusitis" value={prescriptionForm.diagnosis} onChange={handleFormChange} />
                                </div>
                            </div>

                            <div className="form-section-block">
                                <div className="section-header"><FileSpreadsheet size={16} /> Pharmaceutical Dosing Plan</div>
                                {prescriptionForm.medicines.map((med, idx) => {
                                    const queryText = (med.medicine || "").toLowerCase();
                                    const filteredSuggestions = (dbMedicines || []).filter(m =>
                                        m.medicine_name?.toLowerCase().includes(queryText) &&
                                        queryText.trim() !== "" &&
                                        m.medicine_name?.toLowerCase() !== queryText
                                    );

                                    return (
                                        <div key={idx} className="medicine-row-grid relative-container">
                                            <div className="input-field-block flex-grow-3">
                                                <label>Medicine Nomenclature</label>
                                                <input type="text" placeholder="Type to filter medical catalogs..." value={med.medicine} onChange={(e) => handleMedTyping(idx, e.target.value)} onFocus={() => setMedQueries(p => ({ ...p, [idx]: true }))} />
                                                {medQueries[idx] && filteredSuggestions.length > 0 && (
                                                    <div className="suggestion-dropdown-float-board">
                                                        {filteredSuggestions.map((m, sIdx) => (
                                                            <div key={sIdx} className="suggestion-item-row" onMouseDown={() => selectMedSuggestion(idx, m.medicine_name)}>
                                                                {m.medicine_name} <small>({m.category || "General"})</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="input-field-block flex-grow-2">
                                                <label>Dosage Strategy</label>
                                                <input type="text" placeholder="e.g. 1 dosage daily for 5 days" value={med.dosage} onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)} />
                                            </div>
                                            <div className="input-field-block flex-grow-1">
                                                <label>Dosage Ratio</label>
                                                <input type="number" placeholder="e.g., 5" value={med.days} onChange={(e) => handleMedicineChange(idx, "days", e.target.value)} />
                                            </div>
                                            {prescriptionForm.medicines.length > 1 && (
                                                <button type="button" className="row-remove-btn" onClick={() => removeMedicineRow(idx)}><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    );
                                })}
                                <button type="button" className="add-row-action-btn" onClick={addMedicineRow}><Plus size={14} /> Add Additional Medication</button>
                            </div>

                            <div className="form-section-block">
                                <div className="section-header"><Beaker size={16} /> Laboratory Evaluation Requests</div>
                                {prescriptionForm.labReports.map((lab, idx) => {
                                    const queryText = (lab || "").toLowerCase();
                                    const filteredLabs = (dbLabReports || []).filter(l =>
                                        l.report_name?.toLowerCase().includes(queryText) &&
                                        queryText.trim() !== "" &&
                                        l.report_name?.toLowerCase() !== queryText
                                    );

                                    return (
                                        <div key={idx} className="lab-row-input-group relative-container">
                                            <div style={{ flex: 1, position: 'relative' }}>
                                                <input type="text" placeholder="Search diagnostic tests..." value={lab} onChange={(e) => handleLabTyping(idx, e.target.value)} onFocus={() => setLabQueries(p => ({ ...p, [idx]: true }))} />
                                                {labQueries[idx] && filteredLabs.length > 0 && (
                                                    <div className="suggestion-dropdown-float-board">
                                                        {filteredLabs.map((l, sIdx) => (
                                                            <div key={sIdx} className="suggestion-item-row" onMouseDown={() => selectLabSuggestion(idx, l.report_name)}>
                                                                {l.report_name} <small>[{l.category || "Diagnostic"}]</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {prescriptionForm.labReports.length > 1 && (
                                                <button type="button" className="row-remove-btn" onClick={() => removeLabReportRow(idx)}><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    );
                                })}
                                <button type="button" className="add-row-action-btn" onClick={addLabReportRow}><Plus size={14} /> Request Supplementary Laboratory Panel</button>
                            </div>

                            <div className="form-section-block">
                                <div className="section-header"><FileText size={16} /> Directives & Outcomes</div>
                                <div className="input-field-block">
                                    <label>Supplementary Care Directives</label>
                                    <textarea name="notes" placeholder="Enter instructions..." value={prescriptionForm.notes} onChange={handleFormChange} />
                                </div>
                                <div className="input-field-block margin-top-slot">
                                    <label>Post-Consultation Summary Result <span className="req-marker">*</span></label>
                                    <textarea name="result" required placeholder="Document status findings..." value={prescriptionForm.result} onChange={handleFormChange} />
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} className="ep-submit-action-btn">
                                <Save size={16} /> {submitting ? "Signing Record Entry..." : "Authorize & Sign Clinical E-Prescription"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}