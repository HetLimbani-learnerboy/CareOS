import React, { useState, useEffect } from "react";
import ReceptionistSidebar from "../components/ReceptionistSidebar";

import DashboardOverview from "./DashboardOverview";
import Receptionistappointmentmanage from "./Receptionistappointmentmanage";
import ReceptionistHome from "./ReceptionistHome";
import AdmissionProcessing from "./AdmissionProcessing";
// import InsuranceVerification from "./InsuranceVerification";
// import BillingManagement from "./BillingManagement";
// import ProfileManagement from "./ProfileManagement";


export default function ReceptionistDashboardMain() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("receptionistActiveTab") || "Dashboard"
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("receptionistActiveTab", activeTab);
  }, [activeTab]);

  const renderActivePage = () => {
    switch (activeTab) {

      case "Dashboard":
        return <ReceptionistHome />;

      case "Appointment Management":
        return <Receptionistappointmentmanage />;

      case "Admission Processing":
        return <AdmissionProcessing />;

      // case "Insurance Verification":
      //   return <ReceptionistHome />;

      // case "Billing":
      //   return <ReceptionistHome />;

      default:
        return <ReceptionistHome />;
    }
  };

  return (
    <div className="patient-portal-wrapper">

      <header className="mobile-portal-navbar">
        <button
          className="mobile-menu-trigger"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div
            className={`hamburger-bar ${isSidebarOpen ? "open" : ""
              }`}
          />
        </button>

        <span className="mobile-navbar-brand">
          CareOS Receptionist Portal
        </span>
      </header>

      <ReceptionistSidebar
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