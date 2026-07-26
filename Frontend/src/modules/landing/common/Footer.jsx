import React from "react";
import { User, GraduationCap, Building2 } from "lucide-react";
import CareOSLogo from "../../../assets/CareOS-logo.png";
import "../style/Footer.css"

const Footer = () => {
  return (
    <div className="meta-block">
      <div className="meta-content">

        <div className="meta-brand">
          <div className="meta-logo">
            <img
              src={CareOSLogo}
              alt="CareOS Logo"
              className="logo-img"
            />
          </div>

          <div>
            <h4 className="meta-title">CareOS</h4>
            <span className="meta-badge">
              Healthcare ERP Suite
            </span>
          </div>
        </div>

        <div className="meta-details">

          <div className="meta-column">
            <span className="meta-label">
              <User size={14} /> Developer
            </span>
            <p className="meta-value">Het Limbani</p>
          </div>

          <div className="meta-column">
            <span className="meta-label">
              <GraduationCap size={14} /> Institution
            </span>
            <p className="meta-value">Adani University</p>
          </div>

          <div className="meta-column">
            <span className="meta-label">
              <Building2 size={14} /> Internship Company
            </span>

            <a
              href="https://www.covrize.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="meta-link"
            >
              Covrize IT Solutions Private Limited
            </a>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Footer;