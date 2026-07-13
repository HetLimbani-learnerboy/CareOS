import React, { useState, useEffect } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import DashboardOverview from "./DashboardOverview";
import DoctorAppointmentManagement from "./DoctorAppointmentManagement";
import DoctorProfileManagement from "./DoctorProfileManagement";
import EPrescriptionConsole from "./EPrescriptionConsole";
import PatientRecord from "./PatientRecord";
import DoctorLabReview from "./DoctorLabReviews";
import AdmissionProcessing from './AdmissionProcessing';
import DoctorTreatmentWorkflow from './DoctorTreatmentWorkflow';
import "../../patient/style/PatientDashboard.css";

export default function DoctorDashboardMain() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("doctorActiveTab") || "Dashboard"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("doctorActiveTab", activeTab);
  }, [activeTab]);

  const renderActivePage = () => {
    switch (activeTab) {
      case "Dashboard":
        return <DashboardOverview />;
      case "Appointments Ledger":
        return <DoctorAppointmentManagement />;
      case "E-Prescriptions":
        return <EPrescriptionConsole />;
      case "Patient Records File":
        return <PatientRecord />;
      case "Patient Lab Report":
        return <DoctorLabReview />;
      case "Treatment Plan":
        return <DoctorTreatmentWorkflow />;
      case "Ward Review":
        return <AdmissionProcessing />;
      case "Profile Management":
        return <DoctorProfileManagement />;
      default:
        return <DashboardOverview />;
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
        <span className="mobile-navbar-brand">CareOS Clinical Portal</span>
      </header>

      <DoctorSidebar
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