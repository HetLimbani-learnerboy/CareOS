import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Calendar,
  CheckCircle,
  FileText,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  Activity,
  User as UserIcon,
  FlaskConical,
  Save,
  ChevronRight,
  ChevronLeft,
  X,
  IndianRupee,
  MapPin,
  Phone,
  Heart,
  Droplet,
  Stethoscope,
  Receipt,
  CreditCard,
  Ban,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  Award,
  CalendarPlus
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CareOSLOGO from "../../../assets/CareOS-logo.png";
import "../style/PatientDashboard.css";

const isPastTimeSlot = (appointmentDate, timeSlotString) => {
  if (!appointmentDate || !timeSlotString) return false;
  const todayStr = new Date().toISOString().split("T")[0];

  if (appointmentDate < todayStr) return true;
  if (appointmentDate > todayStr) return false;

  try {
    const startTimeStr = timeSlotString.split("-")[0].trim();
    const [hours, minutes] = startTimeStr.split(":").map(Number);

    const currentTime = new Date();
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);

    return currentTime > slotTime;
  } catch (err) {
    return false;
  }
};

export default function DashboardOverview() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const userObj = getStoredUser();
  const patientEmail = userObj?.email || "";

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionIdLoading] = useState(null);
  const [bannerMessage, setBannerMessage] = useState({ type: "", text: "" });

  const authHeaders = useMemo(
    () => ({
      headers: {
        "x-user-email": patientEmail,
        "x-user-role": "patient"
      }
    }),
    [patientEmail]
  );

  const notify = (type, text) => setBannerMessage({ type, text });
  const clearNotify = () => setBannerMessage({ type: "", text: "" });

  const [identity, setIdentity] = useState({
    firstName: userObj?.firstName || userObj?.first_name || "",
    lastName: userObj?.lastName || userObj?.last_name || "",
    phone: userObj?.phone || "",
    email: patientEmail
  });

  const [medicalProfile, setMedicalProfile] = useState({
    birth_date: "",
    gender: "Male",
    blood_group: "",
    address: "",
    emergency_contact_name1: "",
    emergency_contact_phoneno1: "",
    emergency_contact_relation1: "",
    emergency_contact_name2: "",
    emergency_contact_phoneno2: "",
    emergency_contact_relation2: "",
    insurance_provider: "",
    insurance_policynumber: ""
  });

  const [clinicalDashboard, setClinicalDashboard] = useState({
    allergies: [],
    chronic_conditions: [],
    vitals_log: { blood_pressure: "N/A", heart_rate: 0, temperature: 0, weight: 0 }
  });

  const normalizeProfile = (data) => {
    const user = data?.identity || {};
    const medical = data?.medical || {};
    return {
      identity: {
        firstName: user.firstName || user.first_name || "",
        lastName: user.lastName || user.last_name || "",
        phone: user.phone || "",
        email: user.email || patientEmail
      },
      medical: {
        birth_date: medical.birth_date ? String(medical.birth_date).split("T")[0] : "",
        gender: medical.gender || "Male",
        blood_group: medical.blood_group || "",
        address: medical.address || "",
        emergency_contact_name1: medical.emergency_contact_name1 || "",
        emergency_contact_phoneno1: medical.emergency_contact_phoneno1 || "",
        emergency_contact_relation1: medical.emergency_contact_relation1 || "",
        emergency_contact_name2: medical.emergency_contact_name2 || "",
        emergency_contact_phoneno2: medical.emergency_contact_phoneno2 || "",
        emergency_contact_relation2: medical.emergency_contact_relation2 || "",
        insurance_provider: medical.insurance_provider || "",
        insurance_policynumber: medical.insurance_policynumber || ""
      }
    };
  };

  const fetchProfileData = useCallback(async () => {
    if (!patientEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/patients/profile`, authHeaders);
      if (res.data?.status === "success") {
        const normalized = normalizeProfile(res.data.data);
        setIdentity(normalized.identity);
        setMedicalProfile(normalized.medical);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Unable to retrieve patient profile.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, patientEmail, authHeaders]);

  const fetchClinicalDashboard = useCallback(async () => {
    if (!patientEmail) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/patients/dashboard-summary?email=${encodeURIComponent(patientEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        const clinical = res.data.data?.clinical || {};
        setClinicalDashboard({
          allergies: Array.isArray(clinical.allergies) ? clinical.allergies : [],
          chronic_conditions: Array.isArray(clinical.chronic_conditions) ? clinical.chronic_conditions : [],
          vitals_log: clinical.vitals_log || { blood_pressure: "N/A", heart_rate: 0, temperature: 0, weight: 0 }
        });
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Unable to retrieve clinical dashboard data.");
    }
  }, [API_BASE_URL, patientEmail, authHeaders]);

  const saveProfileData = async (e) => {
    e.preventDefault();
    try {
      setActionIdLoading("profile_save");
      clearNotify();

      const payload = {
        phone: identity.phone,
        ...medicalProfile
      };

      const res = await axios.put(`${API_BASE_URL}/api/v1/patients/profile`, payload, authHeaders);
      if (res.data?.status === "success") {
        notify("success", "Patient profile updated successfully.");
        fetchProfileData();
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to update patient profile.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const [newAllergy, setNewAllergy] = useState({ substance: "", severity: "Mild" });
  const [newCondition, setNewCondition] = useState({ condition_name: "", status: "Active" });
  const [vitalsForm, setVitalsForm] = useState({ blood_pressure: "", heart_rate: 0, temperature: 0, weight: 0 });

  useEffect(() => {
    setVitalsForm({
      blood_pressure: clinicalDashboard.vitals_log?.blood_pressure || "",
      heart_rate: clinicalDashboard.vitals_log?.heart_rate || 0,
      temperature: clinicalDashboard.vitals_log?.temperature || 0,
      weight: clinicalDashboard.vitals_log?.weight || 0
    });
  }, [clinicalDashboard.vitals_log]);

  const handleAddAllergy = () => {
    if (!newAllergy.substance.trim()) return;
    setClinicalDashboard((prev) => ({
      ...prev,
      allergies: [...prev.allergies, { ...newAllergy, substance: newAllergy.substance.trim() }]
    }));
    setNewAllergy({ substance: "", severity: "Mild" });
  };

  const handleRemoveAllergy = (idx) => {
    setClinicalDashboard((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== idx)
    }));
  };

  const handleAddCondition = () => {
    if (!newCondition.condition_name.trim()) return;
    setClinicalDashboard((prev) => ({
      ...prev,
      chronic_conditions: [...prev.chronic_conditions, { ...newCondition, condition_name: newCondition.condition_name.trim() }]
    }));
    setNewCondition({ condition_name: "", status: "Active" });
  };

  const handleRemoveCondition = (idx) => {
    setClinicalDashboard((prev) => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions.filter((_, i) => i !== idx)
    }));
  };

  const saveClinicalDashboard = async (e) => {
    e.preventDefault();
    try {
      setActionIdLoading("clinical_save");
      clearNotify();

      const payload = {
        email: patientEmail,
        allergies: clinicalDashboard.allergies,
        chronic_conditions: clinicalDashboard.chronic_conditions,
        vitals_log: {
          blood_pressure: vitalsForm.blood_pressure,
          heart_rate: Number(vitalsForm.heart_rate || 0),
          temperature: Number(vitalsForm.temperature || 0),
          weight: Number(vitalsForm.weight || 0),
          updated_at: new Date().toISOString()
        }
      };

      const res = await axios.post(`${API_BASE_URL}/api/v1/patients/dashboard-summary`, payload, authHeaders);
      if (res.data?.status === "success") {
        notify("success", "Clinical dashboard parameters saved successfully.");
        fetchClinicalDashboard();
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to save clinical dashboard.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const [specializationQuery, setSpecializationQuery] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctorEmail, setSelectedDoctorEmail] = useState("");
  const [doctorMeta, setDoctorMeta] = useState(null);
  const [doctorAvailability, setDoctorAvailability] = useState({ defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });

  const [bookingYear, setBookingYear] = useState(new Date().getFullYear());
  const [bookingMonth, setBookingMonth] = useState(new Date().getMonth() + 1);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [monthSlots, setMonthSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);

  const [myAppointments, setMyAppointments] = useState([]);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [expandedAptIds, setExpandedAptIds] = useState({});

  const specializationsList = ["General Medicine", "Physiotherapy", "Cardiology", "Neurology"];
  const todayStr = new Date().toISOString().split("T")[0];

  const searchDoctorsBySpecialization = async () => {
    if (!specializationQuery.trim()) {
      notify("error", "Enter a specialization to search doctors.");
      return;
    }
    try {
      setActionIdLoading("doctor_search");
      clearNotify();
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/patients/doctors-by-spec?specialization=${encodeURIComponent(specializationQuery.trim())}`
      );
      if (res.data?.status === "success") {
        setDoctorsList(Array.isArray(res.data.data) ? res.data.data : []);
        if (!res.data.data?.length) notify("error", "No doctors found for that specialization.");
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to search doctors.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const fetchMonthSlots = useCallback(
    async (email, year, month) => {
      if (!email) return;
      try {
        const [slotsRes, profileRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/v1/patients/doctor-slots-live?email=${encodeURIComponent(email)}&year=${year}&month=${month}`),
          axios.get(`${API_BASE_URL}/api/v1/patients/public-doctor-meta?email=${encodeURIComponent(email)}`)
        ]);

        if (slotsRes.data?.status === "success") {
          setMonthSlots(slotsRes.data.data || {});
          setDoctorAvailability(slotsRes.data.data || { defaultWeeklySlots: [], customDayOverrides: {}, activeBookings: [] });
        }
        if (profileRes.data?.status === "success") {
          setDoctorMeta(profileRes.data.data);
        }
      } catch (err) {
        notify("error", err.response?.data?.message || "Failed to load doctor availability.");
      }
    },
    [API_BASE_URL]
  );

  const selectDoctorForBooking = async (email) => {
    try {
      setSelectedDoctorEmail(email);
      setSelectedDate("");
      setSelectedTime("");
      setActionIdLoading("doctor_meta");
      clearNotify();
      await fetchMonthSlots(email, bookingYear, bookingMonth);
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to load doctor profile.");
    } finally {
      setActionIdLoading(null);
    }
  };

  useEffect(() => {
    if (selectedDoctorEmail) fetchMonthSlots(selectedDoctorEmail, bookingYear, bookingMonth);
  }, [bookingYear, bookingMonth, selectedDoctorEmail, fetchMonthSlots]);

  const getSlotsForDate = (dateStr) => {
    if (!dateStr || !doctorAvailability) return [];
    if (dateStr < todayStr) return [];

    if (doctorAvailability.customDayOverrides?.[dateStr] !== undefined) {
      return doctorAvailability.customDayOverrides[dateStr];
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return isWeekend ? [] : doctorAvailability.defaultWeeklySlots || [];
  };

  const fetchMyAppointments = useCallback(async () => {
    if (!patientEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/patients/booked-ledger?email=${encodeURIComponent(patientEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setMyAppointments(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to retrieve your appointments.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, patientEmail, authHeaders]);

  const resetBookingForm = () => {
    setEditingAppointmentId(null);
    setSelectedDoctorEmail("");
    setDoctorMeta(null);
    setSelectedDate("");
    setSelectedTime("");
    setSymptoms("");
    setDoctorsList([]);
    setSpecializationQuery("");
  };

  const handleBookOrReschedule = async (e) => {
    e.preventDefault();
    if (!selectedDoctorEmail || !selectedDate || !selectedTime || !symptoms.trim()) {
      notify("error", "Select a doctor, date, time slot, and describe your symptoms.");
      return;
    }
    try {
      setActionIdLoading("book_submit");
      clearNotify();
      const payload = {
        patientEmail,
        doctorEmail: selectedDoctorEmail,
        date: selectedDate,
        time: selectedTime,
        symptoms: symptoms.trim(),
        ...(editingAppointmentId ? { appointmentId: editingAppointmentId } : {})
      };
      const res = await axios.post(`${API_BASE_URL}/api/v1/appointments/book-request`, payload, authHeaders);
      if (res.data?.status === "success") {
        notify("success", editingAppointmentId ? "Appointment rescheduled successfully." : "Appointment request submitted successfully.");
        resetBookingForm();
        fetchMyAppointments();
        setActiveTab("appointments");
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to submit appointment request.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setActionIdLoading(`cancel_${appointmentId}`);
      clearNotify();
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/appointments/book-request`,
        { patientEmail, appointmentId, time: "", date: "" },
        authHeaders
      );
      if (res.data?.status === "success") {
        notify("success", "Appointment cancelled successfully.");
        fetchMyAppointments();
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const handleStartReschedule = async (apt) => {
    if (apt.status === "rejected" || apt.status === "cancelled" || isPastTimeSlot(apt.date, apt.time)) return;
    setEditingAppointmentId(apt.id || apt._id);
    setSymptoms(apt.reason_for_visit || "");
    setActiveTab("book");
    await selectDoctorForBooking(apt.doctorEmail);
  };

  const toggleAccordion = (id) => {
    setExpandedAptIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateExperience = (startDateStr) => {
    if (!startDateStr) return "N/A";
    const start = new Date(startDateStr);
    const ageDifMs = Date.now() - start.getTime();
    return Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay();

  const filteredAppointments = useMemo(() => {
    const term = appointmentSearch.toLowerCase().trim();
    if (!term) return myAppointments;
    return myAppointments.filter((a) =>
      [a.doctorName, a.doctorEmail, a.specialization, a.status, a.reason_for_visit].join(" ").toLowerCase().includes(term)
    );
  }, [myAppointments, appointmentSearch]);

  const categorizedLedgers = useMemo(() => {
    const lists = { confirmed: [], pending: [], visited: [], cancelled: [] };

    filteredAppointments.forEach((apt) => {
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

    const sortChronologically = (a, b) => {
      if (a.date !== b.date) return (a.date || "").localeCompare(b.date || "");
      return (a.time || "").localeCompare(b.time || "");
    };

    lists.confirmed.sort(sortChronologically);
    lists.pending.sort(sortChronologically);
    lists.visited.sort(sortChronologically);
    lists.cancelled.sort(sortChronologically);

    return lists;
  }, [filteredAppointments]);

  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionSearch, setPrescriptionSearch] = useState("");
  const [expandedPrescriptionId, setExpandedPrescriptionId] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    if (!patientEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/patients/prescriptions?patientEmail=${encodeURIComponent(patientEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setPrescriptions(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to retrieve prescription history.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, patientEmail, authHeaders]);

  const filteredPrescriptions = useMemo(() => {
    const term = prescriptionSearch.toLowerCase().trim();
    if (!term) return prescriptions;
    return prescriptions.filter((p) =>
      [p.prescriptionName, p.diagnosis, p.result].join(" ").toLowerCase().includes(term)
    );
  }, [prescriptions, prescriptionSearch]);

  const [labReports, setLabReports] = useState([]);
  const [labSearch, setLabSearch] = useState("");

  const fetchLabReports = useCallback(async () => {
    if (!patientEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/patients/my-reports`, authHeaders);
      if (res.data?.status === "success") {
        setLabReports(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to retrieve lab report history.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, patientEmail, authHeaders]);

  const filteredLabReports = useMemo(() => {
    const term = labSearch.toLowerCase().trim();
    if (!term) return labReports;
    return labReports.filter((r) =>
      [(r.requestedTests || []).join(" "), r.status].join(" ").toLowerCase().includes(term)
    );
  }, [labReports, labSearch]);

  const [billingHistory, setBillingHistory] = useState({ unpaid: [], insurancePending: [], paid: [], cancelled: [] });
  const [billingTab, setBillingTab] = useState("unpaid");
  const [billingSearch, setBillingSearch] = useState("");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: "UPI", transactionId: "", cardOrPayerName: "" });

  const fetchBillingHistory = useCallback(async () => {
    if (!patientEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/patients/billing-history`, authHeaders);
      if (res.data?.status === "success") {
        const data = res.data.data || {};
        setBillingHistory({
          unpaid: Array.isArray(data.unpaid) ? data.unpaid : [],
          insurancePending: Array.isArray(data.insurancePending) ? data.insurancePending : [],
          paid: Array.isArray(data.paid) ? data.paid : [],
          cancelled: Array.isArray(data.cancelled) ? data.cancelled : []
        });
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to retrieve billing history.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, patientEmail, authHeaders]);

  const filteredInvoices = useMemo(() => {
    const list = billingHistory[billingTab] || [];
    const term = billingSearch.toLowerCase().trim();
    if (!term) return list;
    return list.filter((item) => String(item.invoiceNumber || "").toLowerCase().includes(term) || String(item.doctorName || "").toLowerCase().includes(term));
  }, [billingHistory, billingTab, billingSearch]);

  const openPaymentForm = (invoice) => {
    setPayingInvoice(invoice);
    setPaymentForm({
      paymentMethod: "UPI",
      transactionId: `TXN-${Date.now().toString().slice(-8)}`,
      cardOrPayerName: `${identity.firstName} ${identity.lastName}`.trim() || "Patient"
    });
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;

    if (!paymentForm.transactionId.trim() || !paymentForm.cardOrPayerName.trim()) {
      notify("error", "Transaction reference ID and payer name are required.");
      return;
    }

    try {
      setActionIdLoading("submit_payment");
      clearNotify();
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/patients/invoice/${payingInvoice._id}/pay`,
        { ...paymentForm, paymentTimestamp: new Date().toISOString() },
        authHeaders
      );
      if (res.data?.status === "success") {
        notify("success", "Payment processed successfully! Bill status updated to Settled.");
        setPayingInvoice(null);
        fetchBillingHistory();
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to process payment.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const generateInvoicePDF = (item) => {
    try {
      const doc = new jsPDF("p", "pt", "a4");
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 36;

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, 25, pageWidth - margin * 2, 6, "F");

      if (CareOSLOGO) {
        doc.addImage(CareOSLOGO, "PNG", margin, 38, 20, 20);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CareOS Medical Group", margin + 26, 52);

      doc.setFillColor(15, 23, 42);
      doc.setFont("Courier", "normal");
      doc.setFontSize(8);
      doc.text("PATIENT STATEMENT", pageWidth - 190, 48);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Statement Date: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}`, pageWidth - 190, 64);
      doc.text(`Patient ID: ${item.patientId ? String(item.patientId).substring(0, 10).toUpperCase() : "N/A"}`, pageWidth - 190, 78);
      doc.text(`Invoice No: ${item.invoiceNumber || "N/A"}`, pageWidth - 190, 92);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, 125, pageWidth - margin, 125);

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, 138, 85, 16, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("STATEMENT", margin + 12, 149);

      autoTable(doc, {
        startY: 165,
        margin: { left: margin, right: margin },
        head: [["PATIENT NAME", "PATIENT EMAIL", "CONSULTING DOCTOR"]],
        body: [[
          `${identity.firstName} ${identity.lastName}`.trim().toUpperCase() || "PATIENT",
          patientEmail,
          item.doctorName ? `DR. ${item.doctorName.toUpperCase()}` : "N/A"
        ]],
        theme: "plain",
        headStyles: { fillColor: false, textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8.5, halign: "left" },
        bodyStyles: { textColor: [71, 85, 105], fontSize: 8.5, cellPadding: { top: 6, bottom: 6 } },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 1
      });

      const rawBillingItems = item.billingItems || [];
      const tableRows = rawBillingItems.map((bItem) => [
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A",
        bItem.category ? bItem.category.toUpperCase() : "N/A",
        bItem.name ? bItem.name.toUpperCase() : "N/A",
        `INR ${bItem.unitPrice || 0}`,
        `${bItem.quantity || 1}`,
        `INR ${bItem.totalPrice || 0}`
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        margin: { left: margin, right: margin },
        head: [["DATE", "CATEGORY", "DESCRIPTION", "CHARGES", "QTY", "NET DUE"]],
        body: tableRows,
        theme: "plain",
        headStyles: { fillColor: false, textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8.5, lineWidth: 1, lineColor: [15, 23, 42] },
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 80 },
          2: { cellWidth: 180 },
          3: { halign: "right", cellWidth: 70 },
          4: { halign: "center", cellWidth: 35 },
          5: { halign: "right", cellWidth: 80 }
        },
        bodyStyles: { textColor: [71, 85, 105], fontSize: 8, cellPadding: { top: 7, bottom: 7 } },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 1
      });

      const finalTableY = doc.lastAutoTable.finalY;
      const summaryBoxWidth = 180;
      const summaryBoxX = pageWidth - margin - summaryBoxWidth;

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(1.5);
      doc.line(summaryBoxX, finalTableY + 15, pageWidth - margin, finalTableY + 15);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text("Total Net Amount", summaryBoxX, finalTableY + 32);

      doc.setFontSize(11);
      doc.text(`INR ${(item.netPayableAmount || 0).toFixed(2)}`, pageWidth - margin, finalTableY + 32, { align: "right" });

      const footerY = pageHeight - 80;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, footerY, pageWidth - margin * 2, 42, "F");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Thank you for choosing CareOS Healthcare. Official Digital Receipt.", margin + 12, footerY + 20);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("PAYMENT STATUS:", margin, pageHeight - 25);

      const isPaid = String(item.paymentStatus).toLowerCase() === "paid";
      if (isPaid) {
        doc.setTextColor(34, 197, 94);
        doc.text("SETTLED & PAID", margin + 110, pageHeight - 25);
      } else {
        doc.setTextColor(245, 158, 11);
        doc.text("PAYMENT PENDING", margin + 110, pageHeight - 25);
      }

      doc.save(`CareOS_Patient_Receipt_${item.invoiceNumber || "INV"}.pdf`);
      notify("success", "Receipt PDF downloaded successfully.");
    } catch {
      notify("error", "An error occurred during receipt PDF generation.");
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchClinicalDashboard();
  }, [fetchProfileData, fetchClinicalDashboard]);

  useEffect(() => {
    if (activeTab === "appointments") fetchMyAppointments();
    if (activeTab === "prescriptions") fetchPrescriptions();
    if (activeTab === "labs") fetchLabReports();
    if (activeTab === "billing") fetchBillingHistory();
  }, [activeTab, fetchMyAppointments, fetchPrescriptions, fetchLabReports, fetchBillingHistory]);

  const refreshActiveTab = () => {
    if (activeTab === "overview") {
      fetchProfileData();
      fetchClinicalDashboard();
    } else if (activeTab === "appointments") fetchMyAppointments();
    else if (activeTab === "prescriptions") fetchPrescriptions();
    else if (activeTab === "labs") fetchLabReports();
    else if (activeTab === "billing") fetchBillingHistory();
  };

  const renderAppointmentCardList = (list) => {
    return list.map((apt) => {
      const aptId = apt.id || apt._id;
      const isStatusLocked = apt.status === "rejected" || apt.status === "cancelled";
      const isPastTimeline = isPastTimeSlot(apt.date, apt.time);
      const isTotalLocked = isStatusLocked || isPastTimeline;
      const isExpanded = !!expandedAptIds[aptId];

      return (
        <div key={aptId} className={`pt-list-node ${isTotalLocked ? "card-state-locked" : ""} pr-fade-in`}>
          <div style={{ width: "100%" }}>
            <div
              className="pt-invoice-head"
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => toggleAccordion(aptId)}
            >
              <div>
                <strong>{apt.doctorName}</strong>
                <span>{apt.specialization} &bull; {apt.doctorEmail}</span>
                <small style={{ marginTop: "4px" }}>
                  <Calendar size={12} /> {apt.date} @ <Clock size={12} /> {apt.time} &bull;{" "}
                  <span className={`pt-status-tag tag-${apt.status}`}>
                    {isPastTimeline && apt.status === "confirmed" ? "Concluded Session" : apt.status}
                  </span>
                </small>
              </div>
              <div className="pt-badge-flex">
                <button
                  type="button"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion(aptId);
                  }}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="pt-prescription-detail pr-slide-fade" style={{ marginTop: "0.75rem" }}>
                <p><strong>Reason for Visit:</strong> {apt.reason_for_visit || "No symptoms documented."}</p>
                <p><strong>Consultation Fee:</strong> ₹{apt.consultation_fee || 0}</p>
                <p><strong>Clinic Address:</strong> {apt.clinic_address || "N/A"}</p>
              </div>
            )}

            <div className="pt-btn-group" style={{ marginTop: "0.75rem" }}>
              {(apt.status === "pending" || apt.status === "confirmed") && !isPastTimeline && (
                <>
                  <button className="pt-btn-secondary" onClick={() => handleStartReschedule(apt)}>
                    Reschedule
                  </button>
                  <button
                    className="pt-btn-err"
                    disabled={actionLoading === `cancel_${aptId}`}
                    onClick={() => handleCancelAppointment(aptId)}
                  >
                    <Ban size={13} /> Cancel Visit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="pt-root pr-fade-in">
      <header className="pt-header">
        <div className="pt-brand">
          <div className="pt-icon-badge">
            <UserIcon size={22} />
          </div>
          <div>
            <h1>{identity.firstName} {identity.lastName}</h1>
            <p>Patient &bull; CareOS Personal Health Workspace</p>
          </div>
        </div>

        <div className="pt-header-actions">
          <span className="pt-tag-badge">
            <Shield size={14} /> {patientEmail}
          </span>
          <button className="pt-btn-secondary" onClick={refreshActiveTab}>
            <RefreshCw size={14} className={loading ? "pt-spin" : ""} />
            <span>Sync Engine</span>
          </button>
        </div>
      </header>

      {bannerMessage.text && (
        <div className={`pt-banner ${bannerMessage.type === "error" ? "banner-err" : "banner-ok"}`}>
          {bannerMessage.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{bannerMessage.text}</span>
          <button onClick={clearNotify} className="banner-close">
            <X size={14} />
          </button>
        </div>
      )}

      <nav className="pt-tabs-bar">
        <button className={`pt-tab ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")}>
          <Activity size={16} /> Overview
        </button>
        <button className={`pt-tab ${activeTab === "book" ? "tab-active" : ""}`} onClick={() => setActiveTab("book")}>
          <Plus size={16} /> Book Appointment
        </button>
        <button className={`pt-tab ${activeTab === "appointments" ? "tab-active" : ""}`} onClick={() => setActiveTab("appointments")}>
          <Calendar size={16} /> My Appointments
        </button>
        <button className={`pt-tab ${activeTab === "prescriptions" ? "tab-active" : ""}`} onClick={() => setActiveTab("prescriptions")}>
          <FileText size={16} /> Prescriptions
        </button>
        <button className={`pt-tab ${activeTab === "labs" ? "tab-active" : ""}`} onClick={() => setActiveTab("labs")}>
          <FlaskConical size={16} /> Lab Reports
        </button>
        <button className={`pt-tab ${activeTab === "billing" ? "tab-active" : ""}`} onClick={() => setActiveTab("billing")}>
          <Receipt size={16} /> Billing
        </button>
      </nav>

      <main className="pt-viewport">
        {loading && (
          <div className="pt-skeleton-stack">
            <div className="pt-skeleton-node" />
            <div className="pt-skeleton-node" />
            <div className="pt-skeleton-node" />
          </div>
        )}

        {/* OVERVIEW TAB */}
        {!loading && activeTab === "overview" && (
          <div className="pt-grid-2 col-unequal pr-fade-in">
            <div className="pt-card">
              <div className="pt-card-head">
                <Activity size={18} />
                <h2>Clinical Snapshot</h2>
              </div>

              <div className="pt-stats-grid">
                <div className="pt-stat-box">
                  <span>Blood Group</span>
                  <strong><Droplet size={14} /> {medicalProfile.blood_group || "Not set"}</strong>
                </div>
                <div className="pt-stat-box">
                  <span>Blood Pressure</span>
                  <strong>{clinicalDashboard.vitals_log?.blood_pressure || "N/A"}</strong>
                </div>
                <div className="pt-stat-box">
                  <span>Heart Rate</span>
                  <strong><Heart size={14} /> {clinicalDashboard.vitals_log?.heart_rate || 0} bpm</strong>
                </div>
                <div className="pt-stat-box">
                  <span>Weight</span>
                  <strong>{clinicalDashboard.vitals_log?.weight || 0} kg</strong>
                </div>
              </div>

              <div className="pt-profile-lines">
                <p><Phone size={15} /> {identity.phone || "Phone not set"}</p>
                <p><MapPin size={15} /> {medicalProfile.address || "Address not set"}</p>
              </div>

              <div className="pt-section-divider">
                <h3>Allergies</h3>
              </div>
              {clinicalDashboard.allergies.length === 0 ? (
                <p className="pt-empty-text">No known allergies recorded.</p>
              ) : (
                <div className="pt-chip-row">
                  {clinicalDashboard.allergies.map((a, idx) => (
                    <span key={idx} className={`pt-allergy-chip sev-${String(a.severity).toLowerCase()}`}>
                      {a.substance} &bull; {a.severity}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-section-divider">
                <h3>Chronic Conditions</h3>
              </div>
              {clinicalDashboard.chronic_conditions.length === 0 ? (
                <p className="pt-empty-text">No chronic conditions recorded.</p>
              ) : (
                <div className="pt-chip-row">
                  {clinicalDashboard.chronic_conditions.map((c, idx) => (
                    <span key={idx} className="pt-condition-chip">
                      {c.condition_name} &bull; {c.status}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-card">
              <div className="pt-card-head">
                <Shield size={18} />
                <h2>Profile & Medical Details</h2>
              </div>

              <form onSubmit={saveProfileData} className="pt-form">
                <div className="pt-grid-2">
                  <div className="pt-field">
                    <label>First Name</label>
                    <input value={identity.firstName} disabled />
                  </div>
                  <div className="pt-field">
                    <label>Last Name</label>
                    <input value={identity.lastName} disabled />
                  </div>
                </div>

                <div className="pt-grid-2">
                  <div className="pt-field">
                    <label>Phone</label>
                    <input value={identity.phone} onChange={(e) => setIdentity({ ...identity, phone: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Date of Birth</label>
                    <input type="date" required value={medicalProfile.birth_date} onChange={(e) => setMedicalProfile({ ...medicalProfile, birth_date: e.target.value })} />
                  </div>
                </div>

                <div className="pt-grid-2">
                  <div className="pt-field">
                    <label>Gender</label>
                    <select value={medicalProfile.gender} onChange={(e) => setMedicalProfile({ ...medicalProfile, gender: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="pt-field">
                    <label>Blood Group</label>
                    <input required maxLength={5} value={medicalProfile.blood_group} onChange={(e) => setMedicalProfile({ ...medicalProfile, blood_group: e.target.value })} />
                  </div>
                </div>

                <div className="pt-field">
                  <label>Address</label>
                  <input required maxLength={200} value={medicalProfile.address} onChange={(e) => setMedicalProfile({ ...medicalProfile, address: e.target.value })} />
                </div>

                <div className="pt-section-divider">
                  <h3>Emergency Contact #1</h3>
                </div>
                <div className="pt-grid-3">
                  <div className="pt-field">
                    <label>Name</label>
                    <input required value={medicalProfile.emergency_contact_name1} onChange={(e) => setMedicalProfile({ ...medicalProfile, emergency_contact_name1: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Phone</label>
                    <input required value={medicalProfile.emergency_contact_phoneno1} onChange={(e) => setMedicalProfile({ ...medicalProfile, emergency_contact_phoneno1: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Relation</label>
                    <input required value={medicalProfile.emergency_contact_relation1} onChange={(e) => setMedicalProfile({ ...medicalProfile, emergency_contact_relation1: e.target.value })} />
                  </div>
                </div>

                <div className="pt-section-divider">
                  <h3>Emergency Contact #2 (Optional)</h3>
                </div>
                <div className="pt-grid-3">
                  <div className="pt-field">
                    <label>Name</label>
                    <input value={medicalProfile.emergency_contact_name2} onChange={(e) => setMedicalProfile({ ...medicalProfile, emergency_contact_name2: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Phone</label>
                    <input value={medicalProfile.emergency_contact_phoneno2} onChange={(e) => setMedicalProfile({ ...medicalProfile, emergency_contact_phoneno2: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Relation</label>
                    <input value={medicalProfile.emergency_contact_relation2} onChange={(e) => setMedicalProfile({ ...medicalProfile, emergency_contact_relation2: e.target.value })} />
                  </div>
                </div>

                <div className="pt-section-divider">
                  <h3>Insurance Details</h3>
                </div>
                <div className="pt-grid-2">
                  <div className="pt-field">
                    <label>Insurance Provider</label>
                    <input value={medicalProfile.insurance_provider} onChange={(e) => setMedicalProfile({ ...medicalProfile, insurance_provider: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Policy Number</label>
                    <input value={medicalProfile.insurance_policynumber} onChange={(e) => setMedicalProfile({ ...medicalProfile, insurance_policynumber: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="pt-btn-primary" disabled={actionLoading === "profile_save"}>
                  <Save size={16} /> Save Profile
                </button>
              </form>

              <div className="pt-section-divider">
                <h3>Update Vitals & Clinical Log</h3>
              </div>
              <form onSubmit={saveClinicalDashboard} className="pt-form">
                <div className="pt-grid-2">
                  <div className="pt-field">
                    <label>Blood Pressure</label>
                    <input placeholder="120/80" value={vitalsForm.blood_pressure} onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Heart Rate (bpm)</label>
                    <input type="number" min="0" value={vitalsForm.heart_rate} onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })} />
                  </div>
                </div>
                <div className="pt-grid-2">
                  <div className="pt-field">
                    <label>Temperature (°F)</label>
                    <input type="number" min="0" step="0.1" value={vitalsForm.temperature} onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })} />
                  </div>
                  <div className="pt-field">
                    <label>Weight (kg)</label>
                    <input type="number" min="0" step="0.1" value={vitalsForm.weight} onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })} />
                  </div>
                </div>

                <div className="pt-section-divider">
                  <h3>Allergies</h3>
                </div>
                <div className="pt-row-inline">
                  <input placeholder="Substance" value={newAllergy.substance} onChange={(e) => setNewAllergy({ ...newAllergy, substance: e.target.value })} />
                  <select value={newAllergy.severity} onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                  <button type="button" className="pt-btn-secondary" onClick={handleAddAllergy}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {clinicalDashboard.allergies.length > 0 && (
                  <div className="pt-chip-row">
                    {clinicalDashboard.allergies.map((a, idx) => (
                      <span key={idx} className={`pt-allergy-chip sev-${String(a.severity).toLowerCase()}`}>
                        {a.substance} &bull; {a.severity}
                        <button type="button" onClick={() => handleRemoveAllergy(idx)}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-section-divider">
                  <h3>Chronic Conditions</h3>
                </div>
                <div className="pt-row-inline">
                  <input placeholder="Condition name" value={newCondition.condition_name} onChange={(e) => setNewCondition({ ...newCondition, condition_name: e.target.value })} />
                  <select value={newCondition.status} onChange={(e) => setNewCondition({ ...newCondition, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="In Remission">In Remission</option>
                    <option value="Managed">Managed</option>
                  </select>
                  <button type="button" className="pt-btn-secondary" onClick={handleAddCondition}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {clinicalDashboard.chronic_conditions.length > 0 && (
                  <div className="pt-chip-row">
                    {clinicalDashboard.chronic_conditions.map((c, idx) => (
                      <span key={idx} className="pt-condition-chip">
                        {c.condition_name} &bull; {c.status}
                        <button type="button" onClick={() => handleRemoveCondition(idx)}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <button type="submit" className="pt-btn-primary" disabled={actionLoading === "clinical_save"}>
                  <Save size={16} /> Save Clinical Dashboard
                </button>
              </form>
            </div>
          </div>
        )}

        {/* BOOK APPOINTMENT TAB */}
        {!loading && activeTab === "book" && (
          <div className="pt-grid-2 col-unequal pr-fade-in">
            <div className="pt-card">
              <div className="pt-card-head">
                <Stethoscope size={18} />
                <h2>Find a Doctor</h2>
              </div>

              <div className="pt-field">
                <label>Select Clinical Specialization</label>
                <select
                  value={specializationQuery}
                  onChange={(e) => {
                    setSpecializationQuery(e.target.value);
                    if (e.target.value) {
                      axios
                        .get(`${API_BASE_URL}/api/v1/patients/doctors-by-spec?specialization=${encodeURIComponent(e.target.value)}`)
                        .then((res) => setDoctorsList(res.data.data || []))
                        .catch(() => notify("error", "Failed to fetch doctors."));
                    }
                  }}
                >
                  <option value="">Select Category...</option>
                  {specializationsList.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="pt-row-inline">
                <input
                  placeholder="Or search by specialization keyword..."
                  value={specializationQuery}
                  onChange={(e) => setSpecializationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchDoctorsBySpecialization()}
                />
                <button type="button" className="pt-btn-primary" onClick={searchDoctorsBySpecialization} disabled={actionLoading === "doctor_search"}>
                  <Search size={14} /> Search
                </button>
              </div>

              {doctorsList.length > 0 && (
                <div className="pt-list-stack">
                  {doctorsList.map((doc, idx) => (
                    <div
                      key={idx}
                      className={`pt-list-node ${selectedDoctorEmail === doc.email ? "node-confirmed" : ""}`}
                      onClick={() => selectDoctorForBooking(doc.email)}
                      style={{ cursor: "pointer" }}
                    >
                      <div>
                        <strong>{doc.name}</strong>
                        <span>{doc.email}</span>
                      </div>
                      <ChevronRight size={16} />
                    </div>
                  ))}
                </div>
              )}

              {doctorMeta && (
                <div className="pt-doctor-meta-box">
                  <h3>{doctorMeta.doctor?.name}</h3>
                  <p>{doctorMeta.profileData?.specialization} &bull; {doctorMeta.profileData?.qualification}</p>
                  <p><IndianRupee size={13} /> {doctorMeta.profileData?.consultation_fee || 0} consultation fee</p>
                  <p><MapPin size={13} /> {doctorMeta.profileData?.clinic_address || "N/A"}</p>
                </div>
              )}
            </div>

            <div className="pt-card">
              <div className="pt-card-head">
                <Calendar size={18} />
                <h2>{editingAppointmentId ? "Reschedule Appointment" : "Select Slot & Book"}</h2>
              </div>

              {!selectedDoctorEmail ? (
                <p className="pt-empty-text">Search and select a doctor on the left to view live availability.</p>
              ) : (
                <form onSubmit={handleBookOrReschedule} className="pt-form">
                  <div className="pt-date-controls">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingMonth((prev) => {
                          if (prev === 1) {
                            setBookingYear((y) => y - 1);
                            return 12;
                          }
                          return prev - 1;
                        });
                        setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1));
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>{currentCalDate.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingMonth((prev) => {
                          if (prev === 12) {
                            setBookingYear((y) => y + 1);
                            return 1;
                          }
                          return prev + 1;
                        });
                        setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1));
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="pt-field">
                    <label>Available Target Dates</label>
                    <select
                      required
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime("");
                      }}
                    >
                      <option value="">Select a date</option>
                      {Array.from({ length: daysInMonth(currentCalDate.getFullYear(), currentCalDate.getMonth()) }).map((_, i) => {
                        const day = i + 1;
                        const loopDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day);
                        const loopDateStr = loopDate.toISOString().split("T")[0];
                        const isPast = loopDateStr < todayStr;
                        const slots = getSlotsForDate(loopDateStr);

                        if (isPast || slots.length === 0) return null;
                        return (
                          <option key={loopDateStr} value={loopDateStr}>
                            {loopDateStr} ({slots.length} available slots)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedDate && (
                    <div className="pt-field">
                      <label>Available Time Slots on {selectedDate}</label>
                      <div className="pt-chip-row">
                        {getSlotsForDate(selectedDate).length === 0 ? (
                          <p className="pt-empty-text">No open slots on this date.</p>
                        ) : (
                          getSlotsForDate(selectedDate).map((t) => {
                            const isSlotTaken = doctorAvailability.activeBookings?.some(
                              (b) => b.date === selectedDate && b.time === t
                            );
                            const isPast = isPastTimeSlot(selectedDate, t);
                            const isDisabled = isSlotTaken || isPast;

                            return (
                              <button
                                type="button"
                                key={t}
                                disabled={isDisabled}
                                className={`pt-slot-chip ${selectedTime === t ? "slot-active" : ""}`}
                                onClick={() => !isDisabled && setSelectedTime(t)}
                              >
                                <Clock size={12} /> {t} {isSlotTaken ? "(Booked)" : ""} {isPast ? "(Passed)" : ""}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-field">
                    <label>Symptoms / Reason for Visit</label>
                    <textarea rows={3} required value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
                  </div>

                  <div className="pt-form-footer">
                    <button type="submit" className="pt-btn-primary" disabled={actionLoading === "book_submit" || !selectedTime}>
                      <Save size={16} /> {editingAppointmentId ? "Confirm Reschedule" : "Book Appointment"}
                    </button>
                    <button type="button" className="pt-btn-secondary" onClick={resetBookingForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MY APPOINTMENTS TAB */}
        {!loading && activeTab === "appointments" && (
          <div className="pt-card pr-fade-in">
            <div className="pt-card-head" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} />
                <h2>My Appointments Ledger</h2>
              </div>
              <button
                className="pt-btn-primary"
                onClick={() => {
                  resetBookingForm();
                  setActiveTab("book");
                }}
              >
                <CalendarPlus size={15} /> Book New Session
              </button>
            </div>

            <div className="pt-search-box" style={{ marginBottom: "1rem" }}>
              <Search size={15} />
              <input
                placeholder="Search by doctor, specialization, status, reason..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
              />
            </div>

            {filteredAppointments.length === 0 ? (
              <p className="pt-empty-text">No appointments found. Book one from the "Book Appointment" tab.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {categorizedLedgers.confirmed.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.9rem", color: "#166534", marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      Upcoming Confirmed ({categorizedLedgers.confirmed.length})
                    </h3>
                    <div className="pt-list-stack">{renderAppointmentCardList(categorizedLedgers.confirmed)}</div>
                  </div>
                )}

                {categorizedLedgers.pending.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.9rem", color: "#92400e", marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      Awaiting Doctor Signoff ({categorizedLedgers.pending.length})
                    </h3>
                    <div className="pt-list-stack">{renderAppointmentCardList(categorizedLedgers.pending)}</div>
                  </div>
                )}

                {categorizedLedgers.visited.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      Concluded Sessions ({categorizedLedgers.visited.length})
                    </h3>
                    <div className="pt-list-stack">{renderAppointmentCardList(categorizedLedgers.visited)}</div>
                  </div>
                )}

                {categorizedLedgers.cancelled.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.9rem", color: "#991b1b", marginBottom: "0.75rem", textTransform: "uppercase" }}>
                      Cancelled / Declined ({categorizedLedgers.cancelled.length})
                    </h3>
                    <div className="pt-list-stack">{renderAppointmentCardList(categorizedLedgers.cancelled)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {!loading && activeTab === "prescriptions" && (
          <div className="pt-card pr-fade-in">
            <div className="pt-card-head">
              <FileText size={18} />
              <h2>Prescription History</h2>
            </div>

            <div className="pt-search-box" style={{ marginBottom: "1rem" }}>
              <Search size={15} />
              <input
                placeholder="Search prescriptions by title, diagnosis..."
                value={prescriptionSearch}
                onChange={(e) => setPrescriptionSearch(e.target.value)}
              />
            </div>

            {filteredPrescriptions.length === 0 ? (
              <p className="pt-empty-text">No prescriptions found in your records.</p>
            ) : (
              <div className="pt-list-stack">
                {filteredPrescriptions.map((p) => {
                  const isExpanded = expandedPrescriptionId === p._id;
                  return (
                    <div key={p._id} className="pt-prescription-card">
                      <div
                        className="pt-list-node"
                        style={{ cursor: "pointer" }}
                        onClick={() => setExpandedPrescriptionId(isExpanded ? null : p._id)}
                      >
                        <div>
                          <strong>{p.prescriptionName}</strong>
                          <span>Diagnosis: {p.diagnosis}</span>
                          <small>{p.appointmentId?.appointment_date} @ {p.appointmentId?.time_slot}</small>
                        </div>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>

                      {isExpanded && (
                        <div className="pt-prescription-detail pr-slide-fade">
                          <p><strong>Result:</strong> {p.result}</p>
                          {p.notes && <p><strong>Notes:</strong> {p.notes}</p>}

                          {p.medicines?.length > 0 && (
                            <>
                              <h4>Medicines</h4>
                              <table className="pt-table">
                                <thead>
                                  <tr>
                                    <th>Medicine</th>
                                    <th>Dosage</th>
                                    <th>Days</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.medicines.map((m, idx) => (
                                    <tr key={idx}>
                                      <td>{m.medicine}</td>
                                      <td>{m.dosage}</td>
                                      <td>{m.days}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          )}

                          {p.labReports?.length > 0 && (
                            <>
                              <h4>Requested Lab Tests</h4>
                              <div className="pt-chip-row">
                                {p.labReports.map((l, idx) => (
                                  <span key={idx} className="pt-condition-chip">{l}</span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LAB REPORTS TAB */}
        {!loading && activeTab === "labs" && (
          <div className="pt-card pr-fade-in">
            <div className="pt-card-head">
              <FlaskConical size={18} />
              <h2>Lab Report History</h2>
            </div>

            <div className="pt-search-box" style={{ marginBottom: "1rem" }}>
              <Search size={15} />
              <input placeholder="Search lab reports..." value={labSearch} onChange={(e) => setLabSearch(e.target.value)} />
            </div>

            {filteredLabReports.length === 0 ? (
              <p className="pt-empty-text">No diagnostic laboratory reports found.</p>
            ) : (
              <div className="pt-table-wrapper">
                <table className="pt-table">
                  <thead>
                    <tr>
                      <th>Requested Tests</th>
                      <th>Status</th>
                      <th>Findings</th>
                      <th>Billing Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLabReports.map((r) => (
                      <tr key={r.historyId || r._id}>
                        <td>{(r.requestedTests || []).join(", ")}</td>
                        <td><span className={`pt-status-tag tag-${r.status}`}>{r.status}</span></td>
                        <td>{r.reportData?.findings || "Awaiting Completion"}</td>
                        <td><IndianRupee size={11} /> {r.billingAmount}</td>
                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BILLING TAB */}
        {!loading && activeTab === "billing" && (
          <div className="pt-card pr-fade-in">
            <div className="pt-card-head">
              <Receipt size={18} />
              <h2>Billing & Payments</h2>
            </div>

            <div className="pt-tabs-sub-bar">
              <button className={`pt-subtab ${billingTab === "unpaid" ? "subtab-active" : ""}`} onClick={() => setBillingTab("unpaid")}>
                <Receipt size={14} /> Unpaid ({billingHistory.unpaid.length})
              </button>
              <button className={`pt-subtab ${billingTab === "insurancePending" ? "subtab-active" : ""}`} onClick={() => setBillingTab("insurancePending")}>
                <Shield size={14} /> Insurance Pending ({billingHistory.insurancePending.length})
              </button>
              <button className={`pt-subtab ${billingTab === "paid" ? "subtab-active" : ""}`} onClick={() => setBillingTab("paid")}>
                <CheckCircle size={14} /> Paid ({billingHistory.paid.length})
              </button>
              <button className={`pt-subtab ${billingTab === "cancelled" ? "subtab-active" : ""}`} onClick={() => setBillingTab("cancelled")}>
                <XCircle size={14} /> Cancelled ({billingHistory.cancelled.length})
              </button>
            </div>

            <div className="pt-search-box" style={{ marginBottom: "1rem" }}>
              <Search size={15} />
              <input placeholder="Search invoices by number or doctor..." value={billingSearch} onChange={(e) => setBillingSearch(e.target.value)} />
            </div>

            {filteredInvoices.length === 0 ? (
              <p className="pt-empty-text">No invoices found in this category.</p>
            ) : (
              <div className="pt-invoice-grid">
                {filteredInvoices.map((item) => {
                  const isExpanded = expandedInvoiceId === item._id;
                  return (
                    <div key={item._id} className="pt-invoice-card">
                      <div className="pt-invoice-head" style={{ cursor: "pointer" }} onClick={() => setExpandedInvoiceId(isExpanded ? null : item._id)}>
                        <div>
                          <strong>{item.invoiceNumber}</strong>
                          <span>Dr. {item.doctorName}</span>
                        </div>
                        <div className="pt-badge-flex">
                          <span className={`pt-status-tag tag-${billingTab}`}>{String(item.paymentStatus || "").replace(/_/g, " ")}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      <div className="pt-invoice-totals">
                        <span>Net Payable:</span>
                        <strong><IndianRupee size={13} /> {item.netPayableAmount || 0}</strong>
                      </div>

                      {isExpanded && (
                        <div className="pt-invoice-detail pr-slide-fade">
                          <table className="pt-table">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>Category</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(item.billingItems || []).map((bi, idx) => (
                                <tr key={idx}>
                                  <td>{bi.name}</td>
                                  <td>{bi.category}</td>
                                  <td>₹{bi.totalPrice}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="pt-btn-group" style={{ marginTop: "0.5rem" }}>
                        <button className="pt-btn-secondary" onClick={() => generateInvoicePDF(item)}>
                          <Download size={13} /> Receipt
                        </button>
                        {billingTab === "unpaid" && (
                          <button className="pt-btn-primary wide-btn" onClick={() => openPaymentForm(item)}>
                            <CreditCard size={14} /> Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {payingInvoice && (
              <div className="pt-modal-overlay" onClick={() => setPayingInvoice(null)}>
                <div className="pt-modal-box" onClick={(e) => e.stopPropagation()}>
                  <div className="pt-modal-head">
                    <h3>Pay Invoice {payingInvoice.invoiceNumber}</h3>
                    <button onClick={() => setPayingInvoice(null)}>
                      <X size={16} />
                    </button>
                  </div>
                  <p className="pt-modal-amount">
                    <IndianRupee size={16} /> {payingInvoice.netPayableAmount}
                  </p>
                  <form onSubmit={submitPayment} className="pt-form">
                    <div className="pt-field">
                      <label>Payment Method</label>
                      <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                        <option value="UPI">Instant UPI</option>
                        <option value="Card">Debit / Credit Card</option>
                        <option value="Net_Banking">Net Banking</option>
                      </select>
                    </div>
                    <div className="pt-field">
                      <label>Transaction / UTR Ref ID</label>
                      <input required value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} />
                    </div>
                    <div className="pt-field">
                      <label>Account Holder / Payer Name</label>
                      <input required value={paymentForm.cardOrPayerName} onChange={(e) => setPaymentForm({ ...paymentForm, cardOrPayerName: e.target.value })} />
                    </div>
                    <button type="submit" className="pt-btn-primary wide-btn" disabled={actionLoading === "submit_payment"}>
                      {actionLoading === "submit_payment" ? <Loader2 size={15} className="pt-spin" /> : <CreditCard size={15} />}
                      <span>Confirm & Authorize Payment</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}