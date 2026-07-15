import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  Layers,
  FlaskConical,
  Receipt,
  User,
  ChevronRight,
  Loader2,
  Search,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  X,
  CheckCircle2,
  ClipboardList,
  Download,
  CreditCard,
  CheckCircle,
  Wallet
} from "lucide-react";
import "../style/LabDashboard.css";

const emptyReportForm = {
  findings: "",
  notes: "",
  billingAmount: ""
};

export default function LabTechnicianHome() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [roster, setRoster] = useState([]);
  const [billing, setBilling] = useState({ pendingBilling: [], completedBilling: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState({});
  const [searchTerms, setSearchTerms] = useState({ upcoming: "", active: "", billing: "" });
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [reportForm, setReportForm] = useState(emptyReportForm);
  const [billingTab, setBillingTab] = useState("pending");

  const getLabUserEmail = () => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      return userObj?.email?.trim().toLowerCase();
    } catch {
      return;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const headers = {
        "x-user-email": getLabUserEmail(),
        "Content-Type": "application/json"
      };

      const [rosterRes, billingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/v1/lab-technician/eligible-patients`, { headers }),
        axios.get(`${API_BASE_URL}/api/v1/lab-technician/billing-history`, { headers })
      ]);

      if (Array.isArray(rosterRes.data?.data)) {
        setRoster(rosterRes.data.data);
      }
      if (billingRes.data?.status === "success") {
        setBilling({
          pendingBilling: Array.isArray(billingRes.data.data?.pendingBilling) ? billingRes.data.data.pendingBilling : [],
          completedBilling: Array.isArray(billingRes.data.data?.completedBilling) ? billingRes.data.data.completedBilling : []
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sync dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upcomingTasks = useMemo(() => roster.filter(t => t.ownershipStatus === "available"), [roster]);
  const activeTasks = useMemo(() => roster.filter(t => t.ownershipStatus === "claimed_by_me" && t.currentPipelineStatus !== "completed"), [roster]);

  const filteredUpcoming = useMemo(() => {
    const term = searchTerms.upcoming.toLowerCase().trim();
    if (!term) return upcomingTasks;
    return upcomingTasks.filter(t =>
      t.patientName?.toLowerCase().includes(term) ||
      t.patientEmail?.toLowerCase().includes(term) ||
      t.doctorName?.toLowerCase().includes(term) ||
      t.labTests?.some(test => test.toLowerCase().includes(term))
    );
  }, [upcomingTasks, searchTerms.upcoming]);

  const filteredActive = useMemo(() => {
    const term = searchTerms.active.toLowerCase().trim();
    if (!term) return activeTasks;
    return activeTasks.filter(t =>
      t.patientName?.toLowerCase().includes(term) ||
      t.patientEmail?.toLowerCase().includes(term) ||
      t.doctorName?.toLowerCase().includes(term) ||
      t.currentPipelineStatus?.toLowerCase().includes(term) ||
      t.labTests?.some(test => test.toLowerCase().includes(term))
    );
  }, [activeTasks, searchTerms.active]);

  const filteredBilling = useMemo(() => {
    const term = searchTerms.billing.toLowerCase().trim();
    const list = billing[`${billingTab}Billing`] || [];
    if (!term) return list;
    return list.filter(item => {
      const pIdRaw = String(item.patientId || "").toLowerCase();
      const hIdRaw = String(item.historyId || "").toLowerCase();
      const pIdShort = pIdRaw.length > 5 ? pIdRaw.substring(pIdRaw.length - 5) : pIdRaw;
      const hIdShort = hIdRaw.length > 5 ? hIdRaw.substring(hIdRaw.length - 5) : hIdRaw;

      return (
        item.patientName?.toLowerCase().includes(term) ||
        pIdRaw.includes(term) ||
        pIdShort.includes(term) ||
        hIdRaw.includes(term) ||
        hIdShort.includes(term) ||
        item.reportData?.findings?.toLowerCase().includes(term) ||
        item.requestedTests?.some(test => test.toLowerCase().includes(term))
      );
    });
  }, [billing, billingTab, searchTerms.billing]);

  const aggregates = useMemo(() => {
    const pendingTotal = billing.pendingBilling.reduce((sum, item) => sum + Number(item.billingAmount || 0), 0);
    const completedTotal = billing.completedBilling.reduce((sum, item) => sum + Number(item.billingAmount || 0), 0);
    return { pendingTotal, completedTotal };
  }, [billing]);

  const handleClaimTask = async (prescriptionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [prescriptionId]: true }));
      await axios.post(`${API_BASE_URL}/api/v1/lab-technician/claim-task`, { prescriptionId }, {
        headers: { "x-user-email": getLabUserEmail() }
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to claim task.");
    } finally {
      setActionLoading(prev => ({ ...prev, [prescriptionId]: false }));
    }
  };

  const handleAdvancePipeline = async (historyId, currentStatus) => {
    const nextMap = { initialized: "confirmed", confirmed: "collected", collected: "pending", pending: "completed" };
    const nextStatus = nextMap[currentStatus];
    if (!nextStatus) return;

    if (nextStatus === "completed") {
      setSelectedHistoryId(historyId);
      setReportForm(emptyReportForm);
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [historyId]: true }));
      await axios.patch(`${API_BASE_URL}/api/v1/lab-technician/history/${historyId}/pipeline`, { status: nextStatus }, {
        headers: { "x-user-email": getLabUserEmail() }
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to progress pipeline.");
    } finally {
      setActionLoading(prev => ({ ...prev, [historyId]: false }));
    }
  };

  const handleFinalizeReport = async (e) => {
    e.preventDefault();
    if (!selectedHistoryId) return;
    if (!reportForm.findings.trim()) { setError("Findings cannot be empty."); return; }
    if (!reportForm.billingAmount || Number(reportForm.billingAmount) <= 0) { setError("Enter a valid amount."); return; }

    try {
      setActionLoading(prev => ({ ...prev, [selectedHistoryId]: true }));
      await axios.patch(`${API_BASE_URL}/api/v1/lab-technician/history/${selectedHistoryId}/pipeline`, {
        status: "completed",
        findings: reportForm.findings.trim(),
        notes: reportForm.notes.trim(),
        billingAmount: Number(reportForm.billingAmount)
      }, {
        headers: { "x-user-email": getLabUserEmail() }
      });
      setSelectedHistoryId(null);
      setReportForm(emptyReportForm);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log report findings.");
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedHistoryId]: false }));
    }
  };

  const handleSettlePayment = async (historyId) => {
    try {
      setActionLoading(prev => ({ ...prev, [historyId]: true }));
      await axios.patch(`${API_BASE_URL}/api/v1/lab-technician/billing/${historyId}/collect`, {}, {
        headers: { "x-user-email": getLabUserEmail() }
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process transaction.");
    } finally {
      setActionLoading(prev => ({ ...prev, [historyId]: false }));
    }
  };

  const buildInvoiceHtml = (item) => {
    const tests = item.requestedTests || [];
    const refCode = item.patientId ? String(item.patientId).slice(-6).toUpperCase() : "N/A";
    const invoiceCode = item.historyId ? String(item.historyId).slice(-8).toUpperCase() : refCode;
    return `
      <html>
        <head>
          <title>Invoice #${invoiceCode}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .bill-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; }
            .title { color: #0284c7; margin: 0; font-size: 22px; }
            .section { margin: 20px 0; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .value { font-size: 14px; margin-top: 4px; }
            .total-banner { background: #0f172a; color: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 30px; }
            .amount { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="bill-card">
            <div class="header">
              <div>
                <h1 class="title">CareOS Laboratory Invoice</h1>
                <p style="color:#64748b; font-size:12px; margin: 4px 0 0 0;">ID: ${invoiceCode}</p>
              </div>
              <p style="font-weight: bold; color: ${item.isBilled ? '#16a34a' : '#ea580c'}">${item.isBilled ? 'PAID' : 'UNPAID'}</p>
            </div>
            <div class="section">
              <div class="label">Patient Profile</div>
              <div class="value">${item.patientName} (${refCode})</div>
            </div>
            <div class="section">
              <div class="label">Assigned Tests</div>
              <div class="value">${tests.join(", ")}</div>
            </div>
            <div class="section">
              <div class="label">Findings</div>
              <div class="value">${item.reportData?.findings || "N/A"}</div>
            </div>
            <div class="total-banner">
              <div><span style="font-size: 12px; color: #cbd5e1;">TOTAL CHARGE</span></div>
              <div class="amount">₹${item.billingAmount}</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>`;
  };

  const handlePrintInvoice = (item) => {
    const win = window.open("", "_blank", "width=800,height=900");
    if (win) {
      win.document.write(buildInvoiceHtml(item));
      win.document.close();
    } else {
      setError("Popup blocked. Please allow popups to open invoices.");
    }
  };

  const getStatusLabel = (status) => {
    const labels = { initialized: "Confirm", confirmed: "Log Sample", collected: "Mark Pending", pending: "Report" };
    return labels[status] || "Next";
  };

  return (
    <div className="lab-dashboard">
      <div className="dashboard-top-header">
        <div>
          <h1>Lab Operations Cockpit</h1>
          <p>Process inbound clinical requests, manage processing queues, and dispatch billing ledgers.</p>
        </div>
        <button className="sync-btn" onClick={fetchData} disabled={loading}>
          <RefreshCw className={loading ? "spinning" : ""} size={16} />
          Sync Console
        </button>
      </div>

      {error && (
        <div className="dashboard-alert-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="close-alert" onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      <div className="dashboard-metric-cards">
        <div className="metric-card sky">
          <FlaskConical size={24} />
          <div>
            <span className="label">Unclaimed Pipeline Requests</span>
            <h2 className="count">{upcomingTasks.length} Patients</h2>
          </div>
        </div>
        <div className="metric-card active">
          <Layers size={24} />
          <div>
            <span className="label">My Active Workspaces</span>
            <h2 className="count">{activeTasks.length} Active</h2>
          </div>
        </div>
        <div className="metric-card orange">
          <Receipt size={24} />
          <div>
            <span className="label">Pending Billing Ledger</span>
            <h2 className="count">₹{aggregates.pendingTotal.toLocaleString("en-IN")}</h2>
          </div>
        </div>
        <div className="metric-card green">
          <Wallet size={24} />
          <div>
            <span className="label">Total Settled Ledger</span>
            <h2 className="count">₹{aggregates.completedTotal.toLocaleString("en-IN")}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-workspace-grid">
        <div className="grid-column upcoming-section">
          <div className="column-head">
            <div className="heading-wrapper">
              <FlaskConical className="icon-sky" size={20} />
              <h2>Inbound Clinical Roster</h2>
            </div>
            <span className="counter-badge">{filteredUpcoming.length} Open</span>
          </div>

          <div className="column-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search clinical roster..."
              value={searchTerms.upcoming}
              onChange={(e) => setSearchTerms(prev => ({ ...prev, upcoming: e.target.value }))}
            />
          </div>

          <div className="card-feed-container">
            {loading ? (
              <SkeletonFeed />
            ) : filteredUpcoming.length === 0 ? (
              <div className="empty-slate">
                <Activity className="pulsing" size={32} />
                <p>No unclaimed diagnostic requests available.</p>
              </div>
            ) : (
              filteredUpcoming.map((item) => (
                <div key={item.prescriptionId} className="workspace-feed-card animate-card">
                  <div className="feed-card-header">
                    <div>
                      <h3>{item.patientName}</h3>
                      <span className="patient-subtext">{item.patientEmail}</span>
                    </div>
                    <span className="pill-available">Available</span>
                  </div>
                  <div className="test-panel-block">
                    <span className="meta-label">Assigned Panels</span>
                    <div className="pills-flex">
                      {item.labTests.map((t, idx) => (
                        <span key={idx} className="test-pill">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="feed-card-footer">
                    <span className="practitioner-tag">{item.doctorName}</span>
                    <button
                      className="action-btn claim-btn"
                      onClick={() => handleClaimTask(item.prescriptionId)}
                      disabled={actionLoading[item.prescriptionId]}
                    >
                      {actionLoading[item.prescriptionId] ? <Loader2 className="spinning" size={13} /> : <ClipboardList size={13} />}
                      <span>Claim Task</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid-column control-panel-section">
          <div className="sub-panel">
            <div className="column-head">
              <div className="heading-wrapper">
                <Layers className="icon-active" size={20} />
                <h2>Processing Workspace</h2>
              </div>
              <span className="counter-badge">{filteredActive.length} Active</span>
            </div>

            <div className="column-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search active processing pipeline..."
                value={searchTerms.active}
                onChange={(e) => setSearchTerms(prev => ({ ...prev, active: e.target.value }))}
              />
            </div>

            {selectedHistoryId && (
              <form onSubmit={handleFinalizeReport} className="inline-report-builder">
                <div className="builder-header">
                  <div className="title-block">
                    <FileSpreadsheet size={16} />
                    <span>Diagnostic Input Panel</span>
                  </div>
                  <button type="button" className="close-btn" onClick={() => setSelectedHistoryId(null)}><X size={14} /></button>
                </div>
                <div className="builder-body">
                  <div className="form-group">
                    <label>Report Findings</label>
                    <textarea
                      required
                      rows={3}
                      value={reportForm.findings}
                      onChange={(e) => setReportForm(prev => ({ ...prev, findings: e.target.value }))}
                      placeholder="Specify raw diagnostic levels, metric findings, and ranges..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Technician Notes</label>
                    <textarea
                      rows={2}
                      value={reportForm.notes}
                      onChange={(e) => setReportForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add custom notes..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Operational Cost (INR)</label>
                    <div className="currency-box">
                      <span>₹</span>
                      <input
                        required
                        type="number"
                        min="1"
                        value={reportForm.billingAmount}
                        onChange={(e) => setReportForm(prev => ({ ...prev, billingAmount: e.target.value }))}
                        placeholder="750"
                      />
                    </div>
                  </div>
                </div>
                <div className="builder-footer">
                  <button type="button" className="secondary-btn" onClick={() => setSelectedHistoryId(null)}>Discard</button>
                  <button type="submit" className="primary-btn" disabled={actionLoading[selectedHistoryId]}>
                    {actionLoading[selectedHistoryId] ? <Loader2 className="spinning" size={13} /> : <CheckCircle2 size={13} />}
                    <span>Save & Finalize</span>
                  </button>
                </div>
              </form>
            )}

            <div className="card-feed-container small-feed">
              {loading ? (
                <SkeletonFeed count={2} />
              ) : filteredActive.length === 0 ? (
                <div className="empty-slate">
                  <Activity className="pulsing" size={28} />
                  <p>Your processing workspace is empty.</p>
                </div>
              ) : (
                filteredActive.map((item) => (
                  <div key={item.labHistoryId} className="workspace-feed-card active-border animate-card">
                    <div className="feed-card-header">
                      <div>
                        <h3>{item.patientName}</h3>
                        <span className="status-indicator tag-active">{item.currentPipelineStatus}</span>
                      </div>
                    </div>
                    <div className="feed-card-footer">
                      <span className="practitioner-tag">{item.doctorName}</span>
                      <button
                        className="action-btn next-step-btn"
                        onClick={() => handleAdvancePipeline(item.labHistoryId, item.currentPipelineStatus)}
                        disabled={actionLoading[item.labHistoryId]}
                      >
                        {actionLoading[item.labHistoryId] ? <Loader2 className="spinning" size={13} /> : <ChevronRight size={13} />}
                        <span>{getStatusLabel(item.currentPipelineStatus)}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sub-panel invoice-sub-panel">
            <div className="column-head">
              <div className="heading-wrapper">
                <Receipt className="icon-orange" size={20} />
                <h2>Settle Ledger</h2>
              </div>
              <div className="billing-tabs">
                <button className={billingTab === "pending" ? "active" : ""} onClick={() => setBillingTab("pending")}>Pending</button>
                <button className={billingTab === "completed" ? "active" : ""} onClick={() => setBillingTab("completed")}>Settled</button>
              </div>
            </div>

            <div className="column-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search ledger files..."
                value={searchTerms.billing}
                onChange={(e) => setSearchTerms(prev => ({ ...prev, billing: e.target.value }))}
              />
            </div>

            <div className="card-feed-container small-feed">
              {loading ? (
                <SkeletonFeed count={2} />
              ) : filteredBilling.length === 0 ? (
                <div className="empty-slate">
                  <Receipt size={28} />
                  <p>No transactions found in this segment.</p>
                </div>
              ) : (
                filteredBilling.map((item) => (
                  <div key={item.historyId} className="workspace-feed-card billing-card animate-card">
                    <div className="feed-card-header">
                      <div className="billing-meta-block">
                        <h3>{item.patientName}</h3>
                        <div className="billing-id-badges">
                          <span className="id-badge">
                            <strong>Patient ID:</strong> {item.patientId ? item.patientId.substring(item.patientId.length - 5).toUpperCase() : "N/A"}
                          </span>
                          <span className="id-badge">
                            <strong>Bill ID:</strong> {item.historyId ? item.historyId.substring(item.historyId.length - 5).toUpperCase() : "N/A"}
                          </span>
                        </div>
                        <span className="price-tag">₹{item.billingAmount}</span>
                      </div>
                    </div>
                    <div className="feed-card-footer">
                      <button className="action-btn icon-only-btn" onClick={() => handlePrintInvoice(item)}>
                        <Download size={13} />
                      </button>
                      {!item.isBilled ? (
                        <button
                          className="action-btn collect-btn"
                          onClick={() => handleSettlePayment(item.historyId)}
                          disabled={actionLoading[item.historyId]}
                        >
                          {actionLoading[item.historyId] ? <Loader2 className="spinning" size={13} /> : <CreditCard size={13} />}
                          <span>Collect</span>
                        </button>
                      ) : (
                        <div className="locked-badge">
                          <CheckCircle size={12} />
                          <span>Slipped & Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SkeletonFeed({ count = 3 }) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-line title" />
          <div className="skeleton-line text" />
          <div className="skeleton-line btn" />
        </div>
      ))}
    </div>
  );
}