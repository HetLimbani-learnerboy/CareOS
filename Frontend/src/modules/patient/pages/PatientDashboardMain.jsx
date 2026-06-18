import React, { useState, useEffect } from "react";
import PatientSidebar from "../components/PatientSidebar";
import DashboardOverview from "./DashboardOverview";
import AppointmentManagement from "./AppointmentManagement";
import MedicalHistory from "./MedicalHistory";
import PrescriptionHistory from "./PrescriptionHistory";
import LabReport from "./LabReport";
import BillingHistory from "./BillingHistory";

import ProfileManagement from "./ProfileManagement";
import "../style/PatientDashboard.css";

export default function PatientDashboardMain() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("patientActiveTab") || "Dashboard"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("patientActiveTab", activeTab);
  }, [activeTab]);

  const renderActivePage = () => {
    switch (activeTab) {
      case "Dashboard":
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case "Appointment Management":
        return <AppointmentManagement />;
      case "Medical History":
        return <MedicalHistory />;
      case "Prescription History":
        return <PrescriptionHistory />;
      case "Lab Report":
        return <LabReport />;
      case "Billing History":
        return <BillingHistory />;
      case "Profile Management":
        return <ProfileManagement />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="patient-portal-wrapper">
      <header className="mobile-portal-navbar">
        <button
          className="mobile-menu-trigger"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation drawer"
        >
          <div className={`hamburger-bar ${isSidebarOpen ? "open" : ""}`}></div>
        </button>
        <span className="mobile-navbar-brand">CareOS Portal</span>
      </header>

      <PatientSidebar
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

      {isSidebarOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}