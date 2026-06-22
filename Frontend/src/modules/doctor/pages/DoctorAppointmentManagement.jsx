import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Calendar as CalendarIcon, Clock, User, Check, X, 
  ChevronLeft, ChevronRight, Settings, AlertCircle, 
  Undo2
} from "lucide-react";
import "../style/DoctorAppointmentManagement.css";

export default function DoctorAppointmentManagement() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const DEFAULT_SLOTS = [
    "10:00 - 10:50", "11:00 - 11:50", "11:50 - 12:40",
    "13:30 - 14:20", "14:20 - 15:10", "16:30 - 17:10"
  ];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [defaultWeeklySlots, setDefaultWeeklySlots] = useState(DEFAULT_SLOTS);
  const [dailyOverrides, setDailyOverrides] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState("");

  const getFormattedDate = (date) => date.toISOString().split('T')[0];

  useEffect(() => {
    const localUserString = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (localUserString) {
      const parsedUser = JSON.parse(localUserString);
      if (parsedUser?.email) {
        setDoctorEmail(parsedUser.email);
      }
    }
  }, []);

  useEffect(() => {
    if (!doctorEmail) return;

    const fetchRosterAndAppointments = async () => {
      try {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const res = await axios.get(
          `${API_BASE_URL}/api/v1/doctors/availability?email=${encodeURIComponent(doctorEmail)}&year=${year}&month=${month}`
        );

        const { defaultWeeklySlots: backendDefaults, customDayOverrides } = res.data.data;
        
        if (backendDefaults && backendDefaults.length > 0) {
          setDefaultWeeklySlots(backendDefaults);
        }
        setDailyOverrides(customDayOverrides || {});

        const mockRequests = [
          { id: "REQ-901", patient: "Het Limbani", reason: "General Checkup", date: "2026-06-20", time: "11:00 - 11:50" },
          { id: "REQ-902", patient: "Sarah Jenkins", reason: "Post-op Follow-up", date: "2026-06-21", time: "14:20 - 15:10" }
        ];
        setPendingRequests(mockRequests);

        const mockAppointments = [
          { id: "APT-101", patient: "David Miller", time: "10:00 - 10:50", date: "2026-06-18", status: "Confirmed" }
        ];
        setAppointments(mockAppointments);

      } catch (err) {
        console.error("Failed to compile synchronized clinical roster parameters.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRosterAndAppointments();
  }, [doctorEmail, currentDate, API_BASE_URL]);

  const getSlotsForDate = (date) => {
    const dateKey = getFormattedDate(date);
    const day = date.getDay();
    const isWeekend = (day === 0 || day === 6);

    if (dailyOverrides[dateKey] !== undefined) {
      return dailyOverrides[dateKey];
    }
    
    return isWeekend ? [] : defaultWeeklySlots;
  };

  const handleToggleSlot = async (slot) => {
    if (!doctorEmail) return;
    
    const dateKey = getFormattedDate(selectedDate);
    const currentSlots = getSlotsForDate(selectedDate);
    
    let updatedSlots;
    if (currentSlots.includes(slot)) {
      updatedSlots = currentSlots.filter(s => s !== slot);
    } else {
      updatedSlots = [...currentSlots, slot].sort();
    }

    try {
      setDailyOverrides(prev => ({ ...prev, [dateKey]: updatedSlots }));

      await axios.post(`${API_BASE_URL}/api/v1/doctors/availability/override`, {
        email: doctorEmail,
        date: dateKey,
        slots: updatedSlots
      });
    } catch (err) {
      console.error("Failed to persist slot allocation change on backend database.", err);
    }
  };

  const resetToDefault = async () => {
    if (!doctorEmail) return;

    const dateKey = getFormattedDate(selectedDate);
    
    try {
      const newOverrides = { ...dailyOverrides };
      delete newOverrides[dateKey];
      setDailyOverrides(newOverrides);

      await axios.post(`${API_BASE_URL}/api/v1/doctors/availability/override`, {
        email: doctorEmail,
        date: dateKey,
        slots: []
      });
    } catch (err) {
      console.error("Failed to revert calendar node parameters back to presets.", err);
    }
  };

  const handleAccept = (req) => {
    setAppointments([...appointments, { ...req, status: "Confirmed" }]);
    setPendingRequests(pendingRequests.filter(r => r.id !== req.id));
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  if (loading && appointments.length === 0 && pendingRequests.length === 0) {
    return <div className="profile-loading">Assembling Clinical Timelines & Roster Matrices...</div>;
  }

  return (
    <div className="dr-apt-root animate-fade-in">
      
      <div className="dr-apt-header">
        <div className="header-text">
          <h1>Clinical Scheduling Console</h1>
          <p>Manage your recurring availability and process patient consultation requests.</p>
        </div>
      </div>

      <div className="dr-apt-grid">
        
        <div className="dr-apt-card main-calendar-section">
          <div className="card-top">
            <CalendarIcon size={18} />
            <h3>Availability Planner</h3>
          </div>

          <div className="calendar-widget">
            <div className="cal-nav">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeft size={18}/></button>
              <span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRight size={18}/></button>
            </div>
            
            <div className="cal-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="cal-day-label">{d}</div>)}
              {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isSelected = getFormattedDate(dateObj) === getFormattedDate(selectedDate);
                const hasAppointments = appointments.some(a => a.date === getFormattedDate(dateObj));

                return (
                  <div 
                    key={day} 
                    className={`cal-date-node ${isSelected ? 'active' : ''} ${hasAppointments ? 'has-apt' : ''}`}
                    onClick={() => setSelectedDate(dateObj)}
                  >
                    {day}
                    {hasAppointments && <span className="apt-dot"></span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="slot-editor-area">
            <div className="editor-header">
              <h4>Manage Slots for {selectedDate.toDateString()}</h4>
              <button className="reset-btn" onClick={resetToDefault}><Undo2 size={14}/> Use Default</button>
            </div>
            <div className="slots-flex-container">
              {["08:00 - 08:50", "09:00 - 09:50", ...defaultWeeklySlots, "18:00 - 18:50"].filter((v, i, a) => a.indexOf(v) === i).sort().map(slot => {
                const isActive = getSlotsForDate(selectedDate).includes(slot);
                const isBooked = appointments.some(a => a.date === getFormattedDate(selectedDate) && a.time === slot);

                return (
                  <button 
                    key={slot}
                    disabled={isBooked}
                    className={`slot-pill ${isActive ? 'active' : ''} ${isBooked ? 'booked' : ''}`}
                    onClick={() => handleToggleSlot(slot)}
                  >
                    {slot}
                    {isBooked && <Clock size={12} />}
                  </button>
                );
              })}
            </div>
            <p className="helper-text">* Click a slot to enable/disable it for this specific date only.</p>
          </div>
        </div>

        <div className="dr-apt-side-stack">
          
          <div className="dr-apt-card requests-panel">
            <div className="card-top">
              <AlertCircle size={18} className="text-warn" />
              <h3>Pending Proposals</h3>
            </div>
            <div className="requests-list">
              {pendingRequests.length > 0 ? pendingRequests.map(req => (
                <div key={req.id} className="request-item animate-slide-up">
                  <div className="req-info">
                    <strong>{req.patient}</strong>
                    <span>{req.reason}</span>
                    <small>{req.date} @ {req.time}</small>
                  </div>
                  <div className="req-actions">
                    <button className="btn-icon den" onClick={() => setPendingRequests(pendingRequests.filter(r => r.id !== req.id))}><X size={16}/></button>
                    <button className="btn-icon acc" onClick={() => handleAccept(req)}><Check size={16}/></button>
                  </div>
                </div>
              )) : <p className="empty-msg">No pending requests.</p>}
            </div>
          </div>

          <div className="dr-apt-card schedule-panel">
            <div className="card-top">
              <Check size={18} className="text-success" />
              <h3>Upcoming Schedule</h3>
            </div>
            <div className="schedule-list">
              {appointments.filter(a => new Date(a.date) >= new Date(getFormattedDate(new Date()))).map(apt => (
                <div key={apt.id} className="apt-item">
                  <div className="apt-time-badge">{apt.time.split(' ')[0]}</div>
                  <div className="apt-details">
                    <strong>{apt.patient}</strong>
                    <span>{apt.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}