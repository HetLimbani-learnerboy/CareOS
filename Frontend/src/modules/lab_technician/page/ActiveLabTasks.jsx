import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Layers,
    User,
    Activity,
    Loader2,
    ChevronRight,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Search,
    X
} from "lucide-react";
import "../style/ActiveLabTasks.css";

const emptyReportForm = {
    findings: "",
    notes: "",
    billingAmount: ""
};

export default function ActiveLabTasks({ onPipelineUpdated }) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [activeTasks, setActiveTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [reportForm, setReportForm] = useState(emptyReportForm);

    const getLabUserEmail = () => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase() || "lab@careos.com";
        } catch {
            return "lab@careos.com";
        }
    };

    const fetchActiveTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await axios.get(`${API_BASE_URL}/api/v1/lab-technician/eligible-patients`, {
                headers: {
                    "x-user-email": getLabUserEmail(),
                    "Content-Type": "application/json"
                }
            });

            const allData = Array.isArray(res.data?.data) ? res.data.data : [];

            setActiveTasks(
                allData.filter(
                    (task) =>
                        task.ownershipStatus === "claimed_by_me" &&
                        task.currentPipelineStatus !== "completed"
                )
            );
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load active workspace tasks.");
            setActiveTasks([]);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchActiveTasks();
    }, [fetchActiveTasks]);

    const filteredTasks = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return activeTasks;

        return activeTasks.filter((task) => {
            const tests = Array.isArray(task.labTests) ? task.labTests.join(" ") : "";

            return (
                String(task.patientName || "").toLowerCase().includes(term) ||
                String(task.patientEmail || "").toLowerCase().includes(term) ||
                String(task.doctorName || "").toLowerCase().includes(term) ||
                String(task.currentPipelineStatus || "").toLowerCase().includes(term) ||
                tests.toLowerCase().includes(term)
            );
        });
    }, [activeTasks, searchTerm]);

    const selectedTask = useMemo(() => {
        return activeTasks.find((task) => task.labHistoryId === selectedHistoryId) || null;
    }, [activeTasks, selectedHistoryId]);

    const getNextStatusValue = (status) => {
        if (status === "initialized") return "confirmed";
        if (status === "confirmed") return "collected";
        if (status === "collected") return "pending";
        if (status === "pending") return "completed";
        return "";
    };

    const getNextStatusLabel = (status) => {
        if (status === "initialized") return "Confirm Request";
        if (status === "confirmed") return "Log Sample Collected";
        if (status === "collected") return "Mark Analysis Pending";
        if (status === "pending") return "Compile Report";
        return "Next Step";
    };

    const getStatusBadgeClass = (status) => {
        if (status === "initialized") return "active-badge-init";
        if (status === "confirmed") return "active-badge-conf";
        if (status === "collected") return "active-badge-coll";
        if (status === "pending") return "active-badge-pend";
        return "active-badge-default";
    };

    const handleAdvancePipeline = async (historyId, currentStatus) => {
        const nextStatus = getNextStatusValue(currentStatus);

        if (!nextStatus) return;

        if (nextStatus === "completed") {
            setSelectedHistoryId(historyId);
            setReportForm(emptyReportForm);
            return;
        }

        try {
            setActionLoading((prev) => ({ ...prev, [historyId]: true }));
            setError("");

            await axios.patch(
                `${API_BASE_URL}/api/v1/lab-technician/history/${historyId}/pipeline`,
                { status: nextStatus },
                {
                    headers: {
                        "x-user-email": getLabUserEmail()
                    }
                }
            );

            await fetchActiveTasks();

            if (onPipelineUpdated) {
                onPipelineUpdated();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to advance pipeline milestone.");
        } finally {
            setActionLoading((prev) => ({ ...prev, [historyId]: false }));
        }
    };

    const handleFinalizeReport = async (e) => {
        e.preventDefault();

        if (!selectedHistoryId) return;

        if (!reportForm.findings.trim()) {
            setError("Laboratory findings are required.");
            return;
        }

        if (!reportForm.billingAmount || Number(reportForm.billingAmount) <= 0) {
            setError("Please enter a valid billing amount.");
            return;
        }

        try {
            setActionLoading((prev) => ({ ...prev, [selectedHistoryId]: true }));
            setError("");

            await axios.patch(
                `${API_BASE_URL}/api/v1/lab-technician/history/${selectedHistoryId}/pipeline`,
                {
                    status: "completed",
                    findings: reportForm.findings.trim(),
                    notes: reportForm.notes.trim(),
                    billingAmount: Number(reportForm.billingAmount)
                },
                {
                    headers: {
                        "x-user-email": getLabUserEmail()
                    }
                }
            );

            setSelectedHistoryId(null);
            setReportForm(emptyReportForm);
            await fetchActiveTasks();

            if (onPipelineUpdated) {
                onPipelineUpdated();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to finalize diagnostic report.");
        } finally {
            setActionLoading((prev) => ({ ...prev, [selectedHistoryId]: false }));
        }
    };

    const closeReportForm = () => {
        setSelectedHistoryId(null);
        setReportForm(emptyReportForm);
        setError("");
    };

    const SkeletonList = () => (
        <div className="active-stack-panel">
            {[1, 2, 3, 4].map((item) => (
                <div className="active-skeleton-card" key={item}>
                    <div className="active-skeleton-top">
                        <div>
                            <div className="active-skeleton-line active-skeleton-name" />
                            <div className="active-skeleton-line active-skeleton-email" />
                        </div>
                        <div className="active-skeleton-pill" />
                    </div>
                    <div className="active-skeleton-tags">
                        <div className="active-skeleton-tag" />
                        <div className="active-skeleton-tag" />
                        <div className="active-skeleton-tag" />
                    </div>
                    <div className="active-skeleton-footer">
                        <div className="active-skeleton-line active-skeleton-doctor" />
                        <div className="active-skeleton-button" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="active-lab-container">
            <div className="active-split-layout">
                <div className="active-list-side">
                    <div className="active-section-head">
                        <div>
                            <h2 className="active-section-title">
                                <Layers className="active-sky-color" size={22} />
                                My Active Operations Workspace
                            </h2>
                            <p className="active-section-desc">
                                Manage claimed laboratory records and progress each diagnostic pipeline.
                            </p>
                        </div>

                        <button type="button" className="active-refresh-btn" onClick={fetchActiveTasks} disabled={loading}>
                            <RefreshCw size={14} className={loading ? "active-spinner" : ""} />
                            Sync
                        </button>
                    </div>

                    <div className="active-toolbar">
                        <div className="active-search-box">
                            <Search size={15} className="active-slate-color" />
                            <input
                                type="text"
                                placeholder="Search patient, doctor, status, or test"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <span className="active-count-chip">
                            {filteredTasks.length} Active Task{filteredTasks.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    {error && (
                        <div className="active-error-banner">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <SkeletonList />
                    ) : filteredTasks.length === 0 ? (
                        <div className="active-blank-slate">
                            <Activity size={34} className="active-pulse" />
                            <h3>No Active Lab Tasks</h3>
                            <p>Your workspace is empty. Claim available tasks from the registry page to start.</p>
                        </div>
                    ) : (
                        <div className="active-stack-panel">
                            {filteredTasks.map((task) => {
                                const labTests = Array.isArray(task.labTests) ? task.labTests : [];
                                const isBusy = !!actionLoading[task.labHistoryId];

                                return (
                                    <div key={task.labHistoryId || task.prescriptionId} className="active-item-card animate-card-entry">
                                        <div className="active-card-top">
                                            <div className="active-patient-block">
                                                <div className="active-user-meta">
                                                    <User className="active-slate-color" size={15} />
                                                    <span className="active-user-name">{task.patientName || "Patient"}</span>
                                                </div>
                                                <span className="active-user-email">{task.patientEmail || "No email available"}</span>
                                            </div>

                                            <span className={`active-status-badge ${getStatusBadgeClass(task.currentPipelineStatus)}`}>
                                                {task.currentPipelineStatus || "initialized"}
                                            </span>
                                        </div>

                                        <div className="active-tests-row">
                                            {labTests.length > 0 ? (
                                                labTests.map((test, idx) => (
                                                    <span key={`${test}-${idx}`} className="active-test-tag">
                                                        {test}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="active-test-tag active-muted-tag">No tests listed</span>
                                            )}
                                        </div>

                                        <div className="active-card-base">
                                            <span className="active-dr-text">{task.doctorName || "Doctor"}</span>

                                            <button
                                                onClick={() => handleAdvancePipeline(task.labHistoryId, task.currentPipelineStatus)}
                                                disabled={isBusy || !task.labHistoryId}
                                                className="active-step-btn"
                                                type="button"
                                            >
                                                {isBusy ? (
                                                    <Loader2 size={13} className="active-spinner" />
                                                ) : (
                                                    <ChevronRight size={14} />
                                                )}
                                                <span>{getNextStatusLabel(task.currentPipelineStatus)}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="active-form-side">
                    {selectedHistoryId ? (
                        <form onSubmit={handleFinalizeReport} className="active-report-form animate-pane-slide">
                            <div className="active-form-title">
                                <div className="active-form-title-left">
                                    <FileSpreadsheet className="active-sky-color" size={18} />
                                    <span>Compile Diagnostic Findings</span>
                                </div>

                                <button type="button" className="active-close-form-btn" onClick={closeReportForm}>
                                    <X size={15} />
                                </button>
                            </div>

                            {selectedTask && (
                                <div className="active-selected-summary">
                                    <span>{selectedTask.patientName || "Patient"}</span>
                                    <small>{selectedTask.patientEmail || "No email available"}</small>
                                </div>
                            )}

                            <div className="active-input-group">
                                <label className="active-input-label">Laboratory Findings</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={reportForm.findings}
                                    onChange={(e) => setReportForm((prev) => ({ ...prev, findings: e.target.value }))}
                                    placeholder="Record numerical readings, observations, ranges, and diagnostic interpretation."
                                    className="active-textarea-field"
                                />
                            </div>

                            <div className="active-input-group">
                                <label className="active-input-label">Technician Notes</label>
                                <textarea
                                    rows={3}
                                    value={reportForm.notes}
                                    onChange={(e) => setReportForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Enter procedural remarks, sample quality notes, or reference variables."
                                    className="active-textarea-field"
                                />
                            </div>

                            <div className="active-input-group">
                                <label className="active-input-label">Total Operational Service Fee (INR)</label>
                                <div className="active-currency-wrapper">
                                    <span className="active-currency-symbol">₹</span>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={reportForm.billingAmount}
                                        onChange={(e) => setReportForm((prev) => ({ ...prev, billingAmount: e.target.value }))}
                                        placeholder="1200"
                                        className="active-input-field"
                                    />
                                </div>
                            </div>

                            <div className="active-form-actions">
                                <button type="button" onClick={closeReportForm} className="active-cancel-btn">
                                    Discard
                                </button>

                                <button type="submit" disabled={actionLoading[selectedHistoryId]} className="active-submit-btn">
                                    {actionLoading[selectedHistoryId] ? (
                                        <Loader2 size={13} className="active-spinner" />
                                    ) : (
                                        <CheckCircle2 size={13} />
                                    )}
                                    <span>Signoff & Log Bill</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="active-sidebar-placeholder">
                            <FileSpreadsheet size={28} />
                            <h3>Report Portal</h3>
                            <p>When a workflow reaches the pending stage, advance it to open the diagnostic report form here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}