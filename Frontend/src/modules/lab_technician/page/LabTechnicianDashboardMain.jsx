import React, { useState, useEffect } from "react";
import LabTechnicianSidebar from "../components/LabTechnicianSidebar";
import LabTechnicianHome from "./LabTechnicianHome";
import EligiblePatients from "./EligiblePatients";
import ActiveLabTasks from "./ActiveLabTasks";
import LabBillingHistory from "./LabBillingHistory";
import CareOSAssistantPage from "../../common/CareOSAssistantPage";

export default function LabTechnicianDashboardMain() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("labTechActiveTab") || "Dashboard"
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("labTechActiveTab", activeTab);
  }, [activeTab]);

  const renderActivePage = () => {
    switch (activeTab) {
      case "Dashboard":
        return <LabTechnicianHome />;

      case "Test Request Management":
        return <EligiblePatients />;

      case "Sample Processing":
        return <ActiveLabTasks />;

      case "Billing History":
        return <LabBillingHistory />;

      case "AI Assistant":
        return <CareOSAssistantPage />

      default:
        return <LabTechnicianHome />;
    }
  };

  return (
    <div className="patient-portal-wrapper">
      <header className="mobile-portal-navbar">
        <button
          className="mobile-menu-trigger"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className={`hamburger-bar ${isSidebarOpen ? "open" : ""}`} />
        </button>

        <span className="mobile-navbar-brand">
          CareOS Lab Technician Portal
        </span>
      </header>

      <LabTechnicianSidebar
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