import {
  Users,
  UserRound,
  Calendar,
  Pill,
  FlaskConical,
  Bot,
  ShieldCheck,
  Building2,
  ClipboardList
} from 'lucide-react';

import { motion } from "framer-motion";

const features = [
  {
    title: "Patient Management",
    icon: Users,
    desc: "Manage patient profiles, clinical snapshots, medical history, allergies, vitals logs, and treatment records.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "Doctor Management",
    icon: UserRound,
    desc: "Handle doctor specializations, clinical profiles, consultation fees, and weekly availability schedules.",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
  },
  {
    title: "Appointment Management",
    icon: Calendar,
    desc: "Online appointment booking, rescheduling, live slot tracking, cancellation, and automated email notifications.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
  },
  {
    title: "Authentication & Security",
    icon: ShieldCheck,
    desc: "Secure user authentication with OTP verification, role-based access control, and Google reCAPTCHA protection.",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Pharmacy Management",
    icon: Pill,
    desc: "Medicine inventory, stock alerts, prescription fulfillment, billing, and supplier tracking.",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
  },
  {
    title: "Laboratory & Diagnostics",
    icon: FlaskConical,
    desc: "Manage lab test requests, diagnostic reports, pathology records, and report delivery workflows.",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-50",
  },
  {
    title: "Ward & Bed Management",
    icon: Building2,
    desc: "Handle patient admissions, room assignments, bed allocations, discharges, and active treatment plans.",
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-50",
  },
  {
    title: "Receptionist Consultation Desk",
    icon: ClipboardList,
    desc: "Manage incoming consultation requests, front-desk scheduling, and receptionist billing oversight.",
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    title: "AI-Powered Clinical Decision Support",
    icon: Bot,
    desc: "AI-driven insights for diagnosis, treatment recommendations, risk predictions, and personalized care plans.",
    color: "from-teal-500 to-green-500",
    bgColor: "bg-teal-50",
  },
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const FeatureSection = () => {
  return (
    <section
      id="features"
      className="
      scroll-mt-24
      py-20
      lg:py-32
      bg-gradient-to-br
      from-white
      via-slate-50
      to-blue-50/30
      relative
      overflow-hidden
      features-card
    " >

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 left-20 w-80 h-80 bg-sky-200/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 right-20 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block text-sky-700 px-4 py-2 rounded-full text-sm font-semibold border border-sky-200/50 mb-4"
          >
            ✨ Our Capabilities
          </motion.span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
            Powerful Features
          </h2>

          <p className="text-slate-600 mt-4 text-lg lg:text-xl w-full mx-auto mb-6 lg:mb-10">
            Everything your healthcare organization needs in one intelligent platform.
          </p>
        </motion.div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                scaleX: 0,
              }}
              whileInView={{
                opacity: 0.15,
                scaleX: 1,
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.08,
              }}
              className="
                absolute
                h-px
                bg-gradient-to-r
                from-transparent
                via-sky-400
                to-transparent
                origin-left
              "
              style={{
                top: `${15 + i * 7}%`,
                left: `${5 + (i % 3) * 15}%`,
                width: `${30 + (i % 4) * 10}%`,
                transform: `rotate(${i % 2 === 0 ? 15 : -15}deg)`,
              }}
            />
          ))}
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "100px", mode: "easeInOut", minimum: 0.25 }}
          className="
            grid
            grid-cols-1
            pt-6
            mt-10
            md:grid-cols-2
            xl:grid-cols-3
            gap-6
            lg:gap-8
            features-card-grid
          ">

          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: {
                    opacity: 0,
                    scale: 0.85,
                    y: 60,
                  },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      duration: 0.8,
                      delay: index * 0.08,
                      type: "spring",
                      stiffness: 80,
                    },
                  },
                }}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                  rotateX: 4,
                  rotateY: 4,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
                className="group relative"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className={`
                    absolute
                    inset-0
                    bg-gradient-to-br
                    ${feature.color}
                    opacity-0
                    rounded-3xl
                    blur-xl
                    transition-opacity
                    duration-500
                  `} />

                <div
                  className={`
                    relative
                    ${feature.bgColor}
                    rounded-2xl
                    p-12
                    border
                    border-slate-200/50
                    transition-all
                    duration-500
                    h-full
                    min-h-[225px]
                    flex
                    flex-col
                    overflow-hidden
                  `} >
                  <div
                    className="
                      absolute
                      top-4
                      right-4
                      text-5xl
                      p-2
                      backdrop-blur-sm
                      text-slate-300
                      font-black
                      text-slate-100
                      select-none
                    " >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <motion.div
                    whileHover={{
                      rotate: 8,
                      scale: 1.1,
                    }}
                    className={`
                      w-16
                      h-20
                      rounded-2xl
                      bg-gradient-to-br
                      ${feature.color}
                      text-white
                      flex
                      items-center
                      justify-center
                      shadow-lg
                      mb-6 
                      `} >
                    <Icon size={30} />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3 mt-2">
                    {feature.title}
                  </h3>

                  <p className="text-slate-600 leading-relaxed flex-grow mt-1">
                    {feature.desc}
                  </p>

                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow:
              "0 20px 40px rgba(14,165,233,0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          className="
              px-10
              py-4
              bg-gradient-to-r
              from-sky-600
              to-blue-600
              text-white
              font-semibold
              rounded-xl
              hover:from-sky-700
              hover:to-blue-700
              transition-all
              inline-flex
              items-center
              gap-2
            " >
        </motion.button>
      </div>
    </section>
  );
};

export default FeatureSection;