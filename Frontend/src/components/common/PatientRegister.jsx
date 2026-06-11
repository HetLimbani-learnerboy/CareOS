import React, { useState, useRef, useEffect } from "react";
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
  Activity,
  Phone,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import "../../style/PatientRegister-style.css";

const countryCodes = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "US (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+81", label: "Japan (+81)" }
];

const PatientRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("form");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Industrial Resend Timer Configuration Locks
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const otpRefs = useRef([]);

  // Dynamically resolve base URL endpoints from context environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Countdown timer manager hook
  useEffect(() => {
    let intervalId;
    if (resendCountdown > 0) {
      intervalId = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [resendCountdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  // Password rules validation engine
  const isMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*]/.test(formData.password);
  const doPasswordsMatch = formData.password && formData.password === formData.confirmPassword;

  const isFormValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && doPasswordsMatch;

  // Real API Form Registration Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/signup`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        countryCode: formData.countryCode,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.status === "success") {
        setStep("otp");
        setResendCountdown(30); // Initiate structural lock parameters immediately on load
      }
    } catch (error) {
      const serverError = error.response?.data?.message || "Registration processing pipeline failed.";
      setErrorMessage(serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real API Verification Submit
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) return;
    
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        email: formData.email,
        otp: enteredOtp
      });

      if (response.data.status === "success") {
        navigate("/patient-dashboard");
      }
    } catch (error) {
      const serverError = error.response?.data?.message || "Invalid or expired verification parameters.";
      setErrorMessage(serverError);
      setOtp(new Array(6).fill("")); // Wipe cells on validation failure
      otpRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real API Resend OTP Controller Engine
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending) return;

    try {
      setIsResending(true);
      setErrorMessage("");
      
      // Hit the Login route to regenerate a fresh registration OTP block
      await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email: formData.email,
        password: formData.password
      });

    } catch (error) {
      // Catch expected unverified 403 blocks as positive resend confirmations
      if (error.response?.status === 403 || error.response?.data?.code === 'ACCOUNT_UNVERIFIED') {
        setResendCountdown(30); // Reset lock parameters
      } else {
        const errorMsg = error.response?.data?.message || "Failed to resend validation transmission.";
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const updatedOtp = [...otp];
    updatedOtp[index] = element.value;
    setOtp(updatedOtp);
    setErrorMessage("");

    if (element.value !== "" && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="register-viewport">
      <div className="register-card-container">
        
        <button
          type="button"
          onClick={() => navigate("/")}
          className="register-back-btn"
        >
          <ArrowLeft size={18} className="register-back-arrow" />
          <span>Portal Home</span>
        </button> 

        <div className="register-brand-header">
          <span className="register-badge">
            <Sparkles size={14} className="text-sky-500 animate-pulse" />
            Secure Onboarding
          </span>
          <h2 className="register-main-title">
            <div className="register-title-icon-wrapper">
              <Activity size={22} />
            </div>
            CareOS Patient Portal
          </h2>
          <p className="register-subtitle">
            {step === "form" 
              ? "Initialize your clinical EHR data node container profile securely" 
              : "Telemetry link code authorization authentication screen"}
          </p>
        </div>

        {/* Global Error Context Alert banner */}
        {errorMessage && (
          <div className="bg-red-500 text-red-600 text-sm p-3 mb-4 rounded-lg border border-red-200 text-center font-medium">
            {errorMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.form 
              key="reg-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleFormSubmit}
              className="register-form"
            >
              <div className="register-grid-2col">
                <div className="register-field-group">
                  <label className="register-field-label">First Name</label>
                  <div className="register-input-wrapper">
                    <span className="register-input-icon"><User size={16} /></span>
                    <input 
                      type="text" 
                      name="firstName" 
                      required 
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John" 
                      className="register-input-element pl-10"
                    />
                  </div>
                </div>

                <div className="register-field-group">
                  <label className="register-field-label">Last Name</label>
                  <div className="register-input-wrapper">
                    <span className="register-input-icon"><User size={16} /></span>
                    <input 
                      type="text" 
                      name="lastName" 
                      required 
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe" 
                      className="register-input-element pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Email Address</label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon"><Mail size={16} /></span>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com" 
                    className="register-input-element pl-10"
                  />
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Phone Number</label>
                <div className="register-phone-composite">
                  <div className="register-prefix-wrapper">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      className="register-prefix-select"
                    >
                      {countryCodes.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="register-phone-input-wrapper">
                    <span className="register-input-icon"><Phone size={16} /></span>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="98765 43210" 
                      className="register-input-element pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Secure Password</label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon"><Lock size={18} /></span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••" 
                    className="register-input-element pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="register-visibility-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Confirm Password</label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon"><Lock size={18} /></span>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    required 
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••" 
                    className="register-input-element pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="register-visibility-toggle"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="register-rules-panel">
                <span className="register-rules-header">Security Rules Engine</span>
                
                <div className="register-rule-row">
                  <div className={`register-rule-dot ${isMinLength ? 'pass' : 'fail'}`}>
                    {isMinLength ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`register-rule-text ${isMinLength ? 'pass' : 'fail'}`}>
                    Minimum 8 characters
                  </span>
                </div>

                <div className="register-rule-row">
                  <div className={`register-rule-dot ${hasUppercase ? 'pass' : 'fail'}`}>
                    {hasUppercase ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`register-rule-text ${hasUppercase ? 'pass' : 'fail'}`}>
                    Uppercase letter
                  </span>
                </div>

                <div className="register-rule-row">
                  <div className={`register-rule-dot ${hasLowercase ? 'pass' : 'fail'}`}>
                    {hasLowercase ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`register-rule-text ${hasLowercase ? 'pass' : 'fail'}`}>
                    Lowercase letter
                  </span>
                </div>

                <div className="register-rule-row">
                  <div className={`register-rule-dot ${hasNumber ? 'pass' : 'fail'}`}>
                    {hasNumber ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`register-rule-text ${hasNumber ? 'pass' : 'fail'}`}>
                    Number
                  </span>
                </div>

                <div className="register-rule-row">
                  <div className={`register-rule-dot ${hasSpecialChar ? 'pass' : 'fail'}`}>
                    {hasSpecialChar ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`register-rule-text ${hasSpecialChar ? 'pass' : 'fail'}`}>
                    Special character (!@#$%^&*)
                  </span>
                </div>

                <div className="register-rule-row">
                  <div className={`register-rule-dot ${doPasswordsMatch ? 'pass' : 'fail'}`}>
                    {doPasswordsMatch ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span className={`register-rule-text ${doPasswordsMatch ? 'pass' : 'fail'}`}>
                    Confirm Passwords match
                  </span>
                </div>
              </div>

              <div className="register-action-wrapper">
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="register-submit-btn"
                >
                  {isSubmitting ? (
                    <div className="register-spinner" />
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
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              onSubmit={handleVerifySubmit}
              className="register-otp-form"
            >
              <div className="register-otp-banner">
                <p className="register-otp-banner-text">
                  A verification transmission code was dispatched directly to <strong>{formData.email}</strong>. Please check your inbox context elements.
                </p>
              </div>

              <div className="register-field-group">
                <label className="register-otp-label">
                  Enter 6-Digit Telemetry Key
                </label>
                
                <div className="register-otp-grid">
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
                      className="register-otp-input"
                    />
                  ))}
                </div>
              </div>

              {/* Industrial Resend Verification Execution Control Container */}
              <div className="flex justify-center items-center py-2 text-sm">
                {resendCountdown > 0 ? (
                  <p className="text-slate-500 font-medium">
                    Resend validation key in <span className="text-sky-600 font-semibold">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold transition-colors focus:outline-none disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
                    <span>Resend Verification Code</span>
                  </button>
                )}
              </div>

              <div className="register-otp-actions">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp(new Array(6).fill(""));
                    setErrorMessage("");
                  }}
                  className="register-otp-back-btn"
                >
                  Modify Info
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || otp.some(v => v === "")}
                  className="register-otp-submit-btn"
                >
                  {isSubmitting ? (
                    <div className="register-spinner" />
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