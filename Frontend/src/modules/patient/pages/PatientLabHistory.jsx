import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    FlaskConical,
    Calendar,
    Activity,
    AlertCircle,
    Loader2,
    FileText,
    CheckCircle2,
    Download,
    RefreshCw,
    Search
} from "lucide-react";
import "../style/PatientLabHistory.css";

const pipelineStates = ["initialized", "confirmed", "collected", "pending", "completed"];

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

export default function PatientLabHistory() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const [labRecords, setLabRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const getPatientEmail = () => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase() || "";
        } catch {
            return "";
        }
    };

    const fetchPatientData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await axios.get(`${API_BASE_URL}/api/v1/patients/my-reports`, {
                headers: {
                    "x-user-email": getPatientEmail(),
                    "Content-Type": "application/json"
                }
            });

            if (res.data?.status === "success") {
                setLabRecords(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to sync your laboratory records.");
            setLabRecords([]);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchPatientData();
    }, [fetchPatientData]);

    const filteredRecords = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return labRecords;

        return labRecords.filter((record) => {
            const tests = Array.isArray(record.requestedTests) ? record.requestedTests.join(" ") : "";

            return (
                String(record.historyId || "").toLowerCase().includes(term) ||
                String(record.currentStatus || record.status || "").toLowerCase().includes(term) ||
                String(record.reportData?.findings || "").toLowerCase().includes(term) ||
                String(record.reportData?.notes || "").toLowerCase().includes(term) ||
                tests.toLowerCase().includes(term)
            );
        });
    }, [labRecords, searchTerm]);

    const getStepWeight = (status) => {
        const index = pipelineStates.indexOf(status);
        return index >= 0 ? index : 0;
    };

    const formatTimestamp = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const getBillingAmount = (record) => {
        return (
            record.billingAmount ||
            record.reportData?.billingAmount ||
            record.billAmount ||
            record.amount ||
            0
        );
    };

    const buildBillHtml = (record) => {
        const status = record.currentStatus || record.status || "initialized";
        const tests = Array.isArray(record.requestedTests) ? record.requestedTests : [];
        const refCode = record.historyId ? String(record.historyId).slice(-8).toUpperCase() : "N/A";
        const amount = getBillingAmount(record);
        const generatedAt = new Date().toLocaleString("en-IN");
        const patientEmail = getPatientEmail() || "N/A";

        return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Lab Bill ${escapeHtml(refCode)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
            .invoice { border: 1px solid #e2e8f0; border-radius: 18px; padding: 28px; }
            .top { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; }
            h1 { margin: 0; font-size: 26px; color: #0369a1; }
            .muted { color: #64748b; font-size: 12px; }
            .status { display: inline-block; padding: 7px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: ${status === "completed" ? "#dcfce7" : "#e0f2fe"}; color: ${status === "completed" ? "#15803d" : "#0369a1"}; }
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
                <h1>Patient Laboratory Bill</h1>
                <p class="muted">Case Ref: ${escapeHtml(refCode)}</p>
                <p class="muted">Generated: ${escapeHtml(generatedAt)}</p>
              </div>
              <div>
                <span class="status">${escapeHtml(status)}</span>
              </div>
            </div>

            <div class="grid">
              <div class="box">
                <div class="label">Patient Email</div>
                <div class="value">${escapeHtml(patientEmail)}</div>
              </div>
              <div class="box">
                <div class="label">Created Date</div>
                <div class="value">${escapeHtml(record.createdAt ? new Date(record.createdAt).toLocaleDateString("en-IN") : "N/A")}</div>
              </div>
              <div class="box wide">
                <div class="label">Requested Test Panels</div>
                <div class="value">
                  ${tests.length ? tests.map((test) => `<span class="pill">${escapeHtml(test)}</span>`).join("") : "No test panels listed"}
                </div>
              </div>
              <div class="box wide">
                <div class="label">Lab Findings</div>
                <div class="value">${escapeHtml(record.reportData?.findings || "N/A")}</div>
              </div>
              <div class="box wide">
                <div class="label">Technician Notes</div>
                <div class="value">${escapeHtml(record.reportData?.notes || "N/A")}</div>
              </div>
            </div>

            <div class="total">
              <div>
                <div class="label" style="color:#cbd5e1;">Total Laboratory Charge</div>
                <div>${status === "completed" ? "Completed diagnostic report bill" : "Diagnostic pipeline bill"}</div>
              </div>
              <div class="amount">${escapeHtml(formatCurrency(amount))}</div>
            </div>

            <div class="footer">This is a system-generated laboratory bill document.</div>
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

    const handleDownloadBillPdf = (record) => {
        const billWindow = window.open("", "_blank", "width=900,height=1100");

        if (!billWindow) {
            setError("Please allow popups to download the bill PDF.");
            return;
        }

        billWindow.document.open();
        billWindow.document.write(buildBillHtml(record));
        billWindow.document.close();
    };

    const SkeletonList = () => (
        <div className="pat-records-stack">
            {[1, 2, 3].map((item) => (
                <div className="pat-skeleton-card" key={item}>
                    <div className="pat-skeleton-top">
                        <div>
                            <div className="pat-skeleton-line pat-skeleton-label" />
                            <div className="pat-skeleton-line pat-skeleton-title" />
                        </div>
                        <div className="pat-skeleton-pill" />
                    </div>
                    <div className="pat-skeleton-pills">
                        <div className="pat-skeleton-chip" />
                        <div className="pat-skeleton-chip" />
                        <div className="pat-skeleton-chip" />
                    </div>
                    <div className="pat-skeleton-stepper" />
                    <div className="pat-skeleton-results">
                        <div className="pat-skeleton-line pat-skeleton-wide" />
                        <div className="pat-skeleton-line pat-skeleton-wide" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="pat-lab-container">
            <div className="pat-lab-header">
                <div>
                    <h2 className="pat-lab-title">
                        <FlaskConical size={22} />
                        My Diagnostic Lab Records
                    </h2>
                    <p className="pat-lab-subtitle">
                        Monitor sample progress, read authorized findings, and download lab bills.
                    </p>
                </div>

                <button type="button" className="pat-refresh-btn" onClick={fetchPatientData} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "pat-spinner" : ""} />
                    Sync
                </button>
            </div>

            <div className="pat-toolbar-row">
                <div className="pat-search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search test, case reference, findings, or status"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <span className="pat-count-chip">
                    {filteredRecords.length} Record{filteredRecords.length === 1 ? "" : "s"}
                </span>
            </div>

            {error && (
                <div className="pat-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <SkeletonList />
            ) : filteredRecords.length === 0 ? (
                <div className="pat-empty-view">
                    <Activity size={38} />
                    <h3>No Lab Records</h3>
                    <p>No diagnostics prescription references or history records matched this view.</p>
                </div>
            ) : (
                <div className="pat-records-stack">
                    {filteredRecords.map((record) => {
                        const status = record.currentStatus || record.status || "initialized";
                        const currentWeight = getStepWeight(status);
                        const amount = getBillingAmount(record);

                        return (
                            <div key={record.historyId} className="pat-record-card animate-card-pop">
                                <div className="pat-card-top">
                                    <div>
                                        <span className="pat-ref-lbl">Diagnostic Case Reference</span>
                                        <h3 className="pat-ref-id">#{String(record.historyId || "").slice(-8).toUpperCase()}</h3>
                                    </div>

                                    <div className="pat-card-actions">
                                        <button
                                            type="button"
                                            className="pat-download-bill-btn"
                                            onClick={() => handleDownloadBillPdf(record)}
                                        >
                                            <Download size={14} />
                                            <span>Bill PDF</span>
                                        </button>

                                        <div className="pat-date-row">
                                            <Calendar size={14} />
                                            <span>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pat-panels-box">
                                    <span className="pat-label-sub">Requested Test Panels</span>
                                    <div className="pat-pills-flex">
                                        {(record.requestedTests || []).length > 0 ? (
                                            record.requestedTests.map((test, index) => (
                                                <span key={`${test}-${index}`} className="pat-test-pill">
                                                    {test}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="pat-test-pill pat-muted-pill">No panels listed</span>
                                        )}
                                    </div>
                                </div>

                                <div className="pat-stepper-wrapper">
                                    <span className="pat-label-sub">Processing Pipeline Tracker</span>
                                    <div className="pat-stepper-line-row">
                                        {pipelineStates.map((step, idx) => {
                                            const isDone = idx <= currentWeight;
                                            const isCurrent = idx === currentWeight;
                                            const tsKey = `${step}At`;
                                            const timeStr = formatTimestamp(record.statusTimestamps?.[tsKey]);

                                            return (
                                                <div key={step} className={`pat-step-node ${isDone ? "step-active" : ""} ${isCurrent ? "step-pulse" : ""}`}>
                                                    <div className="pat-circle-checkpoint">
                                                        {isDone && step === "completed" ? <CheckCircle2 size={12} /> : <span>{idx + 1}</span>}
                                                    </div>
                                                    <span className="pat-step-name-lbl">{step}</span>
                                                    {timeStr && <span className="pat-step-time-lbl">{timeStr}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {status === "completed" && record.reportData && (
                                    <div className="pat-results-block animate-slide-panel">
                                        <div className="pat-results-head">
                                            <FileText size={15} />
                                            <span>Authorized Lab Findings Summary</span>
                                        </div>

                                        <div className="pat-results-grid">
                                            <div className="pat-result-cell">
                                                <span className="pat-cell-lbl">Lab Metric Readings</span>
                                                <p className="pat-cell-val pat-font-semibold">{record.reportData.findings || "N/A"}</p>
                                            </div>

                                            <div className="pat-result-cell">
                                                <span className="pat-cell-lbl">Practitioner Advisory Remarks</span>
                                                <p className="pat-cell-val">{record.reportData.notes || "N/A"}</p>
                                            </div>

                                            <div className="pat-result-cell pat-bill-cell">
                                                <span className="pat-cell-lbl">Billing Amount</span>
                                                <p className="pat-cell-val pat-bill-amount">{formatCurrency(amount)}</p>
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