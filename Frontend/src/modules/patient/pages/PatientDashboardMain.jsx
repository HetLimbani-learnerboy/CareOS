import React, { useState } from "react";
import PatientSidebar from "../components/PatientSidebar";
import { 
  DashboardOverview, 
  AppointmentManagement, 
  MedicalHistory, 
  PrescriptionHistory, 
  LabReport, 
  BillingHistory 
} from "./SubPages";
import ProfileManagement from "./ProfileManagement";
import "../style/PatientDashboard.css";

export default function PatientDashboardMain() {
  // Matches the exact item list provided in your reference image
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      
      {/* Mobile Header Bar */}
      <header className="mobile-portal-navbar">
        <button 
          className="mobile-menu-trigger"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className={`hamburger-bar ${isSidebarOpen ? "open" : ""}`}></div>
        </button>
        <span className="mobile-navbar-brand">CareOS Portal</span>
      </header>

      {/* Sidebar Navigation */}
      <PatientSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main App Canvas Workspace */}
      <main className="portal-workspace-canvas">
        <div className="workspace-animation-container">
          {renderActivePage()}
        </div>
      </main>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}