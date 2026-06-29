import React from "react";

export default function ReceptionistHome() {
  return (
    <div className="receptionist-home">
      <h2>Receptionist Dashboard</h2>

      <div className="dashboard-cards">

        <div className="dashboard-card">
          <h3>Today's Appointments</h3>
          <p>124</p>
        </div>

        <div className="dashboard-card">
          <h3>Admissions</h3>
          <p>18</p>
        </div>

        <div className="dashboard-card">
          <h3>Insurance Requests</h3>
          <p>9</p>
        </div>

        <div className="dashboard-card">
          <h3>Revenue Today</h3>
          <p>₹45,000</p>
        </div>

      </div>

      <div className="quick-actions">

        <button>New Appointment</button>

        <button>Register Patient</button>

        <button>Create Bill</button>

        <button>Process Admission</button>

      </div>
    </div>
  );
}