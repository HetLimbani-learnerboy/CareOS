import { motion } from "framer-motion";
import { Heart, Activity, Zap, TrendingUp } from "lucide-react";

const HealthManagementAnimation = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  const floatVariants = {
    float: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const animateCardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
  };

  const healthMetrics = [
    { label: "Heart Rate", value: "72", unit: "bpm", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
    { label: "Activity", value: "8,432", unit: "steps", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
    { label: "Energy", value: "94", unit: "%", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full"
    >
      {/* Animated Background Glow */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 60px rgba(14, 165, 233, 0.2)",
            "0 0 100px rgba(14, 165, 233, 0.4)",
            "0 0 60px rgba(14, 165, 233, 0.2)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-3xl blur-2xl"
      />

      {/* Main Card Container */}
      <div className="relative bg-white rounded-3xl p-8 sm:p-10 lg:p-14 pl-6 
      min-h-[150px] lg:min-h-[350px] shadow-2xl border border-slate-200/50 overflow-hidden healthmanagement-card">
        {/* Gradient Background */}
        <div className="absolute top-0 right-0 w-96 h-100 bg-gradient-to-br from-sky-100/30 via-blue-100/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Health Dashboard</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Real-time health metrics monitoring</p>
          </motion.div>

          {/* Vital Signs Circle Animation */}
          <motion.div
            variants={itemVariants}
            className="mb-8 flex justify-center"
          >
            <motion.div
              animate="pulse"
              variants={pulseVariants}
              className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 flex items-center justify-center"
            >
              {/* Outer Ring */}
              <motion.div className="absolute inset-0 rounded-full border-2 border-sky-400/30" />

              {/* Middle Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-sky-300/40"
              />

              {/* Inner Circle */}
              <motion.div
                animate={{
                  boxShadow: [
                    "inset 0 0 20px rgba(14, 165, 233, 0.3)",
                    "inset 0 0 40px rgba(14, 165, 233, 0.5)",
                    "inset 0 0 20px rgba(14, 165, 233, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-8 rounded-full bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.p
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sky-600"
                  >
                    72
                  </motion.p>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold">BPM</p>
                </div>
              </motion.div>

              {/* Animated Pulse Dots */}
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  style={{ originX: "50%", originY: "50%" }}
                  className="absolute inset-0"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                    className="w-2 h-2 bg-sky-500 rounded-full"
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <div className="healthmetric-cards">
          {/* Health Metrics Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 mt-4"
          >
            {healthMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  custom={index}
                  variants={animateCardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{
                    y: -8,
                    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.1)",
                  }}
                  className={`${metric.bg} rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-center cursor-pointer border border-slate-100/50 transition-all`}
                >
                  <motion.div
                    animate="float"
                    variants={floatVariants}
                    className="flex justify-center mb-1 sm:mb-2"
                  >
                    <Icon className={`${metric.color} w-4 h-4 sm:w-5 sm:h-5`} />
                  </motion.div>
                  <p className="text-xs text-slate-600 font-medium">{metric.label}</p>
                  <p className="text-sm sm:text-lg font-bold text-slate-900 mt-0.5 sm:mt-1">{metric.value}</p>
                  <p className="text-xs text-slate-500">{metric.unit}</p>
                </motion.div>
              );
            })}
          </motion.div>
          </div>

          {/* Trend Chart Animation */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 healthmetric-cards"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span className="text-xs font-semibold text-slate-700">Health Trend</span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 sm:py-1 rounded-full">
                +12%
              </span>
            </div>

            {/* Animated Bars */}
            <div className="flex items-end gap-1 h-12 sm:h-16 justify-between">
              {[0.6, 0.8, 0.7, 0.9, 0.85, 0.95, 0.8].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height * 100}%` }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 2,
                  }}
                  className="flex-1 bg-gradient-to-t from-sky-500 to-sky-400 rounded-t-md opacity-80 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HealthManagementAnimation;
