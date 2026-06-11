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
import "../../style/AboutSection-style.css";

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
    desc: "Zero-latency cross-department data pipelines",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10"
  },
  {
    icon: ShieldCheck,
    title: "HIPAA Compliant",
    desc: "Military-grade data protection encryption protocols",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    icon: Layers,
    title: "Modular Scaling",
    desc: "Deploy standalone extensions or complete systems",
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-500/10"
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
    <section id="about" className="aboutsection-card bg-gradient-to-br from-slate-50 via-white to-blue-50/30 w-full relative overflow-hidden">
      
      {/* Background Ambience Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-12 -right-32 w-96 h-100 bg-gradient-to-br from-sky-200/20 to-blue-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
        
        {/* Content Grid */}
        <div className="about-content-layout w-full">
          
          {/* LEFT COLUMN - STRATEGIC BRAND TEXT */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="about-left-panel w-full"
          >
            {/* Badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 text-sky-600 font-semibold tracking-wider uppercase text-xs bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200/60 mb-4 shadow-sm"
            >
              <Sparkles size={14} className="text-sky-500 animate-pulse" />
              About CareOS
            </motion.span>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl lg:text-5xl font-extrabold mt-2 text-slate-900 leading-tight tracking-tight"
            >
              One Platform For Complete Healthcare Operations
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-600 mt-6 text-lg leading-relaxed font-normal"
            >
              CareOS centralizes patient management, doctor scheduling, pharmacy operations, laboratory workflows, billing systems, telemedicine, analytics, and more into one modern platform.
            </motion.p>

            {/* Core Features Check-List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-8 space-y-3.5"
            >
              {features.map((item) => (
                <motion.div
                  key={item}
                  variants={itemVariants}
                  whileHover={{ x: 6 }}
                  className="flex items-center gap-3 group cursor-default"
                >
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="text-emerald-500 group-hover:text-emerald-600 transition-colors shadow-sm rounded-full" size={22} />
                  </div>
                  <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                    {item}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - LIVE DEPARTMENT SYNC SIMULATOR */}
          <div className="about-right-panel w-full relative">
            
            {/* Main Interactive Flow Card */}
            <motion.div
              variants={rightSideCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="w-full bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-xl relative backdrop-blur-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 m-0">
                    <span className="h-3 w-3 bg-emerald-500 rounded-full animate-ping inline-block" />
                    Live Data Matrix Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 m-0">Simulated view of autonomous telemetry synchronizations</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-center text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  Node: East-Hub-01
                </div>
              </div>

              {/* Pipeline Simulation Steps */}
              <div className="space-y-4 relative">
                {/* Connector Line behind steps */}
                <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-slate-100 -z-10" />

                {pipelineSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === activeStep;
                  
                  return (
                    <motion.div
                      key={step.id}
                      onClick={() => setActiveStep(index)}
                      animate={{ 
                        scale: isActive ? 1.02 : 1,
                        backgroundColor: isActive ? "rgba(240, 249, 255, 0.7)" : "rgba(255, 255, 255, 0)" 
                      }}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer box-border ${
                        isActive 
                          ? "border-sky-200 shadow-sm" 
                          : "border-transparent hover:border-slate-100 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Animated Node Circle */}
                      <div className="relative">
                        <motion.div 
                          animate={{ 
                            backgroundColor: isActive ? "#0284c7" : "rgba(226, 232, 240, 1)",
                            color: isActive ? "#ffffff" : "rgba(100, 116, 139, 1)",
                            boxShadow: isActive ? "0 0 15px rgba(14, 165, 233, 0.4)" : "none"
                          }}
                          className="w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-300 z-10 relative"
                        >
                          <StepIcon size={22} />
                        </motion.div>
                        {isActive && (
                          <motion.div 
                            layoutId="pulse-ring" 
                            className="absolute inset-0 rounded-full border-2 border-sky-400 -z-10"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          />
                        )}
                      </div>

                      {/* Step Text Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-base font-bold transition-colors m-0 ${isActive ? "text-sky-900" : "text-slate-800"}`}>
                            {step.label}
                          </h4>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isActive 
                              ? "bg-sky-100 text-sky-700" 
                              : index < activeStep 
                                ? "bg-emerald-50 text-emerald-700" 
                                : "bg-slate-100 text-slate-500"
                          }`}>
                            {isActive ? "Active Sync" : index < activeStep ? "Secured" : "Queued"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1 m-0">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Dynamic Console Feed */}
              <div className="mt-6 bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-400 shadow-inner overflow-hidden relative min-h-[62px]">
                <div className="absolute right-3 top-3 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <div className="w-2 h-2 rounded-full bg-green-500/80" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    <p className="text-emerald-400 font-semibold m-0">// STREAM_ESTABLISHED</p>
                    <p className="m-0">SYSTEM.ROUTING: {pipelineSteps[activeStep].label.toUpperCase().replace(/\s+/g, '_')} processed in 0.0042s</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Bottom Row: Core Structural Architecture Benefits */}
            <motion.div 
              variants={cardStaggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-20px" }}
              className="about-benefits-grid w-full"
            >
              {careOSBenefits.map((benefit) => {
                const BenefitIcon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    variants={rightSideCardVariants}
                    whileHover={{ y: -4, border: "1px solid rgba(14, 165, 233, 0.3)" }}
                    className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-4 rounded-2xl shadow-sm transition-all flex flex-col justify-between box-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${benefit.bgColor} bg-gradient-to-br text-slate-800 flex-shrink-0 flex items-center justify-center`}>
                        <BenefitIcon size={18} className="text-slate-800" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 m-0">{benefit.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-3.5 leading-relaxed m-0">{benefit.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>
        </div>

        {/* Global Horizontal Context Footer Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="about-footer-card bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full box-border"
        >
          <div className="max-w-2xl text-left">
            <h4 className="text-base font-bold text-sky-400 m-0">Transforming Enterprise Clinical Workflows</h4>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed m-0">
              CareOS unifies disparate legacy platforms into an interconnected environment, eliminating administrative overhead and dropping communication friction across hospital staff by up to 40%.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
            <span className="text-xs font-semibold text-slate-300">Operational Efficacy</span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">99.98%</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AboutSection;