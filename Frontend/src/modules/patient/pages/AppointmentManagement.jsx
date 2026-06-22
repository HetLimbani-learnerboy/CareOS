import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Calendar as CalendarIcon, Clock, AlertCircle, 
  ChevronLeft, ChevronRight, CalendarPlus, FileText, Activity,
  Award, MapPin
} from "lucide-react";
import "../style/AppointmentManagement.css";

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

  const [bookingForm, setBookingForm] = useState({
    specialization: "",
    doctorEmail: "",
    selectedDate: "",
    selectedTime: "",
    symptoms: "",
    additionalNotes: ""
  });

  const specializationsList = ["General Medicine", "Physiotherapy", "Cardiology", "Neurology"];

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
      const res = await axios.get(`${API_BASE_URL}/api/v1/patients/booked-ledger?email=${encodeURIComponent(patientData.email)}`);
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error("Failed to query systemic booking records layout.", err);
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
      }
    };

    fetchDoctorMetadataAndSlots();
  }, [bookingForm.doctorEmail, currentCalDate, API_BASE_URL]);

  const getFormattedDate = (date) => date.toISOString().split('T')[0];

  const getSlotsForDate = (dateStr) => {
    if (!dateStr || !doctorAvailability) return [];
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay();
    const isWeekend = (day === 0 || day === 6);

    if (doctorAvailability.customDayOverrides?.[dateStr] !== undefined) {
      return doctorAvailability.customDayOverrides[dateStr];
    }
    return isWeekend ? [] : (doctorAvailability.defaultWeeklySlots || []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (dateObj) => {
    const formatted = getFormattedDate(dateObj);
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
    setEditingAppointmentId(apt.id);
    setBookingForm({
      specialization: apt.specialization || "General Medicine",
      doctorEmail: apt.doctorEmail,
      selectedDate: apt.date,
      selectedTime: apt.time,
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

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay();

  return (
    <div className="pt-apt-root animate-fade-in">
      <div className="pt-apt-header">
        <div className="header-meta">
          <h2>Clinical Consultations & Bookings</h2>
          <p>Schedule new sessions, evaluate clinical timelines, and interface with medical practitioners.</p>
        </div>
        {!isBookingMode && (
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
                <div className="slots-flex-box">
                  {getSlotsForDate(bookingForm.selectedDate).length > 0 ? (
                    getSlotsForDate(bookingForm.selectedDate).map(slot => {
                      const isSlotTaken = doctorAvailability.activeBookings?.some(
                        b => b.date === bookingForm.selectedDate && b.time === slot
                      );

                      return (
                        <button 
                          type="button" 
                          disabled={isSlotTaken}
                          key={slot} 
                          className={`slot-pill-node ${bookingForm.selectedTime === slot ? 'active' : ''} ${isSlotTaken ? 'booked' : ''}`}
                          onClick={() => !isSlotTaken && setBookingForm(prev => ({ ...prev, selectedTime: slot }))}
                        >
                          {slot} {isSlotTaken && "(Booked)"}
                        </button>
                      );
                    })
                  ) : <p className="no-slots-err">No available slots open on this calendar date node.</p>}
                </div>
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
                      const isSelected = getFormattedDate(loopDate) === bookingForm.selectedDate;
                      const hasSlots = getSlotsForDate(getFormattedDate(loopDate)).length > 0;

                      return (
                        <div 
                          key={day} 
                          className={`cal-matrix-node ${isSelected ? 'active' : ''} ${hasSlots ? 'open-slots' : 'blocked-slots'}`}
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
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <div key={apt.id} className="appointment-matrix-card">
                <div className="card-primary-details">
                  <span className={`status-pill ${apt.status}`}>
                    {apt.status === "confirmed" ? "Active Schedule" : "Awaiting Signoff"}
                  </span>
                  <h3>{apt.doctorName}</h3>
                  <p className="specialization-meta">{apt.specialization}</p>
                  <div className="meta-timeline-line">
                    <span><CalendarIcon size={14} /> {apt.date}</span>
                    <span><Clock size={14} /> {apt.time}</span>
                  </div>
                </div>
                <div className="card-operational-actions">
                  <button className="action-btn opt-reschedule" onClick={() => handleTriggerReschedule(apt)}>
                    Reschedule
                  </button>
                  <button className="action-btn opt-cancel" onClick={() => handleCancelAppointment(apt.id)}>
                    Cancel Visit
                  </button>
                </div>
              </div>
            ))
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