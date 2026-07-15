import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  FileText,
  Activity,
  Award,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  X
} from "lucide-react";
import "../style/Receptionistappointmentmanage.css";

const emptyPatientData = { firstName: "", lastName: "", email: "" };
const emptyBookingForm = {
  specialization: "",
  doctorEmail: "",
  selectedDate: "",
  selectedTime: "",
  symptoms: "",
  additionalNotes: ""
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDate = (value) => {
  if (!value) return "";
  return String(value).split("T")[0];
};

const getAppointmentId = (apt) => apt.id || apt._id;

const getPatientNamesFromAppointment = (apt) => {
  const firstName = apt.patientFirstName || apt.firstName || apt.patient?.firstName || "";
  const lastName = apt.patientLastName || apt.lastName || apt.patient?.lastName || "";
  if (firstName || lastName) return { firstName, lastName };
  const nameParts = String(apt.patientName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "" };
};

const isPastTimeSlot = (appointmentDate, timeSlotString) => {
  const dateStr = normalizeDate(appointmentDate);
  const todayStr = formatLocalDate(new Date());
  if (!dateStr) return false;
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  try {
    const startTimeStr = String(timeSlotString || "").split("-")[0].trim();
    const [hours, minutes] = startTimeStr.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;
    const currentTime = new Date();
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    return currentTime > slotTime;
  } catch {
    return false;
  }
};

const SPECIALIZATIONS = ["General Medicine", "Physiotherapy", "Cardiology", "Neurology"];

export default function Receptionistappointmentmanage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [isBookingMode, setIsBookingMode] = useState(false);
  const [patientData, setPatientData] = useState(emptyPatientData);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [doctorsFromDb, setDoctorsFromDb] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState({ defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const storedUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  const [email, setEmail] = useState(
    JSON.parse(storedUser || "{}").email || ""
  );
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [isRescheduleMode, setIsRescheduleMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [expandedAptIds, setExpandedAptIds] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [searchTerm, setSearchTerm] = useState("");

  const todayStr = formatLocalDate(new Date());

  const resetBookingState = () => {
    setPatientData(emptyPatientData);
    setBookingForm(emptyBookingForm);
    setEditingAppointmentId(null);
    setIsRescheduleMode(false);
    setSelectedDoctorProfile(null);
    setDoctorsFromDb([]);
    setDoctorAvailability({ defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
  };

  const openNewAppointmentForm = () => {
    resetBookingState();
    setIsBookingMode(true);
  };

  const closeBookingForm = () => {
    resetBookingState();
    setIsBookingMode(false);
  };

  const fetchPatientLedger = async () => {

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/receptionist/appointments`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        }
      });
      setAppointments(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to query appointment records.", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatientLedger(); }, [API_BASE_URL]);

  useEffect(() => {
    if (!bookingForm.specialization) { setDoctorsFromDb([]); return; }
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/patients/doctors-by-spec`, {
          params: { specialization: bookingForm.specialization },
          headers: {
            "Content-Type": "application/json",
            "x-user-email": email
          }
        });
        setDoctorsFromDb(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch { setDoctorsFromDb([]); }
    };
    fetchDoctors();
  }, [bookingForm.specialization, API_BASE_URL, email]);

  useEffect(() => {
    if (!bookingForm.doctorEmail) { setSelectedDoctorProfile(null); return; }
    const fetchDoctorMetadataAndSlots = async () => {
      try {
        setSlotsLoading(true);
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth() + 1;
        const [slotsRes, profileRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/v1/patients/doctor-slots-live`, {
            params: { email: bookingForm.doctorEmail, year, month },
            headers: { "x-user-email": email }
          }),
          axios.get(`${API_BASE_URL}/api/v1/patients/public-doctor-meta`, {
            params: { email: bookingForm.doctorEmail },
            headers: { "x-user-email": email }
          })
        ]);
        setDoctorAvailability(slotsRes.data?.data || { defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
        setSelectedDoctorProfile(profileRes.data?.data?.profileData || null);
      } catch {
        setDoctorAvailability({ defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
        setSelectedDoctorProfile(null);
      } finally { setSlotsLoading(false); }
    };
    fetchDoctorMetadataAndSlots();
  }, [bookingForm.doctorEmail, currentCalDate, API_BASE_URL, email]);

  const getSlotsForDate = (dateStr) => {
    if (!dateStr || !doctorAvailability || dateStr < todayStr) return [];
    if (doctorAvailability.customDayOverrides?.[dateStr] !== undefined) return doctorAvailability.customDayOverrides[dateStr];
    const [year, month, day] = dateStr.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];
    return doctorAvailability.defaultWeeklySlots || [];
  };

  const isFormReady = useMemo(() => (
    patientData.firstName.trim() &&
    patientData.lastName.trim() &&
    patientData.email.trim() &&
    bookingForm.specialization &&
    bookingForm.doctorEmail &&
    bookingForm.selectedDate &&
    bookingForm.selectedTime &&
    bookingForm.symptoms.trim()
  ), [patientData, bookingForm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientDataChange = (e) => {
    if (isRescheduleMode) return;
    const { name, value } = e.target;
    setPatientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (dateObj) => {
    const formatted = formatLocalDate(dateObj);
    if (formatted < todayStr) return;
    setBookingForm((prev) => ({ ...prev, selectedDate: formatted, selectedTime: "" }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!isFormReady) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/v1/receptionist/receptionist-book-request`,
        {
          firstName: patientData.firstName.trim(),
          lastName: patientData.lastName.trim(),
          patientEmail: patientData.email.trim().toLowerCase(),
          doctorEmail: bookingForm.doctorEmail,
          specialization: bookingForm.specialization,
          date: bookingForm.selectedDate,
          time: bookingForm.selectedTime,
          symptoms: bookingForm.symptoms.trim(),
          additionalNotes: bookingForm.additionalNotes.trim(),
          appointmentId: editingAppointmentId || undefined
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-user-email": email
          }
        }
      );

      alert(
        editingAppointmentId
          ? "Appointment rescheduled successfully."
          : "Appointment created successfully."
      );

      closeBookingForm();
      fetchPatientLedger();

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to save appointment request."
      );
    }
  };

  const handleDirectAction = async (appointmentId, action) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`${appointmentId}_${action}`]: true }));
      await axios.patch(`${API_BASE_URL}/api/v1/receptionist/appointments/${appointmentId}/action`, { action }, {
        headers: { "Content-Type": "application/json", "x-user-email": email }
      });
      alert(action === "confirm" ? "Appointment confirmed." : action === "reject" ? "Appointment rejected." : "Appointment cancelled.");
      fetchPatientLedger();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} appointment.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${appointmentId}_${action}`]: false }));
    }
  };

  const handleTriggerReschedule = (apt) => {
    const appointmentId = getAppointmentId(apt);
    const date = normalizeDate(apt.date || apt.appointment_date);
    const time = apt.time || apt.time_slot || "";
    const status = apt.status || "pending";
    if (status === "rejected" || status === "cancelled" || isPastTimeSlot(date, time)) return;
    const names = getPatientNamesFromAppointment(apt);
    setPatientData({ firstName: names.firstName, lastName: names.lastName, email: apt.patientEmail || apt.patient?.email || "" });
    setEditingAppointmentId(appointmentId);
    setIsRescheduleMode(true);
    setBookingForm({
      specialization: apt.specialization || "General Medicine",
      doctorEmail: apt.doctorEmail || apt.doctor?.email || "",
      selectedDate: date >= todayStr ? date : "",
      selectedTime: date >= todayStr ? time : "",
      symptoms: apt.reason || apt.symptoms || "",
      additionalNotes: apt.additionalNotes || apt.notes || "Reschedule requested by receptionist."
    });
    setIsBookingMode(true);
  };

  const calculateExperience = (startDateStr) => {
    if (!startDateStr) return "N/A";
    const ageDifMs = Date.now() - new Date(startDateStr).getTime();
    return Math.max(0, Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970));
  };

  const toggleAccordion = (id) => setExpandedAptIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay();

  const getStatusLabel = (status, date, time) => {
    const isPast = isPastTimeSlot(date, time);
    if (status === "pending" && isPast) return "Expired Request";
    if (status === "confirmed" && isPast) return "Concluded Session";
    if (status === "confirmed") return "Active Schedule";
    if (status === "rejected") return "Request Declined";
    if (status === "cancelled") return "Cancelled Visit";
    return "Awaiting Signoff";
  };

  const getStatusClass = (apt) => {
    if (apt.status === "pending" && isPastTimeSlot(apt.date, apt.time)) return "expired";
    return apt.status || "pending";
  };

  const sortChronologically = (a, b) => {
    const aDate = normalizeDate(a.date);
    const bDate = normalizeDate(b.date);
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return String(a.time || "").localeCompare(String(b.time || ""));
  };

  const normalizedAppointments = useMemo(() => appointments.map((apt) => ({
    ...apt,
    id: getAppointmentId(apt),
    date: normalizeDate(apt.date || apt.appointment_date),
    time: apt.time || apt.time_slot || "",
    patientName: apt.patientName || `${apt.patientFirstName || apt.patient?.firstName || ""} ${apt.patientLastName || apt.patient?.lastName || ""}`.trim() || "Patient",
    patientEmail: apt.patientEmail || apt.patient?.email || "",
    doctorName: apt.doctorName || apt.doctor?.name || "Doctor",
    doctorEmail: apt.doctorEmail || apt.doctor?.email || "",
    doctorqualification: apt.doctorqualification || "N/A",
    specialization: apt.specialization || "General Medicine",
    reason: apt.reason || apt.symptoms || apt.reason_for_visit || ""
  })), [appointments]);

  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return normalizedAppointments;
    const term = searchTerm.toLowerCase();
    return normalizedAppointments.filter((apt) =>
      apt.patientName.toLowerCase().includes(term) ||
      apt.patientEmail.toLowerCase().includes(term) ||
      apt.doctorName.toLowerCase().includes(term) ||
      apt.doctorEmail.toLowerCase().includes(term) ||
      apt.specialization.toLowerCase().includes(term) ||
      apt.reason.toLowerCase().includes(term) ||
      apt.date.includes(term)
    );
  }, [normalizedAppointments, searchTerm]);

  const categorizedLedgers = useMemo(() => {
    const lists = { confirmed: [], pending: [], visited: [], cancelled: [] };
    filteredAppointments.forEach((apt) => {
      const isPast = isPastTimeSlot(apt.date, apt.time);
      if (apt.status === "cancelled" || apt.status === "rejected") { lists.cancelled.push(apt); }
      else if (apt.status === "pending" && isPast) { lists.cancelled.push(apt); }
      else if (apt.status === "confirmed" && isPast) { lists.visited.push(apt); }
      else if (apt.status === "confirmed") { lists.confirmed.push(apt); }
      else { lists.pending.push(apt); }
    });
    lists.confirmed.sort(sortChronologically);
    lists.pending.sort(sortChronologically);
    lists.visited.sort(sortChronologically);
    lists.cancelled.sort(sortChronologically);
    return lists;
  }, [filteredAppointments]);

  const renderAppointmentCardList = (list) => list.map((apt) => {
    const appointmentId = getAppointmentId(apt);
    const isPastTimeline = isPastTimeSlot(apt.date, apt.time);
    const isExpiredPending = apt.status === "pending" && isPastTimeline;
    const isStatusLocked = apt.status === "rejected" || apt.status === "cancelled" || isExpiredPending;
    const isTotalLocked = isStatusLocked || isPastTimeline;
    const isExpanded = !!expandedAptIds[appointmentId];

    return (
      <div key={appointmentId} className={`ledger-apt-node-card ${isExpanded ? "expanded-shadow" : ""}`}>
        <button type="button" className="apt-card-main-row" onClick={() => toggleAccordion(appointmentId)}>
          <div className="card-primary-block">
            <strong>{apt.patientName}</strong>
            <span className="spec-label">{apt.doctorName} · {apt.specialization}</span>
          </div>
          <div className="card-timing-block">
            <span>{apt.date}</span>
            <small>{apt.time}</small>
          </div>
          <div className="card-status-block">
            <span className={`status-badge tag-${getStatusClass(apt)}`}>
              {getStatusLabel(apt.status, apt.date, apt.time)}
            </span>
          </div>
          <div className="card-toggle-icon">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isExpanded && (
          <div className="apt-card-expanded-accordion animate-slide-up">
            <div className="accordion-details-grid">
              <div>
                <label>Patient Email</label>
                <p>{apt.patientEmail || "N/A"}</p>
              </div>
              <div>
                <label>Doctor Email</label>
                <p>{apt.doctorEmail || "N/A"}</p>
              </div>
              {apt.doctorqualification && apt.doctorqualification !== "N/A" && (
                <div>
                  <label>Qualification</label>
                  <p>{apt.doctorqualification}</p>
                </div>
              )}
              <div className="grid-wide">
                <label>Stated Complaints / Reason</label>
                <p>{apt.reason || "No explicit symptoms provided."}</p>
              </div>
            </div>

            <div className="accordion-actions-strip">
              {apt.status === "pending" && !isPastTimeline && (
                <>
                  <button
                    type="button"
                    className="action-btn btn-confirm-accent"
                    disabled={!!actionLoading[`${appointmentId}_confirm`]}
                    onClick={() => handleDirectAction(appointmentId, "confirm")}
                  >
                    <CheckCircle2 size={14} />
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="action-btn btn-reject-accent"
                    disabled={!!actionLoading[`${appointmentId}_reject`]}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to reject this appointment request?")) {
                        handleDirectAction(appointmentId, "reject");
                      }
                    }}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </>
              )}
              {!isTotalLocked && (
                <>
                  <button type="button" className="action-btn btn-resched" onClick={() => handleTriggerReschedule(apt)}>
                    <RefreshCw size={14} />
                    Reschedule
                  </button>
                  <button
                    type="button"
                    className="action-btn btn-cancel"
                    disabled={!!actionLoading[`${appointmentId}_cancel`]}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to cancel this appointment?")) {
                        handleDirectAction(appointmentId, "cancel");
                      }
                    }}
                  >
                    <XCircle size={14} />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="pt-apt-root animate-fade-in">
      <div className="pt-apt-header">
        <div className="header-meta">
          <h2>Clinical Consultations & Bookings</h2>
          <p>Schedule new sessions, evaluate clinical timelines, and coordinate patient appointments.</p>
        </div>
        <div className="header-actions-group-row">
          <button className="rd-refresh-action-btn" type="button" onClick={fetchPatientLedger} disabled={loading}>
            <RefreshCw size={14} className={loading ? "rd-spin" : ""} />
            Refresh
          </button>
          {!isBookingMode && (
            <button className="book-trigger-btn" type="button" onClick={openNewAppointmentForm}>
              <CalendarPlus size={16} />
              New Appointment
            </button>
          )}
        </div>
      </div>

      {isBookingMode ? (
        <div className="booking-split-canvas animate-fade-in">
          <form className="booking-form-panel" onSubmit={handleFormSubmit}>
            <div className="form-section-title">
              <FileText size={16} />
              <span>{editingAppointmentId ? "Reschedule Appointment" : "New Appointment Intake"}</span>
            </div>

            <div className="disabled-demographics-grid">
              <div className="input-node">
                <label>Patient First Name <span className="req-marker">*</span></label>
                <input type="text" name="firstName" value={patientData.firstName} onChange={handlePatientDataChange} required disabled={isRescheduleMode} placeholder="Enter first name" />
              </div>
              <div className="input-node">
                <label>Patient Last Name <span className="req-marker">*</span></label>
                <input type="text" name="lastName" value={patientData.lastName} onChange={handlePatientDataChange} required disabled={isRescheduleMode} placeholder="Enter last name" />
              </div>
              <div className="input-node full-width">
                <label>Patient Registered Email <span className="req-marker">*</span></label>
                <input type="email" name="email" value={patientData.email} onChange={handlePatientDataChange} required disabled={isRescheduleMode} placeholder="patient@example.com" />
              </div>
            </div>

            <div className="input-node">
              <label>Required Clinical Specialization <span className="req-marker">*</span></label>
              <select name="specialization" required value={bookingForm.specialization} onChange={(e) => {
                setBookingForm((prev) => ({ ...prev, specialization: e.target.value, doctorEmail: "", selectedDate: "", selectedTime: "" }));
                setSelectedDoctorProfile(null);
                setDoctorAvailability({ defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
              }}>
                <option value="">Select category</option>
                {SPECIALIZATIONS.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
              </select>
            </div>

            {bookingForm.specialization && (
              <div className="input-node">
                <label>Available Practitioner <span className="req-marker">*</span></label>
                <select name="doctorEmail" required value={bookingForm.doctorEmail} onChange={(e) => setBookingForm((prev) => ({ ...prev, doctorEmail: e.target.value, selectedDate: "", selectedTime: "" }))}>
                  <option value="">Select doctor</option>
                  {doctorsFromDb.length > 0 ? doctorsFromDb.map((doc) => (
                    <option key={doc.email} value={doc.email}>{doc.name}</option>
                  )) : <option value="" disabled>No doctors found</option>}
                </select>
              </div>
            )}

            {bookingForm.selectedDate && (
              <div className="time-slots-wrapper">
                <label>Available Time Slots on {bookingForm.selectedDate}</label>
                {slotsLoading ? <div className="skeleton-flex-slots-row" /> : (
                  <div className="slots-flex-box">
                    {getSlotsForDate(bookingForm.selectedDate).length > 0 ? getSlotsForDate(bookingForm.selectedDate).map((slot) => {
                      const isSameEditingSlot = editingAppointmentId && appointments.some((apt) => getAppointmentId(apt) === editingAppointmentId && normalizeDate(apt.date || apt.appointment_date) === bookingForm.selectedDate && (apt.time || apt.time_slot) === slot);
                      const isSlotTaken = !isSameEditingSlot && doctorAvailability.activeBookings?.some((b) => b.date === bookingForm.selectedDate && b.time === slot);
                      const isPastSlot = isPastTimeSlot(bookingForm.selectedDate, slot);
                      const isNodeDisabled = isSlotTaken || isPastSlot;
                      return (
                        <button type="button" disabled={isNodeDisabled} key={slot}
                          className={`slot-pill-node ${bookingForm.selectedTime === slot ? "active" : ""} ${isSlotTaken ? "booked" : ""} ${isPastSlot ? "past-lockout" : ""}`}
                          onClick={() => !isNodeDisabled && setBookingForm((prev) => ({ ...prev, selectedTime: slot }))}>
                          {slot}{isSlotTaken ? " · Booked" : ""}{isPastSlot ? " · Passed" : ""}
                        </button>
                      );
                    }) : <p className="no-slots-err">No available slots on this date.</p>}
                  </div>
                )}
              </div>
            )}

            <div className="input-node">
              <label>Presenting Symptoms <span className="req-marker">*</span></label>
              <textarea name="symptoms" required value={bookingForm.symptoms} onChange={handleInputChange} placeholder="Describe clinical symptoms" />
            </div>

            <div className="input-node">
              <label>Additional Notes</label>
              <textarea name="additionalNotes" value={bookingForm.additionalNotes} onChange={handleInputChange} placeholder="Enter receptionist notes" />
            </div>

            <div className="wizard-action-footer">
              <button type="button" className="btn-cancel" onClick={closeBookingForm}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={!isFormReady}>
                {editingAppointmentId ? "Save Reschedule" : "Create Appointment"}
              </button>
            </div>
          </form>

          <div className="booking-calendar-panel">
            <div className="form-section-title">
              <CalendarIcon size={16} />
              <span>Practitioner Schedule Verification</span>
            </div>

            {!bookingForm.doctorEmail ? (
              <div className="calendar-placeholder-overlay">
                <Activity size={32} />
                <p>Select specialization and doctor to view available calendar slots.</p>
              </div>
            ) : slotsLoading ? (
              <div className="interactive-scheduling-stack">
                <div className="skeleton-calendar-matrix-grid" />
                <div className="skeleton-profile-summary-box" />
              </div>
            ) : (
              <div className="interactive-scheduling-stack">
                <div className="calendar-widget-wrapper">
                  <div className="cal-navigation-row">
                    <button type="button" onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
                    <span>{currentCalDate.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                    <button type="button" onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
                  </div>

                  <div className="cal-matrix-grid">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="cal-lbl">{day}</div>)}
                    {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth(currentCalDate.getFullYear(), currentCalDate.getMonth()) }).map((_, i) => {
                      const day = i + 1;
                      const loopDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day);
                      const loopDateStr = formatLocalDate(loopDate);
                      const dayOfWeek = loopDate.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isPast = loopDateStr < todayStr;
                      const isSelected = loopDateStr === bookingForm.selectedDate;
                      const hasSlots = getSlotsForDate(loopDateStr).length > 0 && !isPast;
                      const isHoliday = isWeekend && (!doctorAvailability.customDayOverrides?.[loopDateStr] || doctorAvailability.customDayOverrides[loopDateStr].length === 0);
                      return (
                        <button type="button" key={day} disabled={!hasSlots}
                          className={`cal-matrix-node ${isSelected ? "active" : ""} ${hasSlots ? "open-slots" : "blocked-slots"} ${isPast ? "historical-node" : ""} ${isHoliday ? "holiday-node" : ""}`}
                          onClick={() => hasSlots && handleDateSelect(loopDate)}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDoctorProfile && (
                  <div className="dr-embedded-profile-accordion animate-slide-up">
                    <div className="accordion-heading"><Award size={14} /> Professional Practitioner Summary</div>
                    <div className="profile-details-list">
                      <div className="profile-detail-row">
                        <span className="lbl">Qualification</span>
                        <span className="val highlight">{selectedDoctorProfile.qualification || "N/A"}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="lbl">Clinical Experience</span>
                        <span className="val">{calculateExperience(selectedDoctorProfile.experience_start_date)} Years Active</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="lbl">Consultation Fee</span>
                        <span className="val currency">₹{selectedDoctorProfile.consultation_fee || 0}</span>
                      </div>
                      <div className="profile-detail-row full-width">
                        <span className="lbl"><MapPin size={12} /> Clinic Address</span>
                        <span className="val address-block">{selectedDoctorProfile.clinic_address || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="appointments-dashboard-ledger animate-fade-in">
          <div className="ledger-search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by patient, doctor, specialization, date, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="search-clear-btn" onClick={() => setSearchTerm("")}>
                <X size={14} />
              </button>
            )}
          </div>

          {searchTerm && (
            <p className="search-results-count">
              Showing {filteredAppointments.length} of {normalizedAppointments.length} appointments
            </p>
          )}

          {loading ? (
            <div className="rd-loading-shimmer-wrapper">
              <div className="rd-shimmer-row" />
              <div className="rd-shimmer-row" />
              <div className="rd-shimmer-row" />
            </div>
          ) : (
            <>
              <div className="ledger-categorical-section">
                <div className="section-category-title title-confirmed">Upcoming Confirmed Sessions ({categorizedLedgers.confirmed.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.confirmed.length > 0 ? renderAppointmentCardList(categorizedLedgers.confirmed) : <p className="empty-sub-msg">No active confirmed appointments.</p>}
                </div>
              </div>

              <div className="ledger-categorical-section">
                <div className="section-category-title title-pending">Awaiting Signoff ({categorizedLedgers.pending.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.pending.length > 0 ? renderAppointmentCardList(categorizedLedgers.pending) : <p className="empty-sub-msg">No appointments awaiting signoff.</p>}
                </div>
              </div>

              <div className="ledger-categorical-section">
                <div className="section-category-title title-visited">Concluded Sessions ({categorizedLedgers.visited.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.visited.length > 0 ? renderAppointmentCardList(categorizedLedgers.visited) : <p className="empty-sub-msg">No concluded sessions.</p>}
                </div>
              </div>

              <div className="ledger-categorical-section">
                <div className="section-category-title title-cancelled">Declined & Cancelled ({categorizedLedgers.cancelled.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.cancelled.length > 0 ? renderAppointmentCardList(categorizedLedgers.cancelled) : <p className="empty-sub-msg">No cancelled or declined records.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}