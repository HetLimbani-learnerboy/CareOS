import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Bed,
    UserPlus,
    Users,
    LogOut,
    CheckCircle,
    ShieldAlert,
    Loader2,
    Layers,
    Calendar,
    Mail,
    XCircle,
    ChevronDown,
    ChevronUp,
    Stethoscope,
    FileText,
    User,
    Clock,
    Activity
} from "lucide-react";
import "../style/AdmissionProcessing.css";

export default function AdmissionProcessing() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [beds, setBeds] = useState([]);
    const [queue, setQueue] = useState([]);
    const [activeAdmissions, setActiveAdmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [expandedQueueId, setExpandedQueueId] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [chosenRoomType, setChosenRoomType] = useState("General Room");
    const [submitting, setSubmitting] = useState(false);

    const [selectedBedPatient, setSelectedBedPatient] = useState(null);

    const userEmail = useMemo(() => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase();
        } catch {
            return "";
        }
    }, []);

    const authHeaders = useMemo(() => ({
        "Content-Type": "application/json",
        "x-user-email": userEmail
    }), [userEmail]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await axios.get(`${API_BASE_URL}/api/v1/receptionist/admission/dashboard`, {
                headers: authHeaders
            });
            if (res.data?.status === "success") {
                setBeds(res.data.data.beds || []);
                setQueue(res.data.data.incomingQueue || []);
                setActiveAdmissions(res.data.data.currentAdmissions || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to coordinate hospital ward allocation configurations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const toggleQueueExpand = (id) => {
        setExpandedQueueId(expandedQueueId === id ? null : id);
    };

    const handleOpenAdmissionForm = (e, patient) => {
        e.stopPropagation();
        if (!patient) return;
        setSelectedPatient(patient);
        setChosenRoomType("General Room");
    };

    const handleBedNodeClick = (bedItem) => {
        if (bedItem.status !== "Occupied") return;

        const match = activeAdmissions.find(
            (adm) => String(adm._id) === String(bedItem.currentAdmissionId)
        );

        if (match) {
            setSelectedBedPatient({
                ...match,
                bedNumber: bedItem.bedNumber
            });
        } else {
            alert("Occupant detail timeline is no longer active or has been archived.");
        }
    };

    const handleExecuteAdmission = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            setSubmitting(true);
            const res = await axios.post(`${API_BASE_URL}/api/v1/receptionist/admission/check-in`, {
                prescriptionId: selectedPatient.prescriptionId,
                patientId: selectedPatient.patientId,
                patientName: selectedPatient.patientName,
                patientEmail: selectedPatient.patientEmail,
                roomType: chosenRoomType
            }, {
                headers: authHeaders
            });

            if (res.data?.status === "success") {
                setSelectedPatient(null);
                await fetchDashboard();
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
                headers: authHeaders
            });
            if (res.data?.status === "success") {
                setSelectedBedPatient(null);
                await fetchDashboard();
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

            <div className="adm-analytics-strip">
                <div className="adm-stat-box green">
                    <CheckCircle size={18} />
                    <div>
                        <h4>{beds.filter(b => b.status === "Available").length} / 25 Available</h4>
                        <p>Vacant clinical beds matrix</p>
                    </div>
                </div>
                <div className="adm-stat-box blue">
                    <Users size={18} />
                    <div>
                        <h4>{activeAdmissions.length} Admitted</h4>
                        <p>Active room occupants count</p>
                    </div>
                </div>
            </div>

            <div className="adm-dashboard-grid-layout">

                {/* LEFT PANEL: Unallocated Incoming Clinical Queue Profiles */}
                <div className="adm-panel-card">
                    <div className="panel-title-strip"><UserPlus size={16} /> <span>Awaiting Ward Placement ({queue.length})</span></div>
                    <div className="panel-scroll-box">
                        {loading ? (
                            <div className="adm-loading-box"><Loader2 className="adm-spin" /></div>
                        ) : queue.length === 0 ? (
                            <div className="adm-empty-txt">No outstanding medical admission referrals registered today.</div>
                        ) : (
                            <table className="adm-data-table">
                                <thead>
                                    <tr>
                                        <th>Patient Profile Context</th>
                                        <th>Indication</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queue.map((item) => {
                                        const isExpanded = expandedQueueId === item.prescriptionId;
                                        return (
                                            <React.Fragment key={item.prescriptionId}>
                                                <tr className="adm-clickable-row" onClick={() => toggleQueueExpand(item.prescriptionId)}>
                                                    <td>
                                                        <div className="adm-patient-row-title-flex">
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            <strong>{item.patientName || "Patient"}</strong>
                                                        </div>
                                                        <span className="sub-meta" style={{ paddingLeft: "1.15rem" }}><Mail size={10} /> {item.patientEmail}</span>
                                                    </td>
                                                    <td><span className="diag-tag">{item.diagnosis || "N/A"}</span></td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleOpenAdmissionForm(e, item)}
                                                            className="btn-assign-room"
                                                        >
                                                            Assign Room
                                                        </button>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="adm-expanded-sub-tr">
                                                        <td colSpan="3">
                                                            <div className="adm-queue-details-drawer-pane animate-slide-down">
                                                                <div className="adm-drawer-meta-grid">
                                                                    <div>
                                                                        <span className="adm-drawer-lbl"><Stethoscope size={11} /> Referring Clinician</span>
                                                                        <p className="adm-drawer-val">{item.doctorName}</p>
                                                                        <span className="adm-drawer-subtxt">{item.doctorEmail}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="adm-drawer-lbl"><FileText size={11} /> Prescription Plan</span>
                                                                        <p className="adm-drawer-val text-indigo-700">{item.prescriptionName}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="adm-drawer-clinical-box mt-2">
                                                                    <span className="adm-drawer-lbl">Outcomes Result Summary</span>
                                                                    <p className="adm-drawer-desc-val">{item.resultSummary}</p>
                                                                </div>
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

                {/* RIGHT PANEL: Master Active Occupants Logs Sheet Ledger */}
                <div className="adm-panel-card">
                    <div className="panel-title-strip"><Layers size={16} /> <span>Active Ward Occupants Grid Ledger ({activeAdmissions.length})</span></div>
                    <div className="panel-scroll-box">
                        {loading ? (
                            <div className="adm-loading-box"><Loader2 className="adm-spin" /></div>
                        ) : activeAdmissions.length === 0 ? (
                            <div className="adm-empty-txt">No inpatient beds are currently occupied in the facility mapping blocks.</div>
                        ) : (
                            <table className="adm-data-table">
                                <thead>
                                    <tr>
                                        <th>Occupant Details</th>
                                        <th>Room Allocation</th>
                                        <th>Pipeline Status Tracker</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeAdmissions.map((adm) => {
                                        const isDischargeReady = new Date() >= new Date(adm.dischargeEligibleAt);
                                        return (
                                            <tr key={adm._id}>
                                                <td>
                                                    <strong>{adm.patientName}</strong>
                                                    <span className="sub-meta">{adm.patientEmail}</span>
                                                </td>
                                                <td><span className={`room-type-badge-pill ${getRoomTypeClass(adm.roomType)}`}>{adm.roomType}</span></td>
                                                <td>
                                                    <div className="adm-status-interaction-cell-flex">
                                                        <span className={`adm-pipeline-tracking-badge ${isDischargeReady ? "status-discharge" : "status-occupied"}`}>
                                                            {isDischargeReady ? "Discharge Available" : "Occupied"}
                                                        </span>

                                                        {isDischargeReady && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDischargeCheckout(adm._id)}
                                                                className="btn-discharge-execute"
                                                            >
                                                                <LogOut size={12} /> Discharge
                                                            </button>
                                                        )}
                                                    </div>
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

            {/* Visual Matrix Grid Layout Segment View */}
            <div className="adm-panel-card mt-4">
                <div className="panel-title-strip">
                    <Bed size={16} />
                    <span>25-Bed Structural Layout Distribution Grid Mapping (Click Occupied Beds to View Profile)</span>
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
                                    {categoryBeds.map((b) => {
                                        const isOccupied = b.status === "Occupied";
                                        return (
                                            <div
                                                key={b.bedNumber}
                                                className={`bed-node-mesh-item ${isOccupied ? "mesh-occupied" : "mesh-vacant"} ${getRoomTypeClass(b.roomType)} ${isOccupied ? "mesh-item-interactive" : ""}`}
                                                style={{ minWidth: "9.5rem", flex: "1 0 calc(20% - 0.7rem)" }}
                                                onClick={() => handleBedNodeClick(b)}
                                            >
                                                <Bed size={18} />
                                                <div className="mesh-bed-meta">
                                                    <strong>{b.bedNumber}</strong>
                                                    <span>{b.status}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* POP-UP OVERLAY 1: Patient Ward Allocation Intake Form Modal */}
            {selectedPatient && (
                <div className="adm-modal-backdrop-overlay">
                    <div className="adm-modal-form-view shadow-pop">
                        <div className="modal-head-title">
                            <h3>Process Ward Placement Assignment</h3>
                            <button type="button" onClick={() => setSelectedPatient(null)}>
                                <XCircle size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleExecuteAdmission} className="modal-form-fields-wrapper">
                            <div className="static-field-group">
                                <p><strong>Patient Target:</strong> {selectedPatient.patientName || "Patient"}</p>
                                <p><strong>Diagnosis Indication:</strong> {selectedPatient.diagnosis || "N/A"}</p>
                            </div>
                            <div className="modal-input-field">
                                <label>Target Room Profile Variant Class *</label>
                                <select
                                    value={chosenRoomType}
                                    onChange={(e) => setChosenRoomType(e.target.value)}
                                    className="modal-native-select"
                                >
                                    <option value="General Room">General Room</option>
                                    <option value="Semi-Deluxe Room">Semi-Deluxe Room</option>
                                    <option value="Deluxe Room">Deluxe Room</option>
                                    <option value="ICU">ICU (Intensive Care Unit)</option>
                                </select>
                            </div>
                            <button type="submit" disabled={submitting} className="btn-submit-admission-modal">
                                {submitting ? <Loader2 className="adm-spin" /> : <CheckCircle size={14} />}
                                <span>{submitting ? "Processing Check-In..." : "Confirm Check-In Lock"}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* NEW POP-UP OVERLAY 2: Occupied Bed Patient Extract Profile Insight Flyout Modal */}
            {selectedBedPatient && (
                <div className="adm-modal-backdrop-overlay">
                    <div className="adm-modal-form-view shadow-pop border-blue-panel">
                        <div className="modal-head-title unique-blue-head">
                            <div className="modal-title-combo">
                                <Activity size={15} className="text-sky-600 animate-pulse" />
                                <h3>Bed Allocation Inspection: {selectedBedPatient.bedNumber}</h3>
                            </div>
                            <button type="button" onClick={() => setSelectedBedPatient(null)}>
                                <XCircle size={16} />
                            </button>
                        </div>

                        <div className="modal-form-fields-wrapper">
                            <div className="pos-profile-segment-card">
                                <div className="pos-avatar-stub"><User size={18} /></div>
                                <div>
                                    <h4 className="pos-profile-name">{selectedBedPatient.patientName}</h4>
                                    <span className="pos-profile-sub"><Mail size={10} /> {selectedBedPatient.patientEmail}</span>
                                </div>
                            </div>

                            <div className="clinical-breakdown-pos-box">
                                <div className="clinical-line-node">
                                    <span className="control-lbl-pos"><Clock size={11} /> Admitted Timestamp Log</span>
                                    <p className="clinical-val-text">{new Date(selectedBedPatient.admittedAt).toLocaleString("en-IN")}</p>
                                </div>
                                <div className="clinical-line-node">
                                    <span className="control-lbl-pos"><Layers size={11} /> Allocation Tier</span>
                                    <span className={`room-type-badge-pill ${getRoomTypeClass(selectedBedPatient.roomType)}`}>{selectedBedPatient.roomType}</span>
                                </div>
                            </div>

                            <div className="pos-action-buttons-flex-group" style={{ marginTop: "0.5rem" }}>
                                {new Date() >= new Date(selectedBedPatient.dischargeEligibleAt) ? (
                                    <button
                                        type="button"
                                        className="btn-submit-admission-modal"
                                        onClick={() => handleDischargeCheckout(selectedBedPatient._id)}
                                    >
                                        <LogOut size={13} />
                                        <span>Approve Immediate Discharge</span>
                                    </button>
                                ) : (
                                    <div className="time-locked-pos-banner">
                                        <Clock size={13} />
                                        <span>Patient is under continuous observation observation. 24H release rule lock active.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}