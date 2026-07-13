import React, { useState, useEffect } from "react";
// FIXED: Updated import references to point to the correct Pharmacist Sidebar component
import PharmacistSidebar from "../components/PharmacistSidebar";

// Assuming these are your actual Pharmacist page components—replace with your actual filenames
import PharmacistHome from "./PharmacistDashboard";
import PrescriptionDispensing from "./PrescriptionDispensing";
import MedicineInventory from "./MedicineInventory";
import PharmacyBillingPOS from "./PharmacyBillingPOS";

export default function PharmasictDashboardMain() {
    const [activeTab, setActiveTab] = useState(
        () => localStorage.getItem("pharmacistActiveTab") || "Dashboard"
    );

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem("pharmacistActiveTab", activeTab);
    }, [activeTab]);

    const renderActivePage = () => {
        switch (activeTab) {
            case "Dashboard":
                return <PharmacistHome />;

            case "Prescription Dispensing":
                return <PrescriptionDispensing />;

            case "Medicine Inventory":
                return <MedicineInventory />;

            case "Billing & POS":
                return <PharmacyBillingPOS />;

            default:
                return <PharmacistHome />;
        }
    };

    return (
        <div className="patient-portal-wrapper">
            <header className="mobile-portal-navbar">
                <button
                    className="mobile-menu-trigger"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    aria-label="Toggle Menu"
                >
                    <div className={`hamburger-bar ${isSidebarOpen ? "open" : ""}`} />
                </button>

                <span className="mobile-navbar-brand">
                    CareOS Pharmacist Portal
                </span>
            </header>

            <PharmacistSidebar
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