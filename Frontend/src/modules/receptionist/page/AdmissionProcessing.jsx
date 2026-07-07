import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bed, UserPlus, Users, LogOut, CheckCircle, ShieldAlert, Loader2, RefreshCw, Layers, Calendar, Mail } from "lucide-react";
import "../style/AdmissionProcessing.css";

export default function AdmissionProcessing() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [beds, setBeds] = useState([]);
    const [queue, setQueue] = useState([]);
    const [activeAdmissions, setActiveAdmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal Registration Interface Form Tracking parameters
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [chosenRoomType, setChosenRoomType] = useState("General Room");
    const [submitting, setSubmitting] = useState(false);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await axios.get(`${API_BASE_URL}/api/v1/receptionist/admission/dashboard`, {
                headers: { "x-user-email": "receptionist@careos.com" }
            });
            if (res.data?.status === "success") {
                setBeds(res.data.data.beds || []);
                setQueue(res.data.data.incomingQueue || []);
                setActiveAdmissions(res.data.data.currentAdmissions || []);
            }
        } catch (err) {
            setError("Failed to coordinate hospital ward allocation configurations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboard(); }, []);

    const handleOpenAdmissionForm = (patient) => {
        setSelectedPatient(patient);
        setChosenRoomType("General Room");
    };

    const handleExecuteAdmission = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await axios.post(`${API_BASE_URL}/api/v1/receptionist/admission/check-in`, {
                prescriptionId: selectedPatient.prescriptionId,
                patientId: selectedPatient.patientId,
                patientName: selectedPatient.patientName,
                patientEmail: selectedPatient.patientEmail,
                roomType: chosenRoomType
            }, { headers: { "x-user-email": "receptionist@careos.com" } });

            if (res.data?.status === "success") {
                setSelectedPatient(null);
                fetchDashboard();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Bed allocation processing failure initialization error.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDischargeCheckout = async (admissionId) => {
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/v1/receptionist/admission/${admissionId}/discharge`, {}, {
                headers: { "x-user-email": "receptionist@careos.com" }
            });
            if (res.data?.status === "success") {
                fetchDashboard();
            }
        } catch (err) {
            alert("Discharge threshold parameter matching lock execution sequence exception.");
        }
    };

    const getRoomTypeClass = (type) => {
        switch (type) {
            case "General Room": return "room-general";
            case "Semi-Deluxe Room": return "room-semi";
            case "Deluxe Room": return "room-deluxe";
            case "ICU": return "room-icu";
            default: return "";
        }
    };

    return (
        <div className="adm-container">
            <div className="adm-header">
                <h2 className="adm-title"><Bed size={22} /> Admission Desk & Bed Configuration Manager</h2>
                <p className="adm-subtitle">Coordinate available ward resources, assign rooms to incoming patient logs, and manage release pipelines.</p>
            </div>

            {error && <div className="adm-error-banner"><ShieldAlert size={16} /> <span>{error}</span></div>}

            {/* Ward Occupancy Analytics Strip layout mapping node parameters */}
            <div className="adm-analytics-strip">
                <div className="adm-stat-box green">
                    <CheckCircle size={18} />
                    <div><h4>{beds.filter(b => b.status === "Available").length} / 25 Available</h4><p>Vacant clinical beds matrix</p></div>
                </div>
                <div className="adm-stat-box blue">
                    <Users size={18} />
                    <div><h4>{activeAdmissions.length} Admitted</h4><p>Active room occupants count</p></div>
                </div>
            </div>

            <div className="adm-dashboard-grid-layout">

                {/* Left Side: Unallocated Incoming Clinical Queue Profiles */}
                <div className="adm-panel-card">
                    <div className="panel-title-strip"><UserPlus size={16} /> <span>Awaiting Ward Placement ({queue.length})</span></div>
                    <div className="panel-scroll-box">
                        {loading ? <div className="adm-loading-box"><Loader2 className="adm-spin" /></div> : queue.length === 0 ? (
                            <div className="adm-empty-txt">No outstanding medical admission referrals registered today.</div>
                        ) : (
                            <table className="adm-data-table">
                                <thead>
                                    <tr><th>Patient Profile Context</th><th>Indication</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {queue.map((item) => (
                                        <tr key={item.prescriptionId}>
                                            <td><strong>{item.patientName}</strong><span className="sub-meta"><Mail size={10} /> {item.patientEmail}</span></td>
                                            <td><span className="diag-tag">{item.diagnosis}</span></td>
                                            <td><button onClick={() => handleOpenAdmissionForm(item)} className="btn-assign-room">Assign Room Bed</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Side: Master Active Occupants Logs Sheet Ledger */}
                <div className="adm-panel-card">
                    <div className="panel-title-strip"><Layers size={16} /> <span>Active Ward Occupants Grid Ledger ({activeAdmissions.length})</span></div>
                    <div className="panel-scroll-box">
                        {loading ? <div className="adm-loading-box"><Loader2 className="adm-spin" /></div> : activeAdmissions.length === 0 ? (
                            <div className="adm-empty-txt">No inpatient beds are currently occupied in the facility mapping blocks.</div>
                        ) : (
                            <table className="adm-data-table">
                                <thead>
                                    <tr><th>Occupant Details</th><th>Room Class Allocation</th><th>Discharge Threshold</th></tr>
                                </thead>
                                <tbody>
                                    {activeAdmissions.map((adm) => {
                                        const isDischargeReady = new Date() >= new Date(adm.dischargeEligibleAt);
                                        return (
                                            <tr key={adm._id}>
                                                <td><strong>{adm.patientName}</strong><span className="sub-meta">{adm.patientEmail}</span></td>
                                                <td><span className={`room-type-badge-pill ${getRoomTypeClass(adm.roomType)}`}>{adm.roomType}</span></td>
                                                <td>
                                                    {isDischargeReady ? (
                                                        <button onClick={() => handleDischargeCheckout(adm._id)} className="btn-discharge-execute"><LogOut size={12} /> Discharge</button>
                                                    ) : (
                                                        <span className="time-lock-lbl"><Calendar size={11} /> Locked till checkout</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>

            {/* Bed Layout Visual Matrix Grid Mapping Segment View */}
            {/* REPLACE YOUR EXISTING BED DISTRIBUTION GRID SECTION WITH THIS */}
            <div className="adm-panel-card mt-4">
                <div className="panel-title-strip">
                    <Bed size={16} />
                    <span>25-Bed Structural Layout Distribution Grid Mapping</span>
                </div>

                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {["General Room", "Semi-Deluxe Room", "Deluxe Room", "ICU"].map((category) => {
                        const categoryBeds = beds.filter(b => b.roomType === category);
                        if (categoryBeds.length === 0) return null;

                        return (
                            <div key={category} className="room-category-block-row">
                                <h5 style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", fontWeight: "750", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {category} Section ({categoryBeds.filter(b => b.status === "Available").length} Vacant)
                                </h5>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem" }}>
                                    {categoryBeds.map((b) => (
                                        <div
                                            key={b.bedNumber}
                                            className={`bed-node-mesh-item ${b.status === "Occupied" ? "mesh-occupied" : "mesh-vacant"} ${getRoomTypeClass(b.roomType)}`}
                                            style={{ minWidth: "9.5rem", flex: "1 0 calc(20% - 0.7rem)" }}
                                        >
                                            <Bed size={18} />
                                            <div className="mesh-bed-meta">
                                                <strong>{b.bedNumber}</strong>
                                                <span>{b.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pop-up Overlay Admission Booking Selection Form Modal */}
            {selectedPatient && (
                <div className="adm-modal-backdrop-overlay">
                    <div className="adm-modal-form-view shadow-pop">
                        <div className="modal-head-title"><h3>Process Ward Placement Assignment</h3><button onClick={() => setSelectedPatient(null)}><XCircle size={16} /></button></div>
                        <form onSubmit={handleExecuteAdmission} className="modal-form-fields-wrapper">
                            <div className="static-field-group">
                                <p><strong>Patient Target:</strong> {selectedPatient.patientName}</p>
                                <p><strong>Diagnosis Indication:</strong> {selectedPatient.diagnosis}</p>
                            </div>
                            <div className="modal-input-field">
                                <label>Target Room Profile Variant Class *</label>
                                <select value={chosenRoomType} onChange={(e) => setChosenRoomType(e.target.value)} className="modal-native-select">
                                    <option value="General Room">General Room</option>
                                    <option value="Semi-Deluxe Room">Semi-Deluxe Room</option>
                                    <option value="Deluxe Room">Deluxe Room</option>
                                    <option value="ICU">ICU (Intensive Care Unit)</option>
                                </select>
                            </div>
                            <button type="submit" disabled={submitting} className="btn-submit-admission-modal">
                                {submitting ? <Loader2 className="adm-spin" /> : <CheckCircle size={14} />} <span>Confirm Check-In Lock</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}