import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    LayoutDashboard,
    Package,
    Search,
    RefreshCw,
    AlertTriangle,
    CreditCard,
    CheckCircle2,
    XCircle,
    Loader2,
    TrendingDown,
    Activity,
    DollarSign,
    User
} from "lucide-react";
import "../style/PharmacistDashboard.css";

export default function PharmacistDashboard() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [inventory, setInventory] = useState([]);
    const [billingLedger, setBillingLedger] = useState({ pending: [], paid: [], cancelled: [] });
    const [metrics, setMetrics] = useState({ pendingAmount: 0, completedAmount: 0 });

    const [searchQuery, setSearchQuery] = useState("");
    const [loadingGrid, setLoadingGrid] = useState(true);
    const [actionRunningId, setActionRunningId] = useState(null);
    const [globalError, setGlobalError] = useState("");

    const syncDashboardState = async (searchVal = "") => {
        try {
            setLoadingGrid(true);
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            const headers = { "x-user-email": userObj?.email };

            const searchParam = searchVal.trim() ? `?search=${encodeURIComponent(searchVal.trim())}` : "";
            const dashRes = await axios.get(`${API_BASE_URL}/api/v1/pharmacist/pharmacy/dashboard/summary${searchParam}`, { headers });

            if (dashRes.data?.status === "success") {
                setInventory(dashRes.data.data.inventory || []);
                setMetrics(dashRes.data.data.metrics || { pendingAmount: 0, completedAmount: 0 });
            }

            const billRes = await axios.get(`${API_BASE_URL}/api/v1/pharmacist/pharmacy/billing/ledger`, { headers });
            if (billRes.data?.status === "success") {
                setBillingLedger(billRes.data.data || { pending: [], paid: [], cancelled: [] });
            }

        } catch (err) {
            setGlobalError(err.response?.data?.message || "Communication loop failure syncing dashboard references.");
        } finally {
            setLoadingGrid(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            syncDashboardState(searchQuery);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleInvoiceSettlement = async (invoiceId, actionType) => {
        if (!window.confirm(`Are you sure you want to mark this invoice as ${actionType === "settle" ? "PAID" : "CANCELLED"}?`)) return;

        try {
            setActionRunningId(invoiceId);
            const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;

            const targetEndpoint = actionType === "pay-cash" ? "pay-cash" : "void";
            const res = await axios.patch(
                `${API_BASE_URL}/api/v1/pharmacist/pharmacy/billing/${invoiceId}/${targetEndpoint}`,
                {},
                { headers: { "x-user-email": userObj?.email } }
            );

            if (res.data?.status === "success") {
                syncDashboardState(searchQuery);
            }
            if (targetEndpoint === "pay-cash") {
                alert("Invoice successfully settled via Cash and archived to historical records ledger.");
            } else {
                alert("Invoice cancelled and You have to restock the inventory items manually.");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update financial status.");
        } finally {
            setActionRunningId(null);
        }
    };

    return (
        <div className="dash-workspace-root">
            <div className="dash-core-title-header">
                <div className="flex-meta-header">
                    <LayoutDashboard size={24} className="icon-brand-color" />
                    <div>
                        <h2>Pharmacy Central Command Dashboard</h2>
                        <p>Real-time automated critical safety buffers monitoring & financial settlement reconciliation ledgers.</p>
                    </div>
                </div>
                <button onClick={() => syncDashboardState(searchQuery)} className="dash-refresh-macro-btn">
                    <RefreshCw size={14} /> Refresh Stream
                </button>
            </div>

            {globalError && (
                <div className="dash-alert-error-banner">
                    <AlertTriangle size={18} /> <span>{globalError}</span>
                </div>
            )}

            <div className="dash-metrics-grid-row">
                <div className="metric-metric-card border-left-emerald">
                    <div className="metric-inner-flex">
                        <div>
                            <span className="lbl-muted text-xs uppercase font-bold tracking-wider">Completed Settlements</span>
                            <h3>₹{metrics.completedAmount.toLocaleString('en-IN')}</h3>
                        </div>
                        <CheckCircle2 size={32} className="text-emerald-500 opacity-80" />
                    </div>
                </div>

                <div className="metric-metric-card border-left-amber">
                    <div className="metric-inner-flex">
                        <div>
                            <span className="lbl-muted text-xs uppercase font-bold tracking-wider">Pending Accounts Receivable</span>
                            <h3>₹{metrics.pendingAmount.toLocaleString('en-IN')}</h3>
                        </div>
                        <CreditCard size={32} className="text-amber-500 opacity-80" />
                    </div>
                </div>

                <div className="metric-metric-card border-left-indigo">
                    <div className="metric-inner-flex">
                        <div>
                            <span className="lbl-muted text-xs uppercase font-bold tracking-wider">Active Inventory Roster</span>
                            <h3>{inventory.length} Compounds</h3>
                        </div>
                        <Activity size={32} className="text-indigo-500 opacity-80" />
                    </div>
                </div>
            </div>

            <div className="dash-divided-workspace-grid">
                <div className="dash-panel-section-box">
                    <div className="section-panel-header-bar">
                        <div className="flex-title-meta">
                            <TrendingDown size={16} className="text-rose-500" />
                            <span>Stock Allocation Depletion Monitors (Lowest First)</span>
                        </div>
                        <div className="panel-embedded-search-wrapper">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Filter stock index..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="panel-scroll-viewport inventory-viewport-height">
                        {loadingGrid ? (
                            <div className="viewport-spinner-box">
                                <Loader2 size={24} className="animate-spin text-indigo-600" />
                                <p>Reordering critical allocation arrays...</p>
                            </div>
                        ) : inventory.length === 0 ? (
                            <div className="viewport-empty-notice">
                                <Package size={32} />
                                <p>No pharmaceutical listings match your text constraints.</p>
                            </div>
                        ) : (
                            <div className="dash-stock-list-stack">
                                {inventory.map((med) => {
                                    const criticalRisk = (med.quantity || 0) < 20;
                                    return (
                                        <div key={med._id} className={`stock-item-strip ${criticalRisk ? 'strip-risk-critical' : ''}`}>
                                            <div className="strip-left-clinical-info">
                                                <div className="strip-med-name">{med.medicine_name}</div>
                                                <div className="strip-med-subtext">{med.company} | <span className="font-mono text-xs">{med.barcode}</span></div>
                                            </div>
                                            <div className="strip-right-count-box">
                                                <span className={`stock-metric-badge ${criticalRisk ? 'bg-danger-pill' : 'bg-safe-pill'}`}>
                                                    {med.quantity} Units Left
                                                </span>
                                                <span className="strip-price-tag">₹{med.price}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="dash-panel-section-box">
                    <div className="section-panel-header-bar">
                        <div className="flex-title-meta">
                            <CreditCard size={16} className="text-amber-500" />
                            <span>Pending Invoice Settlement Ledger Queue ({billingLedger.pending.length})</span>
                        </div>
                    </div>

                    <div className="panel-scroll-viewport billing-viewport-height">
                        {loadingGrid ? (
                            <div className="viewport-spinner-box">
                                <Loader2 size={24} className="animate-spin text-amber-500" />
                                <p>Parsing open database balance lists...</p>
                            </div>
                        ) : billingLedger.pending.length === 0 ? (
                            <div className="viewport-empty-notice">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                                <p>Accounts clear. All generated invoice tickets completely settled.</p>
                            </div>
                        ) : (
                            <div className="dash-billing-list-stack">
                                {billingLedger.pending.map((invoice) => (
                                    <div key={invoice.invoiceId} className="billing-invoice-card">
                                        <div className="invoice-card-header">
                                            <div className="invoice-patient-profile">
                                                <User size={14} className="text-slate-400" />
                                                <span className="invoice-patient-name">{invoice.patientName}</span>
                                            </div>
                                            <span className="invoice-id-stamp">#{invoice.invoiceId.slice(-6).toUpperCase()}</span>
                                        </div>

                                        <div className="invoice-items-summary-list">
                                            {(invoice.items || []).map((item, idx) => (
                                                <div key={idx} className="invoice-item-line-detail">
                                                    <span>{item.medicineName} (x{item.quantityDispensed})</span>
                                                    <span>₹{item.totalPrice}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="invoice-card-footer-action-row">
                                            <div className="invoice-grand-total">
                                                <span className="txt-label">Total Amount:</span>
                                                <span className="txt-price-value">₹{invoice.totalAmount}</span>
                                            </div>
                                            <div className="invoice-action-buttons-flex-group">
                                                <button
                                                    onClick={() => handleInvoiceSettlement(invoice.invoiceId, "pay-cash")}
                                                    disabled={actionRunningId === invoice.invoiceId}
                                                    className="btn-action-settle-cash"
                                                    title="Collect Cash & Close Ticket"
                                                >
                                                    {actionRunningId === invoice.invoiceId ? <Loader2 size={12} className="animate-spin" /> : "Pay-Cash"}
                                                </button>
                                                <button
                                                    onClick={() => handleInvoiceSettlement(invoice.invoiceId, "void")}
                                                    disabled={actionRunningId === invoice.invoiceId}
                                                    className="btn-action-void-invoice"
                                                    title="Cancel and Void Receipt"
                                                >
                                                    Void
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}