import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Receipt,
    CreditCard,
    CheckCircle,
    FileText,
    Loader2,
    AlertCircle,
    Wallet,
    Download,
    Search,
    RefreshCw
} from "lucide-react";
import "../style/LabBillingHistory.css";

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

export default function LabBillingHistory() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [ledger, setLedger] = useState({ pendingBilling: [], completedBilling: [] });
    const [loading, setLoading] = useState(true);
    const [collectingId, setCollectingId] = useState(null);
    const [error, setError] = useState("");
    const [activeSubTab, setActiveSubTab] = useState("pending");
    const [searchTerm, setSearchTerm] = useState("");

    const getLabUserEmail = () => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase();
        } catch {
            return;
        }
    };

    const fetchBillingData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await axios.get(`${API_BASE_URL}/api/v1/lab-technician/billing-history`, {
                headers: {
                    "x-user-email": getLabUserEmail(),
                    "Content-Type": "application/json"
                }
            });

            if (res.data?.status === "success") {
                setLedger({
                    pendingBilling: Array.isArray(res.data.data?.pendingBilling) ? res.data.data.pendingBilling : [],
                    completedBilling: Array.isArray(res.data.data?.completedBilling) ? res.data.data.completedBilling : []
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load financial records ledger.");
            setLedger({ pendingBilling: [], completedBilling: [] });
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchBillingData();
    }, [fetchBillingData]);

    const handleSettlePayment = async (historyId) => {
        try {
            setCollectingId(historyId);
            setError("");

            const res = await axios.patch(
                `${API_BASE_URL}/api/v1/lab-technician/billing/${historyId}/collect`,
                {},
                {
                    headers: {
                        "x-user-email": getLabUserEmail()
                    }
                }
            );

            if (res.data?.status === "success") {
                await fetchBillingData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Payment collection mapping failed.");
        } finally {
            setCollectingId(null);
        }
    };

    const aggregates = useMemo(() => {
        const pendingTotal = ledger.pendingBilling.reduce((sum, item) => sum + Number(item.billingAmount || 0), 0);
        const completedTotal = ledger.completedBilling.reduce((sum, item) => sum + Number(item.billingAmount || 0), 0);

        return { pendingTotal, completedTotal };
    }, [ledger]);

    const activeList = useMemo(() => {
        const list = ledger[`${activeSubTab}Billing`] || [];
        const term = searchTerm.trim().toLowerCase();

        if (!term) return list;

        return list.filter((item) => {
            const tests = Array.isArray(item.requestedTests) ? item.requestedTests.join(" ") : "";

            return (
                String(item.patientName || "").toLowerCase().includes(term) ||
                String(item.patientId || "").toLowerCase().includes(term) ||
                String(item.reportData?.findings || "").toLowerCase().includes(term) ||
                String(item.reportData?.notes || "").toLowerCase().includes(term) ||
                tests.toLowerCase().includes(term)
            );
        });
    }, [ledger, activeSubTab, searchTerm]);

    const buildInvoiceHtml = (item) => {
        const tests = Array.isArray(item.requestedTests) ? item.requestedTests : [];
        const refCode = item.patientId ? String(item.patientId).slice(-6).toUpperCase() : "N/A";
        const invoiceCode = item.historyId ? String(item.historyId).slice(-8).toUpperCase() : refCode;
        const generatedAt = new Date().toLocaleString("en-IN");

        return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Lab Bill ${invoiceCode}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
            .invoice { border: 1px solid #e2e8f0; border-radius: 18px; padding: 28px; }
            .top { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; }
            h1 { margin: 0; font-size: 26px; color: #0369a1; }
            .muted { color: #64748b; font-size: 12px; }
            .status { display: inline-block; padding: 7px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: ${item.isBilled ? "#dcfce7" : "#ffedd5"}; color: ${item.isBilled ? "#15803d" : "#c2410c"}; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
            .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f8fafc; }
            .label { color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
            .value { font-size: 14px; line-height: 1.5; }
            .wide { grid-column: 1 / -1; }
            .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #e0f2fe; color: #0369a1; margin: 3px; font-size: 12px; font-weight: 700; }
            .total { margin-top: 24px; padding: 18px; border-radius: 14px; background: #0f172a; color: #ffffff; display: flex; justify-content: space-between; align-items: center; }
            .amount { font-size: 28px; font-weight: 800; }
            .footer { margin-top: 22px; color: #64748b; font-size: 11px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="top">
              <div>
                <h1>Laboratory Billing Receipt</h1>
                <p class="muted">Invoice Ref: ${escapeHtml(invoiceCode)}</p>
                <p class="muted">Generated: ${escapeHtml(generatedAt)}</p>
              </div>
              <div>
                <span class="status">${item.isBilled ? "Settled" : "Unpaid"}</span>
              </div>
            </div>

            <div class="grid">
              <div class="box">
                <div class="label">Patient Name</div>
                <div class="value">${escapeHtml(item.patientName || "Patient")}</div>
              </div>
              <div class="box">
                <div class="label">Patient ID</div>
                <div class="value">${escapeHtml(refCode)}</div>
              </div>
              <div class="box wide">
                <div class="label">Required Test Panels</div>
                <div class="value">
                  ${tests.length ? tests.map((test) => `<span class="pill">${escapeHtml(test)}</span>`).join("") : "No test panels listed"}
                </div>
              </div>
              <div class="box wide">
                <div class="label">Diagnostic Findings</div>
                <div class="value">${escapeHtml(item.reportData?.findings || "N/A")}</div>
              </div>
              <div class="box wide">
                <div class="label">Technician Notes</div>
                <div class="value">${escapeHtml(item.reportData?.notes || "N/A")}</div>
              </div>
            </div>

            <div class="total">
              <div>
                <div class="label" style="color:#cbd5e1;">Total Service Charge</div>
                <div>${item.isBilled ? "Payment collected and receipt locked" : "Payment pending collection"}</div>
              </div>
              <div class="amount">${escapeHtml(formatCurrency(item.billingAmount))}</div>
            </div>

            <div class="footer">This is a system-generated laboratory billing document.</div>
          </div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    };

    const handleDownloadBillPdf = (item) => {
        const invoiceWindow = window.open("", "_blank", "width=900,height=1100");

        if (!invoiceWindow) {
            setError("Please allow popups to download the bill PDF.");
            return;
        }

        invoiceWindow.document.open();
        invoiceWindow.document.write(buildInvoiceHtml(item));
        invoiceWindow.document.close();
    };

    const SkeletonGrid = () => (
        <div className="hist-invoice-grid">
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <div className="hist-skeleton-card" key={item}>
                    <div className="hist-skeleton-top">
                        <div>
                            <div className="hist-skeleton-line hist-skeleton-name" />
                            <div className="hist-skeleton-line hist-skeleton-id" />
                        </div>
                        <div className="hist-skeleton-pill" />
                    </div>
                    <div className="hist-skeleton-line hist-skeleton-label" />
                    <div className="hist-skeleton-pills">
                        <div className="hist-skeleton-test" />
                        <div className="hist-skeleton-test" />
                    </div>
                    <div className="hist-skeleton-line hist-skeleton-wide" />
                    <div className="hist-skeleton-line hist-skeleton-wide" />
                    <div className="hist-skeleton-footer">
                        <div className="hist-skeleton-line hist-skeleton-price" />
                        <div className="hist-skeleton-button" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="hist-billing-container">
            <div className="hist-stats-row">
                <div className="hist-stat-card card-orange animate-pop-in">
                    <div className="hist-stat-icon-wrapper bg-orange-dim text-orange-deep">
                        <Receipt size={22} />
                    </div>
                    <div>
                        <span className="hist-stat-label">Total Pending Amount</span>
                        <h3 className="hist-stat-value">{formatCurrency(aggregates.pendingTotal)}</h3>
                        <p className="hist-stat-sub">{ledger.pendingBilling.length} invoices awaiting settlement</p>
                    </div>
                </div>

                <div className="hist-stat-card card-green animate-pop-in delay-75">
                    <div className="hist-stat-icon-wrapper bg-green-dim text-green-deep">
                        <Wallet size={22} />
                    </div>
                    <div>
                        <span className="hist-stat-label">Total Settled Amount</span>
                        <h3 className="hist-stat-value">{formatCurrency(aggregates.completedTotal)}</h3>
                        <p className="hist-stat-sub">{ledger.completedBilling.length} invoices paid and locked</p>
                    </div>
                </div>
            </div>

            <div className="hist-toolbar-row">
                <div className="hist-search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search patient, test, findings, or notes"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button type="button" className="hist-refresh-btn" onClick={fetchBillingData} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "hist-loop-animation" : ""} />
                    Sync
                </button>
            </div>

            <div className="hist-tab-bar">
                <button
                    type="button"
                    onClick={() => setActiveSubTab("pending")}
                    className={`hist-tab-btn ${activeSubTab === "pending" ? "hist-btn-active" : ""}`}
                >
                    Pending Collections ({ledger.pendingBilling.length})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab("completed")}
                    className={`hist-tab-btn ${activeSubTab === "completed" ? "hist-btn-active" : ""}`}
                >
                    Settled Ledger History ({ledger.completedBilling.length})
                </button>
            </div>

            {error && (
                <div className="hist-error-box">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <SkeletonGrid />
            ) : activeList.length === 0 ? (
                <div className="hist-empty-state-view">
                    <FileText size={38} />
                    <h3>No Billing Records</h3>
                    <p>No transactions are registered under this billing segment.</p>
                </div>
            ) : (
                <div className="hist-invoice-grid">
                    {activeList.map((item) => {
                        const tests = Array.isArray(item.requestedTests) ? item.requestedTests : [];
                        const patientRef = item.patientId ? String(item.patientId).slice(-6).toUpperCase() : "N/A";
                        const isCollecting = collectingId === item.historyId;

                        return (
                            <div key={item.historyId} className="hist-invoice-card animate-slide-up-card">
                                <div className="hist-card-top-row">
                                    <div>
                                        <h4 className="hist-client-title">{item.patientName || "Patient"}</h4>
                                        <span className="hist-client-id-text">ID Reference: {patientRef}</span>
                                    </div>

                                    <span className={`hist-status-tag ${item.isBilled ? "tag-settled" : "tag-unpaid"}`}>
                                        {item.isBilled ? "Settled" : "Unpaid"}
                                    </span>
                                </div>

                                <div className="hist-card-mid-body">
                                    <div className="hist-body-item">
                                        <span className="hist-body-lbl">Required Test Panels</span>
                                        <div className="hist-test-pills-container">
                                            {tests.length > 0 ? (
                                                tests.map((test, index) => (
                                                    <span key={`${test}-${index}`} className="hist-pill-node">
                                                        {test}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="hist-pill-node hist-muted-pill">No panels listed</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hist-body-item">
                                        <span className="hist-body-lbl">Diagnostic Findings Metrics</span>
                                        <p className="hist-findings-preview-text">{item.reportData?.findings || "N/A"}</p>
                                    </div>

                                    <div className="hist-body-item">
                                        <span className="hist-body-lbl">Technician Notes</span>
                                        <p className="hist-findings-preview-text">{item.reportData?.notes || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="hist-card-base-footer">
                                    <div>
                                        <span className="hist-price-lbl">Allocated Charge</span>
                                        <span className="hist-price-val">{formatCurrency(item.billingAmount)}</span>
                                    </div>

                                    <div className="hist-footer-actions">
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadBillPdf(item)}
                                            className="hist-download-bill-btn"
                                        >
                                            <Download size={13} />
                                            <span>PDF</span>
                                        </button>

                                        {!item.isBilled ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSettlePayment(item.historyId)}
                                                disabled={isCollecting}
                                                className="hist-collect-action-btn"
                                            >
                                                {isCollecting ? (
                                                    <Loader2 size={13} className="hist-loop-animation" />
                                                ) : (
                                                    <CreditCard size={13} />
                                                )}
                                                <span>Collect</span>
                                            </button>
                                        ) : (
                                            <div className="hist-locked-badge-paid">
                                                <CheckCircle size={13} />
                                                <span>Locked</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}