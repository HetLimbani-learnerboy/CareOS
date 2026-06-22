import React from "react";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  FileText,
  Clock,
  UserCheck,
  LogOut,
  ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CareOSLogo from "../../../assets/CareOS-logo.png";
import "../../patient/style/PatientSlidebarStyle.css";

export default function DoctorSidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Appointments Ledger", icon: <CalendarClock size={18} /> },
    { name: "Patient Records File", icon: <Users size={18} /> },
    { name: "E-Prescriptions", icon: <FileText size={18} /> },
    { name: "Shift Roster Schedule", icon: <Clock size={18} /> },
    { name: "Profile Management", icon: <UserCheck size={18} /> }
  ];

  const handleTabSelection = (tabName) => {
    setActiveTab(tabName);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorActiveTab");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? "sidebar-overlay-show" : ""}`} 
        onClick={() => setIsOpen(false)}
      />

      <aside className={`portal-sidebar-container ${isOpen ? "sidebar-drawer-open" : ""}`}>
        <div className="sidebar-identity-block">
          <div className="sidebar-branding-wrapper">
            <div className="sidebar-logo-wrapper">
              <img src={CareOSLogo} alt="CareOS Logo" className="sidebar-branding-logo-img" />
            </div>
            <div className="sidebar-branding-text">
              <h3>CareOS</h3>
              <p>Clinical Environment</p>
            </div>
          </div>

          <button 
            className="sidebar-close-drawer-trigger" 
            onClick={() => setIsOpen(false)}
            aria-label="Collapse Navigation Menu"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav className="sidebar-nav-menu">
          {menuItems.map((item) => {
            const isTabActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                className={`sidebar-nav-item ${isTabActive ? "nav-item-active" : ""}`}
                onClick={() => handleTabSelection(item.name)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-text">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-profile-footer">
          <button className="sidebar-logout-action" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Exit Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
}