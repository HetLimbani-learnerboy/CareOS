import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    FlaskConical,
    User,
    Calendar,
    Clock,
    ChevronDown,
    ChevronUp,
    FileText,
    Activity,
    AlertCircle,
    Loader2,
    Pill,
    Stethoscope,
    Download,
    Search,
    RefreshCw
} from "lucide-react";
import "../style/DoctorLabReviews.css";

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function DoctorLabReviews() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const getDoctorEmail = () => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase() || "";
        } catch {
            return "";
        }
    };

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await axios.get(`${API_BASE_URL}/api/v1/doctors/lab-reviews`, {
                headers: {
                    "x-user-email": getDoctorEmail(),
                    "Content-Type": "application/json"
                }
            });

            if (res.data?.status === "success") {
                setReviews(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load laboratory evaluation metrics.");
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const filteredReviews = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return reviews;

        return reviews.filter((item) => {
            const patientName = `${item.patientDetails?.firstName || ""} ${item.patientDetails?.lastName || ""}`;
            const labs = Array.isArray(item.prescriptionDetails?.labReports)
                ? item.prescriptionDetails.labReports.join(" ")
                : "";

            return (
                patientName.toLowerCase().includes(term) ||
                String(item.patientDetails?.email || "").toLowerCase().includes(term) ||
                String(item.status || "").toLowerCase().includes(term) ||
                String(item.prescriptionDetails?.diagnosis || "").toLowerCase().includes(term) ||
                String(item.prescriptionDetails?.prescriptionName || "").toLowerCase().includes(term) ||
                labs.toLowerCase().includes(term)
            );
        });
    }, [reviews, searchTerm]);

    const toggleExpandCard = (id) => {
        setExpandedCardId((current) => (current === id ? null : id));
    };

    const getStatusBadgeStyle = (status) => {
        if (status === "completed") return "doc-badge-completed";
        if (status === "pending") return "doc-badge-pending";
        if (status === "collected") return "doc-badge-collected";
        if (status === "confirmed") return "doc-badge-confirmed";
        return "doc-badge-initialized";
    };

    const getBillingAmount = (item) => {
        return (
            item.billingAmount ||
            item.reportData?.billingAmount ||
            item.billAmount ||
            item.amount ||
            0
        );
    };

    const buildBillHtml = (item) => {
        const patientName = `${item.patientDetails?.firstName || ""} ${item.patientDetails?.lastName || ""}`.trim() || "Patient";
        const refCode = item.historyId ? String(item.historyId).slice(-8).toUpperCase() : "N/A";
        const appointmentDate = item.appointmentDetails?.appointment_date || "N/A";
        const appointmentTime = item.appointmentDetails?.time_slot || "N/A";
        const tests = Array.isArray(item.prescriptionDetails?.labReports) ? item.prescriptionDetails.labReports : [];
        const medicines = Array.isArray(item.prescriptionDetails?.medicines) ? item.prescriptionDetails.medicines : [];
        const amount = getBillingAmount(item);
        const generatedAt = new Date().toLocaleString("en-IN");

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
            .status { display: inline-block; padding: 7px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: ${item.status === "completed" ? "#dcfce7" : "#e0f2fe"}; color: ${item.status === "completed" ? "#15803d" : "#0369a1"}; }
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
                <h1>Doctor Lab Review Bill</h1>
                <p class="muted">Case Ref: ${escapeHtml(refCode)}</p>
                <p class="muted">Generated: ${escapeHtml(generatedAt)}</p>
              </div>
              <div>
                <span class="status">${escapeHtml(item.status || "initialized")}</span>
              </div>
            </div>

            <div class="grid">
              <div class="box">
                <div class="label">Patient Name</div>
                <div class="value">${escapeHtml(patientName)}</div>
              </div>
              <div class="box">
                <div class="label">Patient Email</div>
                <div class="value">${escapeHtml(item.patientDetails?.email || "N/A")}</div>
              </div>
              <div class="box">
                <div class="label">Appointment Date</div>
                <div class="value">${escapeHtml(appointmentDate)}</div>
              </div>
              <div class="box">
                <div class="label">Appointment Slot</div>
                <div class="value">${escapeHtml(appointmentTime)}</div>
              </div>
              <div class="box wide">
                <div class="label">Diagnosis</div>
                <div class="value">${escapeHtml(item.prescriptionDetails?.diagnosis || "N/A")}</div>
              </div>
              <div class="box wide">
                <div class="label">Ordered Diagnostic Tests</div>
                <div class="value">
                  ${tests.length ? tests.map((test) => `<span class="pill">${escapeHtml(test)}</span>`).join("") : "No lab tests listed"}
                </div>
              </div>
              <div class="box wide">
                <div class="label">Medicines</div>
                <div class="value">
                  ${medicines.length
                ? medicines
                    .map(
                        (med) =>
                            `<span class="pill">${escapeHtml(med.medicine)} - ${escapeHtml(med.dosage)} - ${escapeHtml(med.days)} days</span>`
                    )
                    .join("")
                : "No medicines listed"
            }
                </div>
              </div>
              <div class="box wide">
                <div class="label">Lab Findings</div>
                <div class="value">${escapeHtml(item.reportData?.findings || "N/A")}</div>
              </div>
              <div class="box wide">
                <div class="label">Technician Notes</div>
                <div class="value">${escapeHtml(item.reportData?.notes || "N/A")}</div>
              </div>
            </div>

            <div class="total">
              <div>
                <div class="label" style="color:#cbd5e1;">Total Laboratory Charge</div>
                <div>${item.status === "completed" ? "Completed diagnostic report bill" : "Diagnostic pipeline bill"}</div>
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

    const handleDownloadBillPdf = (item, event) => {
        event.stopPropagation();

        const billWindow = window.open("", "_blank", "width=900,height=1100");

        if (!billWindow) {
            setError("Please allow popups to download the bill PDF.");
            return;
        }

        billWindow.document.open();
        billWindow.document.write(buildBillHtml(item));
        billWindow.document.close();
    };

    const SkeletonList = () => (
        <div className="doc-reviews-stack">
            {[1, 2, 3].map((item) => (
                <div className="doc-skeleton-card" key={item}>
                    <div className="doc-skeleton-summary">
                        <div className="doc-skeleton-avatar" />
                        <div className="doc-skeleton-main">
                            <div className="doc-skeleton-line doc-skeleton-name" />
                            <div className="doc-skeleton-line doc-skeleton-email" />
                        </div>
                        <div className="doc-skeleton-line doc-skeleton-date" />
                        <div className="doc-skeleton-pill" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="doc-reviews-container">
            <div className="doc-reviews-header">
                <div>
                    <h2 className="doc-reviews-title">
                        <FlaskConical size={24} />
                        Patient Lab Monitoring Console
                    </h2>
                    <p className="doc-reviews-subtitle">
                        Track laboratory pipelines, inspect patient context, review reports, and download lab bills.
                    </p>
                </div>

                <button type="button" className="doc-refresh-btn" onClick={fetchReviews} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "doc-loop-spinner" : ""} />
                    Sync
                </button>
            </div>

            <div className="doc-toolbar-row">
                <div className="doc-search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search patient, email, diagnosis, status, or lab test"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

                <span className="doc-count-chip">
                    {filteredReviews.length} Review{filteredReviews.length === 1 ? "" : "s"}
                </span>
            </div>

            {error && (
                <div className="doc-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <SkeletonList />
            ) : filteredReviews.length === 0 ? (
                <div className="doc-empty-view">
                    <Activity size={38} />
                    <h3>No Lab Reviews</h3>
                    <p>No laboratory diagnostic profiles match this view.</p>
                </div>
            ) : (
                <div className="doc-reviews-stack">
                    {filteredReviews.map((item) => {
                        const isExpanded = expandedCardId === item.historyId;
                        const isCompleted = item.status === "completed";
                        const patientName = `${item.patientDetails?.firstName || ""} ${item.patientDetails?.lastName || ""}`.trim() || "Patient";

                        return (
                            <div key={item.historyId} className="doc-review-card animate-card-pop">
                                <div className="doc-card-summary-row" onClick={() => toggleExpandCard(item.historyId)}>
                                    <div className="doc-patient-meta-block">
                                        <div className="doc-avatar-stub">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <h3 className="doc-patient-fullname">{patientName}</h3>
                                            <span className="doc-patient-email-lbl">{item.patientDetails?.email || "No email available"}</span>
                                        </div>
                                    </div>

                                    <div className="doc-appt-meta-block">
                                        <div className="doc-icon-text-node">
                                            <Calendar size={13} />
                                            <span>{item.appointmentDetails?.appointment_date || "N/A"}</span>
                                        </div>
                                        <div className="doc-icon-text-node">
                                            <Clock size={13} />
                                            <span>{item.appointmentDetails?.time_slot || "N/A"}</span>
                                        </div>
                                    </div>

                                    <div className="doc-status-meta-block">
                                        <button
                                            type="button"
                                            className="doc-download-bill-btn"
                                            onClick={(event) => handleDownloadBillPdf(item, event)}
                                        >
                                            <Download size={14} />
                                            <span>Download Report</span>
                                        </button>

                                        <span className={`doc-pipeline-badge ${getStatusBadgeStyle(item.status)}`}>
                                            {item.status || "initialized"}
                                        </span>

                                        <button type="button" className="doc-accordion-toggle-btn" onClick={(event) => {
                                            event.stopPropagation();
                                            toggleExpandCard(item.historyId);
                                        }}>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="doc-card-expanded-body animate-slide-panel">
                                        <div className="doc-details-grid">
                                            <div className="doc-details-column">
                                                <div className="doc-info-section">
                                                    <h4 className="doc-section-section-lbl">
                                                        <Stethoscope size={14} /> Appointment Context
                                                    </h4>
                                                    <div className="doc-data-slate">
                                                        <span className="doc-field-lbl">Reason for Visit</span>
                                                        <p className="doc-field-val">{item.appointmentDetails?.reason_for_visit || "N/A"}</p>
                                                    </div>
                                                </div>

                                                <div className="doc-info-section">
                                                    <h4 className="doc-section-section-lbl">
                                                        <FileText size={14} /> Prescription Mapping Details
                                                    </h4>
                                                    <div className="doc-data-slate space-y-2">
                                                        <div>
                                                            <span className="doc-field-lbl">Prescription Plan</span>
                                                            <p className="doc-field-val font-semibold text-slate-800">{item.prescriptionDetails?.prescriptionName || "N/A"}</p>
                                                        </div>
                                                        <div>
                                                            <span className="doc-field-lbl">Confirmed Diagnosis</span>
                                                            <p className="doc-field-val text-rose-700 font-medium">{item.prescriptionDetails?.diagnosis || "N/A"}</p>
                                                        </div>
                                                        <div>
                                                            <span className="doc-field-lbl">Clinical Outcomes Summary</span>
                                                            <p className="doc-field-val">{item.prescriptionDetails?.result || "N/A"}</p>
                                                        </div>
                                                        <div>
                                                            <span className="doc-field-lbl">Practitioner Advisory Notes</span>
                                                            <p className="doc-field-val text-slate-500">{item.prescriptionDetails?.notes || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="doc-details-column">
                                                <div className="doc-info-section">
                                                    <h4 className="doc-section-section-lbl">
                                                        <Pill size={14} /> Pharmaceutical Regimen Plan
                                                    </h4>
                                                    <div className="doc-meds-stack">
                                                        {(item.prescriptionDetails?.medicines || []).length > 0 ? (
                                                            item.prescriptionDetails.medicines.map((med, index) => (
                                                                <div key={`${med.medicine}-${index}`} className="doc-med-pill-item">
                                                                    <span className="doc-med-title-text">{med.medicine || "Medicine"}</span>
                                                                    <span className="doc-med-meta-sub">Dosage: {med.dosage || "N/A"} - Duration: {med.days || 0} days</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="doc-med-pill-item">
                                                                <span className="doc-med-title-text">No medicines listed</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="doc-info-section">
                                                    <h4 className="doc-section-section-lbl">
                                                        <FlaskConical size={14} /> Ordered Diagnostics Labs
                                                    </h4>
                                                    <div className="doc-tests-flex-row">
                                                        {(item.prescriptionDetails?.labReports || []).length > 0 ? (
                                                            item.prescriptionDetails.labReports.map((test, index) => (
                                                                <span key={`${test}-${index}`} className="doc-test-panel-tag">{test}</span>
                                                            ))
                                                        ) : (
                                                            <span className="doc-test-panel-tag doc-muted-tag">No lab tests listed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="doc-report-results-footer-wrapper">
                                            {isCompleted && item.reportData ? (
                                                <div className="doc-completed-results-pane">
                                                    <div className="doc-results-pane-head-row">
                                                        <h4 className="doc-results-pane-head-title">Laboratory Metrics & Signed Findings</h4>

                                                    </div>
                                                    <div className="doc-results-content-split">
                                                        <div className="doc-result-data-box border-emerald">
                                                            <span className="doc-result-box-lbl">Laboratory Metric Readings</span>
                                                            <p className="doc-result-box-val">{item.reportData.findings || "N/A"}</p>
                                                        </div>
                                                        <div className="doc-result-data-box border-slate">
                                                            <span className="doc-result-box-lbl">Technician Notes & Observations</span>
                                                            <p className="doc-result-box-val text-slate-600">{item.reportData.notes || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="doc-pending-status-notice-pane">
                                                    <div className="doc-notice-icon-spin">
                                                        <Loader2 size={16} className="doc-loop-spinner" />
                                                    </div>
                                                    <div>
                                                        <span className="doc-notice-title-lbl">Lab Test Pipeline Incomplete</span>
                                                        <p className="doc-notice-desc-lbl">
                                                            This sample is currently flagged as <span className="font-bold text-amber-800">"{item.status || "initialized"}"</span>. Results remain locked until laboratory signoff.
                                                        </p>
                                                    </div>
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