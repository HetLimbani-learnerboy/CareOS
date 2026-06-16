import React from "react";
import { ArrowUpRight, Activity, Calendar, ShieldAlert } from "lucide-react";
import "../style/PatientSubPages.css";


export function DashboardOverview({ setActiveTab }) {
  return (
    <div className="view-fade-in">
      <div className="view-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back. Here is your core clinical summary context for today.</p>
      </div>

      <div className="dashboard-summary-strip">
        <div className="summary-metric-card" onClick={() => setActiveTab("Appointment Management")}>
          <div className="card-icon-accent sky"><Calendar size={20} /></div>
          <div><h4>Next Appointment</h4><p>Tomorrow at 10:30 AM</p></div>
          <ArrowUpRight className="card-arrow-link" size={16} />
        </div>
        <div className="summary-metric-card" onClick={() => setActiveTab("Prescription History")}>
          <div className="card-icon-accent emerald"><Activity size={20} /></div>
          <div><h4>Active Medications</h4><p>3 Prescriptions Active</p></div>
          <ArrowUpRight className="card-arrow-link" size={16} />
        </div>
        <div className="summary-metric-card allergic">
          <div className="card-icon-accent amber"><ShieldAlert size={20} /></div>
          <div><h4>Registered Allergies</h4><p>Penicillin, Sulphur</p></div>
        </div>
      </div>

      <div className="data-panel-card">
        <h3>Recent Timeline Events</h3>
        <div className="timeline-flow-list">
          <div className="timeline-node-item">
            <span className="node-timestamp">June 10, 2026</span>
            <div className="node-description"><h4>Lab Results Published</h4><p>Complete Blood Count (CBC) updated by Lab Technician.</p></div>
          </div>
          <div className="timeline-node-item">
            <span className="node-timestamp">May 24, 2026</span>
            <div className="node-description"><h4>Invoice Cleared</h4><p>Billing payment processed successfully for consultation invoice #INV-4920.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentManagement() {
  return (
    <div className="view-fade-in">
      <div className="view-header">
        <h2>Appointment Management</h2>
        <p>Schedule new visits or track pending hospital appointment logs.</p>
      </div>
      <div className="data-panel-card">
        <table className="portal-data-table">
          <thead>
            <tr><th>Provider / Doctor</th><th>Specialty Node</th><th>Date & Time</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Dr. Anuj Raval</strong></td><td>Cardiology</td><td>June 13, 2026 - 10:30 AM</td><td><span className="badge-pill active">Confirmed</span></td></tr>
            <tr><td><strong>Dr. Tirth Panchal</strong></td><td>Neurology</td><td>June 29, 2026 - 02:00 PM</td><td><span className="badge-pill pending">Pending Switch</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MedicalHistory() {
  return (
    <div className="view-fade-in">
      <div className="view-header">
        <h2>Medical History</h2>
        <p>Permanent electronic health record (EHR) diagnosis tracking metrics.</p>
      </div>
      <div className="data-panel-card">
        <table className="portal-data-table">
          <thead>
            <tr><th>Condition / Diagnosis</th><th>Onset Date</th><th>Clinical Status</th><th>Attending Physician</th></tr>
          </thead>
          <tbody>
            <tr><td>Chronic Hypertension</td><td>Jan 15, 2024</td><td><span className="badge-pill active">Active Management</span></td><td>Dr. Anuj Raval</td></tr>
            <tr><td>Acute Seasonal Asthmatic Spasms</td><td>Nov 02, 2025</td><td><span className="badge-pill resolved">Resolved</span></td><td>Dr. Sahil Dobaria</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE 4: PRESCRIPTION HISTORY
   ========================================================================== */
export function PrescriptionHistory() {
  return (
    <div className="view-fade-in">
      <div className="view-header">
        <h2>Prescription History</h2>
        <p>Active pharmacy billing scripts, dosage frequencies, and QR codes.</p>
      </div>
      <div className="data-panel-card">
        <table className="portal-data-table">
          <thead>
            <tr><th>Medication Name</th><th>Dosage Matrix</th><th>Frequency Pattern</th><th>Refills Left</th></tr>
          </thead>
          <tbody>
            <tr><td>Lisinopril 10mg</td><td>Oral Tablet</td><td>Once Daily (Morning)</td><td>4 Refills Left</td></tr>
            <tr><td>Albuterol HFA</td><td>Inhaler Pump</td><td>As needed (Spasms)</td><td>1 Refill Left</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE 5: LAB REPORT
   ========================================================================== */
export function LabReport() {
  return (
    <div className="view-fade-in">
      <div className="view-header">
        <h2>Lab Reports</h2>
        <p>Diagnostic laboratory panels, biochemical assay telemetry, and files.</p>
      </div>
      <div className="data-panel-card">
        <table className="portal-data-table">
          <thead>
            <tr><th>Test Panel Component</th><th>Lab Facility</th><th>Result Metrics</th><th>Reference Ranges</th></tr>
          </thead>
          <tbody>
            <tr><td>Complete Blood Count (CBC)</td><td>CareOS Central Pathology Lab</td><td><strong>Normal</strong></td><td>Standard Homogeneous</td></tr>
            <tr><td>Lipid Panel Evaluation</td><td>CareOS Central Pathology Lab</td><td><span className="text-alert-warning">Elevated LDL</span></td><td>Target &lt; 100 mg/dL</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE 6: BILLING HISTORY
   ========================================================================== */
export function BillingHistory() {
  return (
    <div className="view-fade-in">
      <div className="view-header">
        <h2>Billing History</h2>
        <p>Track invoices, operational statements, and payment verification records.</p>
      </div>
      <div className="data-panel-card">
        <table className="portal-data-table">
          <thead>
            <tr><th>Invoice Sequence ID</th><th>Department Service</th><th>Amount Due</th><th>Payment Date</th></tr>
          </thead>
          <tbody>
            <tr><td>#INV-2026-9901</td><td>Outpatient Cardiology Consultation</td><td>150.00 INR</td><td><span className="badge-pill resolved">Cleared</span></td></tr>
            <tr><td>#INV-2026-4920</td><td>Diagnostic Hematology Profiling</td><td>75.00 INR</td><td><span className="badge-pill resolved">Cleared</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}