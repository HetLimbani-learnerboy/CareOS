import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
    FileText, Search, RefreshCw, AlertCircle, CheckCircle, CreditCard, Shield, User,
    Receipt, ClipboardList, X, Loader2, FileSpreadsheet, Layers, Activity
} from "lucide-react";
import "../style/BillingConsole.css";

export default function BillingConsole() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [queue, setQueue] = useState([]);
    const [selectedApt, setSelectedApt] = useState(null);
    const [activeDraft, setActiveDraft] = useState(null);

    const [loadingQueue, setLoadingQueue] = useState(true);
    const [loadingDraft, setLoadingDraft] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [extraCharges, setExtraCharges] = useState("0");
    const [extraNotes, setExtraChargesNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [insuranceValid, setInsuranceValid] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const getReceptionistEmail = () => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase() || "";
        } catch {
            return "";
        }
    };

    const setErrorState = (txt) => {
        setMessage({ type: txt ? "error" : "", text: txt });
    };

    const fetchVisitedQueue = useCallback(async () => {
        try {
            setLoadingQueue(true);
            setErrorState("");
            const res = await axios.get(`${API_BASE_URL}/api/v1/receptionist/visited-appointments`, {
                headers: { "x-user-email": getReceptionistEmail() }
            });
            if (res.data?.status === "success") {
                setQueue(Array.isArray(res.data.data) ? res.data.data : []);
            } else {
                setQueue([]);
            }
        } catch (err) {
            setErrorState(err.response?.data?.message || "Failed to retrieve completed patient consult roster.");
            setQueue([]);
        } finally {
            setLoadingQueue(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchVisitedQueue();
    }, [fetchVisitedQueue]);

    const fetchDraftBreakdown = async (apt) => {
        try {
            setLoadingDraft(true);
            setErrorState("");
            setSelectedApt(apt);
            setActiveDraft(null);
            setExtraCharges("0");
            setExtraChargesNotes("");
            setInsuranceValid(false);
            setPaymentMethod("Cash");

            const res = await axios.get(`${API_BASE_URL}/api/v1/receptionist/draft-invoice/${apt.appointmentId}`, {
                headers: { "x-user-email": getReceptionistEmail() }
            });
            if (res.data?.status === "success" && res.data.data) {
                const draft = res.data.data;
                setActiveDraft({
                    ...draft,
                    costs: draft.costs || {
                        consultationFee: 0,
                        treatmentCost: 0,
                        medicineCost: 0,
                        labCost: 0,
                        grossTotal: 0,
                        deductionsPrePaid: 0,
                        netBeforeInsurance: 0
                    },
                    insurance: draft.insurance || { provider: "N/A", policyNumber: "N/A", isValidated: false },
                    billingItems: Array.isArray(draft.billingItems) ? draft.billingItems : []
                });
            } else {
                setErrorState("No draft data returned for this appointment.");
            }
        } catch (err) {
            setErrorState(err.response?.data?.message || "Failed to aggregate clinical workspace cost records.");
        } finally {
            setLoadingDraft(false);
        }
    };

    const filteredQueue = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return queue;
        return queue.filter(
            (item) =>
                item.patientName?.toLowerCase().includes(term) ||
                item.patientEmail?.toLowerCase().includes(term) ||
                String(item.appointmentId || "").toLowerCase().includes(term)
        );
    }, [queue, searchTerm]);

    const financialCalculations = useMemo(() => {
        if (!activeDraft || !activeDraft.costs) return { gross: 0, prepaid: 0, insCover: 0, net: 0 };

        const baseCosts = activeDraft.costs;
        const addedExtra = parseFloat(extraCharges) || 0;

        const gross =
            (baseCosts.consultationFee || 0) +
            (baseCosts.treatmentCost || 0) +
            (baseCosts.medicineCost || 0) +
            (baseCosts.labCost || 0) +
            addedExtra;

        const prepaid = baseCosts.deductionsPrePaid || 0;

        let insCover = 0;
        if (insuranceValid) {
            insCover = Math.max(0, gross - prepaid);
        }

        const net = Math.max(0, gross - prepaid - insCover);
        return {
            gross: Number(gross.toFixed(2)),
            prepaid: Number(prepaid.toFixed(2)),
            insCover: Number(insCover.toFixed(2)),
            net: Number(net.toFixed(2))
        };
    }, [activeDraft, extraCharges, insuranceValid]);

    const handleSubmitFinalInvoice = async (e) => {
        e.preventDefault();
        if (!activeDraft || submitting) return;

        try {
            setSubmitting(true);
            setErrorState("");

            const payload = {
                appointmentId: activeDraft.appointmentId,
                patientId: activeDraft.patientId,
                doctorId: activeDraft.doctorId,
                patientEmail: activeDraft.patientEmail,
                extraCharges: parseFloat(extraCharges) || 0,
                extraChargesNotes: extraNotes,
                insurance: {
                    provider: activeDraft.insurance?.provider || "N/A",
                    policyNumber: activeDraft.insurance?.policyNumber || "N/A",
                    isValidated: insuranceValid
                },
                paymentMethod: insuranceValid ? "Insurance" : paymentMethod,
                receptionistEmail: getReceptionistEmail()
            };

            const res = await axios.post(`${API_BASE_URL}/api/v1/receptionist/finalize-invoice`, payload, {
                headers: { "x-user-email": getReceptionistEmail() }
            });

            if (res.data?.status === "success") {
                setMessage({ type: "success", text: "Patient invoice signed and committed successfully." });
                setTimeout(() => {
                    setActiveDraft(null);
                    setSelectedApt(null);
                    fetchVisitedQueue();
                }, 1500);
            }
        } catch (err) {
            setErrorState(err.response?.data?.message || "Failed to commit financial ledger record.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bl-dashboard-root pr-fade-in">
            <div className="bl-dashboard-header">
                <div>
                    <h1>Receptionist Revenue Operations</h1>
                    <p>Retrieve completed consult slots, aggregate institutional costs, verify coverage parameters, and finalize accounts.</p>
                </div>
                <button className="bl-sync-btn" onClick={fetchVisitedQueue} disabled={loadingQueue}>
                    <RefreshCw className={loadingQueue ? "bl-spin" : ""} size={16} />
                    Refresh Backlog
                </button>
            </div>

            {message.text && (
                <div className={`bl-alert-banner ${message.type === "error" ? "bl-alert-err" : "bl-alert-ok"}`}>
                    {message.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    <span>{message.text}</span>
                    <button type="button" className="bl-alert-close" onClick={() => setErrorState("")}>
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="bl-split-workspace">
                <div className="bl-queue-sidebar">
                    <div className="bl-sidebar-title-bar">
                        <div className="bl-heading-flex">
                            <ClipboardList size={18} />
                            <h2>Visited Queue</h2>
                        </div>
                        <span className="bl-counter-tag">{filteredQueue.length} Pending</span>
                    </div>

                    <div className="bl-search-box">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search by patient name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bl-feed-container">
                        {loadingQueue ? (
                            <div className="bl-skeleton-stack">
                                <div className="bl-skeleton-node" />
                                <div className="bl-skeleton-node" />
                                <div className="bl-skeleton-node" />
                            </div>
                        ) : filteredQueue.length === 0 ? (
                            <div className="bl-empty-slate">
                                <Activity size={32} />
                                <p>No unbilled completed consult slots discovered.</p>
                            </div>
                        ) : (
                            filteredQueue.map((item) => {
                                const isSelected = selectedApt?.appointmentId === item.appointmentId;
                                return (
                                    <div
                                        key={item.appointmentId}
                                        className={`bl-queue-node ${isSelected ? "bl-node-active" : ""}`}
                                        onClick={() => fetchDraftBreakdown(item)}
                                    >
                                        <div className="bl-node-meta">
                                            <h3>{item.patientName}</h3>
                                            <span>{item.patientEmail}</span>
                                            <small>
                                                Date: {item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString() : "N/A"} (
                                                {item.appointmentTime || "N/A"})
                                            </small>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bl-canvas-panel">
                    {loadingDraft ? (
                        <div className="bl-canvas-loading">
                            <Loader2 className="bl-spin" size={32} />
                            <p>Compiling institutional itemization grids...</p>
                        </div>
                    ) : !activeDraft ? (
                        <div className="bl-placeholder-overlay">
                            <Receipt size={48} />
                            <h3>Awaiting Slate Configuration</h3>
                            <p>Select a verified consultation reference from the left queue roster to construct and balance the ledger invoice.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitFinalInvoice} className="bl-invoice-form pr-fade-in">
                            <div className="bl-profile-strip">
                                <div className="bl-profile-item">
                                    <User size={16} />
                                    <div>
                                        <strong>Patient Record Target</strong>
                                        <span>{activeDraft.patientName}</span>
                                    </div>
                                </div>
                                <div className="bl-profile-item">
                                    <FileText size={16} />
                                    <div>
                                        <strong>Identifier Coordinates</strong>
                                        <span>{activeDraft.patientEmail}</span>
                                    </div>
                                </div>
                                <div className="bl-profile-item">
                                    <Shield size={16} />
                                    <div>
                                        <strong>Corporate Network Group</strong>
                                        <span>{activeDraft.insurance?.provider || "None Configured"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bl-itemization-section">
                                <h3>Account Cost Breakdown Ledger</h3>
                                <div className="bl-table-scroll-wrapper">
                                    <table className="bl-invoice-table">
                                        <thead>
                                            <tr>
                                                <th>Item Operations Description</th>
                                                <th>Classification</th>
                                                <th>Rate</th>
                                                <th>Qty</th>
                                                <th>Gross Price</th>
                                                <th>Settled Counters</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeDraft.billingItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: "center", padding: "1rem", opacity: 0.7 }}>
                                                        No billable items found for this appointment.
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeDraft.billingItems.map((item, idx) => (
                                                    <tr key={idx} className={item.prePaid ? "bl-row-prepaid" : ""}>
                                                        <td>{item.name}</td>
                                                        <td>
                                                            <span className={`bl-cat-tag cat-${String(item.category || "Consultation").toLowerCase()}`}>
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td>₹{item.unitPrice}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>₹{item.totalPrice}</td>
                                                        <td>
                                                            {item.prePaid ? (
                                                                <span className="bl-badge-prepaid">Settled Counter</span>
                                                            ) : (
                                                                <span className="bl-badge-unbilled">Desk Balance</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bl-interactive-fields-grid">
                                <div className="bl-form-group">
                                    <label>Supplementary Adjustment Charge (INR)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={extraCharges}
                                        onChange={(e) => setExtraCharges(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="bl-form-group">
                                    <label>Adjustment Charge Breakdown Notes</label>
                                    <input
                                        type="text"
                                        value={extraNotes}
                                        onChange={(e) => setExtraChargesNotes(e.target.value)}
                                        placeholder="Provide justification rules..."
                                    />
                                </div>
                            </div>

                            <div className="bl-insurance-verification-box">
                                <div className="bl-insurance-meta">
                                    <Shield size={20} />
                                    <div>
                                        <h4>Policy Directives: {activeDraft.insurance?.provider || "N/A"}</h4>
                                        <p>Certificate Reference ID: {activeDraft.insurance?.policyNumber || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="bl-toggle-control">
                                    <label className="bl-switch-label">
                                        <input
                                            type="checkbox"
                                            checked={insuranceValid}
                                            onChange={(e) => setInsuranceValid(e.target.checked)}
                                            disabled={!activeDraft.insurance?.policyNumber || activeDraft.insurance?.policyNumber === "N/A"}
                                        />
                                        <span className="bl-switch-slider" />
                                    </label>
                                    <span className="bl-toggle-text">Validate Corporate Coverage Handshake</span>
                                </div>
                            </div>

                            <div className="bl-summary-and-actions-block">
                                <div className="bl-totals-summary-pane">
                                    <div className="bl-total-row">
                                        <span>Gross Accumulation Balance:</span>
                                        <strong>₹{financialCalculations.gross}</strong>
                                    </div>
                                    <div className="bl-total-row bl-deduct-text">
                                        <span>Pre-Settled Direct Adjustments (-):</span>
                                        <strong>₹{financialCalculations.prepaid}</strong>
                                    </div>
                                    <div className="bl-total-row bl-insurance-text">
                                        <span>Corporate Insurance Covered (-):</span>
                                        <strong>₹{financialCalculations.insCover}</strong>
                                    </div>
                                    <div className="bl-total-row bl-grand-payable-row">
                                        <span>Net Balance Desk Payable:</span>
                                        <span>₹{financialCalculations.net}</span>
                                    </div>
                                </div>

                                <div className="bl-final-controls-row">
                                    {financialCalculations.net > 0 && !insuranceValid && (
                                        <div className="bl-form-group bl-min-w-160">
                                            <label>Desk Settlement Mode</label>
                                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                                <option value="Cash">Cash Currency</option>
                                                <option value="Card">Terminal Card</option>
                                                <option value="UPI">Instant UPI</option>
                                                <option value="Mixed">Mixed Modes</option>
                                            </select>
                                        </div>
                                    )}

                                    <button type="submit" className="bl-submit-btn" disabled={submitting}>
                                        <CreditCard size={16} />
                                        <span>{submitting ? "Signing Records..." : "Authorize & Close Account Invoice"}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}