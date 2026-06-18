import React, { useState } from "react";
import { FileSpreadsheet, Beaker, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Download, Eye } from "lucide-react";
import "../style/LabReport.css";

export default function LabReport() {
  const [expandedReport, setExpandedReport] = useState(null);

  const labRecords = [
    {
      id: "LAB-99201",
      patient_id: "PAT-6192",
      test_name: "Complete Blood Count (CBC) with Differential",
      sample_collected: 1,
      reportStatus: "completed",
      report: "Hemoglobin: 14.2 g/dL (Normal), White Blood Cells: 6.8 x10^3/uL (Normal), Platelets: 245 x10^3/uL (Normal). Differential count shows standard distribution of neutrophils, lymphocytes, and monocytes.",
      collected_at: "2026-06-10 08:30 AM",
      released_at: "2026-06-11 04:15 PM"
    },
    {
      id: "LAB-98412",
      patient_id: "PAT-6192",
      test_name: "Lipid Profile Panel",
      sample_collected: 1,
      reportStatus: "completed",
      report: "Total Cholesterol: 210 mg/dL (Borderline High), HDL Cholesterol: 55 mg/dL (Optimal), LDL Cholesterol: 132 mg/dL (Mildly Elevated), Triglycerides: 115 mg/dL (Normal).",
      collected_at: "2026-05-14 07:45 AM",
      released_at: "2026-05-15 11:00 AM"
    },
    {
      id: "LAB-10023",
      patient_id: "PAT-6192",
      test_name: "Thyroid Stimulating Hormone (TSH)",
      sample_collected: 1,
      reportStatus: "pending",
      report: "Sample successfully routed to regional processing center. Analysis scheduled. Findings will automatically release to patient dashboard once signed off by laboratory pathologist.",
      collected_at: "2026-06-17 09:15 AM",
      released_at: "Pending Analysis"
    },
    {
      id: "LAB-10500",
      patient_id: "PAT-6192",
      test_name: "Urinalysis Routine Panel",
      sample_collected: 0,
      reportStatus: "pending",
      report: "Awaiting sample submission. Please report to the secondary outpatient laboratory collection desk during standard operating hours.",
      collected_at: "Awaiting Sample",
      released_at: "Awaiting Sample"
    }
  ];

  const toggleReportDropdown = (reportId) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  const getStatusBadge = (status, collected) => {
    if (status === "completed") {
      return <span className="status-badge status-complete"><CheckCircle2 size={13} /> Completed</span>;
    }
    if (collected === 1) {
      return <span className="status-badge status-processing"><Clock size={13} /> Processing</span>;
    }
    return <span className="status-badge status-pending"><AlertCircle size={13} /> Action Required</span>;
  };

  return (
    <div className="lab-history-canvas">
      <div className="lab-header-block">
        <h2>Laboratory Diagnostics</h2>
        <p>Monitor laboratory test orders, biological specimen collection parameters, and official diagnostic reports.</p>
      </div>

      <div className="lab-ledger-stack animate-fade-in">
        {labRecords.map((lab) => {
          const isExpanded = expandedReport === lab.id;
          return (
            <div key={lab.id} className={`lab-card-item ${isExpanded ? "lab-expanded" : ""}`}>
              
              <div className="lab-summary-container" onClick={() => toggleReportDropdown(lab.id)}>
                <div className="lab-title-identity-group">
                  <div className={`lab-icon-badge ${lab.reportStatus === "completed" ? "bg-complete" : "bg-pending"}`}>
                    <Beaker size={18} />
                  </div>
                  <div>
                    <h4>{lab.test_name}</h4>
                    <span className="lab-id-tag-sub">Accession ID: {lab.id}</span>
                  </div>
                </div>

                <div className="lab-meta-summary-flex">
                  <div className="meta-capsule-cell">
                    <strong>Specimen:</strong> {lab.sample_collected === 1 ? "Collected" : "Awaiting"}
                  </div>
                  {getStatusBadge(lab.reportStatus, lab.sample_collected)}
                </div>

                <button className="lab-accordion-arrow-trigger">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {isExpanded && (
                <div className="lab-expanded-content-view animate-slide-down">
                  <div className="lab-timeline-grid">
                    <div className="timeline-node">
                      <strong>Specimen Collection Timeline:</strong> {lab.collected_at}
                    </div>
                    <div className="timeline-node">
                      <strong>Official Result Release:</strong> {lab.released_at}
                    </div>
                  </div>

                  <div className="lab-report-findings-block">
                    <h5><FileSpreadsheet size={14} /> Diagnostic Findings & Narrative</h5>
                    <p className={lab.reportStatus === "pending" ? "pending-findings-text" : ""}>
                      {lab.report}
                    </p>
                  </div>

                  {lab.reportStatus === "completed" && (
                    <div className="lab-action-row-footer">
                      <button className="lab-download-btn" onClick={(e) => { e.stopPropagation(); alert("Downloading official signed lab PDF..."); }}>
                        <Download size={14} /> Download Signed PDF Report
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}