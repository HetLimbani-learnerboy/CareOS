import React, { useState } from "react";
import {
  User,
  Send,
  Sparkles,
  Mail,
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../style/GetConsult-style.css";

const GetConsult = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormData({ firstName: "", lastName: "", email: "", message: "" });

    setTimeout(() => {
      navigate("/");
    }, 2200);
  };

  return (
    <section className="getconsult-section">
      <div className="getconsult-card-wrapper">

        <div className="consult-main-card">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="consult-backbtn"
          >
            <ArrowLeft size={18} className="back-arrow-icon" />
            <span>Portal Home</span>
          </button>

          <div className="consult-badge-container">
            <span className="consult-status-badge">
              <Sparkles size={14} className="sparkle-pulse-icon" />
              Direct Channel
            </span>
          </div>

          <div className="consult-header-text">
            <h3 className="consult-title">
              <div className="consult-icon-holder">
                <User size={20} />
              </div>
              Request Consultancy
            </h3>
            <p className="consult-subtitle">
              Connect directly with enterprise infrastructure architects at CareOS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="consult-form-element">

            <div className="consult-grid-row">
              <div className="consult-field-group">
                <label htmlFor="first-name" className="consult-input-label">First Name</label>
                <div className="consult-input-rel">
                  <span className="consult-field-icon"><User size={16} /></span>
                  <input
                    id="first-name"
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. John"
                    className="consult-text-input"
                  />
                </div>
              </div>

              <div className="consult-field-group">
                <label htmlFor="last-name" className="consult-input-label">Last Name</label>
                <div className="consult-input-rel">
                  <span className="consult-field-icon"><User size={16} /></span>
                  <input
                    id="last-name"
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Doe"
                    className="consult-text-input"
                  />
                </div>
              </div>
            </div>

            <div className="consult-field-group">
              <label htmlFor="consult-email" className="consult-input-label">Business Email</label>
              <div className="consult-input-rel">
                <span className="consult-field-icon"><Mail size={16} /></span>
                <input
                  id="consult-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@hospitalnet.com"
                  className="consult-text-input"
                />
              </div>
            </div>

            <div className="consult-field-group">
              <label htmlFor="consult-msg" className="consult-input-label">Consultancy Requirements</label>
              <div className="consult-input-rel">
                <span className="consult-textarea-icon"><FileText size={16} /></span>
                <textarea
                  id="consult-msg"
                  name="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Briefly describe your medical network layout or system migration targets..."
                  className="consult-textarea-input"
                />
              </div>
            </div>

            <div className="consult-action-wrapper">
              <button
                type="submit"
                disabled={isSubmitting || submitSuccess}
                className={`consult-submit-btn ${submitSuccess ? "success" : ""}`}
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <div className="consult-spinner" />
                  ) : submitSuccess ? (
                    <motion.span
                      key="success"
                      initial={{ y: 15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -15, opacity: 0 }}
                      className="consult-btn-inner"
                    >
                      <CheckCircle size={16} /> Session Booked Successfully!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="normal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="consult-btn-inner group"
                    >
                      <span>Book Strategy Session</span>
                      <Send size={14} className="consult-send-arrow" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <div className="consult-footer-notice">
              <Clock size={12} className="consult-clock-icon" />
              <span>Average initial triage callback architecture response: &lt; 6 hours</span>
            </div>

          </form>
        </div>

      </div>
    </section>
  );
};

export default GetConsult;