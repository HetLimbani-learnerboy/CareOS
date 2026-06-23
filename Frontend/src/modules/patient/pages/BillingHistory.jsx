import React, { useState } from "react";
import { Receipt, CreditCard, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Download, Printer, DollarSign } from "lucide-react";
import "../style/BillingHistory.css";

export default function BillingHistory() {
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  const invoiceRecords = [
    {
      id: "INV-2026-0041",
      patient_id: "PAT-6192",
      date_issued: "2026-06-11",
      due_date: "2026-06-25",
      payment_status: "paid",
      payment_method: "Credit Card (Visa ···· 4242)",
      items: [
        { desc: "Outpatient Specialist Consultation (Cardiology)", qty: 1, rate: 120.00 },
        { desc: "Electrocardiogram (ECG/EKG) Diagnostic Scan", qty: 1, rate: 85.00 },
        { desc: "Complete Blood Count Lab Panel Reissue", qty: 1, rate: 45.00 }
      ],
      insurance_covered: 180.00,
      patient_paid: 70.00,
      total_amount: 250.00
    },
    {
      id: "INV-2026-0038",
      patient_id: "PAT-6192",
      date_issued: "2026-05-14",
      due_date: "2026-05-28",
      payment_status: "paid",
      payment_method: "Insurance Direct Settlement",
      items: [
        { desc: "General Practitioner Follow-up Visit", qty: 1, rate: 65.00 },
        { desc: "Pharmaceutical Allocation - Amoxicillin 500mg", qty: 1, rate: 18.50 }
      ],
      insurance_covered: 83.50,
      patient_paid: 0.00,
      total_amount: 83.50
    },
    {
      id: "INV-2026-0045",
      patient_id: "PAT-6192",
      date_issued: "2026-06-17",
      due_date: "2026-07-01",
      payment_status: "unpaid",
      payment_method: "Pending Selection",
      items: [
        { desc: "Diagnostic Testing Assessment - Lipid Panel", qty: 1, rate: 95.00 },
        { desc: "Clinical Collection Administration Surcharge", qty: 1, rate: 15.00 }
      ],
      insurance_covered: 0.00,
      patient_paid: 0.00,
      total_amount: 110.00
    }
  ];

  const toggleInvoiceDropdown = (invoiceId) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  return (
    <div className="billing-history-canvas">
      <div className="billing-header-block">
        <h2>Financial Ledger & Billing</h2>
        <p>Review hospital transactional records, insurance itemization coverages, and print off legal tax statements.</p>
      </div>

      <div className="billing-ledger-stack animate-fade-in">
        {invoiceRecords.map((inv) => {
          const isExpanded = expandedInvoice === inv.id;
          return (
            <div key={inv.id} className={`billing-card-item ${isExpanded ? "billing-expanded" : ""}`}>

              <div className="billing-summary-container" onClick={() => toggleInvoiceDropdown(inv.id)}>
                <div className="billing-title-identity-group">
                  <div className={`billing-icon-badge ${inv.payment_status === "paid" ? "rx-paid" : "rx-unpaid"}`}>
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h4>Invoice #{inv.id.split("-")[2]}</h4>
                    <span className="billing-id-tag-sub">Statement Key: {inv.id}</span>
                  </div>
                </div>

                <div className="billing-meta-summary-flex">
                  <div className="meta-capsule-cell"><DollarSign size={12} />{inv.total_amount.toFixed(2)}</div>
                  <span className={`billing-status-pill ${inv.payment_status === "paid" ? "status-green" : "status-red"}`}>
                    {inv.payment_status}
                  </span>
                </div>

                <button className="billing-accordion-arrow-trigger">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {isExpanded && (
                <div className="billing-expanded-content-view animate-slide-down">

                  <div className="billing-statement-meta-row">
                    <div><strong>Date Issued:</strong> {inv.date_issued}</div>
                    <div><strong>Due Date:</strong> {inv.due_date}</div>
                    <div><strong>Settlement Channel:</strong> {inv.payment_method}</div>
                  </div>

                  <div className="invoice-items-table-wrapper">
                    <table className="invoice-embedded-table">
                      <thead>
                        <tr>
                          <th>Service Description</th>
                          <th>Qty</th>
                          <th className="text-right">Rate</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.desc}</td>
                            <td>{item.qty}</td>
                            <td className="text-right">${item.rate.toFixed(2)}</td>
                            <td className="text-right">${(item.qty * item.rate).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="summary-calc-row row-border-top">
                          <td colSpan="2" className="no-border"></td>
                          <td className="summary-label">Gross Subtotal:</td>
                          <td className="summary-value">${inv.total_amount.toFixed(2)}</td>
                        </tr>
                        <tr className="summary-calc-row">
                          <td colSpan="2" className="no-border"></td>
                          <td className="summary-label">Insurance Coverage:</td>
                          <td className="summary-value text-green">-${inv.insurance_covered.toFixed(2)}</td>
                        </tr>
                        <tr className="summary-calc-row row-final-total">
                          <td colSpan="2" className="no-border"></td>
                          <td className="summary-label">Patient Liability:</td>
                          <td className="summary-value">${(inv.total_amount - inv.insurance_covered).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="billing-action-row-footer">
                    <button className="billing-secondary-btn" onClick={(e) => { e.stopPropagation(); window.print(); }}>
                      <Printer size={14} /> Print Receipt
                    </button>
                    <button className="billing-primary-btn" onClick={(e) => { e.stopPropagation(); alert("Downloading official financial transaction receipt..."); }}>
                      <Download size={14} /> Download Invoice
                    </button>
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}