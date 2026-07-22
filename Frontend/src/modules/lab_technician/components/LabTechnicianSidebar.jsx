import React from "react";
import {
  LayoutDashboard,
  FlaskConical,
  Layers,
  Receipt,
  LogOut,
  ChevronLeft,
  Bot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CareOSLogo from "../../../assets/CareOS-logo.png";
import "../style/LabTechnicianSidebar.css";

export default function LabTechnicianSidebar({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) {
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Test Request Management",
      icon: <FlaskConical size={18} />,
    },
    {
      name: "Sample Processing",
      icon: <Layers size={18} />,
    },
    {
      name: "Billing History",
      icon: <Receipt size={18} />,
    },
    {
      name: "AI Assistant",
      icon: <Bot size={18} />,
    },
  ];

  const handleTabSelection = (tabName) => {
    setActiveTab(tabName);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("labTechActiveTab");
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
              <img
                src={CareOSLogo}
                alt="CareOS Logo"
                className="sidebar-branding-logo-img"
              />
            </div>
            <div className="sidebar-branding-text">
              <h3>CareOS</h3>
              <p>Lab Technician Portal</p>
            </div>
          </div>

          <button
            className="sidebar-close-drawer-trigger"
            onClick={() => setIsOpen(false)}
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