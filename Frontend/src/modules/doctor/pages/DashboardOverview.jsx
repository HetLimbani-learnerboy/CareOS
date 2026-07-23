import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Calendar,
  CheckCircle,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  Award,
  Stethoscope,
  Activity,
  Users,
  FlaskConical,
  BedDouble,
  Save,
  ChevronRight,
  X,
  IndianRupee,
  MapPin,
  Phone
} from "lucide-react";
import "../style/DashboardOverview.css";

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
  const doctorEmail = userObj?.email || "";

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionIdLoading] = useState(null);
  const [bannerMessage, setBannerMessage] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState({
    firstName: userObj?.firstName || userObj?.first_name || "",
    lastName: userObj?.lastName || userObj?.last_name || "",
    phone: userObj?.phone || "",
    email: doctorEmail,
    specialization: "",
    qualification: "",
    experience_start_date: "",
    consultation_fee: 0,
    bio: "",
    clinic_address: ""
  });

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [appointmentRoster, setAppointmentRoster] = useState({ pendingRequests: [], appointments: [] });
  const [appointmentSearch, setAppointmentSearch] = useState("");

  const [patientRoster, setPatientRoster] = useState([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);

  const [catalogs, setCatalogs] = useState({ medicines: [], labReports: [] });
  const [prescriptionForm, setPrescriptionForm] = useState({
    appointmentId: "",
    patientEmail: "",
    prescriptionName: "Standard Consult Care Plan",
    diagnosis: "",
    notes: "",
    result: "Follow Medication Protocol",
    medicines: [{ medicine: "", dosage: "1-0-1", days: 5 }],
    labReports: [""]
  });
  const [editingPrescriptionId, setEditingPrescriptionId] = useState(null);

  const [labReviews, setLabReviews] = useState([]);
  const [labSearch, setLabSearch] = useState("");

  const [inpatientQueue, setInpatientQueue] = useState([]);
  const [inpatientSearch, setInpatientSearch] = useState("");

  const [treatmentForm, setTreatmentForm] = useState({
    admissionId: "",
    planId: null,
    treatmentHeading: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "09:00 AM",
    clinicalNotes: "",
    items: [{ itemType: "Medication Administration", itemName: "", dosageConfiguration: "", unitPrice: 0, quantity: 1 }]
  });

  const authHeaders = useMemo(
    () => ({
      headers: {
        "x-doctor-email": doctorEmail,
        "x-user-email": doctorEmail,
        "x-user-role": "doctor"
      }
    }),
    [doctorEmail]
  );

  const notify = (type, text) => setBannerMessage({ type, text });
  const clearNotify = () => setBannerMessage({ type: "", text: "" });

  const getAppointmentId = (apt) =>
    String(apt?.id || apt?._id || apt?.appointmentId || apt?.appointment_id || apt?.appointmentDetails?._id || "");

  const getPatientEmail = (apt) =>
    apt?.patientEmail ||
    apt?.patient_email ||
    apt?.email ||
    apt?.patient?.email ||
    apt?.patient_id?.email ||
    apt?.patientDetails?.email ||
    "";

  const getPatientName = (apt) =>
    apt?.patient ||
    apt?.patientName ||
    apt?.patient_name ||
    [apt?.patient?.firstName, apt?.patient?.lastName].filter(Boolean).join(" ") ||
    [apt?.patient_id?.firstName, apt?.patient_id?.lastName].filter(Boolean).join(" ") ||
    [apt?.patientDetails?.firstName, apt?.patientDetails?.lastName].filter(Boolean).join(" ") ||
    "Patient";

  const getAppointmentReason = (apt) =>
    apt?.reason || apt?.reason_for_visit || apt?.symptoms || apt?.diagnosis || "General Consultation";

  const getAppointmentDate = (apt) =>
    apt?.date || apt?.appointment_date || apt?.appointmentDetails?.appointment_date || "";

  const getAppointmentTime = (apt) =>
    apt?.time || apt?.time_slot || apt?.appointment_time || apt?.appointmentDetails?.time_slot || "";

  const calculateExperienceYears = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return 0;
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) years -= 1;
    return Math.max(years, 0);
  };

  const normalizeProfile = (data) => {
    const user = data?.user || {};
    const doctorProfile = data?.profile || {};
    return {
      firstName: user.firstName || user.first_name || "",
      lastName: user.lastName || user.last_name || "",
      phone: user.phone || "",
      email: user.email || doctorEmail,
      specialization: doctorProfile.specialization || "",
      qualification: doctorProfile.qualification || "",
      experience_start_date: doctorProfile.experience_start_date ? String(doctorProfile.experience_start_date).split("T")[0] : "",
      consultation_fee: Number(doctorProfile.consultation_fee || 0),
      bio: doctorProfile.bio || "",
      clinic_address: doctorProfile.clinic_address || ""
    };
  };

  const fetchProfileData = useCallback(async () => {
    if (!doctorEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/doctors/profile?email=${encodeURIComponent(doctorEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setProfile((prev) => ({ ...prev, ...normalizeProfile(res.data.data) }));
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Unable to retrieve doctor profile.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, doctorEmail, authHeaders]);

  const saveProfileData = async (e) => {
    e.preventDefault();
    try {
      setActionIdLoading("profile_save");
      clearNotify();

      const payload = {
        email: doctorEmail,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        specialization: profile.specialization,
        qualification: profile.qualification,
        experience_start_date: profile.experience_start_date,
        consultation_fee: Number(profile.consultation_fee || 0),
        bio: profile.bio,
        clinic_address: profile.clinic_address
      };

      const res = await axios.put(`${API_BASE_URL}/api/v1/doctors/profile`, payload, authHeaders);
      if (res.data?.status === "success") {
        setProfile((prev) => ({ ...prev, ...normalizeProfile(res.data.data) }));
      }
      notify("success", "Doctor profile updated successfully.");
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to update doctor profile.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const fetchAppointmentsAndSchedule = useCallback(async () => {
    if (!doctorEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/doctors/appointments?email=${encodeURIComponent(doctorEmail)}&year=${currentYear}&month=${currentMonth}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setAppointmentRoster({
          pendingRequests: Array.isArray(res.data.data?.pendingRequests) ? res.data.data.pendingRequests : [],
          appointments: Array.isArray(res.data.data?.appointments) ? res.data.data.appointments : []
        });
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to retrieve appointment schedule roster.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, doctorEmail, currentYear, currentMonth, authHeaders]);

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      setActionIdLoading(appointmentId);
      clearNotify();
      await axios.patch(
        `${API_BASE_URL}/api/v1/doctors/appointments/${appointmentId}/status`,
        { email: doctorEmail, status },
        authHeaders
      );
      notify("success", `Appointment request set to ${status}.`);
      fetchAppointmentsAndSchedule();
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to modify appointment state.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const fetchPatientRosterData = useCallback(async () => {
    if (!doctorEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/doctors/patients?doctorEmail=${encodeURIComponent(doctorEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setPatientRoster(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to retrieve patient roster.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, doctorEmail, authHeaders]);

  const fetchHistoryForPatient = async (patientEmail) => {
    try {
      setActionIdLoading(`history_${patientEmail}`);
      clearNotify();
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/doctors/patients/history?doctorEmail=${encodeURIComponent(doctorEmail)}&patientEmail=${encodeURIComponent(patientEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setSelectedPatientHistory(res.data.data);
        return res.data.data;
      }
      return null;
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to fetch patient history.");
      return null;
    } finally {
      setActionIdLoading(null);
    }
  };

  const fetchCatalogData = useCallback(async () => {
    try {
      const specialization = profile.specialization || "General Medicine";
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/doctors/catalogs?specialization=${encodeURIComponent(specialization)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setCatalogs({
          medicines: Array.isArray(res.data.data?.medicines) ? res.data.data.medicines : [],
          labReports: Array.isArray(res.data.data?.labReports) ? res.data.data.labReports : []
        });
      }
    } catch {
      setCatalogs({ medicines: [], labReports: [] });
    }
  }, [API_BASE_URL, profile.specialization, authHeaders]);

  const fillPrescriptionForm = (appointment, prescription = null) => {
    const appointmentId = getAppointmentId(appointment);
    const patientEmail = getPatientEmail(appointment);
    const patientName = getPatientName(appointment);

    setPrescriptionForm({
      appointmentId,
      patientEmail,
      prescriptionName: prescription?.prescriptionName || `Consult Plan - ${patientName}`,
      diagnosis: prescription?.diagnosis || getAppointmentReason(appointment),
      notes: prescription?.notes || "",
      result: prescription?.result || "Follow Medication Protocol",
      medicines: prescription?.medicines?.length
        ? prescription.medicines.map((item) => ({
          medicine: item.medicine || "",
          dosage: item.dosage || "",
          days: Number(item.days || 1)
        }))
        : [{ medicine: "", dosage: "1-0-1", days: 5 }],
      labReports: prescription?.labReports?.length ? prescription.labReports : [""]
    });
  };

  const handleInitiatePrescription = async (apt) => {
    const appointmentId = getAppointmentId(apt);
    const patientEmail = getPatientEmail(apt);
    const patientName = getPatientName(apt);

    if (!appointmentId) {
      notify("error", "Appointment id missing. Cannot create prescription.");
      return;
    }

    if (!patientEmail) {
      notify("error", "Patient email missing. Cannot create prescription.");
      return;
    }

    try {
      setActionIdLoading(`prescribe_${appointmentId}`);
      clearNotify();
      await fetchCatalogData();

      const history = await fetchHistoryForPatient(patientEmail);
      const matchedTimeline = history?.timeline?.find(
        (item) => String(item.appointmentId || item.appointment_id || "") === String(appointmentId)
      );
      const existingPrescription = matchedTimeline?.prescription || null;

      if (existingPrescription?._id) {
        setEditingPrescriptionId(existingPrescription._id);
        fillPrescriptionForm(apt, existingPrescription);
        notify("success", `Existing prescription opened for ${patientName}.`);
      } else {
        setEditingPrescriptionId(null);
        fillPrescriptionForm(apt);
        notify("success", `Prescription draft opened for ${patientName}.`);
      }

      setActiveTab("prescription");
    } catch (err) {
      notify("error", err.response?.data?.message || "Unable to open prescription draft.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const handleAddMedicineRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { medicine: "", dosage: "1-0-1", days: 5 }]
    }));
  };

  const handleRemoveMedicineRow = (idx) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== idx)
    }));
  };

  const handleAddLabRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      labReports: [...prev.labReports, ""]
    }));
  };

  const handleRemoveLabRow = (idx) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      labReports: prev.labReports.filter((_, i) => i !== idx)
    }));
  };

  const resetPrescriptionForm = () => {
    setEditingPrescriptionId(null);
    setPrescriptionForm({
      appointmentId: "",
      patientEmail: "",
      prescriptionName: "Standard Consult Care Plan",
      diagnosis: "",
      notes: "",
      result: "Follow Medication Protocol",
      medicines: [{ medicine: "", dosage: "1-0-1", days: 5 }],
      labReports: [""]
    });
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionIdLoading("submit_prescription");
      clearNotify();

      const medicines = prescriptionForm.medicines
        .filter((item) => String(item.medicine || "").trim())
        .map((item) => ({
          medicine: String(item.medicine || "").trim(),
          dosage: String(item.dosage || "").trim() || "As directed",
          days: Number(item.days || 1)
        }));

      const labReports = prescriptionForm.labReports
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      if (!medicines.length && !labReports.length) {
        notify("error", "Add at least one medicine or lab report before issuing prescription.");
        return;
      }

      const payload = {
        appointmentId: prescriptionForm.appointmentId,
        patientEmail: prescriptionForm.patientEmail,
        doctorEmail,
        prescriptionName: prescriptionForm.prescriptionName.trim(),
        diagnosis: prescriptionForm.diagnosis.trim(),
        notes: prescriptionForm.notes.trim(),
        result: prescriptionForm.result.trim(),
        medicines,
        labReports
      };

      if (editingPrescriptionId) {
        await axios.patch(
          `${API_BASE_URL}/api/v1/doctors/e-prescription/${editingPrescriptionId}`,
          payload,
          authHeaders
        );
        notify("success", "Prescription updated successfully.");
      } else {
        await axios.post(`${API_BASE_URL}/api/v1/doctors/e-prescription`, payload, authHeaders);
        notify("success", "E-prescription issued successfully.");
      }

      resetPrescriptionForm();
      setActiveTab("appointments");
      fetchAppointmentsAndSchedule();
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to process prescription.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    try {
      setActionIdLoading(`delete_pres_${prescriptionId}`);
      clearNotify();
      await axios.delete(
        `${API_BASE_URL}/api/v1/doctors/e-prescription/${prescriptionId}?doctorEmail=${encodeURIComponent(doctorEmail)}`,
        authHeaders
      );
      notify("success", "Prescription record deleted.");
      if (selectedPatientHistory?.patient?.email) {
        fetchHistoryForPatient(selectedPatientHistory.patient.email);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to remove prescription.");
    } finally {
      setActionIdLoading(null);
    }
  };

  const fetchLabReviewsData = useCallback(async () => {
    if (!doctorEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/doctors/lab-reviews?email=${encodeURIComponent(doctorEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setLabReviews(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to fetch laboratory review requests.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, doctorEmail, authHeaders]);

  const fetchInpatientQueueData = useCallback(async () => {
    if (!doctorEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/doctors/inpatient/treatment-queue?doctorEmail=${encodeURIComponent(doctorEmail)}`,
        authHeaders
      );
      if (res.data?.status === "success") {
        setInpatientQueue(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to load active admitted inpatient roster.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, doctorEmail, authHeaders]);

  const handleAddTreatmentItem = () => {
    setTreatmentForm((prev) => ({
      ...prev,
      items: [...prev.items, { itemType: "Medication Administration", itemName: "", dosageConfiguration: "", unitPrice: 0, quantity: 1 }]
    }));
  };

  const handleRemoveTreatmentItem = (idx) => {
    setTreatmentForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleTreatmentPlanSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionIdLoading("submit_treatment");
      clearNotify();

      const payload = {
        ...treatmentForm,
        doctorEmail,
        items: treatmentForm.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice || 0),
          quantity: Number(item.quantity || 1)
        }))
      };

      if (treatmentForm.planId) {
        await axios.put(
          `${API_BASE_URL}/api/v1/doctors/inpatient/treatment-plan/${treatmentForm.planId}`,
          payload,
          authHeaders
        );
        notify("success", "Treatment plan updated.");
      } else {
        await axios.post(`${API_BASE_URL}/api/v1/doctors/inpatient/treatment-plan`, payload, authHeaders);
        notify("success", "New treatment directive issued.");
      }

      setTreatmentForm({
        admissionId: "",
        planId: null,
        treatmentHeading: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTime: "09:00 AM",
        clinicalNotes: "",
        items: [{ itemType: "Medication Administration", itemName: "", dosageConfiguration: "", unitPrice: 0, quantity: 1 }]
      });

      fetchInpatientQueueData();
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to submit treatment directive.");
    } finally {
      setActionIdLoading(null);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (profile.specialization) fetchCatalogData();
  }, [profile.specialization, fetchCatalogData]);

  useEffect(() => {
    if (activeTab === "appointments") fetchAppointmentsAndSchedule();
    if (activeTab === "roster") fetchPatientRosterData();
    if (activeTab === "labs") fetchLabReviewsData();
    if (activeTab === "inpatients") fetchInpatientQueueData();
  }, [activeTab, fetchAppointmentsAndSchedule, fetchPatientRosterData, fetchLabReviewsData, fetchInpatientQueueData]);

  const filteredAppointments = useMemo(() => {
    const term = appointmentSearch.toLowerCase().trim();
    const pendingRequests = appointmentRoster.pendingRequests || [];
    const appointments = appointmentRoster.appointments || [];

    if (!term) return { pendingRequests, appointments };

    return {
      pendingRequests: pendingRequests.filter((apt) =>
        [getPatientName(apt), getPatientEmail(apt), getAppointmentReason(apt), getAppointmentDate(apt), getAppointmentTime(apt)]
          .join(" ")
          .toLowerCase()
          .includes(term)
      ),
      appointments: appointments.filter((apt) =>
        [getPatientName(apt), getPatientEmail(apt), getAppointmentReason(apt), getAppointmentDate(apt), getAppointmentTime(apt)]
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
    };
  }, [appointmentRoster, appointmentSearch]);

  const filteredRoster = useMemo(() => {
    const term = rosterSearch.toLowerCase().trim();
    if (!term) return patientRoster;
    return patientRoster.filter((p) =>
      [p.patientName, p.patientEmail].join(" ").toLowerCase().includes(term)
    );
  }, [patientRoster, rosterSearch]);

  const filteredLabReviews = useMemo(() => {
    const term = labSearch.toLowerCase().trim();
    if (!term) return labReviews;
    return labReviews.filter((r) =>
      [r.patientDetails?.firstName, r.patientDetails?.lastName, r.patientDetails?.email, r.status]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [labReviews, labSearch]);

  const filteredInpatientQueue = useMemo(() => {
    const term = inpatientSearch.toLowerCase().trim();
    if (!term) return inpatientQueue;
    return inpatientQueue.filter((ip) =>
      [ip.patientName, ip.patientEmail, ip.diagnosis].join(" ").toLowerCase().includes(term)
    );
  }, [inpatientQueue, inpatientSearch]);

  const experienceYears = calculateExperienceYears(profile.experience_start_date);

  return (
    <div className="doc-root pr-fade-in">
      <header className="doc-header">
        <div className="doc-brand">
          <div className="doc-icon-badge">
            <Stethoscope size={22} />
          </div>
          <div>
            <h1>Dr. {profile.firstName} {profile.lastName}</h1>
            <p>{profile.specialization || "Doctor"} &bull; CareOS Physician Workspace</p>
          </div>
        </div>

        <div className="doc-header-actions">
          <span className="doc-tag-badge">
            <Award size={14} /> {profile.qualification || "Certified Practitioner"}
          </span>
          <button
            className="doc-btn-secondary"
            onClick={() => {
              if (activeTab === "appointments") fetchAppointmentsAndSchedule();
              else if (activeTab === "roster") fetchPatientRosterData();
              else if (activeTab === "labs") fetchLabReviewsData();
              else if (activeTab === "inpatients") fetchInpatientQueueData();
              else fetchProfileData();
            }}
          >
            <RefreshCw size={14} className={loading ? "doc-spin" : ""} />
            <span>Sync Engine</span>
          </button>
        </div>
      </header>

      {bannerMessage.text && (
        <div className={`doc-banner ${bannerMessage.type === "error" ? "banner-err" : "banner-ok"}`}>
          {bannerMessage.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{bannerMessage.text}</span>
          <button onClick={clearNotify} className="banner-close">
            <X size={14} />
          </button>
        </div>
      )}

      <nav className="doc-tabs-bar">
        <button className={`doc-tab ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")}>
          <Activity size={16} /> Dashboard Overview
        </button>
        <button className={`doc-tab ${activeTab === "appointments" ? "tab-active" : ""}`} onClick={() => setActiveTab("appointments")}>
          <Calendar size={16} /> Appointment Requests
        </button>
        <button className={`doc-tab ${activeTab === "prescription" ? "tab-active" : ""}`} onClick={() => setActiveTab("prescription")}>
          <FileText size={16} /> Issue E-Prescription
        </button>
        <button className={`doc-tab ${activeTab === "roster" ? "tab-active" : ""}`} onClick={() => setActiveTab("roster")}>
          <Users size={16} /> Patient Roster
        </button>
        <button className={`doc-tab ${activeTab === "labs" ? "tab-active" : ""}`} onClick={() => setActiveTab("labs")}>
          <FlaskConical size={16} /> Lab Reviews
        </button>
        <button className={`doc-tab ${activeTab === "inpatients" ? "tab-active" : ""}`} onClick={() => setActiveTab("inpatients")}>
          <BedDouble size={16} /> Inpatient Directives
        </button>
      </nav>

      <main className="doc-viewport">
        {loading && (
          <div className="doc-skeleton-stack">
            <div className="doc-skeleton-node" />
            <div className="doc-skeleton-node" />
            <div className="doc-skeleton-node" />
          </div>
        )}

        {!loading && activeTab === "overview" && (
          <div className="doc-grid-2 col-unequal pr-fade-in">
            <div className="doc-card">
              <div className="doc-card-head">
                <Activity size={18} />
                <h2>Practitioner Clinical Status</h2>
              </div>

              <div className="doc-stats-grid">
                <div className="doc-stat-box">
                  <span>Specialization</span>
                  <strong>{profile.specialization || "Not set"}</strong>
                </div>
                <div className="doc-stat-box">
                  <span>Experience</span>
                  <strong>{experienceYears} Years</strong>
                </div>
                <div className="doc-stat-box">
                  <span>Consult Fee</span>
                  <strong><IndianRupee size={15} /> {Number(profile.consultation_fee || 0)}</strong>
                </div>
                <div className="doc-stat-box">
                  <span>Registered Email</span>
                  <small>{doctorEmail}</small>
                </div>
              </div>

              <div className="doc-profile-lines">
                <p><Phone size={15} /> {profile.phone || "Phone not set"}</p>
                <p><MapPin size={15} /> {profile.clinic_address || "Clinic address not set"}</p>
              </div>

              <p className="doc-bio-text">{profile.bio || "No practitioner biography provided."}</p>
            </div>

            <div className="doc-card">
              <div className="doc-card-head">
                <Shield size={18} />
                <h2>Doctor Profile Setup</h2>
              </div>

              <form onSubmit={saveProfileData} className="doc-form">
                <div className="doc-grid-2">
                  <div className="doc-field">
                    <label>First Name</label>
                    <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} required />
                  </div>
                  <div className="doc-field">
                    <label>Last Name</label>
                    <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} required />
                  </div>
                </div>

                <div className="doc-grid-2">
                  <div className="doc-field">
                    <label>Phone</label>
                    <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                  <div className="doc-field">
                    <label>Specialization</label>
                    <input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} required />
                  </div>
                </div>

                <div className="doc-grid-2">
                  <div className="doc-field">
                    <label>Qualification</label>
                    <input value={profile.qualification} onChange={(e) => setProfile({ ...profile, qualification: e.target.value })} required />
                  </div>
                  <div className="doc-field">
                    <label>Experience Start Date</label>
                    <input type="date" value={profile.experience_start_date} onChange={(e) => setProfile({ ...profile, experience_start_date: e.target.value })} required />
                  </div>
                </div>

                <div className="doc-grid-2">
                  <div className="doc-field">
                    <label>Consultation Fee</label>
                    <input type="number" min="0" value={profile.consultation_fee} onChange={(e) => setProfile({ ...profile, consultation_fee: e.target.value })} required />
                  </div>
                  <div className="doc-field">
                    <label>Clinic Address</label>
                    <input value={profile.clinic_address} onChange={(e) => setProfile({ ...profile, clinic_address: e.target.value })} required />
                  </div>
                </div>

                <div className="doc-field">
                  <label>Bio</label>
                  <textarea rows={3} maxLength={1000} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
                </div>

                <button type="submit" className="doc-btn-primary" disabled={actionLoading === "profile_save"}>
                  <Save size={16} /> Save Profile
                </button>
              </form>
            </div>
          </div>
        )}

        {!loading && activeTab === "appointments" && (
          <div className="doc-card pr-fade-in">
            <div className="doc-card-head">
              <Calendar size={18} />
              <h2>Appointment Requests Roster</h2>
            </div>

            <div className="doc-search-box" style={{ marginBottom: "1rem" }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search appointments by patient name, email, or reason..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
              />
            </div>

            <div className="doc-date-controls">
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth((prev) => {
                    if (prev === 1) {
                      setCurrentYear((year) => year - 1);
                      return 12;
                    }
                    return prev - 1;
                  });
                }}
              >
                &lt;
              </button>
              <span>{currentYear} - Month {currentMonth}</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth((prev) => {
                    if (prev === 12) {
                      setCurrentYear((year) => year + 1);
                      return 1;
                    }
                    return prev + 1;
                  });
                }}
              >
                &gt;
              </button>
            </div>

            <h3>Pending Consultation Requests</h3>
            {filteredAppointments.pendingRequests.length === 0 ? (
              <p className="doc-empty-text">No pending appointment requests discovered.</p>
            ) : (
              <div className="doc-list-stack">
                {filteredAppointments.pendingRequests.map((apt) => {
                  const appointmentId = getAppointmentId(apt);
                  return (
                    <div key={appointmentId} className="doc-list-node">
                      <div>
                        <strong>{getPatientName(apt)}</strong>
                        <span>{getPatientEmail(apt)} &bull; Reason: {getAppointmentReason(apt)}</span>
                        <small>Slot: {getAppointmentDate(apt)} @ {getAppointmentTime(apt)}</small>
                      </div>
                      <div className="doc-btn-group">
                        <button className="doc-btn-ok" disabled={actionLoading === appointmentId} onClick={() => handleUpdateAppointmentStatus(appointmentId, "confirmed")}>
                          Confirm
                        </button>
                        <button className="doc-btn-err" disabled={actionLoading === appointmentId} onClick={() => handleUpdateAppointmentStatus(appointmentId, "rejected")}>
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <h3 style={{ marginTop: "1.5rem" }}>Confirmed Appointments</h3>
            {filteredAppointments.appointments.length === 0 ? (
              <p className="doc-empty-text">No confirmed appointments scheduled for this month.</p>
            ) : (
              <div className="doc-list-stack">
                {filteredAppointments.appointments.map((apt) => {
                  const appointmentId = getAppointmentId(apt);
                  return (
                    <div key={appointmentId} className="doc-list-node node-confirmed">
                      <div>
                        <strong>{getPatientName(apt)}</strong>
                        <span>{getPatientEmail(apt)}</span>
                        <small>Confirmed Slot: {getAppointmentDate(apt)} @ {getAppointmentTime(apt)}</small>
                      </div>
                      <button
                        className="doc-btn-primary"
                        disabled={actionLoading === `prescribe_${appointmentId}`}
                        onClick={() => handleInitiatePrescription(apt)}
                      >
                        <FileText size={15} /> Prescribe
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "prescription" && (
          <div className="doc-card pr-fade-in">
            <div className="doc-card-head">
              <FileText size={18} />
              <h2>{editingPrescriptionId ? "Update E-Prescription" : "Draft New E-Prescription"}</h2>
            </div>

            <form onSubmit={handlePrescriptionSubmit} className="doc-form">
              <div className="doc-grid-2">
                <div className="doc-field">
                  <label>Appointment Target ID</label>
                  <input type="text" required value={prescriptionForm.appointmentId} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, appointmentId: e.target.value })} />
                </div>
                <div className="doc-field">
                  <label>Patient Email</label>
                  <input type="email" required value={prescriptionForm.patientEmail} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientEmail: e.target.value })} />
                </div>
              </div>

              <div className="doc-grid-2">
                <div className="doc-field">
                  <label>Prescription Title</label>
                  <input required value={prescriptionForm.prescriptionName} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescriptionName: e.target.value })} />
                </div>
                <div className="doc-field">
                  <label>Diagnosis Heading</label>
                  <input required value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })} />
                </div>
              </div>

              <div className="doc-field">
                <label>Clinical Directives / Result Status</label>
                <input required value={prescriptionForm.result} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, result: e.target.value })} />
              </div>

              <div className="doc-field">
                <label>Doctor Notes</label>
                <textarea rows={2} value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })} />
              </div>

              <div className="doc-section-divider">
                <h3>Prescribed Medicines List</h3>
                <button type="button" className="doc-btn-secondary" onClick={handleAddMedicineRow}>
                  <Plus size={14} /> Add Medicine
                </button>
              </div>

              {prescriptionForm.medicines.map((med, idx) => (
                <div key={idx} className="doc-row-inline">
                  <input
                    type="text"
                    placeholder="Select or enter medicine"
                    list="medicine-catalog-list"
                    value={med.medicine}
                    onChange={(e) => {
                      const updated = [...prescriptionForm.medicines];
                      updated[idx].medicine = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => {
                      const updated = [...prescriptionForm.medicines];
                      updated[idx].dosage = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                    }}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Days"
                    value={med.days}
                    onChange={(e) => {
                      const updated = [...prescriptionForm.medicines];
                      updated[idx].days = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                    }}
                  />
                  {prescriptionForm.medicines.length > 1 && (
                    <button type="button" className="doc-btn-icon-err" onClick={() => handleRemoveMedicineRow(idx)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}

              <datalist id="medicine-catalog-list">
                {catalogs.medicines.map((m, i) => (
                  <option key={i} value={m.medicine_name || m.name || m.medicine} />
                ))}
              </datalist>

              <div className="doc-section-divider">
                <h3>Diagnostic Lab Test Orders</h3>
                <button type="button" className="doc-btn-secondary" onClick={handleAddLabRow}>
                  <Plus size={14} /> Add Lab Requisition
                </button>
              </div>

              {prescriptionForm.labReports.map((lab, idx) => (
                <div key={idx} className="doc-row-inline">
                  <input
                    type="text"
                    placeholder="Select diagnostic report"
                    list="lab-catalog-list"
                    value={lab}
                    onChange={(e) => {
                      const updated = [...prescriptionForm.labReports];
                      updated[idx] = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, labReports: updated });
                    }}
                  />
                  {prescriptionForm.labReports.length > 1 && (
                    <button type="button" className="doc-btn-icon-err" onClick={() => handleRemoveLabRow(idx)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}

              <datalist id="lab-catalog-list">
                {catalogs.labReports.map((l, i) => (
                  <option key={i} value={l.report_name || l.name || l.reportName} />
                ))}
              </datalist>

              <div className="doc-form-footer">
                <button type="submit" className="doc-btn-primary" disabled={actionLoading === "submit_prescription"}>
                  <Save size={16} /> {editingPrescriptionId ? "Update Prescription" : "Issue E-Prescription"}
                </button>
                <button type="button" className="doc-btn-secondary" onClick={resetPrescriptionForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!loading && activeTab === "roster" && (
          <div className="doc-grid-2 col-unequal pr-fade-in">
            <div className="doc-card">
              <div className="doc-card-head">
                <Users size={18} />
                <h2>Consulted Patients Roster</h2>
              </div>

              <div className="doc-search-box">
                <Search size={15} />
                <input value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} placeholder="Filter patient roster by name or email..." />
              </div>

              <div className="doc-list-stack">
                {filteredRoster.map((pt, idx) => (
                  <div key={idx} className="doc-list-node" onClick={() => fetchHistoryForPatient(pt.patientEmail)}>
                    <div>
                      <strong>{pt.patientName}</strong>
                      <span>{pt.patientEmail}</span>
                      <small>Visits: {pt.totalVisits || 0} &bull; Prescriptions: {pt.totalPrescriptions || 0}</small>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))}
              </div>
            </div>

            <div className="doc-card">
              <div className="doc-card-head">
                <Activity size={18} />
                <h2>Patient History Timeline</h2>
              </div>

              {!selectedPatientHistory ? (
                <p className="doc-empty-text">Select a patient from the left roster to inspect clinical timelines and prescriptions.</p>
              ) : (
                <div>
                  <h3>{selectedPatientHistory.patient?.name} ({selectedPatientHistory.patient?.email})</h3>
                  <div className="doc-timeline-stack">
                    {(selectedPatientHistory.timeline || []).map((item, idx) => (
                      <div key={idx} className="doc-timeline-node">
                        <div className="doc-tl-marker" />
                        <div>
                          <strong>{item.date} @ {item.time}</strong>
                          <p>Reason: {item.reason || "Routine"}</p>
                          {item.prescription && (
                            <div className="doc-tl-prescription-box">
                              <span>Prescription ID: {item.prescription._id}</span>
                              <p>Diagnosis: {item.prescription.diagnosis}</p>
                              <div className="doc-btn-group">
                                <button
                                  className="doc-btn-secondary"
                                  onClick={() => {
                                    setEditingPrescriptionId(item.prescription._id);
                                    setPrescriptionForm({
                                      appointmentId: String(item.prescription.appointmentId || item.appointmentId || ""),
                                      patientEmail: item.prescription.patientEmail || selectedPatientHistory.patient?.email || "",
                                      prescriptionName: item.prescription.prescriptionName || "",
                                      diagnosis: item.prescription.diagnosis || "",
                                      notes: item.prescription.notes || "",
                                      result: item.prescription.result || "",
                                      medicines: item.prescription.medicines?.length
                                        ? item.prescription.medicines.map((m) => ({
                                          medicine: m.medicine || "",
                                          dosage: m.dosage || "",
                                          days: Number(m.days || 1)
                                        }))
                                        : [{ medicine: "", dosage: "1-0-1", days: 5 }],
                                      labReports: item.prescription.labReports?.length ? item.prescription.labReports : [""]
                                    });
                                    setActiveTab("prescription");
                                  }}
                                >
                                  <Edit size={12} /> Edit
                                </button>
                                <button className="doc-btn-err" disabled={actionLoading === `delete_pres_${item.prescription._id}`} onClick={() => handleDeletePrescription(item.prescription._id)}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === "labs" && (
          <div className="doc-card pr-fade-in">
            <div className="doc-card-head">
              <FlaskConical size={18} />
              <h2>Diagnostic Lab Report Reviews</h2>
            </div>

            <div className="doc-search-box" style={{ marginBottom: "1rem" }}>
              <Search size={15} />
              <input value={labSearch} onChange={(e) => setLabSearch(e.target.value)} placeholder="Search lab reviews..." />
            </div>

            {filteredLabReviews.length === 0 ? (
              <p className="doc-empty-text">No diagnostic laboratory reviews registered for your consultations.</p>
            ) : (
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Patient Details</th>
                      <th>Appointment Date</th>
                      <th>Status</th>
                      <th>Lab Findings</th>
                      <th>Billing Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLabReviews.map((rev) => (
                      <tr key={rev.historyId || rev._id}>
                        <td>
                          <strong>{rev.patientDetails?.firstName} {rev.patientDetails?.lastName}</strong>
                          <small>{rev.patientDetails?.email}</small>
                        </td>
                        <td>{rev.appointmentDetails?.appointment_date || rev.appointmentDate}</td>
                        <td><span className={`doc-status-tag tag-${rev.status}`}>{rev.status}</span></td>
                        <td>{rev.reportData?.findings || "Awaiting Lab Completion"}</td>
                        <td>₹{rev.billingAmount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "inpatients" && (
          <div className="doc-grid-2 col-unequal pr-fade-in">
            <div className="doc-card">
              <div className="doc-card-head">
                <BedDouble size={18} />
                <h2>Active Admitted Inpatient Queue</h2>
              </div>

              <div className="doc-search-box" style={{ marginBottom: "1rem" }}>
                <Search size={15} />
                <input value={inpatientSearch} onChange={(e) => setInpatientSearch(e.target.value)} placeholder="Filter inpatients..." />
              </div>

              {filteredInpatientQueue.length === 0 ? (
                <p className="doc-empty-text">No active admitted patients under your treatment orders.</p>
              ) : (
                <div className="doc-list-stack">
                  {filteredInpatientQueue.map((ip) => (
                    <div key={ip.admissionId} className="doc-list-node">
                      <div>
                        <strong>{ip.patientName}</strong>
                        <span>{ip.patientEmail} &bull; Room: {ip.roomType} Bed #{ip.bedNumber}</span>
                        <small>Diagnosis: {ip.diagnosis}</small>
                      </div>
                      <button
                        className="doc-btn-primary"
                        onClick={() =>
                          setTreatmentForm((prev) => ({
                            ...prev,
                            admissionId: ip.admissionId,
                            planId: null,
                            treatmentHeading: `Ward Care Protocol - ${ip.patientName}`
                          }))
                        }
                      >
                        Order Treatment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="doc-card">
              <div className="doc-card-head">
                <FileText size={18} />
                <h2>Issue Ward Treatment Directive</h2>
              </div>

              <form onSubmit={handleTreatmentPlanSubmit} className="doc-form">
                <div className="doc-field">
                  <label>Admission Record ID</label>
                  <input required value={treatmentForm.admissionId} onChange={(e) => setTreatmentForm({ ...treatmentForm, admissionId: e.target.value })} />
                </div>

                <div className="doc-field">
                  <label>Treatment Heading</label>
                  <input required value={treatmentForm.treatmentHeading} onChange={(e) => setTreatmentForm({ ...treatmentForm, treatmentHeading: e.target.value })} />
                </div>

                <div className="doc-grid-2">
                  <div className="doc-field">
                    <label>Scheduled Date</label>
                    <input type="date" required value={treatmentForm.scheduledDate} onChange={(e) => setTreatmentForm({ ...treatmentForm, scheduledDate: e.target.value })} />
                  </div>
                  <div className="doc-field">
                    <label>Scheduled Time</label>
                    <input required value={treatmentForm.scheduledTime} onChange={(e) => setTreatmentForm({ ...treatmentForm, scheduledTime: e.target.value })} />
                  </div>
                </div>

                <div className="doc-section-divider">
                  <h3>Treatment Order Items</h3>
                  <button type="button" className="doc-btn-secondary" onClick={handleAddTreatmentItem}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {treatmentForm.items.map((item, idx) => (
                  <div key={idx} className="doc-row-inline-grid">
                    <input
                      placeholder="Item Name"
                      value={item.itemName}
                      onChange={(e) => {
                        const updated = [...treatmentForm.items];
                        updated[idx].itemName = e.target.value;
                        setTreatmentForm({ ...treatmentForm, items: updated });
                      }}
                    />
                    <input
                      placeholder="Dosage Config"
                      value={item.dosageConfiguration}
                      onChange={(e) => {
                        const updated = [...treatmentForm.items];
                        updated[idx].dosageConfiguration = e.target.value;
                        setTreatmentForm({ ...treatmentForm, items: updated });
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...treatmentForm.items];
                        updated[idx].unitPrice = e.target.value;
                        setTreatmentForm({ ...treatmentForm, items: updated });
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...treatmentForm.items];
                        updated[idx].quantity = e.target.value;
                        setTreatmentForm({ ...treatmentForm, items: updated });
                      }}
                    />
                    {treatmentForm.items.length > 1 && (
                      <button type="button" className="doc-btn-icon-err" onClick={() => handleRemoveTreatmentItem(idx)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <div className="doc-field">
                  <label>Clinical Notes</label>
                  <textarea rows={2} value={treatmentForm.clinicalNotes} onChange={(e) => setTreatmentForm({ ...treatmentForm, clinicalNotes: e.target.value })} />
                </div>

                <button type="submit" className="doc-btn-primary" disabled={actionLoading === "submit_treatment"}>
                  <Save size={16} /> Submit Ward Treatment Plan
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}