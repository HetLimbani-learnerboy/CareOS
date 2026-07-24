import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Zap,
  ShieldCheck,
  Activity,
  UserPlus,
  Stethoscope,
  Sparkles,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../style/AboutSection-style.css";

const features = [
  "Multi-Role Access Control",
  "Electronic Health Records",
  "Real-Time Notifications",
  "Telemedicine Integration",
  "Analytics & Reporting",
  "Hospital Operations Management",
];

const careOSBenefits = [
  {
    icon: Zap,
    title: "Instant Sync",
    desc: "Zero-latency cross-department data pipelines"
  },
  {
    icon: ShieldCheck,
    title: "HIPAA Compliant",
    desc: "Military-grade data protection encryption protocols"
  },
  {
    icon: Layers,
    title: "Modular Scaling",
    desc: "Deploy standalone extensions or complete systems"
  }
];

const pipelineSteps = [
  { id: 1, label: "Patient Check-In", icon: UserPlus, status: "completed", desc: "Data encrypted & routing initiated" },
  { id: 2, label: "Triage & Vitals", icon: Activity, status: "processing", desc: "AI calculating priority metrics" },
  { id: 3, label: "Clinical Consult", icon: Stethoscope, status: "pending", desc: "Awaiting provider connection" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const cardStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 }
  }
};

const rightSideCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const AboutSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % pipelineSteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="about" className="about-section-wrapper">

      <div className="about-background-glows">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="glow-circle glow-circle-1"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="glow-circle glow-circle-2"
        />
      </div>

      <div className="about-container">

        <div className="about-content-layout">

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="about-left-panel"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="about-badge"
            >
              <Sparkles size={14} className="badge-sparkle-icon" />
              About CareOS
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="about-main-title"
            >
              One Platform For Complete Healthcare Operations
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="about-description"
            >
              CareOS centralizes patient management, doctor scheduling, pharmacy operations, laboratory workflows, billing systems, telemedicine, analytics, and more into one modern platform.
            </motion.p>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="about-features-list"
            >
              {features.map((item) => (
                <motion.div
                  key={item}
                  variants={itemVariants}
                  whileHover={{ x: 6 }}
                  className="feature-item"
                >
                  <div className="feature-icon-wrapper">
                    <CheckCircle2 className="feature-check-icon" size={22} />
                  </div>
                  <span className="feature-text">
                    {item}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <div className="about-right-panel">

            <motion.div
              variants={rightSideCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="matrix-card"
            >
              <div className="matrix-header">
                <div>
                  <h3 className="matrix-title">
                    <span className="matrix-pulse-dot" />
                    Live Data Matrix Pipeline
                  </h3>
                  <p className="matrix-subtitle">Simulated view of autonomous telemetry synchronizations</p>
                </div>
                <div className="node-badge">
                  Node: East-Hub-01
                </div>
              </div>

              <div className="pipeline-steps-container">
                <div className="pipeline-line" />

                {pipelineSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === activeStep;

                  return (
                    <motion.div
                      key={step.id}
                      onClick={() => setActiveStep(index)}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                      }}
                      className={`pipeline-step-item ${isActive ? "active-step" : ""}`}
                    >
                      <div className="pipeline-icon-container">
                        <motion.div
                          animate={{
                            backgroundColor: isActive ? "#0284c7" : "#e2e8f0",
                            color: isActive ? "#ffffff" : "#64748b",
                            boxShadow: isActive ? "0 0 15px rgba(14, 165, 233, 0.4)" : "none"
                          }}
                          className="pipeline-icon-box"
                        >
                          <StepIcon size={22} />
                        </motion.div>
                        {isActive && (
                          <motion.div
                            layoutId="pulse-ring"
                            className="pipeline-pulse-ring"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          />
                        )}
                      </div>

                      <div className="pipeline-content">
                        <div className="pipeline-step-header">
                          <h4 className={`pipeline-label ${isActive ? "active-label" : ""}`}>
                            {step.label}
                          </h4>
                          <span className={`pipeline-status-badge ${isActive ? "status-active" : index < activeStep ? "status-secured" : "status-queued"
                            }`}>
                            {isActive ? "Active Sync" : index < activeStep ? "Secured" : "Queued"}
                          </span>
                        </div>
                        <p className="pipeline-desc">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="terminal-box">
                <div className="terminal-dots">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot amber" />
                  <div className="terminal-dot green" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="terminal-stream">// STREAM_ESTABLISHED</p>
                    <p className="terminal-output">SYSTEM.ROUTING: {pipelineSteps[activeStep].label.toUpperCase().replace(/\s+/g, '_')} processed in 0.0042s</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              variants={cardStaggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-20px" }}
              className="about-benefits-grid"
            >
              {careOSBenefits.map((benefit) => {
                const BenefitIcon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    variants={rightSideCardVariants}
                    whileHover={{ y: -4 }}
                    className="benefit-card"
                  >
                    <div className="benefit-card-header">
                      <div className="benefit-icon-box">
                        <BenefitIcon size={18} className="benefit-icon" />
                      </div>
                      <h4 className="benefit-title">{benefit.title}</h4>
                    </div>
                    <p className="benefit-desc">{benefit.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="about-footer-card"
        >
          <div className="about-footer-text-content">
            <h4 className="about-footer-title">Transforming Enterprise Clinical Workflows</h4>
            <p className="about-footer-desc">
              CareOS unifies disparate legacy platforms into an interconnected environment, eliminating administrative overhead and dropping communication friction across hospital staff by up to 40%.
            </p>
          </div>
          <div className="about-footer-badge-box">
            <span className="footer-badge-label">Operational Efficacy</span>
            <span className="footer-badge-value">99.98%</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AboutSection;