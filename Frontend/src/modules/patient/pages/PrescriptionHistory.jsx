import React, { useState } from "react";
import { Pill, User, Clipboard, FileText, ChevronDown, ChevronUp, Clock, Calendar, CheckCircle } from "lucide-react";
import "../style/PrescriptionHistory.css";

export default function PrescriptionHistory() {
  const [expandedPrescription, setExpandedPrescription] = useState(null);

  // Mock payload mirroring schema parameters, including nested array formatting
  const prescriptionRecords = [
    {
      id: "RX-88201",
      patient_id: "PAT-6192",
      doctor_id: "DOC-0412",
      doctor_name: "Dr. Elizabeth Vance",
      prescription: "Standard Respiratory Management Pack",
      notes: "Take the primary antibiotic course during morning meals. Monitor fluid cycles closely.",
      medicines: [
        { medicine: "Amoxicillin 500mg Oral Capsule", dosage: "1 Capsule, 3x Daily", days: 7 },
        { medicine: "Fluticasone Propionate 50mcg", dosage: "2 Sprays per Nostril Daily", days: 14 },
        { medicine: "Cetirizine 10mg Tablets", dosage: "1 Tablet nightly at bedtime", days: 10 }
      ],
      is_active: true,
      created_at: "2026-05-14"
    },
    {
      id: "RX-84192",
      patient_id: "PAT-6192",
      doctor_id: "DOC-0881",
      doctor_name: "Dr. Marcus Sterling",
      prescription: "Hypertension First-Line Maintenance Plan",
      notes: "Check baseline blood pressure values every evening and log them inside your portal spreadsheet.",
      medicines: [
        { medicine: "Lisinopril 10mg Tablets", dosage: "1 Tablet every morning", days: 90 }
      ],
      is_active: true,
      created_at: "2026-03-10"
    },
    {
      id: "RX-79102",
      patient_id: "PAT-6192",
      doctor_id: "DOC-1104",
      doctor_name: "Dr. Alan Grant",
      prescription: "Acute Ophthalmic Anti-allergic Block",
      notes: "Discard medication bottle 30 days post-unsealing. Do not exceed prescribed drop counts.",
      medicines: [
        { medicine: "Olopatadine Hydrochloride 0.1%", dosage: "1 drop per eye, twice daily", days: 7 }
      ],
      is_active: false,
      created_at: "2026-01-18"
    }
  ];

  const togglePrescriptionDropdown = (rxId) => {
    setExpandedPrescription(expandedPrescription === rxId ? null : rxId);
  };

  return (
    <div className="prescription-history-canvas">
      <div className="prescription-header-block">
        <h2>Prescription Tracking Records</h2>
        <p>Monitor system medications logs, active dosages schemas, and clinical instructions files.</p>
      </div>

      <div className="prescription-ledger-stack animate-fade-in">
        {prescriptionRecords.map((rx) => {
          const isExpanded = expandedPrescription === rx.id;
          return (
            <div key={rx.id} className={`prescription-card-item ${isExpanded ? "rx-expanded" : ""} ${!rx.is_active ? "rx-archived" : ""}`}>
              
              {/* Visible Overview Wrapper */}
              <div className="rx-summary-container" onClick={() => togglePrescriptionDropdown(rx.id)}>
                <div className="rx-title-identity-group">
                  <div className={`rx-pill-badge ${rx.is_active ? "badge-active" : "badge-expired"}`}>
                    <Pill size={18} />
                  </div>
                  <div>
                    <h4>{rx.prescription}</h4>
                    <span className="rx-id-tag-sub">Script Reference: {rx.id}</span>
                  </div>
                </div>

                <div className="rx-meta-summary-flex">
                  <div className="meta-capsule-cell"><User size={13} /> {rx.doctor_name}</div>
                  <div className="meta-capsule-cell"><Calendar size={13} /> {rx.created_at}</div>
                  <span className={`status-pill-badge ${rx.is_active ? "active-green" : "expired-gray"}`}>
                    {rx.is_active ? "Active Active" : "Archived Plan"}
                  </span>
                </div>

                <button className="rx-accordion-arrow-trigger">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Accordion Content Drop Down Row */}
              {isExpanded && (
                <div className="rx-expanded-content-view animate-slide-down">
                  
                  {/* Dynamic Table List for the nested 'medicines' array */}
                  <div className="medicines-nested-array-table-wrapper">
                    <h5><CheckCircle size={14} /> Itemized Pharmaceutical Allocation</h5>
                    <table className="medicines-embedded-table">
                      <thead>
                        <tr>
                          <th>Allocated Medication Description</th>
                          <th>Dosage Regimen</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rx.medicines.map((med, index) => (
                          <tr key={index}>
                            <td><strong>{med.medicine}</strong></td>
                            <td className="dosage-emphasized-text">{med.dosage}</td>
                            <td><span className="days-counter-pill">{med.days} Days Supply</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rx-notes-bottom-block">
                    <h5><FileText size={14} /> Pharmacy Instruction Notes</h5>
                    <p>{rx.notes}</p>
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