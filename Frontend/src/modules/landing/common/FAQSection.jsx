import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  HelpCircle,
  MessageSquare,
  GraduationCap,
  Building2,
  User,
  X,
  Mail,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import CareOSLogo from "../../../assets/CareOS-logo.png";
import "../style/FAQSection-style.css";

const faqs = [
  {
    question: "What is CareOS?",
    answer: "CareOS is an intelligent enterprise healthcare management platform designed to streamline hospital operations. It integrates patient onboarding, doctor scheduling, secure OTP authentication, online appointment management with automated email notifications, pharmacy inventory tracking, diagnostic laboratory workflows, ward and bed management, and AI-powered clinical decision support."
  },
  {
    question: "How does the Appointment Management system handle bookings and notifications?",
    answer: "The platform supports online appointment booking, live slot tracking, rescheduling, and cancellations. Upon any status update, the system automatically triggers automated email notifications to keep both patients and doctors informed in real time."
  },
  {
    question: "What security measures protect user authentication and access control?",
    answer: "CareOS secures user authentication through robust OTP verification, Role-Based Access Control (RBAC) for different healthcare staff roles, and integrated Google reCAPTCHA protection to prevent automated bot activity and unauthorized access."
  },
  {
    question: "How does the Ward and Bed Management module function?",
    answer: "The module tracks patient admissions, room assignments, bed allocations, and active treatment plans. It allows hospital staff to efficiently manage room occupancy and seamlessly handle patient discharges and transfers."
  },
  {
    question: "What is the role of the Receptionist Consultation Desk in CareOS?",
    answer: "The receptionist module streamlines front-desk operations by managing incoming consultation requests, handling walk-in or phone scheduling, and providing dedicated billing oversight to ensure smooth patient check-ins and payment tracking."
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (isContactOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isContactOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await axios.post(`${API_BASE_URL}/api/v1/auth/contact-support`, {
        name: formData.name,
        email: formData.email,
        message: formData.message
      });

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", message: "" });

      setTimeout(() => {
        setSubmitSuccess(false);
        setIsContactOpen(false);
      }, 2000);

    } catch (error) {
      const msg = error.response?.data?.message || "Communication transmission error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="faq" className="faq-section scroll-mt-28">
      <div className="faq-container faqsection-content">

        <div className="faq-header">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="support-badge"
          >
            <HelpCircle size={14} />
            Support Hub
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="faq-title"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="faq-subtitle"
          >
            Everything you need to know about the CareOS infrastructure, orchestration, and data security models.
          </motion.p>
        </div>

        <div className="accordion-group faqsection-centered-content">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`accordion-item ${isOpen ? "accordion-item-open" : ""}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="accordion-trigger"
                >
                  <span className={`accordion-question ${isOpen ? "text-active" : ""}`}>
                    {faq.question}
                  </span>

                  <div className={`chevron-wrapper ${isOpen ? "chevron-active" : ""}`}>
                    <ChevronDown
                      size={18}
                      className={`chevron-icon ${isOpen ? "rotate" : ""}`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                          height: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2, delay: 0.05 }
                        }
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.15 }
                        }
                      }}
                    >
                      <div className="accordion-content">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="support-card"
        >
          <div className="support-card-left">
            <div className="message-icon-box">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="support-card-title">Still have engineering or technical setup questions?</p>
              <p className="support-card-desc">Our enterprise support specialists are available around the clock.</p>
            </div>
          </div>
          <button
            onClick={() => setIsContactOpen(true)}
            className="contact-trigger-btn"
          >
            Contact Enterprise Team
          </button>
        </motion.div>

        <div className="section-divider" />

      </div>

      <AnimatePresence>
        {isContactOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactOpen(false)}
              className="drawer-backdrop"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="drawer-panel"
            >
              <div className="drawer-header">
                <div className="drawer-header-left">
                  <div className="mail-icon-box">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="drawer-title">Secure Communications</h3>
                    <p className="drawer-subtitle">Enterprise deployment orchestration routing</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsContactOpen(false)}
                  className="drawer-close-btn"
                  aria-label="Close message form panel"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-body">

                {errorMessage && (
                  <div style={{ background: "#fef2f2", color: "#ef4444", padding: "10px", borderRadius: "6px", fontSize: "13px", marginBottom: "15px", border: "1px solid #fecaca" }}>
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="form-name" className="form-label">
                      Your Full Name
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <User size={16} />
                      </span>
                      <input
                        id="form-name"
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="form-email" className="form-label">
                      Business Email Address
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <Mail size={16} />
                      </span>
                      <input
                        id="form-email"
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@hospitalnet.com"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="form-message" className="form-label">
                      Detailed Message
                    </label>
                    <textarea
                      id="form-message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Outline operational request or custom integration parameters requirement..."
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-action">
                    <button
                      type="submit"
                      disabled={isSubmitting || submitSuccess}
                      className={`submit-btn ${submitSuccess ? "btn-success" : ""}`}
                    >
                      <AnimatePresence mode="wait">
                        {isSubmitting ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="spinner"
                          />
                        ) : submitSuccess ? (
                          <motion.span
                            key="success"
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -15, opacity: 0 }}
                          >
                            Transmission Secured!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="normal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="btn-content"
                          >
                            <span>Submit Request Suite</span>
                            <Send size={14} className="send-icon" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </section>
  );
};

export default FAQSection;
