import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Receipt,
    Search,
    BadgeIndianRupee,
    Calendar,
    User,
    ShoppingBag,
    Loader2,
    AlertCircle,
    XCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Ban,
    Wallet,
    Pill 
} from "lucide-react";
import "../style/PharmacyBillingPOS.css";

export default function PharmacyBillingPOS() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [ledger, setLedger] = useState({ pending: [], paid: [], cancelled: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSubTab, setActiveSubTab] = useState("pending");
    const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const pharmacistEmail = useMemo(() => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase() || "pharmacist@careos.com";
        } catch {
            return "pharmacist@careos.com";
        }
    }, []);

    const authHeaders = useMemo(() => ({
        "Content-Type": "application/json",
        "x-user-email": pharmacistEmail
    }), [pharmacistEmail]);

    const fetchBillingLedger = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await axios.get(`${API_BASE_URL}/api/v1/pharmacist/pharmacy/billing/ledger`, {
                headers: authHeaders
            });

            if (res.data?.status === "success") {
                setLedger(res.data.data || { pending: [], paid: [], cancelled: [] });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load point-of-sale statements ledger.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingLedger();
    }, []);

    const handleSettleCashPayment = async (invoiceId) => {
        if (!window.confirm("Confirm cash collection and clear this statement order line?")) return;

        try {
            setProcessingId(invoiceId);
            const res = await axios.patch(
                `${API_BASE_URL}/api/v1/pharmacist/pharmacy/billing/${invoiceId}/pay-cash`,
                { pharmacistEmail },
                { headers: authHeaders }
            );

            if (res.data?.status === "success") {
                fetchBillingLedger();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to finalize cash checkout payment.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleVoidInvoice = async (invoiceId) => {
        if (!window.confirm("Are you sure you want to cancel and void this pharmacy bill?")) return;

        try {
            setProcessingId(invoiceId);
            const res = await axios.patch(
                `${API_BASE_URL}/api/v1/pharmacist/pharmacy/billing/${invoiceId}/void`,
                { pharmacistEmail },
                { headers: authHeaders }
            );

            if (res.data?.status === "success") {
                fetchBillingLedger();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel statement transaction line.");
        } finally {
            setProcessingId(null);
        }
    };

    const aggregates = useMemo(() => {
        const sum = (arr) => arr.reduce((total, item) => total + (item.totalAmount || 0), 0);
        return {
            pendingAmount: sum(ledger.pending),
            paidAmount: sum(ledger.paid),
            cancelledAmount: sum(ledger.cancelled)
        };
    }, [ledger]);

    const filteredInvoices = useMemo(() => {
        const activeList = ledger[activeSubTab] || [];
        if (!searchQuery.trim()) return activeList;

        const query = searchQuery.toLowerCase().trim();
        return activeList.filter(
            (inv) =>
                inv.patientName?.toLowerCase().includes(query) ||
                inv.patientEmail?.toLowerCase().includes(query) ||
                inv.invoiceId?.toLowerCase().includes(query)
        );
    }, [ledger, activeSubTab, searchQuery]);

    const getStatusClass = (status) => {
        if (status?.toLowerCase() === "paid") return "pos-badge-paid";
        if (status?.toLowerCase() === "cancelled") return "pos-badge-void";
        return "pos-badge-pending";
    };

    return (
        <div className="pos-billing-container">
            {/* Top Banner Dashboard Segment */}
            <div className="pos-billing-header">
                <h2 className="pos-billing-title">
                    <Receipt size={22} />
                    Pharmacy Point-of-Sale (POS) Billing Management
                </h2>
                <p className="pos-billing-subtitle">
                    Collect cash settlements instantly, monitor outstanding pharmaceutical credits, and manage historical sales logs.
                </p>
            </div>

            {/* Aggregate Financial Metrics Cards */}
            <div className="pos-analytics-dashboard-row">
                <div className="pos-metric-card stat-orange animate-pop">
                    <div className="pos-metric-icon bg-orange-light text-orange-dark">
                        <BadgeIndianRupee size={20} />
                    </div>
                    <div>
                        <span className="pos-metric-label">Unsettled Pharmacy Balances</span>
                        <h3>₹{aggregates.pendingAmount.toLocaleString("en-IN")}</h3>
                        <p>{ledger.pending.length} invoices awaiting checkout counter settlement</p>
                    </div>
                </div>

                <div className="pos-metric-card stat-green animate-pop">
                    <div className="pos-metric-icon bg-green-light text-green-dark">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <span className="pos-metric-label">Total Cash Saffed Revenue</span>
                        <h3>₹{aggregates.paidAmount.toLocaleString("en-IN")}</h3>
                        <p>{ledger.paid.length} bills settled and inventory released</p>
                    </div>
                </div>
            </div>

            {/* Search Bar & Sub-Tab Control Module */}
            <div className="pos-control-utilities-bar">
                <div className="pos-tab-switch-row">
                    <button
                        onClick={() => { setActiveSubTab("pending"); setExpandedInvoiceId(null); }}
                        className={`pos-tab-node-btn ${activeSubTab === "pending" ? "pos-tab-active" : ""}`}
                    >
                        Pending Cashiers ({ledger.pending.length})
                    </button>
                    <button
                        onClick={() => { setActiveSubTab("paid"); setExpandedInvoiceId(null); }}
                        className={`pos-tab-node-btn ${activeSubTab === "paid" ? "pos-tab-active" : ""}`}
                    >
                        Settled History Ledger ({ledger.paid.length})
                    </button>
                    <button
                        onClick={() => { setActiveSubTab("cancelled"); setExpandedInvoiceId(null); }}
                        className={`pos-tab-node-btn ${activeSubTab === "cancelled" ? "pos-tab-active" : ""}`}
                    >
                        Voided Statements ({ledger.cancelled.length})
                    </button>
                </div>

                <div className="pos-search-input-box-wrapper">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Search by Patient Name, Email or Invoice token ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="pos-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Primary Workspace Processing Arena */}
            {loading ? (
                <div className="pos-loading-state-box">
                    <Loader2 size={32} className="pos-loop-spin" />
                    <p>Compiling financial auditing tables...</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="pos-empty-state-box">
                    <ShoppingBag size={36} />
                    <p>No transaction tickets recorded within this billing pipeline tier query selection.</p>
                </div>
            ) : (
                <div className="pos-invoices-list-stack">
                    {filteredInvoices.map((inv) => {
                        const isExpanded = expandedInvoiceId === inv.invoiceId;

                        return (
                            <div key={inv.invoiceId} className="pos-invoice-node-card">
                                {/* Header Summary Row layout block */}
                                <div
                                    className="pos-invoice-summary-clickable-row"
                                    onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.invoiceId)}
                                >
                                    <div className="pos-inv-meta-pat">
                                        <div className="pos-avatar-circle">
                                            <User size={15} />
                                        </div>
                                        <div>
                                            <h4>{inv.patientName}</h4>
                                            <small>{inv.patientEmail}</small>
                                        </div>
                                    </div>

                                    <div className="pos-inv-meta-date">
                                        <Calendar size={13} />
                                        <span>{new Date(inv.generatedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    <div className="pos-inv-meta-cash-total">
                                        <span className="pos-cash-amount-text">₹{inv.totalAmount.toLocaleString("en-IN")}</span>
                                        <span className={`pos-status-badge ${getStatusClass(inv.paymentStatus)}`}>
                                            {inv.paymentStatus}
                                        </span>
                                        <button type="button" className="pos-accordion-chevron">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Dropdown breakdown items log context panels Area */}
                                {isExpanded && (
                                    <div className="pos-invoice-expanded-body animate-slide-down">
                                        <div className="pos-items-table-container">
                                            <table className="pos-items-receipt-table">
                                                <thead>
                                                    <tr>
                                                        <th>Medicine Formulation Description</th>
                                                        <th className="text-center">Unit Cost</th>
                                                        <th className="text-center">Quantity Dispensed</th>
                                                        <th className="text-right">Line Gross Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {inv.items.map((med, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="pos-table-med-title">
                                                                    <Pill size={13} className="text-sky-600" />
                                                                    <span>{med.medicineName}</span>
                                                                </div>
                                                                {med.usedSubstitution && <span className="pos-table-sub-pill">Substituted Alternative</span>}
                                                            </td>
                                                            <td className="text-center">₹{med.unitPrice}</td>
                                                            <td className="text-center">{med.quantityDispensed} units</td>
                                                            <td className="text-right font-semibold">₹{med.totalPrice}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Render Skipped medications sublog list array if exists */}
                                        {inv.skippedMedicines && inv.skippedMedicines.length > 0 && (
                                            <div className="pos-skipped-items-block">
                                                <h5>Skipped/Omitted Prescription Items</h5>
                                                <div className="pos-skipped-items-flex">
                                                    {inv.skippedMedicines.map((skipped, idx) => (
                                                        <div key={idx} className="pos-skipped-node-pill">
                                                            <strong>{skipped.originalMedicine}</strong>
                                                            <span>Reason: {skipped.reason}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Operational POS Cashier actions footer workspace context element block */}
                                        <div className="pos-invoice-expanded-footer-actions-bar">
                                            <div className="pos-audit-ids-subtext">
                                                <span>Invoice Reference ID: <span className="font-mono">{inv.invoiceId}</span></span>
                                                <span>Dispensing Pharmacist Account: {inv.pharmacistEmail}</span>
                                            </div>

                                            {inv.paymentStatus === "Pending" && (
                                                <div className="pos-action-buttons-flex-group">
                                                    <button
                                                        type="button"
                                                        className="pos-btn-void-cancel"
                                                        disabled={processingId === inv.invoiceId}
                                                        onClick={() => handleVoidInvoice(inv.invoiceId)}
                                                    >
                                                        <Ban size={13} />
                                                        <span>Void Statement</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="pos-btn-checkout-cash-confirm"
                                                        disabled={processingId === inv.invoiceId}
                                                        onClick={() => handleSettleCashPayment(inv.invoiceId)}
                                                    >
                                                        {processingId === inv.invoiceId ? (
                                                            <Loader2 size={13} className="pos-loop-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={13} />
                                                        )}
                                                        <span>Collect Cash & Clear POS</span>
                                                    </button>
                                                </div>
                                            )}
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