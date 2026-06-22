import React, { useState } from "react";
import { 
  Users, Calendar, Clock, UserCheck, BellRing, Check, X, 
  ArrowUpRight, ShieldAlert, FileHeart, Stethoscope
} from "lucide-react";

export default function DashboardOverview() {
  // Mock dataset structured exactly like your product specifications
  const [appointmentRequests, setAppointmentRequests] = useState([
    { id: "REQ-01", patient: "Het Limbani", reason: "Hypertension Routine Review", time: "Requested for 10:30 AM", date: "2026-06-24" },
    { id: "REQ-02", patient: "Sarah Jenkins", reason: "Chronic Migraine Assessment", time: "Requested for 02:15 PM", date: "2026-06-24" }
  ]);

  const activeTriageQueue = [
    { queueId: "#04", patient: "David Miller", status: "In Waiting Room", time: "Scheduled: 11:00 AM", criticalTag: "Normal" },
    { queueId: "#05", patient: "Emily Watson", status: "Triage Assessment", time: "Scheduled: 11:30 AM", criticalTag: "Urgent" }
  ];

  const handleRequestAction = (id, action) => {
    alert(`Appointment Request ${id} has been strictly marked: ${action}`);
    setAppointmentRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <div className="dashboard-overview-canvas">
      
      <div className="dashboard-welcome-banner">
        <h1>Clinical Control Center</h1>
        <p>Monitor your active medical workflows, patient triage priorities, and appointment request streams.</p>
      </div>

      {/* Industrial Analytics Counter Matrix Row */}
      <div className="vitals-matrix-row">
        <div className="vital-card-node">
          <div className="vital-icon-wrapper blood-pressure"><Clock size={20} /></div>
          <div className="vital-data-block">
            <span>Remaining Today</span>
            <h3>5 Patients</h3>
            <p>Out of 12 Total Bookings</p>
          </div>
        </div>
        <div className="vital-card-node">
          <div className="vital-icon-wrapper weight"><UserCheck size={20} /></div>
          <div className="vital-data-block">
            <span>Completed Visits</span>
            <h3>7 Patients</h3>
            <p>All clinical notes signed</p>
          </div>
        </div>
        <div className="vital-card-node">
          <div className="vital-icon-wrapper heart-rate"><BellRing size={20} /></div>
          <div className="vital-data-block">
            <span>New Inbox Requests</span>
            <h3>{appointmentRequests.length} Pending</h3>
            <p>Awaiting schedule approval</p>
          </div>
        </div>
        <div className="vital-card-node">
          <div className="vital-icon-wrapper temperature"><Users size={20} /></div>
          <div className="vital-data-block">
            <span>Active Inpatients</span>
            <h3>4 Ward Beds</h3>
            <p>Admissions monitoring</p>
          </div>
        </div>
      </div>

      <div className="dashboard-split-grid-row">
        
        {/* Triage Workspace Grid Module */}
        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><Stethoscope size={18} /> Current Live Triage Queue</div>
          </div>
          
          <div className="list-ledger-container">
            <div className="ledger-item-row" style={{ background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)", borderColor: "#fde68a" }}>
              <div>
                <span className="allergy-tag severity-moderate" style={{ marginBottom: "6px", display: "inline-block" }}>Current Session</span>
                <h6>Liam Henderson</h6>
                <p>Room 402 · General Physical Examination · Started 5m ago</p>
              </div>
              <span className="prescription-status-active" style={{ background: "#dcfce7", color: "#16a34a" }}>In Progress</span>
            </div>

            {activeTriageQueue.map((queue) => (
              <div key={queue.queueId} className="ledger-item-row">
                <div>
                  <h6>{queue.patient} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>({queue.queueId})</span></h6>
                  <p>{queue.time} · Status: <strong>{queue.status}</strong></p>
                </div>
                <span className={`allergy-tag ${queue.criticalTag === "Urgent" ? "severity-severe" : "severity-moderate"}`} style={{ padding: "2px 10px", fontSize: "0.75rem" }}>
                  {queue.criticalTag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incoming Scheduling Approval Module */}
        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><Calendar size={18} /> Incoming Booking Proposals</div>
          </div>
          
          <div className="appointment-schedule-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {appointmentRequests.length > 0 ? (
              appointmentRequests.map((req) => (
                <div key={req.id} className="active-appointment-ticket" style={{ background: "#ffffff", borderColor: "#e2e8f0", margin: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ color: "#0f172a" }}>{req.patient}</h4>
                      <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#475569" }}>{req.reason}</p>
                      <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: "600" }}>{req.date} · {req.time}</span>
                    </div>
                    
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button 
                        onClick={() => handleRequestAction(req.id, "Rejected")}
                        style={{ padding: "6px", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer" }}
                        title="Reject Request"
                      >
                        <X size={14} />
                      </button>
                      <button 
                        onClick={() => handleRequestAction(req.id, "Approved")}
                        style={{ padding: "6px", borderRadius: "8px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", cursor: "pointer" }}
                        title="Approve Request"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="fallback-empty-text" style={{ textAlign: "center", padding: "2rem" }}>No pending appointment proposals currently in the gateway queue.</p>
            )}
          </div>
        </div>

      </div>

      {/* Enterprise-grade features: Recent Critical Alerts & Diagnostic Reports Router */}
      <div className="dashboard-split-grid-row">
        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><ShieldAlert size={18} /> Critical Facility Alerts</div>
          </div>
          <div className="list-ledger-container">
            <div className="ledger-item-row" style={{ borderLeft: "4px solid #ef4444" }}>
              <div>
                <h6 style={{ color: "#ef4444" }}>Emergency Room (ER) Overflow Alert</h6>
                <p>High trauma incoming volume. Non-critical specialist routing prioritized.</p>
              </div>
            </div>
            <div className="ledger-item-row" style={{ borderLeft: "4px solid #eab308" }}>
              <div>
                <h6>Pharmacy System Maintenance Window</h6>
                <p>E-prescriptions sync server undergoing maintenance at 11:00 PM tonight.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="clinical-asymmetry-card">
          <div className="card-header-row">
            <div className="title-tag"><FileHeart size={18} /> Sign-off Pending Laboratory Diagnostics</div>
          </div>
          <div className="list-ledger-container">
            <div className="ledger-item-row">
              <div>
                <h6>Oliver Vance · Pathology Panel</h6>
                <p>Abnormal high potassium detected. Verification required.</p>
              </div>
              <button className="ledger-view-action" onClick={() => alert("Loading lab analysis diagnostic file...")}>
                Sign Off <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}