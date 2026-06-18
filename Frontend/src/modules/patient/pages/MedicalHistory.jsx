import React, { useState } from "react";
import { FileText, User, Activity, FileCheck, Clipboard, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import "../style/MedicalHistory.css";

export default function MedicalHistory() {
  const [expandedRow, setExpandedRow] = useState(null);

  // Mock data mapping perfectly to your schema attributes
  const medicalRecords = [
    {
      id: "MED-7701",
      patient_id: "PAT-6192",
      doctor_id: "DOC-0412",
      doctor_name: "Dr. Elizabeth Vance",
      diagnosis: "Acute Bacterial Sinusitis",
      prescription: "Amoxicillin 500mg, Fluticasone Nasal Spray",
      result: "Patient presented with severe facial pressure, nasal congestion, and purulent discharge for 10 days. Post-treatment evaluation shows complete resolution of acute symptoms.",
      notes: "Advised patient to complete the entire antibiotic course. Increase humidification and fluid intake. Follow up if symptoms recur within 14 days.",
      created_at: "2026-05-14",
      updated_at: "2026-05-20"
    },
    {
      id: "MED-7490",
      patient_id: "PAT-6192",
      doctor_id: "DOC-0881",
      doctor_name: "Dr. Marcus Sterling",
      diagnosis: "Stage 1 Essential Hypertension",
      prescription: "Lisinopril 10mg Daily",
      result: "Initial BP reading 142/92 mmHg. Confirmed over consecutive ambulatory checkups. Cardiac enzymes testing came back fully within regular parameters.",
      notes: "Initiated low-dose ACE inhibitor. Strongly recommended dietary modifications (low sodium, DASH diet) and aerobic exercise tracking 3 times weekly.",
      created_at: "2026-03-10",
      updated_at: "2026-03-10"
    },
    {
      id: "MED-6912",
      patient_id: "PAT-6192",
      doctor_id: "DOC-1104",
      doctor_name: "Dr. Alan Grant",
      diagnosis: "Allergic Conjunctivitis",
      prescription: "Olopatadine 0.1% Ophthalmic Solution",
      result: "Bilateral ocular injection and severe pruritus secondary to seasonal environmental pollen exposure.",
      notes: "Apply 1 drop in each eye twice daily. Avoid wearing contact lenses until inflammation resolves completely.",
      created_at: "2026-01-18",
      updated_at: "2026-01-18"
    }
  ];

  const toggleRowAccordion = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  return (
    <div className="medical-history-canvas">
      <div className="history-header-block">
        <h2>Medical History Logs</h2>
        <p>Access chronological diagnosis frameworks, clinical consultation results, and official practitioner files.</p>
      </div>

      <div className="records-ledger-stack animate-fade-in">
        {medicalRecords.map((record) => {
          const isExpanded = expandedRow === record.id;
          return (
            <div key={record.id} className={`medical-record-card ${isExpanded ? "card-expanded" : ""}`}>
              
              {/* Card Visible Summary Header */}
              <div className="record-summary-row" onClick={() => toggleRowAccordion(record.id)}>
                <div className="diagnosis-primary-meta">
                  <div className="clinical-icon-badge"><Activity size={18} /></div>
                  <div>
                    <h4>{record.diagnosis}</h4>
                    <span className="record-id-tag">Case File: {record.id}</span>
                  </div>
                </div>

                <div className="record-summary-grid">
                  <div className="summary-cell">
                    <User size={14} />
                    <span>{record.doctor_name}</span>
                  </div>
                  <div className="summary-cell">
                    <Calendar size={14} />
                    <span>{record.created_at}</span>
                  </div>
                </div>

                <button className="accordion-toggle-btn" aria-label="Toggle Details">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Collapsible Drop Down Section */}
              {isExpanded && (
                <div className="record-expanded-details animate-slide-down">
                  <div className="details-grid-layout">
                    
                    <div className="detail-block full-width">
                      <h5><Clipboard size={14} /> Clinical Evaluation & Result Summary</h5>
                      <p>{record.result}</p>
                    </div>

                    <div className="detail-block">
                      <h5><FileCheck size={14} /> Associated Prescriptions</h5>
                      <p className="prescription-inline-text">{record.prescription}</p>
                    </div>

                    <div className="detail-block">
                      <h5><FileText size={14} /> Physician's Direct Directives & Notes</h5>
                      <p>{record.notes}</p>
                    </div>

                  </div>

                  <div className="expanded-footer-timestamps">
                    <span><strong>Record Generated:</strong> {record.created_at}</span>
                    <span><strong>Last Verified System Update:</strong> {record.updated_at}</span>
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