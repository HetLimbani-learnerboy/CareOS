import React from "react";
import { 
  LayoutDashboard, 
  CalendarClock, 
  FileClock, 
  Pill, 
  FileSpreadsheet, 
  Receipt, 
  UserCog,
  LogOut
} from "lucide-react";

export default function PatientSidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  
  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Appointment Management", icon: <CalendarClock size={18} /> },
    { name: "Medical History", icon: <FileClock size={18} /> },
    { name: "Prescription History", icon: <Pill size={18} /> },
    { name: "Lab Report", icon: <FileSpreadsheet size={18} /> },
    { name: "Billing History", icon: <Receipt size={18} /> },
    { name: "Profile Management", icon: <UserCog size={18} /> },
  ];

  const handleTabSelection = (tabName) => {
    setActiveTab(tabName);
    setIsOpen(false);
  };

  return (
    <aside className={`portal-sidebar-container ${isOpen ? "sidebar-drawer-open" : ""}`}>
      <div className="sidebar-identity-block">
        <h3>CareOS</h3>
        <p>Patient Environment</p>
      </div>

      <nav className="sidebar-nav-menu">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`sidebar-nav-item ${activeTab === item.name ? "nav-item-active" : ""}`}
            onClick={() => handleTabSelection(item.name)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-text">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-profile-footer">
        <button className="sidebar-logout-action" onClick={() => window.location.href = '/login'}>
          <LogOut size={16} />
          <span>Exit Portal</span>
        </button>
      </div>
    </aside>
  );
}