import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Calendar as CalendarIcon, Clock, AlertCircle, 
  ChevronLeft, ChevronRight, CalendarPlus, FileText, Activity,
  Award, MapPin, ChevronDown, ChevronUp, User, CreditCard
} from "lucide-react";
import "../style/AppointmentManagement.css";

const isPastTimeSlot = (appointmentDate, timeSlotString) => {
  const getFormattedDate = (date) => date.toISOString().split('T')[0];
  const todayStr = getFormattedDate(new Date());

  if (appointmentDate < todayStr) return true;
  if (appointmentDate > todayStr) return false;

  try {
    const startTimeStr = timeSlotString.split('-')[0].trim();
    const [hours, minutes] = startTimeStr.split(':').map(Number);

    const currentTime = new Date();
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);

    return currentTime > slotTime;
  } catch (err) {
    return false; 
  }
};

export default function AppointmentManagement() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [isBookingMode, setIsBookingMode] = useState(false);
  const [patientData, setPatientData] = useState({ firstName: "", lastName: "", email: "" });
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  
  const [doctorsFromDb, setDoctorsFromDb] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState({ defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [expandedAptIds, setExpandedAptIds] = useState({});

  const [bookingForm, setBookingForm] = useState({
    specialization: "",
    doctorEmail: "",
    selectedDate: "",
    selectedTime: "",
    symptoms: "",
    additionalNotes: ""
  });

  const specializationsList = ["General Medicine", "Physiotherapy", "Cardiology", "Neurology"];

  const getFormattedDate = (date) => date.toISOString().split('T')[0];
  const todayStr = getFormattedDate(new Date());

  useEffect(() => {
    const localUserString = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (localUserString) {
      const parsedUser = JSON.parse(localUserString);
      setPatientData({
        firstName: parsedUser?.firstName || "Patient",
        lastName: parsedUser?.lastName || "",
        email: parsedUser?.email || ""
      });
    }
  }, []);

  const fetchPatientLedger = async () => {
    if (!patientData.email) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/patients/booked-ledger?email=${encodeURIComponent(patientData.email)}`);
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error("Failed to query systemic booking records layout.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientLedger();
  }, [patientData.email, API_BASE_URL]);

  useEffect(() => {
    if (!bookingForm.specialization) {
      setDoctorsFromDb([]);
      return;
    }
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/patients/doctors-by-spec?specialization=${encodeURIComponent(bookingForm.specialization)}`);
        setDoctorsFromDb(res.data.data || []);
      } catch (err) {
        console.error("Failed to pull matching specialized clinicians.", err);
      }
    };
    fetchDoctors();
  }, [bookingForm.specialization, API_BASE_URL]);

  useEffect(() => {
    if (!bookingForm.doctorEmail) {
      setSelectedDoctorProfile(null);
      return;
    }

    const fetchDoctorMetadataAndSlots = async () => {
      try {
        setSlotsLoading(true);
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth() + 1;

        const [slotsRes, profileRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/v1/patients/doctor-slots-live?email=${encodeURIComponent(bookingForm.doctorEmail)}&year=${year}&month=${month}`),
          axios.get(`${API_BASE_URL}/api/v1/patients/public-doctor-meta?email=${encodeURIComponent(bookingForm.doctorEmail)}`)
        ]);

        setDoctorAvailability(slotsRes.data.data || { defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
        setSelectedDoctorProfile(profileRes.data.data.profileData);
      } catch (err) {
        console.error("Failed to query runtime doctor configuration records.", err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchDoctorMetadataAndSlots();
  }, [bookingForm.doctorEmail, currentCalDate, API_BASE_URL]);

  const getSlotsForDate = (dateStr) => {
    if (!dateStr || !doctorAvailability) return [];
    if (dateStr < todayStr) return [];
    
    if (doctorAvailability.customDayOverrides?.[dateStr] !== undefined) {
      return doctorAvailability.customDayOverrides[dateStr];
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    return isWeekend ? [] : (doctorAvailability.defaultWeeklySlots || []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (dateObj) => {
    const formatted = getFormattedDate(dateObj);
    if (formatted < todayStr) return;
    setBookingForm(prev => ({ ...prev, selectedDate: formatted, selectedTime: "" }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/v1/patients/book-request`, {
        patientEmail: patientData.email,
        doctorEmail: bookingForm.doctorEmail,
        date: bookingForm.selectedDate,
        time: bookingForm.selectedTime,
        symptoms: bookingForm.symptoms,
        appointmentId: editingAppointmentId
      });

      alert(editingAppointmentId ? "Reschedule proposal routed successfully!" : "Appointment request posted successfully!");
      setIsBookingMode(false);
      setEditingAppointmentId(null);
      setBookingForm({ specialization: "", doctorEmail: "", selectedDate: "", selectedTime: "", symptoms: "", additionalNotes: "" });
      fetchPatientLedger();
    } catch (err) {
      alert(err.response?.data?.message || "Operational scheduling collision occurred.");
    }
  };

  const handleTriggerReschedule = (apt) => {
    if (apt.status === "rejected" || apt.status === "cancelled" || isPastTimeSlot(apt.date, apt.time)) return;
    setEditingAppointmentId(apt.id);
    setBookingForm({
      specialization: apt.specialization || "General Medicine",
      doctorEmail: apt.doctorEmail,
      selectedDate: apt.date >= todayStr ? apt.date : "",
      selectedTime: apt.date >= todayStr ? apt.time : "",
      symptoms: "Requesting schedule adjustment baseline configuration.",
      additionalNotes: ""
    });
    setIsBookingMode(true);
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm("Are you sure you want to drop this medical timeline consultation reservation?")) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/patients/book-request`, {
          patientEmail: patientData.email,
          appointmentId: id,
          time: "", 
          date: "" 
        });
        fetchPatientLedger();
      } catch (err) {
        setAppointments(appointments.filter(apt => apt.id !== id));
      }
    }
  };

  const calculateExperience = (startDateStr) => {
    if (!startDateStr) return "N/A";
    const start = new Date(startDateStr);
    const ageDifMs = Date.now() - start.getTime();
    return Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
  };

  const toggleAccordion = (id) => {
    setExpandedAptIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay();

  const getStatusLabel = (status, date, time) => {
    if (isPastTimeSlot(date, time) && status === "confirmed") return "Concluded Session";
    if (status === "confirmed") return "Active Schedule";
    if (status === "rejected") return "Request Declined";
    if (status === "cancelled") return "Cancelled Visit";
    return "Awaiting Signoff";
  };

  const sortChronologically = (a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.time.localeCompare(b.time);
  };

  const categorizedLedgers = useMemo(() => {
    const lists = { confirmed: [], pending: [], visited: [], cancelled: [] };

    appointments.forEach((apt) => {
      const isPast = isPastTimeSlot(apt.date, apt.time);
      if (apt.status === "cancelled" || apt.status === "rejected") {
        lists.cancelled.push(apt);
      } else if (isPast && apt.status === "confirmed") {
        lists.visited.push(apt);
      } else if (apt.status === "confirmed") {
        lists.confirmed.push(apt);
      } else if (apt.status === "pending") {
        lists.pending.push(apt);
      }
    });

    lists.confirmed.sort(sortChronologically);
    lists.pending.sort(sortChronologically);
    lists.visited.sort(sortChronologically);
    lists.cancelled.sort(sortChronologically);

    return lists;
  }, [appointments]);

  const renderAppointmentCardList = (list) => {
    return list.map((apt) => {
      const isStatusLocked = apt.status === "rejected" || apt.status === "cancelled";
      const isPastTimeline = isPastTimeSlot(apt.date, apt.time);
      const isTotalLocked = isStatusLocked || isPastTimeline;
      const isExpanded = !!expandedAptIds[apt.id];

      return (
        <div key={apt.id} className={`appointment-wrapper-node ${isTotalLocked ? 'card-state-locked' : ''} animate-slide-up`}>
          <div className="appointment-matrix-card">
            <div className="card-primary-details" onClick={() => toggleAccordion(apt.id)}>
              <div className="details-interactive-header">
                <span className={`status-pill ${isPastTimeline && apt.status === "confirmed" ? "concluded" : apt.status}`}>
                  {getStatusLabel(apt.status, apt.date, apt.time)}
                </span>
                <button type="button" className="accordion-expand-toggle-btn">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              <h3>{apt.doctorName}</h3>
              <p className="specialization-meta">{apt.specialization}</p>
              <div className="meta-timeline-line">
                <span><CalendarIcon size={14} /> {apt.date}</span>
                <span><Clock size={14} /> {apt.time}</span>
              </div>
            </div>
            <div className="card-operational-actions">
              <button 
                className="action-btn opt-reschedule" 
                disabled={isTotalLocked}
                onClick={() => handleTriggerReschedule(apt)}
              >
                Reschedule
              </button>
              <button 
                className="action-btn opt-cancel" 
                disabled={isTotalLocked}
                onClick={() => handleCancelAppointment(apt.id)}
              >
                Cancel Visit
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="appointment-dropdown-details-panel">
              <div className="details-panel-grid">
                <div className="panel-meta-node">
                  <span className="meta-label"><User size={12} /> Clinical Category Structure</span>
                  <p className="meta-value">{apt.specialization || "General Medicine"}</p>
                </div>
                <div className="panel-meta-node">
                  <span className="meta-label"><CreditCard size={12} /> Communication Route Target</span>
                  <p className="meta-value">{apt.doctorEmail || "N/A"}</p>
                </div>
                <div className="panel-meta-node">
                  <span className="meta-label"><Award size={12} /> Professional Qualification</span>
                  <p className="meta-value">{apt.qualification || "N/A"}</p>
                </div>
                <div className="panel-meta-node">
                  <span className="meta-label">₹ Base Consultation Fee</span>
                  <p className="meta-value currency">₹{apt.consultation_fee || 0}</p>
                </div>
                <div className="panel-meta-node full-width">
                  <span className="meta-label"><MapPin size={12} /> Registered Practice Facility Address</span>
                  <p className="meta-value">{apt.clinic_address || "N/A"}</p>
                </div>
                <div className="panel-meta-node full-width">
                  <span className="meta-label"><FileText size={12} /> Documented Intake Presenting Symptoms</span>
                  <p className="meta-value symptoms-block">{apt.reason_for_visit || "No symptoms documented."}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="pt-apt-root animate-fade-in">
      <div className="pt-apt-header">
        <div className="header-meta">
          <h2>Clinical Consultations & Bookings</h2>
          <p>Schedule new sessions, evaluate clinical timelines, and interface with medical practitioners.</p>
        </div>
        {!isBookingMode && !loading && (
          <button className="book-trigger-btn" onClick={() => { setEditingAppointmentId(null); setIsBookingMode(true); }}>
            <CalendarPlus size={16} /> Book New Appointment
          </button>
        )}
      </div>

      {isBookingMode ? (
        <div className="booking-split-canvas animate-fade-in">
          <form className="booking-form-panel" onSubmit={handleFormSubmit}>
            <div className="form-section-title">
              <FileText size={16} /> <span>{editingAppointmentId ? "Reconfiguring Booking Options" : "Clinical Intake Parameters"}</span>
            </div>

            <div className="disabled-demographics-grid">
              <div className="input-node">
                <label>First Name</label>
                <input type="text" value={patientData.firstName} disabled />
              </div>
              <div className="input-node">
                <label>Last Name</label>
                <input type="text" value={patientData.lastName} disabled />
              </div>
              <div className="input-node full-width">
                <label>Registered Email Association</label>
                <input type="text" value={patientData.email} disabled />
              </div>
            </div>

            <div className="input-node">
              <label>Required Clinical Specialization</label>
              <select 
                name="specialization" 
                required 
                value={bookingForm.specialization} 
                onChange={(e) => {
                  setBookingForm(prev => ({
                    ...prev,
                    specialization: e.target.value,
                    doctorEmail: "",
                    selectedDate: "",
                    selectedTime: ""
                  }));
                  setSelectedDoctorProfile(null);
                  setDoctorAvailability({ defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
                }}
              >
                <option value="">Select Category...</option>
                {specializationsList.map(spec => <option key={spec} value={spec}>{spec}</option>)}
              </select>
            </div>

            {bookingForm.specialization && (
              <div className="input-node">
                <label>Available Practitioner</label>
                <select name="doctorEmail" required value={bookingForm.doctorEmail} onChange={handleInputChange}>
                  <option value="">Select Doctor...</option>
                  {doctorsFromDb.length > 0 ? (
                    doctorsFromDb.map(doc => (
                      <option key={doc.email} value={doc.email}>{doc.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>No doctors found for this specialization</option>
                  )}
                </select>
              </div>
            )}

            {bookingForm.selectedDate && (
              <div className="time-slots-wrapper">
                <label>Available Target Intervals on {bookingForm.selectedDate}</label>
                {slotsLoading ? (
                  <div className="skeleton-flex-slots-row" />
                ) : (
                  <div className="slots-flex-box">
                    {getSlotsForDate(bookingForm.selectedDate).length > 0 ? (
                      getSlotsForDate(bookingForm.selectedDate).map(slot => {
                        const isSlotTaken = doctorAvailability.activeBookings?.some(
                          b => b.date === bookingForm.selectedDate && b.time === slot
                        );
                        const isPastSlot = isPastTimeSlot(bookingForm.selectedDate, slot);
                        const isNodeDisabled = isSlotTaken || isPastSlot;

                        return (
                          <button 
                            type="button" 
                            disabled={isNodeDisabled}
                            key={slot} 
                            className={`slot-pill-node ${bookingForm.selectedTime === slot ? 'active' : ''} ${isSlotTaken ? 'booked' : ''} ${isPastSlot ? 'past-lockout' : ''}`}
                            onClick={() => !isNodeDisabled && setBookingForm(prev => ({ ...prev, selectedTime: slot }))}
                          >
                            {slot} {isSlotTaken && "(Booked)"} {isPastSlot && "(Passed)"}
                          </button>
                        );
                      })
                    ) : <p className="no-slots-err">No available slots open on this calendar date node.</p>}
                  </div>
                )}
              </div>
            )}

            <div className="input-node">
              <label>Presenting Symptoms</label>
              <textarea name="symptoms" required value={bookingForm.symptoms} onChange={handleInputChange} placeholder="Describe symptoms..." />
            </div>

            <div className="wizard-action-footer">
              <button type="button" className="btn-cancel" onClick={() => { setIsBookingMode(false); setEditingAppointmentId(null); }}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={!bookingForm.selectedTime}>
                {editingAppointmentId ? "Commit Revision Matrix" : "Commit Booking Request"}
              </button>
            </div>
          </form>

          <div className="booking-calendar-panel">
            <div className="form-section-title">
              <CalendarIcon size={16} /> <span>Practitioner Schedule Verification</span>
            </div>

            {!bookingForm.doctorEmail ? (
              <div className="calendar-placeholder-overlay">
                <Activity size={32} />
                <p>Please isolate a specialized practitioner to pull runtime calendar availability grids.</p>
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
                    <button type="button" onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))}><ChevronLeft size={16}/></button>
                    <span>{currentCalDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))}><ChevronRight size={16}/></button>
                  </div>

                  <div className="cal-matrix-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="cal-lbl">{d}</div>)}
                    {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth(currentCalDate.getFullYear(), currentCalDate.getMonth()) }).map((_, i) => {
                      const day = i + 1;
                      const loopDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day);
                      const loopDateStr = getFormattedDate(loopDate);
                      
                      const dayOfWeek = loopDate.getDay();
                      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                      const isPast = loopDateStr < todayStr;
                      const isSelected = loopDateStr === bookingForm.selectedDate;
                      const hasSlots = getSlotsForDate(loopDateStr).length > 0 && !isPast;
                      
                      const isHoliday = isWeekend && (!doctorAvailability.customDayOverrides?.[loopDateStr] || doctorAvailability.customDayOverrides[loopDateStr].length === 0);

                      return (
                        <div 
                          key={day} 
                          className={`cal-matrix-node ${isSelected ? 'active' : ''} ${hasSlots ? 'open-slots' : 'blocked-slots'} ${isPast ? 'historical-node' : ''} ${isHoliday ? 'holiday-node' : ''}`}
                          onClick={() => hasSlots && handleDateSelect(loopDate)}
                        >
                          {day}
                        </div>
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
                        <span className="val highlight">{selectedDoctorProfile.qualification}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="lbl">Clinical Experience</span>
                        <span className="val">{calculateExperience(selectedDoctorProfile.experience_start_date)} Years Active</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="lbl">Consultation Fee</span>
                        <span className="val currency">₹{selectedDoctorProfile.consultation_fee}</span>
                      </div>
                      <div className="profile-detail-row full-width">
                        <span className="lbl"><MapPin size={12} style={{ display: "inline", marginRight: "3px" }} /> Clinic Address</span>
                        <span className="val address-block">{selectedDoctorProfile.clinic_address}</span>
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
          {loading ? (
            <>
              <div className="skeleton-ledger-card" />
              <div className="skeleton-ledger-card" />
            </>
          ) : appointments.length > 0 ? (
            <>
              <div className="ledger-categorical-section">
                <div className="section-category-title title-confirmed">Upcoming Confirmed Sessions ({categorizedLedgers.confirmed.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.confirmed.length > 0 ? renderAppointmentCardList(categorizedLedgers.confirmed) : <p className="empty-sub-msg">No active confirmed appointments.</p>}
                </div>
              </div>

              <div className="ledger-categorical-section">
                <div className="section-category-title title-pending">Upcoming Awaiting Signoff ({categorizedLedgers.pending.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.pending.length > 0 ? renderAppointmentCardList(categorizedLedgers.pending) : <p className="empty-sub-msg">No appointments awaiting signoff.</p>}
                </div>
              </div>

              <div className="ledger-categorical-section">
                <div className="section-category-title title-visited">Concluded / Visited Sessions ({categorizedLedgers.visited.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.visited.length > 0 ? renderAppointmentCardList(categorizedLedgers.visited) : <p className="empty-sub-msg">No historical visited consultations tracked.</p>}
                </div>
              </div>

              <div className="ledger-categorical-section">
                <div className="section-category-title title-cancelled">Declined & Cancelled Logs ({categorizedLedgers.cancelled.length})</div>
                <div className="section-category-nodes-stack">
                  {categorizedLedgers.cancelled.length > 0 ? renderAppointmentCardList(categorizedLedgers.cancelled) : <p className="empty-sub-msg">No cancelled records log history found.</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-roster-fallback">
              <AlertCircle size={24} />
              <p>No medical consultations tracked on this account ledger.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}