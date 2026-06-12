import React, { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import CareOSLogo from "../../../assets/CareOS-logo.png";
import "../style/Header.css"; // External CSS reference hook

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
    { name: "FAQ", href: "#faq" }
  ];

  return (
    <header className={`site-header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="header-container">
        <div className="header-navbar">

          {/* Logo Branding Node */}
          <a href="#" className="header-brand">
            <img src={CareOSLogo} alt="CareOS" className="brand-logo" />
            <div className="brand-text-wrapper">
              <h1 className="brand-title">CareOS</h1>
              <p className="brand-subtitle">HEALTHCARE ERP</p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="nav-link-item">
                {link.name}
                <span className="nav-underline-indicator" />
              </a>
            ))}
          </nav>

          {/* Desktop Action Interactivity Node */}
          <div className="desktop-actions">
            <button onClick={() => navigate('/login')} className="action-btn-login">
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/getconsult')}
              className="action-btn-consult"
            >
              <span className="consult-text">Request a Consultation</span>
              <ChevronRight size={18} className="consult-icon" />
            </button>
          </div>

          {/* Hamburger Menu Toggle Button */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="mobile-toggle-btn">
            {mobileMenu ? <X size={26} /> : <Menu size={26} />}
          </button>

        </div>
      </div>

      {/* Mobile Sidebar Dropdown Pane */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mobile-dropdown-menu"
          >
            <div className="mobile-menu-content">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  /* ==========================================================================
                     THE FIX: CLOSE DROPDOWN MENU FIRST, THEN LET ANCHOR SCROLL FIRE
                     ========================================================================== */
                  onClick={(e) => {
                    // 1. Instantly hide the mobile dropdown menu layout viewport wrapper
                    setMobileMenu(false);

                    // 2. If it's a local section anchor link, enforce smooth scroll behaviors
                    if (link.href.startsWith("#") && link.href !== "#") {
                      e.preventDefault();
                      const targetId = link.href.replace("#", "");
                      const element = document.getElementById(targetId);
                      if (element) {
                        // Delayed slightly so the menu closing animation finishes cleanly
                        setTimeout(() => {
                          element.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 150);
                      }
                    }
                  }}
                  className="mobile-nav-link"
                >
                  {link.name}
                </a>
              ))}
              <hr className="mobile-menu-divider" />
              <button onClick={() => { setMobileMenu(false); navigate('/login'); }} className="mobile-action-login">
                Login
              </button>
              <button onClick={() => { setMobileMenu(false); navigate('/getconsult'); }} className="mobile-action-consult">
                Request a Consultation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;