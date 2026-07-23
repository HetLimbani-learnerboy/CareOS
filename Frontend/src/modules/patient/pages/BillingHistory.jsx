import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Search, RefreshCw, AlertCircle, CheckCircle, CreditCard, Shield, User,
  Receipt, ClipboardList, X, Loader2, FileText, Ban, ChevronDown, ChevronUp,
  Download, QrCode, Building
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CareOSLOGO from "../../../assets/CareOS-logo.png";
import "../style/BillingHistoryDashboard.css";

export default function BillingHistory() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  const [checkoutModalInvoice, setCheckoutModalInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "UPI",
    transactionId: "",
    cardOrPayerName: "",
    paymentTimestamp: new Date().toISOString().slice(0, 16)
  });

  const getPatientEmail = () => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser)?.email?.trim().toLowerCase() : "";
    } catch {
      return "";
    }
  };

  const getPatientName = () => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      const u = storedUser ? JSON.parse(storedUser) : null;
      return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.name || "Patient";
    } catch {
      return "Patient";
    }
  };

  const fetchPatientBillingHistory = useCallback(async () => {
    const patientEmail = getPatientEmail();
    if (!patientEmail) {
      setMessage({ type: "error", text: "Patient profile context missing. Please log in again." });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/patients/billing-history`, {
        headers: { "x-user-email": patientEmail }
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
      setMessage({ type: "error", text: "Failed to load your personal billing records." });
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchPatientBillingHistory();
  }, [fetchPatientBillingHistory]);

  const toggleInvoiceDropdown = (item) => {
    setExpandedInvoiceIds((prev) => ({ ...prev, [item._id]: !prev[item._id] }));
  };

  const filteredInvoices = useMemo(() => {
    const list = history[activeTab] || [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return list;
    return list.filter(
      (item) =>
        String(item.invoiceNumber || "").toLowerCase().includes(term) ||
        String(item.appointmentId || "").toLowerCase().includes(term) ||
        String(item.doctorName || "").toLowerCase().includes(term)
    );
  }, [history, activeTab, searchTerm]);

  const handleOpenCheckoutModal = (invoice) => {
    setCheckoutModalInvoice(invoice);
    setPaymentForm({
      paymentMethod: "UPI",
      transactionId: `TXN-${Date.now().toString().slice(-8)}`,
      cardOrPayerName: getPatientName(),
      paymentTimestamp: new Date().toISOString().slice(0, 16)
    });
  };

  const handleProcessOnlinePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!checkoutModalInvoice) return;

    if (!paymentForm.transactionId.trim() || !paymentForm.cardOrPayerName.trim()) {
      setMessage({ type: "error", text: "Please provide a valid transaction ID and account holder name." });
      return;
    }

    try {
      setActionId(checkoutModalInvoice._id);
      setMessage({ type: "", text: "" });

      const res = await axios.post(
        `${API_BASE_URL}/api/v1/patients/invoice/${checkoutModalInvoice._id}/pay`,
        {
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId.trim(),
          cardOrPayerName: paymentForm.cardOrPayerName.trim(),
          paymentTimestamp: new Date(paymentForm.paymentTimestamp).toISOString()
        },
        { headers: { "x-user-email": getPatientEmail() } }
      );

      if (res.data?.status === "success") {
        setMessage({ type: "success", text: "Payment verified successfully! Bill status updated to Settled." });
        setCheckoutModalInvoice(null);
        fetchPatientBillingHistory();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to process digital payment." });
    } finally {
      setActionId(null);
    }
  };

  const generateInvoicePDF = (item) => {
    try {
      const doc = new jsPDF("p", "pt", "a4");
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 36;

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, 25, pageWidth - margin * 2, 6, "F");

      if (CareOSLOGO) {
        doc.addImage(CareOSLOGO, "PNG", margin, 38, 20, 20);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CareOS Medical Group", margin + 26, 52);

      doc.setFillColor(15, 23, 42);
      doc.setFont("Courier", "normal");
      doc.setFontSize(8);
      doc.text("PATIENT STATEMENT", pageWidth - 190, 48);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Statement Date: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}`, pageWidth - 190, 64);
      doc.text(`Patient ID: ${item.patientId ? String(item.patientId).substring(0, 10).toUpperCase() : "N/A"}`, pageWidth - 190, 78);
      doc.text(`Invoice No: ${item.invoiceNumber || "N/A"}`, pageWidth - 190, 92);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, 125, pageWidth - margin, 125);

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, 138, 85, 16, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("STATEMENT", margin + 12, 149);

      autoTable(doc, {
        startY: 165,
        margin: { left: margin, right: margin },
        head: [["PATIENT NAME", "PATIENT EMAIL", "CONSULTING DOCTOR"]],
        body: [[
          item.patientName && item.patientName !== "Unknown" ? item.patientName.toUpperCase() : getPatientName().toUpperCase(),
          item.patientEmail || getPatientEmail(),
          item.doctorName ? `DR. ${item.doctorName.toUpperCase()}` : "N/A"
        ]],
        theme: "plain",
        headStyles: { fillColor: false, textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8.5, halign: "left" },
        bodyStyles: { textColor: [71, 85, 105], fontSize: 8.5, cellPadding: { top: 6, bottom: 6 } },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 1
      });

      const rawBillingItems = item.billingItems || [];
      const tableRows = rawBillingItems.map((bItem) => [
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
        headStyles: { fillColor: false, textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8.5, lineWidth: 1, lineColor: [15, 23, 42] },
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 80 },
          2: { cellWidth: 180 },
          3: { halign: "right", cellWidth: 70 },
          4: { halign: "center", cellWidth: 35 },
          5: { halign: "right", cellWidth: 80 }
        },
        bodyStyles: { textColor: [71, 85, 105], fontSize: 8, cellPadding: { top: 7, bottom: 7 } },
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
      doc.text("Total Net Amount", summaryBoxX, finalTableY + 32);

      doc.setFontSize(11);
      doc.text(`INR ${(item.netPayableAmount || 0).toFixed(2)}`, pageWidth - margin, finalTableY + 32, { align: "right" });

      const footerY = pageHeight - 80;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, footerY, pageWidth - margin * 2, 42, "F");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Thank you for choosing CareOS Healthcare. Official Digital Receipt.", margin + 12, footerY + 20);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("PAYMENT STATUS:", margin, pageHeight - 25);

      const isPaid = String(item.paymentStatus).toLowerCase() === "paid";
      if (isPaid) {
        doc.setTextColor(34, 197, 94);
        doc.text("SETTLED & PAID", margin + 110, pageHeight - 25);
      } else {
        doc.setTextColor(245, 158, 11);
        doc.text("PAYMENT PENDING", margin + 110, pageHeight - 25);
      }

      doc.save(`CareOS_Patient_Receipt_${item.invoiceNumber || "INV"}.pdf`);
      setMessage({ type: "success", text: "Receipt PDF downloaded successfully." });
    } catch {
      setMessage({ type: "error", text: "An error occurred during receipt PDF generation." });
    }
  };

  return (
    <div className="hd-dashboard-root pr-fade-in">
      <div className="hd-dashboard-header">
        <div>
          <h1>My Billing & Accounts</h1>
          <p>Review your medical invoices, track claim statuses, and process online payments securely.</p>
        </div>
        <button className="hd-sync-btn" onClick={fetchPatientBillingHistory} disabled={loading}>
          <RefreshCw className={loading ? "hd-spin" : ""} size={16} /> Sync My Records
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
          <Receipt size={16} /> Pending Payment ({history.unpaid.length})
        </button>
        <button
          className={`hd-tab-link ${activeTab === "insurancePending" ? "hd-tab-active" : ""}`}
          onClick={() => {
            setActiveTab("insurancePending");
            setSearchTerm("");
          }}
        >
          <Shield size={16} /> Insurance Claims ({history.insurancePending.length})
        </button>
        <button
          className={`hd-tab-link ${activeTab === "paid" ? "hd-tab-active" : ""}`}
          onClick={() => {
            setActiveTab("paid");
            setSearchTerm("");
          }}
        >
          <CheckCircle size={16} /> Paid Invoices ({history.paid.length})
        </button>
        <button
          className={`hd-tab-link ${activeTab === "cancelled" ? "hd-tab-active" : ""}`}
          onClick={() => {
            setActiveTab("cancelled");
            setSearchTerm("");
          }}
        >
          <Ban size={16} /> Cancelled ({history.cancelled.length})
        </button>
      </div>

      <div className="hd-search-filter-wrapper">
        <Search size={15} />
        <input
          type="text"
          placeholder="Filter by invoice number, doctor name, or appointment ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="hd-grid-viewport">
        {loading ? (
          <div className="hd-skeleton-stack">
            <div className="hd-skeleton-card-node" />
            <div className="hd-skeleton-card-node" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="hd-empty-state-card">
            <ClipboardList size={40} />
            <h3>No Invoices Found</h3>
            <p>You have no billing records matching this category.</p>
          </div>
        ) : (
          <div className="hd-cards-flex-grid">
            {filteredInvoices.map((item) => {
              const isExpanded = !!expandedInvoiceIds[item._id];
              return (
                <div key={item._id} className={`hd-invoice-card-node status-border-${activeTab} ${isExpanded ? "hd-card-expanded" : ""}`}>
                  <div className="hd-card-head" onClick={() => toggleInvoiceDropdown(item)} style={{ cursor: "pointer" }}>
                    <div className="hd-title-block">
                      <span className="hd-invoice-num">{item.invoiceNumber || "INVOICE RECORD"}</span>
                      <span className="hd-date-stamp">Date: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="hd-badge-flex">
                      <span className={`hd-status-badge status-tag-${activeTab}`}>
                        {String(item.paymentStatus || "Unpaid").replace(/_/g, " ")}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="hd-drop-icon" /> : <ChevronDown size={16} className="hd-drop-icon" />}
                    </div>
                  </div>

                  <div className="hd-patient-details-row">
                    <User size={15} />
                    <div>
                      <h4>Doctor: {item.doctorName || "Consulting Practitioner"}</h4>
                      <span>Appointment ID: {item.appointmentId}</span>
                    </div>
                  </div>

                  <div className="hd-cost-breakdown-summary">
                    <div className="hd-cost-line">
                      <span>Gross Consultation Charge:</span>
                      <span>₹{item.grossTotal || 0}</span>
                    </div>
                    <div className="hd-cost-line hd-text-green">
                      <span>Pre-Settled Deductions (-):</span>
                      <span>₹{item.deductionsPrePaid || 0}</span>
                    </div>
                    {(item.insuranceCoverageAmount || 0) > 0 && (
                      <div className="hd-cost-line hd-text-orange">
                        <span>Insurance Approved Amount (-):</span>
                        <span>₹{item.insuranceCoverageAmount}</span>
                      </div>
                    )}
                    <div className="hd-payable-total-row">
                      <span>Net Outstanding Payable:</span>
                      <span>₹{item.netPayableAmount || 0}</span>
                    </div>
                  </div>

                  {item.extraChargesNotes && (
                    <div className="hd-card-notes-block">
                      <strong>Note:</strong> {item.extraChargesNotes}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="hd-dropdown-expandable-panel pr-slide-fade">
                      <div className="hd-dropdown-section-title">Itemized Billing Breakdown</div>
                      <div className="hd-table-wrapper">
                        <table className="hd-expanded-table">
                          <thead>
                            <tr>
                              <th>Description</th>
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
                                  No itemized entries found.
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
                          <strong>Insurance Network:</strong> {item.insurance?.provider || "None"}
                        </div>
                        <div>
                          <strong>Policy No:</strong> {item.insurance?.policyNumber || "N/A"}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="hd-card-actions-row">
                    <button type="button" className="hd-action-btn btn-pdf" onClick={() => generateInvoicePDF(item)}>
                      <Download size={13} />
                      <span>Download Receipt</span>
                    </button>

                    {activeTab === "unpaid" && (
                      <button
                        type="button"
                        className="hd-action-btn btn-collect wide-btn"
                        onClick={() => handleOpenCheckoutModal(item)}
                      >
                        <CreditCard size={13} />
                        <span>Pay Online Now (₹{item.netPayableAmount})</span>
                      </button>
                    )}

                    {(activeTab === "paid" || activeTab === "cancelled" || activeTab === "insurancePending") && (
                      <div className="hd-locked-meta-tag">
                        <FileText size={13} />
                        <span>Payment Mode: {item.paymentMethod || "Digital"}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Online Digital Checkout Modal */}
      {checkoutModalInvoice && (
        <div className="hd-modal-overlay">
          <div className="hd-modal-card pr-slide-fade">
            <div className="hd-modal-head">
              <h3>Secure Digital Checkout</h3>
              <button type="button" onClick={() => setCheckoutModalInvoice(null)} className="hd-modal-close">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleProcessOnlinePaymentSubmit} className="hd-modal-form">
              <div className="hd-modal-summary">
                <span>Invoice: <strong>{checkoutModalInvoice.invoiceNumber}</strong></span>
                <span className="hd-modal-amount">Amount Due: <strong>₹{checkoutModalInvoice.netPayableAmount}</strong></span>
              </div>

              <div className="hd-form-group">
                <label>Select Payment Method</label>
                <div className="hd-method-pills">
                  <button
                    type="button"
                    className={`hd-pill ${paymentForm.paymentMethod === "UPI" ? "pill-active" : ""}`}
                    onClick={() => setPaymentForm((p) => ({ ...p, paymentMethod: "UPI" }))}
                  >
                    <QrCode size={14} /> Instant UPI
                  </button>
                  <button
                    type="button"
                    className={`hd-pill ${paymentForm.paymentMethod === "Card" ? "pill-active" : ""}`}
                    onClick={() => setPaymentForm((p) => ({ ...p, paymentMethod: "Card" }))}
                  >
                    <CreditCard size={14} /> Debit / Credit Card
                  </button>
                  <button
                    type="button"
                    className={`hd-pill ${paymentForm.paymentMethod === "Net_Banking" ? "pill-active" : ""}`}
                    onClick={() => setPaymentForm((p) => ({ ...p, paymentMethod: "Net_Banking" }))}
                  >
                    <Building size={14} /> Net Banking
                  </button>
                </div>
              </div>

              <div className="hd-form-group">
                <label>Transaction / UTR Reference ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN987654321"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                />
              </div>

              <div className="hd-form-group">
                <label>Account Holder / Payer Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name on Account or Card"
                  value={paymentForm.cardOrPayerName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardOrPayerName: e.target.value })}
                />
              </div>

              <div className="hd-form-group">
                <label>Payment Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={paymentForm.paymentTimestamp}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentTimestamp: e.target.value })}
                />
              </div>

              <div className="hd-modal-actions">
                <button type="button" className="hd-action-btn btn-cancel" onClick={() => setCheckoutModalInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="hd-action-btn btn-collect wide-btn" disabled={actionId === checkoutModalInvoice._id}>
                  {actionId === checkoutModalInvoice._id ? <Loader2 className="hd-spin" size={14} /> : <CheckCircle size={14} />}
                  <span>Confirm & Authorize Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}