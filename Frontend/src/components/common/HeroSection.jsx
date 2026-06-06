import { motion } from "framer-motion";
import HealthManagementAnimation from "./HealthManagementAnimation";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate= useNavigate();
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
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, // Smooth easeOutExpo
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
    <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 lg:py-20 overflow-hidden bg-slate-50/30">
      
      {/* Animated Depth Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[30rem] h-[30rem] bg-sky-200/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, -40, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-0 w-[35rem] h-[35rem] bg-blue-200/15 rounded-full blur-[120px]"
        />
      </div>

      {/* Main Structural Layout Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
        >
          
          {/* Left Hero Content Typography and CTA Engine */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 flex flex-col justify-center text-left">
            
            {/* Inline Dynamic Badge */}
            <motion.div variants={badgeVariants} className="self-start">
              <span className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-sky-100 shadow-sm">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                Healthcare ERP Platform
              </span>
            </motion.div>

            {/* Main Typographic Stack */}
            <div className="space-y-10 mb-3">
              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black leading-[1.1] text-slate-900 tracking-tight"
              >
                Smart Hospital
                <span className="block mt-1 sm:mt-2">
                  <motion.span
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="bg-gradient-to-r from-sky-600 via-blue-600 to-sky-600 bg-clip-text text-transparent bg-[size:200%_auto]"
                  >
                    Management
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed font-normal"
              >
                Manage Patients, Doctors, Pharmacy, Laboratory, Billing, Analytics, Telemedicine and Hospital Operations through one intelligent platform.
              </motion.p>
            </div>
            
            {/* Interactive Analytical Metrics Grid */}
            <motion.div
              variants={itemVariants}
              className="
    grid
    grid-cols-3
    gap-6
    sm:gap-8
    max-w-md
    mt-8
    mb-8
    pt-6
    border-t
    border-slate-100
    "
            >
              {[
                { number: "50+", label: "Hospitals" },
                { number: "100K+", label: "Patients" },
                { number: "99.9%", label: "Uptime" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="flex flex-col gap-0.5 cursor-pointer group landing-btn"
                >
                  <span className="text-xl sm:text-2xl font-black text-sky-600 group-hover:text-sky-700 transition-colors">
                    {stat.number}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium group-hover:text-slate-800 transition-colors">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Conversion Triggers & Interactive CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:max-w-md lg:max-w-none"
            >
              <motion.button
              onClick={()=>navigate('/patientregister')}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 12px 30px -10px rgba(14, 165, 233, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-sky-500/40 landing-btn"
              >
                <span>Patient Registration</span>
                <span className="text-base transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(241, 245, 249, 0.8)",
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-slate-200 landing-btn"
              >
                <span>Watch Demo</span>
                <span className="text-xs text-slate-400 transition-transform duration-200 group-hover:scale-110">
                  ▶
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* Right Hero Interactive Device/Dashboard Simulation Vector */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full flex items-center justify-center lg:justify-end"
          >
            <div className="w-full max-w-xl xl:max-w-2xl transform hover:scale-[1.01] transition-transform duration-500 drop-shadow-2xl">
              <HealthManagementAnimation />
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;