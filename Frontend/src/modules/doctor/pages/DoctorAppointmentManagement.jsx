import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Undo2,
  X,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import '../style/DoctorAppointmentManagement.css';

const DEFAULT_SLOTS = [
  '10:00 - 10:50',
  '11:00 - 11:50',
  '11:50 - 12:40',
  '13:30 - 14:20',
  '14:20 - 15:10',
  '16:30 - 17:10'
];

const EXTRA_SLOTS = ['08:00 - 08:50', '09:00 - 09:50', '18:00 - 18:50'];

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

const isPastTimeSlot = (selectedDateStr, timeSlotString) => {
  const todayStr = formatLocalDate(new Date());

  if (selectedDateStr < todayStr) return true;
  if (selectedDateStr > todayStr) return false;

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

export default function DoctorAppointmentManagement() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [defaultWeeklySlots, setDefaultWeeklySlots] = useState(DEFAULT_SLOTS);
  const [dailyOverrides, setDailyOverrides] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSlotName, setSavingSlotName] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  // Reschedule Interactive Mode States
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [isRescheduleBooking, setIsRescheduleBooking] = useState(false);

  const todayKey = useMemo(() => formatLocalDate(new Date()), []);
  const selectedDateKey = useMemo(() => formatLocalDate(selectedDate), [selectedDate]);
  const isSelectedDatePast = useMemo(() => selectedDateKey < todayKey, [selectedDateKey, todayKey]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (user?.role && user.role !== 'doctor') {
        setErrorMessage('This page is available only to doctor accounts.');
      } else if (user?.email) {
        setDoctorEmail(user.email.trim().toLowerCase());
      } else {
        setErrorMessage('Doctor account information was not found.');
      }
    } catch {
      setErrorMessage('Stored account information is invalid. Please sign in again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!doctorEmail) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const query = `email=${encodeURIComponent(doctorEmail)}&year=${year}&month=${month}`;

    try {
      setLoading(true);
      setErrorMessage('');

      const [availabilityResponse, appointmentResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/v1/doctors/availability?${query}`),
        axios.get(`${API_BASE_URL}/api/v1/doctors/appointments?${query}`)
      ]);

      const availability = availabilityResponse.data.data || {};
      const roster = appointmentResponse.data.data || {};

      setDefaultWeeklySlots(
        availability.defaultWeeklySlots?.length
          ? availability.defaultWeeklySlots
          : DEFAULT_SLOTS
      );
      setDailyOverrides(availability.customDayOverrides || {});
      setPendingRequests(roster.pendingRequests || []);
      setAppointments(roster.appointments || []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to load the doctor schedule.'));
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, currentDate, doctorEmail]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getSlotsForDate = useCallback(
    (date) => {
      const dateKey = formatLocalDate(date);
      if (Object.prototype.hasOwnProperty.call(dailyOverrides, dateKey)) {
        return dailyOverrides[dateKey];
      }

      const day = date.getDay();
      return day === 0 || day === 6 ? [] : defaultWeeklySlots;
    },
    [dailyOverrides, defaultWeeklySlots]
  );

  const allSlotOptions = useMemo(
    () => [...new Set([...EXTRA_SLOTS, ...defaultWeeklySlots])].sort(),
    [defaultWeeklySlots]
  );

  const bookedAppointments = useMemo(
    () => [...pendingRequests, ...appointments],
    [appointments, pendingRequests]
  );

  const saveOverride = async (dateKey, slots) => {
    await axios.post(`${API_BASE_URL}/api/v1/doctors/availability/override`, {
      email: doctorEmail,
      date: dateKey,
      slots
    });
  };

  const handleToggleSlot = async (slot) => {
    if (!doctorEmail || savingSlotName || isResetting || isPastTimeSlot(selectedDateKey, slot)) return;

    const currentSlots = getSlotsForDate(selectedDate);
    const updatedSlots = currentSlots.includes(slot)
      ? currentSlots.filter((currentSlot) => currentSlot !== slot)
      : [...currentSlots, slot].sort();

    try {
      setSavingSlotName(slot);
      setErrorMessage('');
      await saveOverride(selectedDateKey, updatedSlots);
      setDailyOverrides((current) => ({ ...current, [selectedDateKey]: updatedSlots }));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to update this slot.'));
    } finally {
      setSavingSlotName(null);
    }
  };

  const resetToDefault = async () => {
    if (!doctorEmail || savingSlotName || isResetting || isSelectedDatePast) return;

    try {
      setIsResetting(true);
      setErrorMessage('');
      await saveOverride(selectedDateKey, null);
      setDailyOverrides((current) => {
        const next = { ...current };
        delete next[selectedDateKey];
        return next;
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to restore the default schedule.'));
    } finally {
      setIsResetting(false);
    }
  };

  const updateRequestStatus = async (request, status) => {
    try {
      setUpdatingRequestId(request.id);
      setErrorMessage('');

      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/doctors/appointments/${request.id}/status`,
        { email: doctorEmail, status }
      );

      setPendingRequests((current) => current.filter((item) => item.id !== request.id));
      if (status === 'confirmed') {
        setAppointments((current) => [...current, response.data.data].sort((a, b) =>
          `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
        ));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, `Unable to ${status} this request.`));
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Triggers rescheduling interface overlay focus
  const handleInitiateReschedule = (item) => {
    setRescheduleTarget(item);
    const itemDate = new Date(item.date);
    if (!isNaN(itemDate.getTime())) {
      setSelectedDate(itemDate);
      setCurrentDate(itemDate);
    }
  };

  // Submits the reschedule tracking payload to the server pipeline
  const handleConfirmReschedule = async (chosenSlot) => {
    if (!rescheduleTarget || !doctorEmail) return;

    const nameParts = String(rescheduleTarget.patient || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Patient';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      setIsRescheduleBooking(true);
      setErrorMessage('');

      await axios.post(`${API_BASE_URL}/api/v1/receptionist/receptionist-book-request`, {
        firstName: firstName,
        lastName: lastName,
        patientEmail: rescheduleTarget.patientEmail || '',
        doctorEmail: doctorEmail,
        specialization: rescheduleTarget.specialization || 'General Medicine',
        date: selectedDateKey,
        time: chosenSlot,
        symptoms: rescheduleTarget.reason || 'Rescheduled by practitioner.',
        appointmentId: rescheduleTarget.id
      });

      alert('Appointment rescheduled successfully. Notification email dispatched.');
      setRescheduleTarget(null);
      fetchDashboard();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to save the reschedule timeline data structure.'));
    } finally {
      setIsRescheduleBooking(false);
    }
  };

  const toggleExpandItem = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const changeMonth = (offset) => {
    setCurrentDate((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      setSelectedDate(next);
      return next;
    });
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  if (loading && !doctorEmail && !errorMessage) {
    return (
      <div className="dr-apt-root">
        <div className="skeleton-header-box" />
        <div className="dr-apt-grid">
          <div className="dr-apt-card skeleton-card-height" />
          <div className="dr-apt-side-stack">
            <div className="dr-apt-card skeleton-card-half" />
            <div className="dr-apt-card skeleton-card-half" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dr-apt-root animate-fade-in">
      <div className="dr-apt-header">
        <div className="header-text">
          <h1>Clinical Scheduling Console</h1>
          <p>Manage your availability and patient consultation requests.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="schedule-error" role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {rescheduleTarget && (
        <div className="reschedule-context-banner bg-sky-50 border border-sky-200 text-sky-800 p-4 mb-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin text-sky-600" />
            <span>
              Rescheduling appointment for <strong>{rescheduleTarget.patient}</strong>. Please select a new timeline interval slot from the configuration manager below.
            </span>
          </div>
          <button 
            type="button" 
            className="text-sky-600 hover:text-sky-800 font-semibold text-sm"
            onClick={() => setRescheduleTarget(null)}
          >
            Cancel Reschedule
          </button>
        </div>
      )}

      <div className="dr-apt-grid">
        <div className="dr-apt-card main-calendar-section">
          <div className="card-top">
            <CalendarIcon size={18} />
            <h3>Availability Planner</h3>
          </div>

          {loading ? (
            <div className="skeleton-calendar-widget" />
          ) : (
            <div className="calendar-widget" aria-busy={loading}>
              <div className="cal-nav">
                <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
                  <ChevronLeft size={18} />
                </button>
                <span>
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="cal-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="cal-day-label">{day}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }, (_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dateKey = formatLocalDate(date);
                  const isSelected = dateKey === selectedDateKey;
                  const hasAppointments = bookedAppointments.some((item) => item.date === dateKey);

                  return (
                    <button
                      type="button"
                      key={dateKey}
                      className={`cal-date-node ${isSelected ? 'active' : ''} ${hasAppointments ? 'has-apt' : ''}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      {day}
                      {hasAppointments && <span className="apt-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="slot-editor-area">
            <div className="editor-header">
              <h4>
                {rescheduleTarget 
                  ? `Assign New Slot for ${selectedDate.toDateString()}` 
                  : `Manage Slots for ${selectedDate.toDateString()}`}
              </h4>
              {!rescheduleTarget && (
                <button
                  type="button"
                  className="reset-btn"
                  disabled={!!savingSlotName || isResetting || isSelectedDatePast}
                  onClick={resetToDefault}
                >
                  {isResetting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Undo2 size={14} />
                  )}
                  <span>{isResetting ? 'Restoring...' : 'Use Default'}</span>
                </button>
              )}
            </div>
            {loading ? (
              <div className="skeleton-slots-row" />
            ) : (
              <div className="slots-flex-container">
                {allSlotOptions.map((slot) => {
                  const isActive = getSlotsForDate(selectedDate).includes(slot);
                  const isBooked = bookedAppointments.some(
                    (item) => item.date === selectedDateKey && item.time === slot
                  );
                  const isPast = isPastTimeSlot(selectedDateKey, slot);
                  const isCurrentSaving = savingSlotName === slot;
                  
                  // Disable if booked, historical, or mutating
                  const isNodeDisabled = rescheduleTarget 
                    ? (!isActive || isBooked || isPast || isRescheduleBooking)
                    : (isBooked || !!savingSlotName || isResetting || isPast);

                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={isNodeDisabled}
                      className={`slot-pill ${isActive ? 'active' : ''} ${isBooked ? 'booked' : ''} ${isPast ? 'past-lockout' : ''} ${isCurrentSaving ? 'mutating-state' : ''} ${rescheduleTarget && !isNodeDisabled ? 'reschedule-executable-node' : ''}`}
                      onClick={() => {
                        if (rescheduleTarget) {
                          handleConfirmReschedule(slot);
                        } else {
                          handleToggleSlot(slot);
                        }
                      }}
                    >
                      <span>{slot}</span>
                      {isCurrentSaving || (rescheduleTarget && isRescheduleBooking) ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isBooked ? (
                        <Clock size={12} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="dr-apt-side-stack">
          <div className="dr-apt-card requests-panel">
            <div className="card-top">
              <AlertCircle size={18} className="text-warn" />
              <h3>Pending Proposals</h3>
            </div>
            <div className="requests-list">
              {loading ? (
                <>
                  <div className="skeleton-item" />
                  <div className="skeleton-item" />
                </>
              ) : pendingRequests.length ? (
                pendingRequests.map((request) => (
                  <div key={request.id} className="request-item animate-slide-up structural-item-container">
                    <div className="item-primary-row">
                      <div className="req-info" onClick={() => toggleExpandItem(request.id)}>
                        <div className="name-with-toggle">
                          <strong>{request.patient}</strong>
                          <span className="info-toggle-chevron">
                            {expandedItems[request.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </div>
                        <small>{request.date} @ {request.time}</small>
                      </div>
                      <div className="req-actions">
                        <button
                          type="button"
                          className="btn-icon den"
                          aria-label="Reject request"
                          disabled={updatingRequestId === request.id}
                          onClick={() => updateRequestStatus(request, 'rejected')}
                        >
                          <X size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon acc"
                          aria-label="Confirm request"
                          disabled={updatingRequestId === request.id}
                          onClick={() => updateRequestStatus(request, 'confirmed')}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>

                    {expandedItems[request.id] && (
                      <div className="item-expanded-details animate-slide-up">
                        <div className="detail-meta-block">
                          <span className="meta-icon-label"><FileText size={12} /> Reason/Symptoms:</span>
                          <p className="meta-value-text">{request.reason || 'No description supplied.'}</p>
                        </div>
                        <div className="detail-meta-block">
                          <span className="meta-icon-label"><User size={12} /> Contact Email:</span>
                          <p className="meta-value-text">{request.patientEmail || 'N/A'}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            className="action-btn btn-resched inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            onClick={() => handleInitiateReschedule(request)}
                          >
                            <RefreshCw size={12} />
                            Reschedule Proposal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-msg">No pending requests.</p>
              )}
            </div>
          </div>

          <div className="dr-apt-card schedule-panel">
            <div className="card-top">
              <Check size={18} className="text-success" />
              <h3>Upcoming Schedule</h3>
            </div>
            <div className="schedule-list">
              {loading ? (
                <>
                  <div className="skeleton-item" />
                  <div className="skeleton-item" />
                </>
              ) : (
                <>
                  {appointments.filter((appointment) => appointment.date >= todayKey).map((appointment) => (
                    <div key={appointment.id} className="apt-item structural-item-container flex-direction-column">
                      <div className="item-primary-row" onClick={() => toggleExpandItem(appointment.id)}>
                        <div className="apt-time-badge">{appointment.time.split(' ')[0]}</div>
                        <div className="apt-details">
                          <div className="name-with-toggle">
                            <strong>{appointment.patient}</strong>
                            <span className="info-toggle-chevron">
                              {expandedItems[appointment.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </span>
                          </div>
                          <span>{appointment.date}</span>
                        </div>
                      </div>

                      {expandedItems[appointment.id] && (
                        <div className="item-expanded-details animate-slide-up style-bordered-top">
                          <div className="detail-meta-block">
                            <span className="meta-icon-label"><FileText size={12} /> Clinical Record Status:</span>
                            <p className="meta-value-text">{appointment.reason || 'Routine Checkup / Consultation visit.'}</p>
                          </div>
                          <div className="detail-meta-block">
                            <span className="meta-icon-label"><User size={12} /> Patient Email:</span>
                            <p className="meta-value-text">{appointment.patientEmail || 'N/A'}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              className="action-btn btn-resched inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              onClick={() => handleInitiateReschedule(appointment)}
                            >
                              <RefreshCw size={12} />
                              Reschedule Session
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {!appointments.some((appointment) => appointment.date >= todayKey) && (
                    <p className="empty-msg">No confirmed appointments.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}