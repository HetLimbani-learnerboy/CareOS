import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Activity, ShieldAlert, Calendar, Clock, ArrowUpRight, 
  Heart, Thermometer, Weight, FileText, Pill 
} from "lucide-react";

export default function DashboardOverview({ setActiveTab }) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const localUserString = localStorage.getItem("user") || sessionStorage.getItem("user");
        let storedEmail = "";
        if (localUserString) {
          storedEmail = JSON.parse(localUserString)?.email;
        }

        if (!storedEmail) return;

        const res = await axios.get(
          `${API_BASE_URL}/api/v1/patients/dashboard-summary?email=${encodeURIComponent(storedEmail)}`
        );
        setDashboardData(res.data.data);
      } catch (err) {
        console.error("Dashboard calculation link detached.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [API_BASE_URL]);

  if (loading) return <div className="dashboard-spinner">Calculating clinical metrics summary...</div>;

  const vitals = dashboardData?.clinical?.vitals_log || {};
  const allergies = dashboardData?.clinical?.allergies || [];
  const conditions = dashboardData?.clinical?.chronic_conditions || [];

  return (
    <div className="dashboard-overview-canvas">
      
      <div className="dashboard-welcome-banner">
        <h1>Welcome Back, {dashboardData?.patient?.first_name || "Patient"}</h1>
        <p>Review your clinical trends, appointments, and medical statements dynamically.</p>
      </div>

      <div className="vitals-matrix-row">
        <div className="vital-card-node">
          <div className="vital-icon-wrapper blood-pressure"><Activity size={20} /></div>
          <div className="vital-data-block">
            <span>Blood Pressure</span>
            <h3>{vitals.blood_pressure || "120/80"}</h3>
            <p>mmHg · Optimal</p>
          </div>
        </div>
        <div className="vital-card-node">
          <div className="vital-icon-wrapper heart-rate"><Heart size={20} /></div>
          <div className="vital-data-block">
            <span>Heart Rate</span>
            <h3>{vitals.heart_rate || 72}</h3>
            <p>BPM · Normal resting</p>
          </div>
        </div>
        <div className="vital-card-node">
          <div className="vital-icon-wrapper temperature"><Thermometer size={20} /></div>
          <div className="vital-data-block">
            <span>Body Temp</span>
            <h3>{vitals.temperature || 98.6}°F</h3>
            <p>Normal boundaries</p>
          </div>
        </div>
        <div className="vital-card-node">
          <div className="vital-icon-wrapper weight"><Weight size={20} /></div>
          <div className="vital-data-block">
            <span>Weight Balance</span>
            <h3>{vitals.weight || 70} kg</h3>
            <p>Stable vs last visit</p>
          </div>
        </div>
      </div>

      <div className="dashboard-split-grid-row">
        
        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><ShieldAlert size={18} /> Clinical Safety Parameters</div>
          </div>
          
          <div className="clinical-data-inner-stack">
            <div className="clinical-sub-block">
              <h5>Registered Allergies</h5>
              {allergies.length > 0 ? (
                <div className="allergy-badge-flex">
                  {allergies.map((all, i) => (
                    <span key={i} className={`allergy-tag severity-${all.severity.toLowerCase()}`}>
                      {all.substance} ({all.severity})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="fallback-empty-text">No active medical allergies detected on profile data entries.</p>
              )}
            </div>

            <div className="clinical-sub-block">
              <h5>Chronic Diagnoses Framework</h5>
              {conditions.length > 0 ? (
                <div className="condition-list-stack">
                  {conditions.map((cond, i) => (
                    <div key={i} className="condition-item-row">
                      <span>{cond.condition_name}</span>
                      <span className="status-marker-pill">{cond.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="fallback-empty-text">No chronic illness monitoring restrictions recorded.</p>
              )}
            </div>
          </div>
        </div>

        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><Calendar size={18} /> Schedule & Bookings</div>
          </div>
          
          <div className="appointment-schedule-container">
            <div className="active-appointment-ticket">
              <div className="ticket-meta-split">
                <div className="date-icon-block"><Clock size={22} /></div>
                <div className="ticket-details">
                  <h4>General Practitioner Consultation</h4>
                  <p>Dr. Elizabeth Vance · Outpatient Department</p>
                  <span>June 24, 2026 · 10:30 AM</span>
                </div>
              </div>
            </div>

            <div className="appointment-action-cta-row">
              <button className="cta-btn secondary-ghost" onClick={() => setActiveTab("Appointment Management")}>
                Manage Schedule
              </button>
              <button className="cta-btn primary-solid" onClick={() => setActiveTab("Appointment Management")}>
                Book New Appointment <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="dashboard-split-grid-row">
        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><FileText size={18} /> Recent Laboratory Diagnostics</div>
          </div>
          <div className="list-ledger-container">
            <div className="ledger-item-row">
              <div>
                <h6>Complete Blood Count (CBC)</h6>
                <p>Generated by Dr. Vance · Completed</p>
              </div>
              <button onClick={() => setActiveTab("Lab Report")} className="ledger-view-action">View</button>
            </div>
            <div className="ledger-item-row">
              <div>
                <h6>Lipid Profile Panel</h6>
                <p>Routine Monitoring · Diagnostic Lab A</p>
              </div>
              <button onClick={() => setActiveTab("Lab Report")} className="ledger-view-action">View</button>
            </div>
          </div>
        </div>

        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><Pill size={18} /> Active Prescriptions Tracker</div>
          </div>
          <div className="list-ledger-container">
            <div className="ledger-item-row">
              <div>
                <h6>Amoxicillin 500mg</h6>
                <p>1 Capsule · 3 times daily · 5 Days remaining</p>
              </div>
              <span className="prescription-status-active">Active</span>
            </div>
            <div className="ledger-item-row">
              <div>
                <h6>Lisinopril 10mg</h6>
                <p>1 Tablet · Daily mornings · Chronic refill authorization</p>
              </div>
              <span className="prescription-status-active">Active</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}