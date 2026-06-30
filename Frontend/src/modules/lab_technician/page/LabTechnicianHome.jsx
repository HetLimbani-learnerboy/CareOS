import React from "react";

export default function LabTechnicianHome() {
  return (
    <div className="receptionist-home"> 
      <h2>Laboratory Analytics Dashboard</h2>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Pending Lab Tests</h3>
          <p>42</p>
        </div>

        <div className="dashboard-card">
          <h3>Samples Collected</h3>
          <p>118</p>
        </div>

        <div className="dashboard-card">
          <h3>Reports Pending Sign-off</h3>
          <p>14</p>
        </div>

        <div className="dashboard-card">
          <h3>Critical Alerts</h3>
          <p className="text-red-500" style={{ color: "#dc2626", fontWeight: "bold" }}>3</p>
        </div>
      </div>

      <div className="quick-actions">
        <button>Log Collected Sample</button>
        <button>Enter Test Results</button>
        <button>Generate Lab Report</button>
        <button>Check Reagent Inventory</button>
      </div>
    </div>
  );
}