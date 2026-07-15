import React, { useState, useRef, useEffect } from "react";
import {
  User, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck,
  Sparkles, Check, X, KeyRound, Activity, Phone, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import "../style/PatientRegister-style.css";

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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    let intervalId;
    if (resendCountdown > 0) {
      intervalId = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(intervalId);
  }, [resendCountdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const isMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*]/.test(formData.password);
  const doPasswordsMatch = formData.password && formData.password === formData.confirmPassword;
  const isFormValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && doPasswordsMatch;

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
        setResendCountdown(30);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        const user = response.data?.data?.user;
        const storage = localStorage.getItem("authToken") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }));
        navigate("/patient-dashboard");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Invalid or expired verification code.");
      setOtp(new Array(6).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Uses dedicated /resend-otp endpoint — no captcha or password needed
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending) return;
    try {
      setIsResending(true);
      setErrorMessage("");
      await axios.post(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
        email: formData.email
      });
      setResendCountdown(30);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const updatedOtp = [...otp];
    updatedOtp[index] = element.value;
    setOtp(updatedOtp);
    setErrorMessage("");
    if (element.value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = new Array(6).fill("");
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const nextEmpty = Math.min(pasted.length, 5);
    otpRefs.current[nextEmpty]?.focus();
  };

  const rules = [
    { key: "length", label: "Minimum 8 characters", met: isMinLength },
    { key: "upper", label: "Uppercase letter", met: hasUppercase },
    { key: "lower", label: "Lowercase letter", met: hasLowercase },
    { key: "number", label: "Number", met: hasNumber },
    { key: "special", label: "Special character (!@#$%^&*)", met: hasSpecialChar },
    { key: "match", label: "Passwords match", met: doPasswordsMatch }
  ];

  return (
    <div className="register-viewport">
      <div className="register-card-container">
        <button type="button" onClick={() => navigate("/")} className="register-back-btn">
          <ArrowLeft size={18} className="register-back-arrow" />
          <span>Portal Home</span>
        </button>

        <div className="register-brand-header">
          <span className="register-badge">
            <Sparkles size={14} className="text-sky-500 animate-pulse" />
            Secure Onboarding
          </span>
          <h2 className="register-main-title">
            <div className="register-title-icon-wrapper"><Activity size={22} /></div>
            CareOS Patient Portal
          </h2>
          <p className="register-subtitle">
            {step === "form"
              ? "Create your secure patient profile"
              : "Enter the verification code sent to your email"}
          </p>
        </div>

        {errorMessage && (
          <div className="register-error-banner">{errorMessage}</div>
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
                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} placeholder="John" className="register-input-element pl-10" />
                  </div>
                </div>
                <div className="register-field-group">
                  <label className="register-field-label">Last Name</label>
                  <div className="register-input-wrapper">
                    <span className="register-input-icon"><User size={16} /></span>
                    <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} placeholder="Doe" className="register-input-element pl-10" />
                  </div>
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Email Address</label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon"><Mail size={16} /></span>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className="register-input-element pl-10" />
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Phone Number</label>
                <div className="register-phone-composite">
                  <div className="register-prefix-wrapper">
                    <select name="countryCode" value={formData.countryCode} onChange={handleInputChange} className="register-prefix-select">
                      {countryCodes.map((item) => (
                        <option key={item.code} value={item.code}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="register-phone-input-wrapper">
                    <span className="register-input-icon"><Phone size={16} /></span>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="98765 43210" className="register-input-element pl-10" />
                  </div>
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Secure Password</label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon"><Lock size={18} /></span>
                  <input
                    type={showPassword ? "text" : "password"} name="password" required autoComplete="new-password"
                    value={formData.password} onChange={handleInputChange}
                    onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}
                    placeholder="••••••••" className="register-input-element pl-10 pr-11"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="register-visibility-toggle">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-field-label">Confirm Password</label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon"><Lock size={18} /></span>
                  <input
                    type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required autoComplete="new-password"
                    value={formData.confirmPassword} onChange={handleInputChange}
                    onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}
                    placeholder="••••••••" className="register-input-element pl-10 pr-11"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="register-visibility-toggle">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="register-rules-panel">
                <span className="register-rules-header">Password Requirements</span>
                {rules.map((rule) => (
                  <div key={rule.key} className="register-rule-row">
                    <div className={`register-rule-dot ${rule.met ? "pass" : "fail"}`}>
                      {rule.met ? <Check size={10} /> : <X size={10} />}
                    </div>
                    <span className={`register-rule-text ${rule.met ? "pass" : "fail"}`}>{rule.label}</span>
                  </div>
                ))}
              </div>

              <div className="register-action-wrapper">
                <button type="submit" disabled={isSubmitting || !isFormValid} className="register-submit-btn">
                  {isSubmitting ? <div className="register-spinner" /> : (
                    <><span>Create Account</span><ShieldCheck size={16} /></>
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
                  A verification code was sent to <strong>{formData.email}</strong>. Check your inbox and spam folder.
                </p>
              </div>

              <div className="register-field-group">
                <label className="register-otp-label">Enter 6-Digit Code</label>
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
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="register-otp-input"
                      inputMode="numeric"
                    />
                  ))}
                </div>
              </div>

              <div className="register-resend-row">
                {resendCountdown > 0 ? (
                  <p className="register-resend-timer">
                    Resend available in <span>{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendOtp}
                    className="register-resend-btn"
                  >
                    <RefreshCw size={14} className={isResending ? "register-spin" : ""} />
                    <span>{isResending ? "Sending..." : "Resend Verification Code"}</span>
                  </button>
                )}
              </div>

              <div className="register-otp-actions">
                <button type="button" onClick={() => { setStep("form"); setOtp(new Array(6).fill("")); setErrorMessage(""); }} className="register-otp-back-btn">
                  Edit Info
                </button>
                <button type="submit" disabled={isSubmitting || otp.some(v => v === "")} className="register-otp-submit-btn">
                  {isSubmitting ? <div className="register-spinner" /> : (
                    <><span>Verify & Activate</span><KeyRound size={16} /></>
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