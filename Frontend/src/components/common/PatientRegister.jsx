import React, { useState, useRef } from "react";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  X,
  KeyRound,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const PatientRegister = () => {
  const navigate = useNavigate();
  
  // Navigation wizard flow steps tracking: 'form' | 'otp'
  const [step, setStep] = useState("form");
  
  // Registration Form States
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Interactive UI configurations
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [otpError, setOtpError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fixed static key parameter matching request validation requirements
  const FIXED_OTP = "123456";
  const otpRefs = useRef([]);

  // Form Field Updates Handles
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Password structural rule criteria mapping evaluation
  const isPasswordLongEnough = formData.password.length >= 6;
  const doPasswordsMatch = formData.password && formData.password === formData.confirmPassword;

  // Step 1 Submit: Core Initial Info Logging
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordLongEnough || !doPasswordsMatch) return;
    
    setIsSubmitting(true);
    // Simulate encryption and transactional initialization delay
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("otp");
    }, 1200);
  };

  // Step 2 Core Verification Tracker Handler
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const updatedOtp = [...otp];
    updatedOtp[index] = element.value;
    setOtp(updatedOtp);
    setOtpError(false);

    // Auto-focus progression chain handling down line cells
    if (element.value !== "" && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Backspace deletion behavior tracking focus shifting up row
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      if (enteredOtp === FIXED_OTP) {
        setIsSubmitting(false);
        // Securely routed parameter redirection directly to workspace panel dashboard hub
        navigate("/patient-dashboard");
      } else {
        setIsSubmitting(false);
        setOtpError(true);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 sm:p-6 lg:p-8 box-border font-sans">
      
      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl relative backdrop-blur-md">
        
        {/* Back To Home Absolute Layout Navigation Trigger Node */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute left-6 top-6 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold border-none bg-transparent cursor-pointer select-none group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Portal Home</span>
        </button>

        {/* Brand System Identifier Core Cluster */}
        <div className="flex flex-col items-center mb-8 mt-4">
          <span className="inline-flex items-center gap-1.5 text-sky-600 font-semibold tracking-wider uppercase text-xs bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200/60 shadow-sm mb-4">
            <Sparkles size={14} className="text-sky-500 animate-pulse" />
            Secure Onboarding
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2.5 m-0">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-md shadow-sky-100 flex items-center justify-center">
              <Activity size={22} />
            </div>
            CareOS Patient Portal
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-xs text-center m-0">
            {step === "form" 
              ? "Initialize your clinical EHR data node container profile securely" 
              : "Telemetry link code authorization authentication screen"}
          </p>
        </div>

        {/* Wizard Multi-Stage Condition Component Rendering */}
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.form 
              key="reg-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleFormSubmit}
              className="space-y-4 text-left w-full block"
            >
              {/* Split Name Row Layout Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* First Name input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">First Name</label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center"><User size={16} /></span>
                    <input 
                      type="text" 
                      name="firstName" 
                      required 
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John" 
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all box-border"
                    />
                  </div>
                </div>

                {/* Last Name input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Last Name</label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center"><User size={16} /></span>
                    <input 
                      type="text" 
                      name="lastName" 
                      required 
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe" 
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all box-border"
                    />
                  </div>
                </div>
              </div>

              {/* Email Element Configuration Field */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center"><Mail size={16} /></span>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com" 
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all box-border"
                  />
                </div>
              </div>

              {/* Primary Password Input With Functional Icon Toggle */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Secure Password</label>
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center"><Lock size={16} /></span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all box-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 flex items-center"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmation Password Validation Input Box */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm Password</label>
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center"><Lock size={16} /></span>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    required 
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all box-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 flex items-center"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Dynamic Rules Assessment Panel (Color-Changing Indicators) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Security Rules Engine</span>
                
                {/* Metric Rule 1: Length evaluation parameter */}
                <div className="flex items-center gap-2 text-xs font-medium">
                  <div className={`p-0.5 rounded-full flex items-center justify-center text-white transition-colors duration-300 ${isPasswordLongEnough ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {isPasswordLongEnough ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`transition-colors duration-300 ${isPasswordLongEnough ? 'text-emerald-600 font-semibold' : 'text-rose-600'}`}>
                    Password contains at least 6 characters
                  </span>
                </div>

                {/* Metric Rule 2: Equality match parameters check */}
                <div className="flex items-center gap-2 text-xs font-medium">
                  <div className={`p-0.5 rounded-full flex items-center justify-center text-white transition-colors duration-300 ${doPasswordsMatch ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {doPasswordsMatch ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`transition-colors duration-300 ${doPasswordsMatch ? 'text-emerald-600 font-semibold' : 'text-rose-600'}`}>
                    Passwords inputs match correctly
                  </span>
                </div>
              </div>

              {/* Form Action Submit Button */}
              <div className="pt-3 w-full">
                <button
                  type="submit"
                  disabled={isSubmitting || !isPasswordLongEnough || !doPasswordsMatch}
                  className="w-full py-3.5 px-5 font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none border-none cursor-pointer box-border"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Generate Security Pipeline</span>
                      <ShieldCheck size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            /* STAGE 2: 6-DIGIT SECURITY VERIFICATION SHEET OVERLAY */
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              onSubmit={handleVerifySubmit}
              className="space-y-6 text-left w-full block"
            >
              <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 text-center">
                <p className="text-xs text-sky-800 leading-relaxed m-0">
                  A verification transmission node was simulated toward your profile context. <br />
                  For testing, apply the system key code parameter: <strong className="font-bold text-slate-900 bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200">{FIXED_OTP}</strong>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider text-center block w-full">
                  Enter 6-Digit Telemetry Key
                </label>
                
                {/* 6 Grid Cells Core Input Segment */}
                <div className="flex justify-between items-center gap-2 max-w-sm mx-auto w-full mt-2">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      name="otp-cell"
                      maxLength="1"
                      ref={(el) => (otpRefs.current[index] = el)}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      focus={(index === 0).toString()}
                      className={`w-12 h-14 text-center text-xl font-bold bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all box-border ${
                        otpError 
                          ? "border-rose-400 bg-rose-50/30 text-rose-600 ring-4 ring-rose-500/10" 
                          : "border-slate-200 text-slate-800"
                      }`}
                    />
                  ))}
                </div>

                {/* Error feedback text indicator node */}
                <AnimatePresence>
                  {otpError && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs font-semibold text-rose-600 text-center mt-2 m-0"
                    >
                      Security key validation mismatch. Please evaluate inputs.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons Hub Row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp(new Array(6).fill(""));
                    setOtpError(false);
                  }}
                  className="w-full sm:w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all border-none cursor-pointer box-border"
                >
                  Modify Info
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || otp.some(v => v === "")}
                  className="w-full sm:w-2/3 py-3.5 px-5 font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer box-border"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Authorize Registration</span>
                      <KeyRound size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default PatientRegister;