import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
    Activity,
    User,
    Clock,
    ClipboardList,
    Search,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    FileText,
    Pill,
    FlaskConical,
    DollarSign,
    Calendar,
    Phone
} from 'lucide-react';
import '../style/NurseLabReviews.css';

export default function NurseLabReviews() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [labReports, setLabReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const getNurseEmail = () => {
        try {
            const user = localStorage.getItem("user");
            if (!user) return "";
            return JSON.parse(user).email;
        } catch (e) {
            return "";
        }
    };

    const nurseEmail = getNurseEmail();

    const fetchLabReviews = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/v1/nurse/lab-reviews`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': nurseEmail,
                }
            });
            setLabReports(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            console.error('Failed to load lab report tracking logs.', err);
            setLabReports([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabReviews();
    }, [API_BASE_URL]);

    const filteredReports = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return labReports;
        return labReports.filter(item => {
            const pName = `${item.patientDetails?.firstName || ''} ${item.patientDetails?.lastName || ''}`.toLowerCase();
            return (
                pName.includes(term) ||
                (item.patientDetails?.email || '').toLowerCase().includes(term) ||
                (item.prescriptionDetails?.prescriptionName || '').toLowerCase().includes(term) ||
                (item.prescriptionDetails?.diagnosis || '').toLowerCase().includes(term) ||
                (item.requestedTests || []).some(test => String(test).toLowerCase().includes(term))
            );
        });
    }, [labReports, searchTerm]);

    return (
        <div className="lab-root animate-fade-in">
            <div className="lab-header-row">
                <div>
                    <h2>Diagnostic Lab Reviews Ledger</h2>
                    <p>Evaluate tracking processing statuses, analysis outcomes, and metrics logs for your assigned ward patients.</p>
                </div>
                <button className="refresh-action-btn" type="button" onClick={fetchLabReviews} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spin-node' : ''} />
                    Refresh Logs
                </button>
            </div>

            <div className="lab-search-controls">
                <Search size={16} className="search-decorator" />
                <input
                    type="text"
                    placeholder="Search parameters via patient info, test name classifications, or diagnostic profile terms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="lab-loading-shimmer-wrapper">
                    <div className="shimmer-card" />
                    <div className="shimmer-card" />
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="lab-empty-placeholder">
                    <FlaskConical size={40} />
                    <p>No active diagnostic history files match your current lookup parameters or case tracking rosters.</p>
                </div>
            ) : (
                <div className="lab-reports-stack">
                    {filteredReports.map((item) => {
                        const isExpanded = expandedId === item.historyId;
                        const patientName = `${item.patientDetails?.firstName || 'Anonymous'} ${item.patientDetails?.lastName || ''}`.trim();

                        return (
                            <div key={item.historyId} className={`lab-node-card ${isExpanded ? 'open-shadow' : ''}`}>
                                <div className="lab-card-summary" onClick={() => setExpandedId(isExpanded ? null : item.historyId)}>
                                    <div className="patient-identity-block">
                                        <div className="avatar-shield"><User size={16} /></div>
                                        <div>
                                            <h4>{patientName}</h4>
                                            <span>{item.patientDetails?.email || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="tests-context-block">
                                        <FlaskConical size={14} />
                                        <span>{(item.requestedTests || []).join(', ') || 'No Tests Listed'}</span>
                                    </div>

                                    <div className="timeline-context-block">
                                        <Calendar size={14} />
                                        <span>Ordered: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>

                                    <div className="action-badge-interactive-zone">
                                        <span className={`lab-tag tag-${(item.status || 'pending').toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                        <div className="accordion-toggle-arrow">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="lab-card-extended-body animate-slide-up">

                                        <div className="prescription-metadata-banner">
                                            <div className="prescription-header">
                                                <FileText size={16} />
                                                <h5>Clinical Dossier Frame: <span>{item.prescriptionDetails?.prescriptionName || 'Care Routine'}</span></h5>
                                            </div>
                                            <div className="prescription-grid">
                                                <div className="meta-block">
                                                    <span className="meta-label">Primary Assessment Diagnosis</span>
                                                    <span className="meta-value text-alert">{item.prescriptionDetails?.diagnosis || 'N/A'}</span>
                                                </div>
                                                <div className="meta-block">
                                                    <span className="meta-label"><Phone size={12} /> Communication Contact</span>
                                                    <span className="meta-value">{item.patientDetails?.phone || 'N/A'}</span>
                                                </div>
                                                <div className="meta-block full-row">
                                                    <span className="meta-label">Clinical Direction / Notes</span>
                                                    <p className="meta-text-block">{item.prescriptionDetails?.notes || 'No extensive case guidelines registered.'}</p>
                                                </div>
                                                <div className="meta-block full-row">
                                                    <span className="meta-label">Summary Findings Narrative</span>
                                                    <p className="meta-text-block">{item.prescriptionDetails?.result || 'Awaiting entry summaries.'}</p>
                                                </div>
                                            </div>

                                            {Array.isArray(item.prescriptionDetails?.medicines) && item.prescriptionDetails.medicines.length > 0 && (
                                                <div className="medicines-sub-section">
                                                    <div className="sub-section-title">
                                                        <Pill size={14} />
                                                        <span>Active Pharmacological Schedules</span>
                                                    </div>
                                                    <div className="table-responsive-container">
                                                        <table className="extracted-data-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Formula Context</th>
                                                                    <th>Dosage Protocol</th>
                                                                    <th>Course</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {item.prescriptionDetails.medicines.map((med, idx) => (
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
                                        </div>

                                        <div className="extended-grid-layout">

                                            <div className="findings-logging-sub-panel">
                                                <h5><Activity size={14} /> Analysis Laboratory Findings</h5>
                                                {item.reportData ? (
                                                    <div className="findings-content-container">
                                                        <div className="findings-block">
                                                            <span className="meta-label">Observation Findings Matrix</span>
                                                            <pre className="report-pre-block">{item.reportData.findings}</pre>
                                                        </div>
                                                        <div className="findings-block" style={{ marginTop: '14px' }}>
                                                            <span className="meta-label">Lab Technician Verification Notes</span>
                                                            <p className="meta-text-block">{item.reportData.notes}</p>
                                                        </div>
                                                        {item.reportData.generatedAt && (
                                                            <div className="generation-timestamp-footer">
                                                                <Clock size={12} />
                                                                <span>Validated: {new Date(item.reportData.generatedAt).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="no-history-alert">Physiological specimen outputs have not been uploaded by lab diagnostics yet.</p>
                                                )}

                                                <div className="extracted-accounting-box">
                                                    <div className="accounting-header-title">
                                                        <DollarSign size={13} />
                                                        <span>Billing & Invoice Parameters</span>
                                                    </div>
                                                    <div className="accounting-details-strip">
                                                        <span>Processing Fee: <strong>₹{item.billingAmount || 0}</strong></span>
                                                        <span>Ledger Status: <strong className={item.isBilled ? "text-blue" : "text-amber"}>{item.isBilled ? 'Settled' : 'Unbilled'}</strong></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="vitals-history-sub-panel">
                                                <h5><Clock size={14} /> Status Operational Milestones</h5>
                                                {item.statusTimestamps && Object.keys(item.statusTimestamps).length > 0 ? (
                                                    <div className="timeline-milestones-container">
                                                        {Object.entries(item.statusTimestamps).map(([phase, dateStr]) => (
                                                            <div key={phase} className="milestone-timeline-node">
                                                                <div className="node-marker" />
                                                                <div className="node-content">
                                                                    <span className="phase-name">{phase.replace('At', '')}</span>
                                                                    <span className="phase-time">{new Date(dateStr).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="no-history-alert">No workflow execution timestamps traced on this pipeline sheet.</p>
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