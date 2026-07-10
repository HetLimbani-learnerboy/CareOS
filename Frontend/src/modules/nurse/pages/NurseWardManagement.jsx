import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
    Activity,
    User,
    Layers,
    Clock,
    CheckCircle,
    HeartPulse,
    ClipboardList,
    Search,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    PlusCircle,
    LogOut,
    FileText,
    Stethoscope,
    Pill,
    Clipboard
} from 'lucide-react';
import '../style/NurseWardManagementStyle.css';

export default function NurseWardManagement() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [admissions, setAdmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    const [vitalsForm, setVitalsForm] = useState({ bloodPressure: '', heartRate: '', temperature: '' });
    const [vitalsSubmitting, setVitalsSubmitting] = useState(false);

    const getNurseEmail = () => {
        try {
            const user = localStorage.getItem("user");
            if (!user) return "nurse@careos.co";
            return JSON.parse(user).email || "nurse@careos.co";
        } catch (e) {
            return "nurse@careos.co";
        }
    };

    const nurseEmail = getNurseEmail();

    const fetchAssignedWardAdmissions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/v1/nurse/my-admissions`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': nurseEmail,
                }
            });
            setAdmissions(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            console.error('Failed to load assigned ward data roster details.', err);
            setAdmissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedWardAdmissions();
    }, [API_BASE_URL]);

    const handleMarkReadyDischarge = async (e, admissionId) => {
        e.stopPropagation();
        if (!window.confirm('Update this patient eligibility timestamp for discharge clearance?')) return;

        try {
            setActionLoading(prev => ({ ...prev, [admissionId]: true }));
            await axios.patch(`${API_BASE_URL}/api/v1/nurse/${admissionId}/ready-discharge`, {}, {
                headers: {
                    'x-user-email': nurseEmail
                }
            });
            alert('Patient discharge clearance window timestamp updated successfully.');
            fetchAssignedWardAdmissions();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update milestone clearance window.');
        } finally {
            setActionLoading(prev => ({ ...prev, [admissionId]: false }));
        }
    };

    const handleCompleteDischargeCheckout = async (e, admissionId) => {
        e.stopPropagation();
        if (!window.confirm('Are you ready to finalize this clinical checkout? This will release the allocated bed space back into active circulation.')) return;

        try {
            setActionLoading(prev => ({ ...prev, [admissionId]: true }));
            await axios.patch(`${API_BASE_URL}/api/v1/nurse/${admissionId}/complete-discharge`, {}, {
                headers: {
                    'x-user-email': nurseEmail
                }
            });
            alert('Patient completely discharged. Ward bed unit assigned tracking references have been scrubbed clear.');
            fetchAssignedWardAdmissions();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to finalize room discharge operations.');
        } finally {
            setActionLoading(prev => ({ ...prev, [admissionId]: false }));
        }
    };

    const handleVitalsSubmit = async (e, admissionId) => {
        e.preventDefault();
        if (!vitalsForm.bloodPressure || !vitalsForm.heartRate || !vitalsForm.temperature) {
            alert('Please populate all clinical metrics input nodes.');
            return;
        }

        try {
            setVitalsSubmitting(true);
            await axios.post(`${API_BASE_URL}/api/v1/nurse/${admissionId}/vitals`, vitalsForm, {
                headers: {
                    'x-user-email': nurseEmail
                }
            });
            alert('Patient clinical physiological status parameters updated.');
            setVitalsForm({ bloodPressure: '', heartRate: '', temperature: '' });
            fetchAssignedWardAdmissions();
        } catch (err) {
            alert(err.response?.data?.message || 'Unable to store metrics.');
        } finally {
            setVitalsSubmitting(false);
        }
    };

    const filteredAdmissions = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return admissions;
        return admissions.filter(item =>
            (item.patientName || '').toLowerCase().includes(term) ||
            (item.patientEmail || '').toLowerCase().includes(term) ||
            (item.roomType || '').toLowerCase().includes(term) ||
            (item.prescriptionId?.diagnosis || '').toLowerCase().includes(term) ||
            (item.bedId?.bedNumber || '').toLowerCase().includes(term)
        );
    }, [admissions, searchTerm]);

    return (
        <div className="ward-root animate-fade-in">
            <div className="ward-header-row">
                <div>
                    <h2>Ward Tracking & Nursing Operations</h2>
                    <p>Track your assigned active ward patients, maintain medical observations, and process discharge eligibility.</p>
                </div>
                <button className="refresh-action-btn" type="button" onClick={fetchAssignedWardAdmissions} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spin-node' : ''} />
                    Refresh Roster
                </button>
            </div>

            <div className="ward-search-controls">
                <Search size={16} className="search-decorator" />
                <input
                    type="text"
                    placeholder="Search records via name, email, layout bed numbers, or primary diagnosis profile fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="ward-loading-shimmer-wrapper">
                    <div className="shimmer-card" />
                    <div className="shimmer-card" />
                </div>
            ) : filteredAdmissions.length === 0 ? (
                <div className="ward-empty-placeholder">
                    <ClipboardList size={40} />
                    <p>No active ward patient files match your current filter preferences or specific duty roster assignments.</p>
                </div>
            ) : (
                <div className="ward-admissions-stack">
                    {filteredAdmissions.map((item) => {
                        const isExpanded = expandedId === item._id;
                        const isTimeCleared = item.dischargeEligibleAt && new Date(item.dischargeEligibleAt).getTime() <= Date.now();

                        return (
                            <div key={item._id} className={`ward-node-card ${isExpanded ? 'open-shadow' : ''} ${isTimeCleared ? 'border-ready' : ''}`}>
                                <div className="ward-card-summary" onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                                    <div className="patient-identity-block">
                                        <div className="avatar-shield"><User size={16} /></div>
                                        <div>
                                            <h4>{item.patientName || 'Unknown Patient'}</h4>
                                            <span>{item.patientEmail || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="allocation-context-block">
                                        <Layers size={14} />
                                        <span>{item.roomType || 'General'} (Bed: {item.bedId?.bedNumber || 'N/A'})</span>
                                    </div>

                                    <div className="timeline-context-block">
                                        <Clock size={14} />
                                        <span>Admitted: {item.admittedAt ? new Date(item.admittedAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>

                                    <div className="action-badge-interactive-zone">
                                        <span className={`ward-tag ${isTimeCleared ? 'tag-ready-for-discharge' : 'tag-admitted'}`}>
                                            {isTimeCleared ? 'Cleared For Discharge' : 'Active Patient'}
                                        </span>

                                        <button
                                            className="btn-discharge-trigger"
                                            type="button"
                                            disabled={!!actionLoading[item._id]}
                                            onClick={(e) => handleMarkReadyDischarge(e, item._id)}
                                        >
                                            <CheckCircle size={13} />
                                            Update Window
                                        </button>

                                        <button
                                            className="btn-discharge-complete"
                                            type="button"
                                            disabled={!!actionLoading[item._id]}
                                            onClick={(e) => handleCompleteDischargeCheckout(e, item._id)}
                                        >
                                            <LogOut size={13} />
                                            Discharge
                                        </button>

                                        <div className="accordion-toggle-arrow">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="ward-card-extended-body animate-slide-up">

                                        {item.prescriptionId && (
                                            <div className="prescription-metadata-banner">
                                                <div className="prescription-header">
                                                    <FileText size={16} />
                                                    <h5>Medical Case Dossier Summary: <span>{item.prescriptionId.prescriptionName || 'Standard Care'}</span></h5>
                                                </div>

                                                <div className="prescription-grid">
                                                    <div className="meta-block">
                                                        <span className="meta-label">Attending Specialist</span>
                                                        <span className="meta-value text-highlight">{item.prescriptionId.doctorName || 'N/A'}</span>
                                                    </div>
                                                    <div className="meta-block">
                                                        <span className="meta-label">Primary Admitting Diagnosis</span>
                                                        <span className="meta-value text-alert">{item.prescriptionId.diagnosis || 'Unspecified'}</span>
                                                    </div>
                                                    {item.prescriptionId.notes && (
                                                        <div className="meta-block full-row">
                                                            <span className="meta-label">Clinical Observation Case Notes</span>
                                                            <p className="meta-text-block">{item.prescriptionId.notes}</p>
                                                        </div>
                                                    )}
                                                    {item.prescriptionId.result && (
                                                        <div className="meta-block full-row">
                                                            <span className="meta-label">Evaluation Findings Matrix Result</span>
                                                            <p className="meta-text-block">{item.prescriptionId.result}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {Array.isArray(item.prescriptionId.medicines) && item.prescriptionId.medicines.length > 0 && (
                                                    <div className="medicines-sub-section">
                                                        <div className="sub-section-title">
                                                            <Pill size={14} />
                                                            <span>Active Pharmacological Order Schedules</span>
                                                        </div>
                                                        <div className="table-responsive-container">
                                                            <table className="extracted-data-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Therapeutic Formula Name</th>
                                                                        <th>Dosage Protocol</th>
                                                                        <th>Course Period</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {item.prescriptionId.medicines.map((med, idx) => (
                                                                        <tr key={idx}>
                                                                            <td className="font-semibold">{med.medicine}</td>
                                                                            <td>{med.dosage}</td>
                                                                            <td>{med.days} Days</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {Array.isArray(item.prescriptionId.labReports) && item.prescriptionId.labReports.length > 0 && (
                                                    <div className="lab-reports-sub-section">
                                                        <div className="sub-section-title">
                                                            <Clipboard size={14} />
                                                            <span>Required Diagnostics & Lab Matrix Mapping</span>
                                                        </div>
                                                        <div className="lab-chips-flex">
                                                            {item.prescriptionId.labReports.map((lab, idx) => (
                                                                <span key={idx} className="lab-report-chip">{lab}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="extended-grid-layout">
                                            <div className="vitals-logging-sub-panel">
                                                <h5><PlusCircle size={14} /> Log New Physiological Vitals</h5>
                                                <form onSubmit={(e) => handleVitalsSubmit(e, item._id)}>
                                                    <div className="form-row-inputs">
                                                        <div className="input-group">
                                                            <label>Blood Pressure</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g., 120/80"
                                                                value={vitalsForm.bloodPressure}
                                                                onChange={(e) => setVitalsForm(p => ({ ...p, bloodPressure: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Heart Rate (BPM)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="e.g., 72"
                                                                value={vitalsForm.heartRate}
                                                                onChange={(e) => setVitalsForm(p => ({ ...p, heartRate: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Temperature (°C)</label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="e.g., 37.0"
                                                                value={vitalsForm.temperature}
                                                                onChange={(e) => setVitalsForm(p => ({ ...p, temperature: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button type="submit" disabled={vitalsSubmitting} className="btn-vitals-submit">
                                                        <HeartPulse size={12} /> Save Metrics
                                                    </button>
                                                </form>

                                                {item.bedId && (
                                                    <div className="extracted-bed-layout-box">
                                                        <div className="bed-header-title">
                                                            <Stethoscope size={13} />
                                                            <span>Structural Allocation Mapping Metadata</span>
                                                        </div>
                                                        <div className="bed-details-strip">
                                                            <span>Unit Identifier: <strong>{item.bedId.bedNumber || 'N/A'}</strong></span>
                                                            <span>Room Class: <strong>{item.bedId.roomType || 'N/A'}</strong></span>
                                                            <span>Base Accounting Rate: <strong className="text-blue">₹{item.bedId.price || 0}/day</strong></span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="vitals-history-sub-panel">
                                                <h5><Activity size={14} /> Historical Evaluation Logs</h5>
                                                {(!item.vitalsHistory || item.vitalsHistory.length === 0) ? (
                                                    <p className="no-history-alert">No health assessment metric timelines recorded for this entry block yet.</p>
                                                ) : (
                                                    <div className="vitals-table-scroll-container">
                                                        <table className="vitals-log-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Time</th>
                                                                    <th>BP</th>
                                                                    <th>HR</th>
                                                                    <th>Temp</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(item.vitalsHistory || []).map((vital, idx) => (
                                                                    <tr key={vital._id || idx}>
                                                                        <td>{vital.recordedAt ? new Date(vital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                                                                        <td>{vital.bloodPressure}</td>
                                                                        <td>{vital.heartRate} bpm</td>
                                                                        <td>{vital.temperature}°F</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}