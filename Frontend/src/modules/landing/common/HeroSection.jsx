import { motion } from "framer-motion";
import HealthManagementAnimation from "./HealthManagementAnimation";
import { useNavigate } from "react-router-dom";
import "../style/HeroSection.css";

const HeroSection = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="hero-section">
      <div className="bg-blur-container">
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="bg-blur-circle-1"
        />
        <motion.div
          animate={{ y: [0, -40, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="bg-blur-circle-2"
        />
      </div>

      <div className="hero-container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hero-grid"
        >
          <div className="hero-content">
            <motion.div variants={badgeVariants} className="hero-badge-wrapper">
              <span className="hero-badge">
                <span className="badge-dot" />
                Healthcare ERP Platform
              </span>
            </motion.div>

            <div className="hero-heading-box">
              <motion.h1 variants={itemVariants} className="hero-title">
                Smart Hospital
                <span className="hero-title-block">
                  <motion.span
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="hero-gradient-text"
                  >
                    Management
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="hero-desc">
                Manage Patients, Doctors, Pharmacy, Laboratory, Billing, Analytics, Telemedicine and Hospital Operations through one intelligent platform.
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="hero-stats-grid">
              {[
                { number: "50+", label: "Hospitals" },
                { number: "100K+", label: "Patients" },
                { number: "99.9%", label: "Uptime" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="hero-stat-card"
                >
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="hero-actions">
              <motion.button
                onClick={() => navigate("/patientregister")}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 12px 30px -10px rgba(14, 165, 233, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
              >
                <span>Patient Registration</span>
                <span className="btn-arrow">→</span>
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(241, 245, 249, 0.8)",
                }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary"
              >
                <span>Watch Demo</span>
                <span className="btn-play">▶</span>
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hero-visual-wrapper"
          >
            <div className="hero-visual-inner">
              <HealthManagementAnimation />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;