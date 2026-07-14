import React, { useState, useEffect } from "react";
import NurseSlidebar from "../components/NurseSlidebar";
import NurseWardManagement from "./NurseWardManagement";
import PatientRecord from './PatientRecord'
import NurseLabReviews from './NurseLabReviews';
import NurseTreatmentWorkflow from './NurseTreatmentWorkflow';

function DashboardView() {
  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.5rem 0" }}>Nurse Command Center</h1>
      <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Welcome back to your clinical shift overview tracker.</p>
    </div>
  );
}

export default function NurseDashboardMain() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("nurseActiveTab") || "Dashboard"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("nurseActiveTab", activeTab);
  }, [activeTab]);

  const renderActivePage = () => {
    switch (activeTab) {
      case "Ward Management":
        return <NurseWardManagement />;
      case "Patient Monitoring":
        return <NurseTreatmentWorkflow />;
      case "Patient Records File":
        return <PatientRecord />;
      case "Patient Lab Report":
        return <NurseLabReviews />;
      default:
        return <NurseWardManagement />;
    }
  };

  return (
    <div className="patient-portal-wrapper">
      <header className="mobile-portal-navbar">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className={`hamburger-bar ${isSidebarOpen ? "open" : ""}`} />
        </button>
        <span className="mobile-navbar-brand">CareOS Nurse Portal</span>
      </header>

      <NurseSlidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="portal-workspace-canvas">
        <div className="workspace-animation-container animate-fade-in">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}