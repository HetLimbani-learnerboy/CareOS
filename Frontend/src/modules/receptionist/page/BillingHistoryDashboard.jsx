import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
    Search, RefreshCw, AlertCircle, CheckCircle, CreditCard, Shield, User,
    Receipt, ClipboardList, X, Loader2, FileText, Ban, ChevronDown, ChevronUp,
    FileSpreadsheet, Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CareOSLOGO from '../../../assets/CareOS-logo.png'
import "../style/BillingHistoryDashboard.css";

export default function BillingHistoryDashboard() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();

    const [history, setHistory] = useState({
        unpaid: [],
        insurancePending: [],
        paid: [],
        cancelled: []
    });

    const [activeTab, setActiveTab] = useState("unpaid");
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentMethodMap, setPaymentMethodMap] = useState({});
    const [expandedInvoiceIds, setExpandedInvoiceIds] = useState({});
    const [message, setMessage] = useState({ type: "", text: "" });

    const getReceptionistEmail = () => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        try {
            return storedUser ? JSON.parse(storedUser)?.email?.trim().toLowerCase() : "";
        } catch {
            return "";
        }
    };

    const fetchBillingHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/v1/receptionist/billing-history-partition`, {
                headers: { "x-user-email": getReceptionistEmail() }
            });
            if (res.data?.status === "success") {
                const data = res.data.data || {};
                setHistory({
                    unpaid: Array.isArray(data.unpaid) ? data.unpaid : [],
                    insurancePending: Array.isArray(data.insurancePending) ? data.insurancePending : [],
                    paid: Array.isArray(data.paid) ? data.paid : [],
                    cancelled: Array.isArray(data.cancelled) ? data.cancelled : []
                });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to compile financial ledger partitions." });
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchBillingHistory();
    }, [fetchBillingHistory]);

    const toggleInvoiceDropdown = (item) => {
        if (item.isDraftBacklog) {
            setMessage({ type: "error", text: "Select this patient inside the main Operations Console to aggregate their items." });
            return;
        }
        setExpandedInvoiceIds((prev) => ({ ...prev, [item._id]: !prev[item._id] }));
    };

    const filteredInvoices = useMemo(() => {
        const list = history[activeTab] || [];
        const term = searchTerm.toLowerCase().trim();
        if (!term) return list;
        return list.filter(
            (item) =>
                String(item.invoiceNumber || "").toLowerCase().includes(term) ||
                String(item.patientEmail || "").toLowerCase().includes(term) ||
                String(item.appointmentId || "").toLowerCase().includes(term) ||
                String(item.patientName || "").toLowerCase().includes(term)
        );
    }, [history, activeTab, searchTerm]);

    const handleUpdateStatus = async (invoiceId, targetStatus) => {
        try {
            setActionId(invoiceId);
            const res = await axios.patch(
                `${API_BASE_URL}/api/v1/receptionist/invoice/${invoiceId}/status`,
                {
                    status: targetStatus,
                    paymentMethod: paymentMethodMap[invoiceId] || "Cash"
                },
                { headers: { "x-user-email": getReceptionistEmail() } }
            );
            if (res.data?.status === "success") {
                setMessage({ type: "success", text: `Invoice status updated to ${targetStatus.replace(/_/g, " ")}.` });
                fetchBillingHistory();
            }
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to modify ledger asset state." });
        } finally {
            setActionId(null);
        }
    };

    const handleRedirectToConsole = (item) => {
        setMessage({ type: "success", text: `Redirecting to console for appointment ${item.appointmentId}...` });
        navigate(`/billing-console?appointmentId=${item.appointmentId}`);
    };

    const generateInvoicePDF = (item) => {
        try {
            const doc = new jsPDF("p", "pt", "a4");
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 36;

            doc.setFillColor(15, 23, 42);
            doc.rect(margin, 25, pageWidth - (margin * 2), 6, "F");

            doc.addImage(CareOSLOGO, "PNG", margin, 38, 20, 20);

            doc.setTextColor(15, 23, 42);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(14);
            doc.text("CareOS Medical Group", margin + 26, 52);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);

            doc.setFillColor(15, 23, 42);
            doc.setFont("Courier", "normal");
            doc.setFontSize(8);
            doc.text("STATEMENT DETAILS", pageWidth - 190, 48);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.text(`Statement Date: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}`, pageWidth - 190, 64);
            doc.text(`Patient No: ${item.patientId ? String(item.patientId).substring(0, 10).toUpperCase() : "N/A"}`, pageWidth - 190, 78);
            doc.text(`Statement No: ${item.invoiceNumber || "N/A"}`, pageWidth - 190, 92);

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(1);
            doc.line(margin, 125, pageWidth - margin, 125);

            doc.setFillColor(15, 23, 42);
            doc.rect(margin, 138, 85, 16, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9);
            doc.text("STATEMENT", margin + 12, 149);

            doc.setTextColor(71, 85, 105);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.text("PLEASE DETACH AND RETURN TOP PORTION WITH YOUR PAYMENT IN THE ENCLOSED ENVELOPE", pageWidth - 365, 149);

            autoTable(doc, {
                startY: 165,
                margin: { left: margin, right: margin },
                head: [["PATIENT NAME", "PATIENT ID", "PROVIDER / ASSOCIATE DOCTOR"]],
                body: [[
                    item.patientName && item.patientName !== "Unknown" ? item.patientName.toUpperCase() : "N/A",
                    item.patientId ? String(item.patientId).toUpperCase() : "N/A",
                    item.doctorName ? `DR. ${item.doctorName.toUpperCase()}` : "N/A"
                ]],
                theme: "plain",
                headStyles: {
                    fillColor: false,
                    textColor: [15, 23, 42],
                    fontStyle: "bold",
                    fontSize: 8.5,
                    halign: "left"
                },
                bodyStyles: {
                    textColor: [71, 85, 105],
                    fontSize: 8.5,
                    cellPadding: { top: 6, bottom: 6 }
                },
                tableLineColor: [226, 232, 240],
                tableLineWidth: 1
            });

            const rawBillingItems = item.billingItems || [];
            const tableRows = rawBillingItems.map((bItem, bIdx) => [
                item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A",
                bItem.category ? bItem.category.toUpperCase() : "N/A",
                bItem.name ? bItem.name.toUpperCase() : "N/A",
                `INR ${bItem.unitPrice || 0}`,
                `${bItem.quantity || 1}`,
                `INR ${bItem.totalPrice || 0}`
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 15,
                margin: { left: margin, right: margin },
                head: [["DATE", "CATEGORY", "DESCRIPTION", "CHARGES", "QTY", "NET DUE"]],
                body: tableRows,
                theme: "plain",
                headStyles: {
                    fillColor: false,
                    textColor: [15, 23, 42],
                    fontStyle: "bold",
                    fontSize: 8.5,
                    lineWidth: 1,
                    lineColor: [15, 23, 42]
                },
                columnStyles: {
                    0: { cellWidth: 65 },
                    1: { cellWidth: 80 },
                    2: { cellWidth: 180 },
                    3: { halign: "right", cellWidth: 70 },
                    4: { halign: "center", cellWidth: 35 },
                    5: { halign: "right", cellWidth: 80 }
                },
                bodyStyles: {
                    textColor: [71, 85, 105],
                    fontSize: 8,
                    cellPadding: { top: 7, bottom: 7 }
                },
                tableLineColor: [226, 232, 240],
                tableLineWidth: 1
            });

            const finalTableY = doc.lastAutoTable.finalY;
            const summaryBoxWidth = 180;
            const summaryBoxX = pageWidth - margin - summaryBoxWidth;

            doc.setDrawColor(15, 23, 42);
            doc.setLineWidth(1.5);
            doc.line(summaryBoxX, finalTableY + 15, pageWidth - margin, finalTableY + 15);

            doc.setFont("Helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(10);
            doc.text("Total Amount Due", summaryBoxX, finalTableY + 32);

            doc.setFontSize(11);
            doc.text(`INR ${(item.netPayableAmount || 0).toFixed(2)}`, pageWidth - margin, finalTableY + 32, { align: "right" });

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(1);
            doc.line(summaryBoxX, finalTableY + 45, pageWidth - margin, finalTableY + 45);

            const footerY = pageHeight - 80;
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, footerY, pageWidth - (margin * 2), 42, "F");

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(
                "Your prompt payment is greatly appreciated. Central CareOS billing records reflect real-time hospital administrative mappings.",
                margin + 12,
                footerY + 16
            );
            doc.text(
                "Statements generated are legally binding accounts and represent fully verified operational, diagnostic, and clinical ledger updates.",
                margin + 12,
                footerY + 28
            );

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text("STATEMENT STATUS:", margin, pageHeight - 25);

            const isPaid = String(item.paymentStatus).toLowerCase() === "paid";
            if (isPaid) {
                doc.setTextColor(34, 197, 94);
                doc.text("PAID IN FULL", margin + 110, pageHeight - 25);
            } else {
                doc.setTextColor(245, 158, 11);
                doc.text("OUTSTANDING BALANCE PENDING", margin + 110, pageHeight - 25);
            }

            doc.save(`CareOS_Statement_${item.invoiceNumber || "INV"}.pdf`);
            setMessage({ type: "success", text: "Medical Invoice Statement generated and downloaded successfully." });
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: "An error occurred during statement rendering." });
        }
    };

    return (
        <div className="hd-dashboard-root pr-fade-in">
            <div className="hd-dashboard-header">
                <div>
                    <h1>Hospital Master Revenue Ledger</h1>
                    <p>Audit, expand itemized details, and process financial ledger balances across categorical lifecycle conditions.</p>
                </div>
                <button className="hd-sync-btn" onClick={fetchBillingHistory} disabled={loading}>
                    <RefreshCw className={loading ? "hd-spin" : ""} size={16} /> Sync Master Ledger
                </button>
            </div>

            {message.text && (
                <div className={`hd-alert-banner ${message.type === "error" ? "hd-alert-err" : "hd-alert-ok"}`}>
                    {message.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    <span>{message.text}</span>
                    <button type="button" className="hd-alert-close" onClick={() => setMessage({ type: "", text: "" })}>
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="hd-tabs-nav-bar">
                <button
                    className={`hd-tab-link ${activeTab === "unpaid" ? "hd-tab-active" : ""}`}
                    onClick={() => {
                        setActiveTab("unpaid");
                        setSearchTerm("");
                    }}
                >
                    <Receipt size={16} /> Pending Desk (Unpaid) ({history.unpaid.length})
                </button>
                <button
                    className={`hd-tab-link ${activeTab === "insurancePending" ? "hd-tab-active" : ""}`}
                    onClick={() => {
                        setActiveTab("insurancePending");
                        setSearchTerm("");
                    }}
                >
                    <Shield size={16} /> Claims Pending ({history.insurancePending.length})
                </button>
                <button
                    className={`hd-tab-link ${activeTab === "paid" ? "hd-tab-active" : ""}`}
                    onClick={() => {
                        setActiveTab("paid");
                        setSearchTerm("");
                    }}
                >
                    <CheckCircle size={16} /> Settled Accounts ({history.paid.length})
                </button>
                <button
                    className={`hd-tab-link ${activeTab === "cancelled" ? "hd-tab-active" : ""}`}
                    onClick={() => {
                        setActiveTab("cancelled");
                        setSearchTerm("");
                    }}
                >
                    <Ban size={16} /> Cancelled / Voided ({history.cancelled.length})
                </button>
            </div>

            <div className="hd-search-filter-wrapper">
                <Search size={15} />
                <input
                    type="text"
                    placeholder="Filter active workspace by invoice number, patient info, or appointment ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="hd-grid-viewport">
                {loading ? (
                    <div className="hd-skeleton-stack">
                        <div className="hd-skeleton-card-node" />
                        <div className="hd-skeleton-card-node" />
                        <div className="hd-skeleton-card-node" />
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="hd-empty-state-card">
                        <ClipboardList size={40} />
                        <h3>No Records Identified</h3>
                        <p>No billing documents found matching this matrix parameter.</p>
                    </div>
                ) : (
                    <div className="hd-cards-flex-grid">
                        {filteredInvoices.map((item) => {
                            const isExpanded = !!expandedInvoiceIds[item._id];
                            return (
                                <div
                                    key={item._id}
                                    className={`hd-invoice-card-node status-border-${activeTab} ${isExpanded ? "hd-card-expanded" : ""} ${item.isDraftBacklog ? "hd-draft-backlog-card" : ""
                                        }`}
                                >
                                    <div className="hd-card-head" onClick={() => toggleInvoiceDropdown(item)} style={{ cursor: "pointer" }}>
                                        <div className="hd-title-block">
                                            <span className="hd-invoice-num">{item.invoiceNumber || "UNTITLED LEDGER"}</span>
                                            <span className="hd-date-stamp">Finalized: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</span>
                                        </div>
                                        <div className="hd-badge-flex">
                                            <span className={`hd-status-badge status-tag-${activeTab}`}>
                                                {item.isDraftBacklog ? "Visited Queue Draft" : String(item.paymentStatus || "Unpaid").replace(/_/g, " ")}
                                            </span>
                                            {!item.isDraftBacklog && (isExpanded ? <ChevronUp size={16} className="hd-drop-icon" /> : <ChevronDown size={16} className="hd-drop-icon" />)}
                                        </div>
                                    </div>

                                    <div className="hd-patient-details-row">
                                        <User size={15} />
                                        <div>
                                            <h4>{item.patientName && item.patientName !== "Unknown" ? item.patientName : item.patientEmail || "Patient Profile Missing"}</h4>
                                            <span>Appointment ID: {item.appointmentId}</span>
                                        </div>
                                    </div>

                                    {item.isDraftBacklog ? (
                                        <div className="hd-draft-backlog-placeholder-notes">
                                            <FileSpreadsheet size={16} />
                                            <span>This consultation records are uncommitted. Draft the ledger details on the billing console layout to compute institutional totals.</span>
                                        </div>
                                    ) : (
                                        <div className="hd-cost-breakdown-summary">
                                            <div className="hd-cost-line">
                                                <span>Gross Accumulation:</span>
                                                <span>₹{item.grossTotal || 0}</span>
                                            </div>
                                            <div className="hd-cost-line hd-text-green">
                                                <span>Pre-Settled Counters (-):</span>
                                                <span>₹{item.deductionsPrePaid || 0}</span>
                                            </div>
                                            {(item.insuranceCoverageAmount || 0) > 0 && (
                                                <div className="hd-cost-line hd-text-orange">
                                                    <span>Insurance Coverage Amount (-):</span>
                                                    <span>₹{item.insuranceCoverageAmount}</span>
                                                </div>
                                            )}
                                            <div className="hd-payable-total-row">
                                                <span>Net Desk Payable:</span>
                                                <span>₹{item.netPayableAmount || 0}</span>
                                            </div>
                                        </div>
                                    )}

                                    {item.extraChargesNotes && (
                                        <div className="hd-card-notes-block">
                                            <strong>Adjustment Directive:</strong> {item.extraChargesNotes}
                                        </div>
                                    )}

                                    {isExpanded && !item.isDraftBacklog && (
                                        <div className="hd-dropdown-expandable-panel pr-slide-fade">
                                            <div className="hd-dropdown-section-title">Itemized Service Allocation Ledger</div>
                                            <div className="hd-table-wrapper">
                                                <table className="hd-expanded-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Billing Nomenclature</th>
                                                            <th>Category</th>
                                                            <th>Rate</th>
                                                            <th>Qty</th>
                                                            <th>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(item.billingItems || []).length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} style={{ textAlign: "center", padding: "0.75rem", opacity: 0.7 }}>
                                                                    No itemized entries recorded.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            (item.billingItems || []).map((bItem, bIdx) => (
                                                                <tr key={bIdx} className={bItem.prePaid ? "hd-row-prepaid-highlight" : ""}>
                                                                    <td className="hd-td-name">{bItem.name}</td>
                                                                    <td>
                                                                        <span className={`hd-table-cat-tag cat-${String(bItem.category || "Consultation").toLowerCase()}`}>
                                                                            {bItem.category}
                                                                        </span>
                                                                    </td>
                                                                    <td>₹{bItem.unitPrice}</td>
                                                                    <td>{bItem.quantity}</td>
                                                                    <td className="hd-td-total">₹{bItem.totalPrice}</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="hd-insurance-profile-footer">
                                                <div>
                                                    <strong>Insurance Provider:</strong> {item.insurance?.provider || "N/A"}
                                                </div>
                                                <div>
                                                    <strong>Policy Identifier Code:</strong> {item.insurance?.policyNumber || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="hd-card-actions-row">
                                        {activeTab === "unpaid" &&
                                            (item.isDraftBacklog ? (
                                                <div className="hd-unbilled-action-notice-bar">
                                                    <span className="hd-badge-info">Unbilled File</span>
                                                    <button
                                                        type="button"
                                                        className="hd-action-btn btn-collect wide-btn"
                                                        onClick={() => {
                                                            setMessage({
                                                                type: "success",
                                                                text: `Administrative alert dispatched for Appointment ID: ${item.appointmentId}.`
                                                            });
                                                        }}
                                                    >
                                                        Request Administrative Clearance
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="hd-action-btn btn-pdf"
                                                        onClick={() => generateInvoicePDF(item)}
                                                    >
                                                        <Download size={13} />
                                                        <span>Download Statement</span>
                                                    </button>
                                                    <div className="hd-method-select-block">
                                                        <select
                                                            value={paymentMethodMap[item._id] || "Cash"}
                                                            onChange={(e) => setPaymentMethodMap((prev) => ({ ...prev, [item._id]: e.target.value }))}
                                                        >
                                                            <option value="Cash">Cash</option>
                                                            <option value="Card">Terminal Card</option>
                                                            <option value="UPI">Instant UPI</option>
                                                            <option value="Mixed">Mixed Modes</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="hd-action-btn btn-collect"
                                                        onClick={() => handleUpdateStatus(item._id, "Paid")}
                                                        disabled={actionId === item._id}
                                                    >
                                                        {actionId === item._id ? <Loader2 className="hd-spin" size={13} /> : <CreditCard size={13} />}
                                                        <span>Collect</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="hd-action-btn btn-cancel"
                                                        onClick={() => handleUpdateStatus(item._id, "Cancelled")}
                                                        disabled={actionId === item._id}
                                                    >
                                                        <Ban size={13} />
                                                    </button>
                                                </>
                                            ))}

                                        {activeTab === "insurancePending" && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="hd-action-btn btn-pdf"
                                                    onClick={() => generateInvoicePDF(item)}
                                                >
                                                    <Download size={13} />
                                                    <span>Download Statement</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="hd-action-btn btn-collect wide-btn"
                                                    onClick={() => handleUpdateStatus(item._id, "Paid")}
                                                    disabled={actionId === item._id}
                                                >
                                                    {actionId === item._id ? <Loader2 className="hd-spin" size={13} /> : <CheckCircle size={13} />}
                                                    <span>Clear Corporate Remittance</span>
                                                </button>
                                            </>
                                        )}

                                        {(activeTab === "paid" || activeTab === "cancelled") && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="hd-action-btn btn-pdf"
                                                    onClick={() => generateInvoicePDF(item)}
                                                >
                                                    <Download size={13} />
                                                    <span>Download Statement</span>
                                                </button>
                                                <div className="hd-locked-meta-tag">
                                                    <FileText size={13} />
                                                    <span>Settlement Mode: {item.paymentMethod || "N/A"}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}