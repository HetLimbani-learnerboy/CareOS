import React from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Receipt,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CareOSLogo from "../../../assets/CareOS-logo.png";
import "../style/PharmacistSidebar.css";

export default function PharmacistSidebar({
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
      name: "Prescription Dispensing",
      icon: <ClipboardList size={18} />,
    },
    {
      name: "Medicine Inventory",
      icon: <Package size={18} />,
    },
    {
      name: "Billing & POS",
      icon: <Receipt size={18} />,
    },
  ];

  const handleTabSelection = (tabName) => {
    setActiveTab(tabName);
    localStorage.setItem("pharmacistActiveTab", tabName);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("pharmacistActiveTab");
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
              <p>Pharmacist Portal</p>
            </div>
          </div>

          <button
            className="sidebar-close-drawer-trigger"
            onClick={() => setIsOpen(false)}
            aria-label="Close Sidebar"
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