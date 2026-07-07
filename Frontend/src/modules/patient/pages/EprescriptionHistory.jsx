import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FileText,
  FileSpreadsheet,
  Beaker,
  User,
  Activity,
  Calendar,
  Clock,
  Search,
  ShieldAlert,
  Award,
  SlidersHorizontal,
  Eye
} from "lucide-react";
import "../style/EprescriptionHistory.css";

export default function EprescriptionHistory() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!storedUser) {
      setErrorMsg("Patient login session was not found.");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const email = user?.email?.trim().toLowerCase();

      if (!email) {
        setErrorMsg("Patient email was not found in login session.");
        setLoading(false);
        return;
      }

      setPatientEmail(email);
    } catch {
      setErrorMsg("Patient login session is invalid.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!patientEmail) return;

    const fetchRecords = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await axios.get(`${API_BASE_URL}/api/v1/patients/prescriptions`, {
          headers: { "x-patient-email": patientEmail },
          params: { email: patientEmail }
        });

        const records = Array.isArray(res.data?.data) ? res.data.data : [];
        setPrescriptions(records);
        setSelectedRecord(records[0] || null);
      } catch (err) {
        setPrescriptions([]);
        setSelectedRecord(null);
        setErrorMsg(err.response?.data?.message || "Failed to load prescription records.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [patientEmail, API_BASE_URL]);

  const filteredPrescriptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return prescriptions;

    return prescriptions.filter((rec) => {
      return (
        String(rec.prescriptionName || "").toLowerCase().includes(term) ||
        String(rec.diagnosis || "").toLowerCase().includes(term) ||
        String(rec.doctorName || "").toLowerCase().includes(term)
      );
    });
  }, [prescriptions, searchTerm]);

  const formatDate = (value) => {
    if (!value) return "N/A";
    return String(value).split("T")[0];
  };

  const SkeletonScreen = () => (
    <div className="ph-dashboard-container ph-animate-fade-in">
      <header className="ph-dashboard-header">
        <div className="ph-title-area">
          <div className="ph-skeleton ph-skeleton-title" />
          <div className="ph-skeleton ph-skeleton-subtitle" />
        </div>
      </header>

      <div className="ph-layout-grid">
        <aside className="ph-sidebar-panel">
          <div className="ph-skeleton ph-skeleton-search" />
          <div className="ph-skeleton ph-skeleton-label" />
          <div className="ph-cards-stack">
            {[1, 2, 3, 4].map((item) => (
              <div className="ph-skeleton-card" key={item}>
                <div className="ph-skeleton ph-skeleton-card-title" />
                <div className="ph-skeleton ph-skeleton-chip" />
                <div className="ph-skeleton ph-skeleton-card-line" />
              </div>
            ))}
          </div>
        </aside>

        <main className="ph-display-canvas">
          <div className="ph-skeleton-strip">
            {[1, 2, 3].map((item) => (
              <div className="ph-skeleton-strip-item" key={item}>
                <div className="ph-skeleton ph-skeleton-small" />
                <div className="ph-skeleton ph-skeleton-medium" />
              </div>
            ))}
            <div className="ph-skeleton ph-skeleton-wide" />
          </div>

          {[1, 2, 3].map((item) => (
            <div className="ph-skeleton-section" key={item}>
              <div className="ph-skeleton ph-skeleton-section-heading" />
              <div className="ph-skeleton ph-skeleton-block" />
            </div>
          ))}
        </main>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonScreen />;
  }

  return (
    <div className="ph-dashboard-container ph-animate-fade-in">
      <header className="ph-dashboard-header">
        <div className="ph-title-area">
          <h1>My Electronic Health Dossier</h1>
          <p>Review signed prescription records, pharmacy dosing schedules, and laboratory evaluation requests.</p>
        </div>
      </header>

      {errorMsg && (
        <div className="ph-error-banner ph-animate-slide-up">
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="ph-layout-grid">
        <aside className="ph-sidebar-panel">
          <div className="ph-search-filter-box">
            <Search size={16} className="ph-search-icon" />
            <input
              type="text"
              placeholder="Filter by title, doctor, diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="ph-list-title">
            <SlidersHorizontal size={14} />
            <span>Available Records ({filteredPrescriptions.length})</span>
          </div>

          <div className="ph-cards-stack">
            {filteredPrescriptions.length > 0 ? (
              filteredPrescriptions.map((rec) => {
                const isSelected = selectedRecord?._id === rec._id;
                const dateStr = formatDate(rec.appointmentId?.appointment_date);

                return (
                  <button
                    key={rec._id}
                    type="button"
                    className={`ph-summary-card ${isSelected ? "ph-active" : ""}`}
                    onClick={() => setSelectedRecord(rec)}
                  >
                    <div className="ph-card-header-row">
                      <h4>{rec.prescriptionName || "General Prescription"}</h4>
                      <Eye size={14} className="ph-view-indicator" />
                    </div>

                    <span className="ph-badge-diagnosis">{rec.diagnosis || "No Diagnosis Tag"}</span>

                    <div className="ph-card-footer-meta">
                      <span>
                        <User size={12} />
                        {rec.doctorName || "Doctor"}
                      </span>
                      <span>
                        <Calendar size={12} />
                        {dateStr}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="ph-empty-state-sidebar">
                <Activity size={28} />
                <p>No matching clinical summary files found.</p>
              </div>
            )}
          </div>
        </aside>

        <main className="ph-display-canvas">
          {!selectedRecord ? (
            <div className="ph-empty-overlay ph-animate-fade-in">
              <FileText size={48} />
              <h3>No Record Selected</h3>
              <p>Please select a prescription record from the left panel to read details.</p>
            </div>
          ) : (
            <div className="ph-record-document ph-animate-slide-up" key={selectedRecord._id}>
              <section className="ph-doc-identity-strip">
                <div className="ph-strip-block">
                  <span className="ph-strip-label">Authorized Clinician</span>
                  <div className="ph-strip-value value-highlight">
                    <Award size={14} />
                    {selectedRecord.doctorName || "N/A"}
                  </div>
                </div>

                <div className="ph-strip-block">
                  <span className="ph-strip-label">Consultation Date</span>
                  <div className="ph-strip-value">
                    <Calendar size={14} />
                    {formatDate(selectedRecord.appointmentId?.appointment_date)}
                  </div>
                </div>

                <div className="ph-strip-block">
                  <span className="ph-strip-label">Allocated Time Slot</span>
                  <div className="ph-strip-value">
                    <Clock size={14} />
                    {selectedRecord.appointmentId?.time_slot || "N/A"}
                  </div>
                </div>

                <div className="ph-strip-full-row">
                  <span className="ph-strip-label">Chief Visit Complaint</span>
                  <p className="ph-strip-text">
                    {selectedRecord.appointmentId?.reason_for_visit || "General assessment and check-up."}
                  </p>
                </div>
              </section>

              <div className="ph-section-container">
                <h3 className="ph-section-header">
                  <FileText size={16} />
                  Clinical Diagnostic Details
                </h3>

                <div className="ph-meta-card-block">
                  <div className="ph-meta-item">
                    <label>Assigned Medical Diagnosis</label>
                    <p className="ph-text-emphasized">{selectedRecord.diagnosis || "N/A"}</p>
                  </div>

                  <div className="ph-meta-item">
                    <label>Post-Consultation Assessment Finding</label>
                    <p>{selectedRecord.result || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="ph-section-container">
                <h3 className="ph-section-header">
                  <FileSpreadsheet size={16} />
                  Pharmaceutical Dosing Plan
                </h3>

                {Array.isArray(selectedRecord.medicines) && selectedRecord.medicines.length > 0 ? (
                  <div className="ph-table-responsive-wrapper">
                    <table className="ph-dosing-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th className="ph-center-cell">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.medicines.map((med, idx) => (
                          <tr key={`${med.medicine || "medicine"}-${idx}`}>
                            <td className="ph-td-bold">{med.medicine || "N/A"}</td>
                            <td>{med.dosage || "N/A"}</td>
                            <td className="ph-center-cell">
                              <span className="ph-days-pill">{med.days || 0} Days</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="ph-no-data-fallback-block">No medicine plan was added for this prescription.</div>
                )}
              </div>

              <div className="ph-section-container">
                <h3 className="ph-section-header">
                  <Beaker size={16} />
                  Laboratory Evaluation Requests
                </h3>

                {Array.isArray(selectedRecord.labReports) && selectedRecord.labReports.length > 0 ? (
                  <ul className="ph-labs-checklist-grid">
                    {selectedRecord.labReports.map((lab, idx) => (
                      <li key={`${lab}-${idx}`} className="ph-lab-item">
                        <div className="ph-checkbox-mock" />
                        <span>{lab}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="ph-no-data-fallback-block">No laboratory reports were requested for this visit.</div>
                )}
              </div>

              {selectedRecord.notes && (
                <div className="ph-section-container">
                  <h3 className="ph-section-header">
                    <FileText size={16} />
                    Supplementary Care Directives
                  </h3>

                  <div className="ph-notes-callout-box">
                    <p>{selectedRecord.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}