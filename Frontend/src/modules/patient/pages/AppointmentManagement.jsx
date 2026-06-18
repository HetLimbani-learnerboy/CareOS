import React, { useState } from "react";
import {
  Calendar, Clock, User, CheckCircle, AlertCircle,
  ChevronRight, CalendarPlus, X, RefreshCw, Eye
} from "lucide-react";
import "../style/AppointmentManagement.css";

export default function AppointmentManagement() {
  const [activeSegment, setActiveSegment] = useState("upcoming"); // upcoming | history | book
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Simulated Frontend Mock Datasets
  const [upcomingAppointments, setUpcomingAppointments] = useState([
    {
      id: "APT-9921",
      department: "Cardiology Unit",
      doctor: "Dr. Marcus Sterling",
      date: "2026-06-24",
      time: "10:30 AM",
      status: "Confirmed"
    },
    {
      id: "APT-9945",
      department: "Dental Surgery",
      doctor: "Dr. Aisha Rahman",
      date: "2026-07-12",
      time: "02:15 PM",
      status: "Pending Verification"
    }
  ]);

  const appointmentHistory = [
    { id: "APT-8812", department: "General Medicine", doctor: "Dr. Elizabeth Vance", date: "2026-03-10", status: "Completed" },
    { id: "APT-8590", department: "Ophthalmology", doctor: "Dr. Alan Grant", date: "2026-01-18", status: "Completed" },
    { id: "APT-8102", department: "General Medicine", doctor: "Dr. Elizabeth Vance", date: "2025-11-05", status: "Canceled" }
  ];

  // Form State Nodes
  const [newAppointment, setNewAppointment] = useState({
    department: "General Medicine",
    doctor: "",
    date: "",
    time: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const mockId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
    const freshRecord = {
      id: mockId,
      ...newAppointment,
      status: "Confirmed"
    };

    setUpcomingAppointments(prev => [freshRecord, ...prev]);
    setSuccessMessage("Appointment scheduled successfully! Syncing parameters...");
    setTimeout(() => {
      setSuccessMessage("");
      setActiveSegment("upcoming");
      setNewAppointment({ department: "General Medicine", doctor: "", date: "", time: "" });
    }, 2000);
  };

  const handleCancelAppointment = (id) => {
    if (window.confirm("Are you sure you want to cancel this scheduled consultation?")) {
      setUpcomingAppointments(prev => prev.filter(apt => apt.id !== id));
      setSelectedAppointment(null);
    }
  };

  return (
    <div className="appointment-management-canvas">

      {/* Header Segments Selector Bar Layout */}
      <div className="appointment-view-header">
        <div className="header-meta-block">
          <h2>Appointment Management</h2>
          <p>Schedule, modify, and monitor clinical checkups and consultation timelines.</p>
        </div>

        <button
          className={`action-trigger-booking-btn ${activeSegment === "book" ? "hidden" : ""}`}
          onClick={() => setActiveSegment("book")}
        >
          <CalendarPlus size={16} /> Book New Appointment
        </button>
      </div>

      {successMessage && (
        <div className="appointment-toast-alert animate-slide-in">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      {/* Internal Navigation Sub-tabs */}
      {activeSegment !== "book" && (
        <div className="navigation-segment-tab-row">
          <button
            className={`segment-tab ${activeSegment === "upcoming" ? "tab-active" : ""}`}
            onClick={() => setActiveSegment("upcoming")}
          >
            Upcoming Consultations ({upcomingAppointments.length})
          </button>
          <button
            className={`segment-tab ${activeSegment === "history" ? "tab-active" : ""}`}
            onClick={() => setActiveSegment("history")}
          >
            Historical Records
          </button>
        </div>
      )}

      {/* ==========================================================================
         VIEW SEGMENT 1: BOOKING WIZARD PANEL
         ========================================================================== */}
      {activeSegment === "book" && (
        <div className="appointment-panel-card animate-fade-in">
          <div className="panel-card-title-row">
            <h3>Schedule Clinical Consultation</h3>
            <button className="panel-close-btn" onClick={() => setActiveSegment("upcoming")}><X size={18} /></button>
          </div>

          <form onSubmit={handleBookingSubmit} className="booking-wizard-form">
            <div className="form-input-grid">
              <div className="input-field-node">
                <label>Target Medical Department</label>
                <select name="department" value={newAppointment.department} onChange={handleInputChange}>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology Unit">Cardiology Unit</option>
                  <option value="Dental Surgery">Dental Surgery</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                </select>
              </div>

              <div className="input-field-node">
                <label>Available Practitioner</label>
                <select name="doctor" required value={newAppointment.doctor} onChange={handleInputChange}>
                  <option value="">Select Doctor...</option>
                  <option value="Dr. Elizabeth Vance">Dr. Elizabeth Vance (General)</option>
                  <option value="Dr. Marcus Sterling">Dr. Marcus Sterling (Cardio)</option>
                  <option value="Dr. Aisha Rahman">Dr. Aisha Rahman (Dental)</option>
                </select>
              </div>

              <div className="input-field-node">
                <label>Preferred Date</label>
                <input type="date" name="date" required value={newAppointment.date} onChange={handleInputChange} />
              </div>

              <div className="input-field-node">
                <label>Preferred Time Slot</label>
                <select name="time" required value={newAppointment.time} onChange={handleInputChange}>
                  <option value="">Select Time Slot...</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="02:15 PM">02:15 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>

            <div className="form-actions-footer">
              <button type="button" className="wizard-cancel-btn" onClick={() => setActiveSegment("upcoming")}>Cancel</button>
              <button type="submit" className="wizard-submit-btn">Confirm Scheduled Booking</button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================================================
         VIEW SEGMENT 2: UPCOMING VISITS GRID
         ========================================================================== */}
      {activeSegment === "upcoming" && (
        <div className="appointments-display-grid animate-fade-in">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt) => (
              <div key={apt.id} className="appointment-ticket-item">
                <div className="ticket-main-details">
                  <span className={`status-tag-indicator status-${apt.status.toLowerCase().replace(" ", "-")}`}>
                    {apt.status}
                  </span>
                  <h4>{apt.department}</h4>
                  <div className="ticket-meta-line"><User size={14} /> {apt.doctor || "Assigned On Rotation"}</div>
                  <div className="ticket-meta-line"><Calendar size={14} /> {apt.date}</div>
                  <div className="ticket-meta-line"><Clock size={14} /> {apt.time}</div>
                </div>
                <button className="manage-appointment-action-btn" onClick={() => setSelectedAppointment(apt)}>
                  Manage File <ChevronRight size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state-fallback">No upcoming clinical appointments scheduled.</div>
          )}
        </div>
      )}

      {/* ==========================================================================
         VIEW SEGMENT 3: HISTORICAL LEDGER
         ========================================================================== */}
      {activeSegment === "history" && (
        <div className="appointment-panel-card animate-fade-in">
          <div className="history-table-wrapper">
            <table className="historical-appointments-table">
              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Department</th>
                  <th>Practitioner</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointmentHistory.map((historyItem) => (
                  <tr key={historyItem.id}>
                    <td><strong>{historyItem.id}</strong></td>
                    <td>{historyItem.department}</td>
                    <td>{historyItem.doctor}</td>
                    <td>{historyItem.date}</td>
                    <td>
                      <span className={`history-pill score-${historyItem.status.toLowerCase()}`}>
                        {historyItem.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================================================
         MODAL COMPONENT LAYER: MANAGE / RESCHEDULE OVERLAY DRAWER
         ========================================================================== */}
      {selectedAppointment && (
        <div className="modal-overlay-backdrop" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-drawer-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-block">
              <div>
                <span>Reference: {selectedAppointment.id}</span>
                <h3>Manage Clinical Appointment</h3>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setSelectedAppointment(null)}><X size={18} /></button>
            </div>

            <div className="modal-summary-section">
              <p><strong>Department:</strong> {selectedAppointment.department}</p>
              <p><strong>Assigned Doctor:</strong> {selectedAppointment.doctor}</p>
              <p><strong>Current Timeline Slot:</strong> {selectedAppointment.date} at {selectedAppointment.time}</p>
            </div>

            <div className="modal-action-vertical-stack">
              <button
                className="modal-action-row-btn reschedule-trigger"
                onClick={() => {
                  alert("Reschedule calendar layout sync triggered.");
                  setSelectedAppointment(null);
                }}
              >
                <RefreshCw size={16} /> Reschedule Appointment Parameters
              </button>
              <button
                className="modal-action-row-btn cancel-trigger"
                onClick={() => handleCancelAppointment(selectedAppointment.id)}
              >
                <X size={16} /> Cancel Scheduled Consultation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}