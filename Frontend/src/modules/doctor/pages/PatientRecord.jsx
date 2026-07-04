import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  User,
  FileText,
  Trash2,
  Save,
  Activity,
  Clipboard,
  Beaker,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronDown,
  Calendar,
  PlusCircle
} from "lucide-react";
import "../style/PatientRecord.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return dateStr.toString().includes("T") ? dateStr.split("T")[0] : dateStr;
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isPastAppointmentTime = (appointmentDate, appointmentTime) => {
  const dateStr = formatDate(appointmentDate);
  const todayStr = getLocalDateString(new Date());

  if (!dateStr || dateStr === "N/A") return false;
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  if (!appointmentTime) return false;

  try {
    const startTime = String(appointmentTime).split("-")[0].trim();
    const [hours, minutes] = startTime.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;

    const now = new Date();
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);

    return now > slotTime;
  } catch {
    return false;
  }
};

export default function PatientRecord() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorSpec, setDoctorSpec] = useState("");

  const [patientRoster, setPatientRoster] = useState([]);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState("");
  const [rosterLoading, setRosterLoading] = useState(true);

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const [dbMedicines, setDbMedicines] = useState([]);
  const [dbLabReports, setDbLabReports] = useState([]);
  const [medQueries, setMedQueries] = useState({});
  const [labQueries, setLabQueries] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        if (user?.email) {
          setDoctorEmail(user.email.trim().toLowerCase());
          setDoctorSpec(user.specialization || "General Medicine");
        }
      } catch {
        setMessage({ type: "error", text: "Invalid doctor login session." });
      }
    }
  }, []);

  useEffect(() => {
    if (!doctorEmail || !doctorSpec) return;

    const fetchCatalogs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/doctors/catalogs`, {
          params: {
            specialization: doctorSpec,
            doctorEmail
          }
        });

        setDbMedicines(res.data?.data?.medicines || res.data?.medicines || []);
        setDbLabReports(res.data?.data?.labReports || res.data?.labReports || []);
      } catch (err) {
        console.error("Failed to sync clinical catalogs:", err);
      }
    };

    fetchCatalogs();
  }, [doctorEmail, doctorSpec, API_BASE_URL]);

  const fetchRoster = async () => {
    if (!doctorEmail) return;

    try {
      setRosterLoading(true);

      const res = await axios.get(`${API_BASE_URL}/api/v1/doctors/patients`, {
        params: { doctorEmail }
      });

      const list = res.data?.data || [];
      setPatientRoster(list);

      if (list.length > 0 && !selectedPatientEmail) {
        setSelectedPatientEmail(list[0].patientEmail);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to fetch consulted patient roster." });
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [doctorEmail]);

  const fetchHistory = async (patientEmail) => {
    if (!doctorEmail || !patientEmail) return;

    try {
      setHistoryLoading(true);
      setSelectedRecord(null);
      setIsCreatingNew(false);

      const res = await axios.get(`${API_BASE_URL}/api/v1/doctors/patients/history`, {
        params: {
          doctorEmail,
          patientEmail
        }
      });

      setHistoryData(res.data?.data || null);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch patient clinical history." });
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientEmail) {
      fetchHistory(selectedPatientEmail);
    }
  }, [selectedPatientEmail, doctorEmail]);

  const handlePatientDropdownChange = (e) => {
    setSelectedPatientEmail(e.target.value);
    setMessage({ type: "", text: "" });
  };

  const combinedTimelineList = useMemo(() => {
    if (!historyData) return [];

    return (historyData.timeline || [])
      .map((item) => ({
        id: item.appointmentId,
        appointmentId: item.appointmentId,
        appointmentDate: item.date,
        appointmentTime: item.time,
        appointmentReason: item.reason,
        status: item.status,
        prescription: item.prescription
      }))
      .filter((item) => {
        const hasPrescription = !!item.prescription;
        const appointmentAlreadyPassed = isPastAppointmentTime(item.appointmentDate, item.appointmentTime);

        return hasPrescription || appointmentAlreadyPassed;
      });
  }, [historyData]);

  const filteredTimeline = combinedTimelineList.filter((item) => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return true;

    const diag = (item.prescription?.diagnosis || "").toLowerCase();
    const title = (item.prescription?.prescriptionName || "").toLowerCase();
    const reason = (item.appointmentReason || "").toLowerCase();

    return diag.includes(term) || title.includes(term) || reason.includes(term);
  });

  const handleSelectTimelineItem = (item) => {
    setMessage({ type: "", text: "" });
    setMedQueries({});
    setLabQueries({});

    if (item.prescription) {
      setIsCreatingNew(false);
      setSelectedRecord({
        ...item.prescription,
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        appointmentReason: item.appointmentReason,
        appointmentStatus: item.status
      });
      return;
    }

    setIsCreatingNew(true);
    setSelectedRecord({
      appointmentId: item.appointmentId,
      patientEmail: selectedPatientEmail,
      prescriptionName: "",
      diagnosis: "",
      notes: "",
      result: "",
      medicines: [{ medicine: "", dosage: "", days: "" }],
      labReports: [""],
      appointmentDate: item.appointmentDate,
      appointmentTime: item.appointmentTime,
      appointmentReason: item.appointmentReason,
      appointmentStatus: item.status
    });
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setSelectedRecord((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicineChange = (idx, field, value) => {
    const updatedMeds = [...(selectedRecord.medicines || [])];
    updatedMeds[idx] = { ...updatedMeds[idx], [field]: value };
    setSelectedRecord((prev) => ({ ...prev, medicines: updatedMeds }));
  };

  const handleMedTyping = (idx, val) => {
    handleMedicineChange(idx, "medicine", val);
    setMedQueries((prev) => ({ ...prev, [idx]: true }));
  };

  const selectMedSuggestion = (idx, name) => {
    handleMedicineChange(idx, "medicine", name);
    setMedQueries((prev) => ({ ...prev, [idx]: false }));
  };

  const addMedicineRow = () => {
    setSelectedRecord((prev) => ({
      ...prev,
      medicines: [...(prev.medicines || []), { medicine: "", dosage: "", days: "" }]
    }));
  };

  const removeMedicineRow = (idx) => {
    const updatedMeds = (selectedRecord.medicines || []).filter((_, i) => i !== idx);
    setSelectedRecord((prev) => ({ ...prev, medicines: updatedMeds }));
  };

  const handleLabTyping = (idx, val) => {
    const updatedLabs = [...(selectedRecord.labReports || [])];
    updatedLabs[idx] = val;
    setSelectedRecord((prev) => ({ ...prev, labReports: updatedLabs }));
    setLabQueries((prev) => ({ ...prev, [idx]: true }));
  };

  const selectLabSuggestion = (idx, name) => {
    const updatedLabs = [...(selectedRecord.labReports || [])];
    updatedLabs[idx] = name;
    setSelectedRecord((prev) => ({ ...prev, labReports: updatedLabs }));
    setLabQueries((prev) => ({ ...prev, [idx]: false }));
  };

  const addLabRow = () => {
    setSelectedRecord((prev) => ({
      ...prev,
      labReports: [...(prev.labReports || []), ""]
    }));
  };

  const removeLabRow = (idx) => {
    const updatedLabs = (selectedRecord.labReports || []).filter((_, i) => i !== idx);
    setSelectedRecord((prev) => ({ ...prev, labReports: updatedLabs }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRecord?.result?.trim()) {
      setMessage({ type: "error", text: "Summary result verification is required." });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: "", text: "" });

      const cleanMedicines = (selectedRecord.medicines || []).filter(
        (m) => m.medicine && m.medicine.trim() !== ""
      );

      const cleanLabReports = (selectedRecord.labReports || []).filter(
        (l) => l && l.trim() !== ""
      );

      const payload = {
        appointmentId: selectedRecord.appointmentId,
        patientEmail: selectedRecord.patientEmail,
        doctorEmail,
        prescriptionName: selectedRecord.prescriptionName,
        diagnosis: selectedRecord.diagnosis,
        notes: selectedRecord.notes,
        result: selectedRecord.result,
        medicines: cleanMedicines,
        labReports: cleanLabReports
      };

      if (isCreatingNew) {
        const res = await axios.post(`${API_BASE_URL}/api/v1/doctors/e-prescription`, payload);
        const created = res.data?.data;

        setMessage({ type: "success", text: "Prescription initialized and signed successfully." });
        setIsCreatingNew(false);

        setHistoryData((prev) => ({
          ...prev,
          prescriptions: [...(prev.prescriptions || []), created],
          timeline: (prev.timeline || []).map((t) =>
            t.appointmentId === created.appointmentId ? { ...t, prescription: created } : t
          )
        }));

        setSelectedRecord({
          ...created,
          appointmentDate: selectedRecord.appointmentDate,
          appointmentTime: selectedRecord.appointmentTime,
          appointmentReason: selectedRecord.appointmentReason,
          appointmentStatus: selectedRecord.appointmentStatus
        });
      } else {
        const res = await axios.patch(
          `${API_BASE_URL}/api/v1/doctors/e-prescription/${selectedRecord._id}`,
          payload
        );

        const updated = res.data?.data;

        setMessage({ type: "success", text: "Patient record updated successfully." });

        setHistoryData((prev) => ({
          ...prev,
          prescriptions: (prev.prescriptions || []).map((p) => (p._id === updated._id ? updated : p)),
          timeline: (prev.timeline || []).map((t) =>
            t.prescription?._id === updated._id ? { ...t, prescription: updated } : t
          )
        }));

        setSelectedRecord({
          ...updated,
          appointmentDate: selectedRecord.appointmentDate,
          appointmentTime: selectedRecord.appointmentTime,
          appointmentReason: selectedRecord.appointmentReason,
          appointmentStatus: selectedRecord.appointmentStatus
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed saving data parameters." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!window.confirm("Are you absolutely sure you want to permanently delete this clinical record? This action cannot be undone.")) return;

    try {
      setSubmitting(true);
      setMessage({ type: "", text: "" });

      await axios.delete(
        `${API_BASE_URL}/api/v1/doctors/e-prescription/${selectedRecord._id}`,
        {
          params: { doctorEmail }
        }
      );

      setMessage({ type: "success", text: "Prescription record deleted successfully." });

      setHistoryData((prev) => ({
        ...prev,
        prescriptions: (prev.prescriptions || []).filter((p) => p._id !== selectedRecord._id),
        timeline: (prev.timeline || []).map((t) =>
          t.prescription?._id === selectedRecord._id ? { ...t, prescription: null } : t
        )
      }));

      setSelectedRecord(null);
      setIsCreatingNew(false);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to remove record." });
    } finally {
      setSubmitting(false);
    }
  };

  if (rosterLoading && !patientRoster.length) {
    return (
      <div className="pr-console-root">
        <div className="pr-skeleton-title" />
        <div className="pr-split-workspace">
          <div className="pr-skeleton-card" style={{ height: "400px" }} />
          <div className="pr-skeleton-card" style={{ height: "400px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="pr-console-root pr-fade-in">
      <div className="pr-console-header">
        <div className="pr-header-meta">
          <h1>Consulted Patient Archives</h1>
          <p>Review, update parameters, initialize entries or delete completed clinical records assigned to patients.</p>
        </div>
      </div>

      {message.text && (
        <div className={`pr-alert ${message.type === "error" ? "err-box" : "ok-box"}`}>
          {message.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="pr-patient-dropdown-bar">
        <label className="pr-dropdown-label">
          <User size={16} />
          Select Patient Chart
        </label>

        <div className="pr-dropdown-wrapper">
          <select value={selectedPatientEmail} onChange={handlePatientDropdownChange} disabled={patientRoster.length === 0}>
            {patientRoster.length === 0 && <option value="">No consulted patients found</option>}
            {patientRoster.map((p) => (
              <option key={p.patientEmail} value={p.patientEmail}>
                {p.patientName} - {p.totalVisits} visit{p.totalVisits !== 1 ? "s" : ""}, {p.totalPrescriptions} prescription{p.totalPrescriptions !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pr-dropdown-chevron" />
        </div>
      </div>

      <div className="pr-split-workspace">
        <div className="pr-patients-sidebar-card">
          <div className="pr-search-box-wrapper">
            <Search size={16} className="pr-search-icon" />
            <input
              type="text"
              placeholder="Search completed appointment records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="pr-sidebar-title">
            <Clipboard size={16} />
            Patient Consultation Records ({filteredTimeline.length})
          </div>

          {historyLoading ? (
            <div className="pr-skeleton-card" style={{ height: "200px" }} />
          ) : (
            <div className="pr-patients-nodes-stack">
              {filteredTimeline.length > 0 ? (
                filteredTimeline.map((item) => {
                  const hasPrescription = !!item.prescription;
                  const isCurrentSelection = selectedRecord && selectedRecord.appointmentId === item.appointmentId;

                  let nodeStatusClass = "";

                  if (!hasPrescription) {
                    nodeStatusClass = item.status === "confirmed" ? "node-confirmed-active" : "node-pending-action";
                  }

                  return (
                    <div
                      key={item.id}
                      className={`pr-patient-node ${isCurrentSelection ? "active" : ""} ${nodeStatusClass}`}
                      onClick={() => handleSelectTimelineItem(item)}
                    >
                      <div className="pr-patient-meta">
                        <strong>
                          {hasPrescription
                            ? item.prescription.prescriptionName || "Untitled Prescription"
                            : "Completed Appointment Record"}
                        </strong>

                        <span className={`pr-diag-tag ${!hasPrescription ? "tag-missing" : ""}`}>
                          {hasPrescription
                            ? item.prescription.diagnosis || "Diagnosis Missing"
                            : "Prescription Not Signed"}
                        </span>

                        <span>
                          <Calendar size={12} />
                          {formatDate(item.appointmentDate)}
                          {item.appointmentTime ? ` - ${item.appointmentTime}` : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="pr-empty-fallback">
                  <Activity size={32} />
                  <p>No completed appointment records found. Upcoming pending or confirmed appointments are hidden from this page.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pr-form-canvas-card">
          {!selectedRecord ? (
            <div className="pr-placeholder-overlay">
              <Clipboard size={44} />
              <h3>No Selected Record File</h3>
              <p>Select a completed consultation record from the left side panel to view details, configure edits, or sign missing prescriptions.</p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="pr-intake-form pr-fade-in">
              <div className="pr-context-strip">
                <div>
                  <strong>Patient Name:</strong> {historyData?.patient?.name || "Unknown"}
                </div>

                <div>
                  <strong>Identifier Email:</strong> {selectedRecord.patientEmail}
                </div>

                <div>
                  <strong>Consult Status:</strong>{" "}
                  <span className={`pr-text-badge text-${selectedRecord.appointmentStatus}`}>
                    {isCreatingNew ? `Draft (${selectedRecord.appointmentStatus})` : "Historical Record Archival"}
                  </span>
                </div>

                <div className="pr-full-strip">
                  <strong>Visit Slot Date:</strong> {formatDate(selectedRecord.appointmentDate)}
                  {selectedRecord.appointmentTime ? ` (${selectedRecord.appointmentTime})` : ""}
                </div>

                <div className="pr-full-strip">
                  <strong>Chief Complaint Reason:</strong> {selectedRecord.appointmentReason || "Routine check-up track consult."}
                </div>
              </div>

              <div className="pr-form-grid">
                <div className="pr-input-block">
                  <label>Prescription Sheet Title</label>
                  <input
                    type="text"
                    name="prescriptionName"
                    placeholder="e.g., Post-Viral Cough Therapy Protocol"
                    value={selectedRecord.prescriptionName || ""}
                    onChange={handleFieldChange}
                  />
                </div>

                <div className="pr-input-block">
                  <label>Clinical Primary Diagnosis</label>
                  <input
                    type="text"
                    name="diagnosis"
                    placeholder="e.g., Acute Post-Infectious Bronchitis"
                    value={selectedRecord.diagnosis || ""}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>

              <div className="pr-section-block">
                <div className="pr-section-header">
                  <FileSpreadsheet size={16} />
                  Pharmaceutical Dosing Plan
                </div>

                {(selectedRecord.medicines || []).map((med, idx) => {
                  const queryText = (med.medicine || "").toLowerCase();

                  const filteredSuggestions = (dbMedicines || []).filter(
                    (m) =>
                      m.medicine_name?.toLowerCase().includes(queryText) &&
                      queryText.trim() !== "" &&
                      m.medicine_name?.toLowerCase() !== queryText
                  );

                  return (
                    <div key={idx} className="pr-med-row">
                      <div className="pr-input-block flex-3 relative-container">
                        <label>Medicine Name</label>
                        <input
                          type="text"
                          value={med.medicine || ""}
                          required
                          placeholder="Type to filter medical catalogs..."
                          onChange={(e) => handleMedTyping(idx, e.target.value)}
                          onFocus={() => setMedQueries((p) => ({ ...p, [idx]: true }))}
                          onBlur={() => setTimeout(() => setMedQueries((p) => ({ ...p, [idx]: false })), 200)}
                        />

                        {medQueries[idx] && filteredSuggestions.length > 0 && (
                          <div className="suggestion-dropdown-float-board">
                            {filteredSuggestions.map((m, sIdx) => (
                              <div key={sIdx} className="suggestion-item-row" onMouseDown={() => selectMedSuggestion(idx, m.medicine_name)}>
                                {m.medicine_name} <small>({m.category || "General"})</small>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pr-input-block flex-2">
                        <label>Dosage Strategy</label>
                        <input
                          type="text"
                          value={med.dosage || ""}
                          required
                          placeholder="e.g., 1 tablet daily for 5 days"
                          onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                        />
                      </div>

                      <div className="pr-input-block flex-1">
                        <label>Dosage Ratio</label>
                        <input
                          type="number"
                          value={med.days || ""}
                          required
                          placeholder="e.g., 5"
                          onChange={(e) => handleMedicineChange(idx, "days", e.target.value)}
                        />
                      </div>

                      <button type="button" className="pr-remove-btn" onClick={() => removeMedicineRow(idx)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}

                <button type="button" className="pr-add-row-btn" onClick={addMedicineRow}>
                  + Append New Medicine Line
                </button>
              </div>

              <div className="pr-section-block">
                <div className="pr-section-header">
                  <Beaker size={16} />
                  Laboratory Evaluation Requests
                </div>

                {(selectedRecord.labReports || []).map((lab, idx) => {
                  const queryText = (lab || "").toLowerCase();

                  const filteredLabs = (dbLabReports || []).filter(
                    (l) =>
                      l.report_name?.toLowerCase().includes(queryText) &&
                      queryText.trim() !== "" &&
                      l.report_name?.toLowerCase() !== queryText
                  );

                  return (
                    <div key={idx} className="pr-lab-row">
                      <div style={{ flex: 1 }} className="relative-container">
                        <input
                          type="text"
                          value={lab || ""}
                          required
                          placeholder="Search diagnostic panels..."
                          onChange={(e) => handleLabTyping(idx, e.target.value)}
                          onFocus={() => setLabQueries((p) => ({ ...p, [idx]: true }))}
                          onBlur={() => setTimeout(() => setLabQueries((p) => ({ ...p, [idx]: false })), 200)}
                        />

                        {labQueries[idx] && filteredLabs.length > 0 && (
                          <div className="suggestion-dropdown-float-board">
                            {filteredLabs.map((l, sIdx) => (
                              <div key={sIdx} className="suggestion-item-row" onMouseDown={() => selectLabSuggestion(idx, l.report_name)}>
                                {l.report_name} <small>[{l.category || "Diagnostic"}]</small>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button type="button" className="pr-remove-btn" onClick={() => removeLabRow(idx)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}

                <button type="button" className="pr-add-row-btn" onClick={addLabRow}>
                  + Add Additional Lab Panel Request
                </button>
              </div>

              <div className="pr-section-block">
                <div className="pr-section-header">
                  <FileText size={16} />
                  Directives & Outcomes
                </div>

                <div className="pr-input-block">
                  <label>Supplementary Care Directives</label>
                  <textarea
                    name="notes"
                    placeholder="Lifestyle advice, follow-up constraints..."
                    value={selectedRecord.notes || ""}
                    onChange={handleFieldChange}
                  />
                </div>

                <div className="pr-input-block" style={{ marginTop: "1rem" }}>
                  <label>
                    Post-Consultation Summary Result <span className="pr-req">*</span>
                  </label>
                  <textarea
                    name="result"
                    required
                    placeholder="Clinical summary status findings outcome data..."
                    value={selectedRecord.result || ""}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>

              <div className="pr-action-button-group">
                {isCreatingNew ? (
                  <button type="submit" disabled={submitting} className="pr-btn-save btn-create-accent">
                    <PlusCircle size={16} />
                    {submitting ? "Signing Record..." : "Authorize & Sign E-Prescription"}
                  </button>
                ) : (
                  <>
                    <button type="submit" disabled={submitting} className="pr-btn-save">
                      <Save size={16} />
                      {submitting ? "Saving..." : "Save Historical Changes"}
                    </button>

                    <button type="button" disabled={submitting} className="pr-btn-delete" onClick={handleDeleteRecord}>
                      <Trash2 size={16} />
                      Delete Record
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}