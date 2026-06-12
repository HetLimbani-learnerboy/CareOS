import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, ShieldCheck, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import "../style/ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Flow State Controller: 1 = Email, 2 = OTP, 3 = New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Visibility & Interaction States
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Password Validation States Matrix
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    number: false,
    special: false,
  });

  // Handle Resend Countdown Timer Loop
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Track live password field entry against security validation requirements
  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordRules({
      length: value.length >= 8,
      number: /\d/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>_]/.test(value),
    });
  };

  /* ==========================================================================
     TRANSACTION HANDLERS (BACKEND HANDSHAKES)
     ========================================================================== */
  
  // Step 1: Submit Email & Dispatch OTP via Promailer REST
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      
      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password-request`, { email });
      
      setMessage({ type: "success", text: "Security code dispatched successfully." });
      setStep(2);
      setResendTimer(30);
      setCanResend(false);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Verification drop error." });
    } finally {
      setLoading(false);
    }
  };

  // Trigger Resend OTP Token Action
  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password-request`, { email });
      setMessage({ type: "success", text: "A fresh 6-digit security code has been sent." });
      setResendTimer(30);
      setCanResend(false);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to resend token." });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate Submitted OTP Code
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password-verify-otp`, { email, otp });
      
      setMessage({ type: "success", text: "Identity verified. Establish new password parameters." });
      setStep(3);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Invalid token code entry." });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Commit Passed Secure Credentials Down to Database
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    const allRulesPassed = passwordRules.length && passwordRules.number && passwordRules.special;
    
    if (!allRulesPassed) {
      setMessage({ type: "error", text: "Please satisfy all mandatory system password complexity rules." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Password confirmation string mismatch." });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password-update`, { email, otp, password });
      
      setMessage({ type: "success", text: "Account credentials updated! Redirection executing..." });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Disk update execution drop." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recovery-viewport">
      <div className="recovery-card animate-slide-up">
        
        {/* Dynamic Header Titles based on Step Context */}
        <div className="recovery-header">
          {step === 1 && <h2>Forgot Password</h2>}
          {step === 2 && <h2>Enter Secure OTP</h2>}
          {step === 3 && <h2>Reset Password</h2>}
          
          {step === 1 && <p>Input your registered account email address to receive a verification token.</p>}
          {step === 2 && <p>We sent an encryption code to <strong>{email}</strong>. Input it below.</p>}
          {step === 3 && <p>Establish a secure structural password sequence for your workspace portal access profile.</p>}
        </div>

        {message.text && <div className={`recovery-alert ${message.type}`}>{message.text}</div>}

        {/* STEP 1 FORM: IDENTITY CHECK */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="recovery-form">
            <div className="recovery-field-group">
              <label>Email Address</label>
              <div className="input-with-icon-wrapper">
                <Mail size={18} className="input-inner-icon" />
                <input 
                  type="email" required value={email} 
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@careos.com" 
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="recovery-submit-btn">
              {loading ? "Locating Profile..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* STEP 2 FORM: OTP HANDSHAKE */}
        {step === 2 && (
          <form onSubmit={handleOtpVerify} className="recovery-form">
            <div className="recovery-field-group">
              <label>6-Digit Verification Token</label>
              <div className="input-with-icon-wrapper">
                <ShieldCheck size={18} className="input-inner-icon" />
                <input 
                  type="text" required maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000"
                  className="center-tracking-token"
                />
              </div>
            </div>
            
            <div className="resend-timer-wrapper">
              {canResend ? (
                <button type="button" onClick={handleResendOtp} className="resend-active-action-btn">
                  Resend Verification OTP
                </button>
              ) : (
                <p>Resend available in <strong>{resendTimer}s</strong></p>
              )}
            </div>

            <button type="submit" disabled={loading} className="recovery-submit-btn">
              {loading ? "Validating Code..." : "Verify Identity"}
            </button>
          </form>
        )}

        {/* STEP 3 FORM: NEW PASSWORD CONSTRAINTS */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="recovery-form">
            
            <div className="recovery-field-group">
              <label>New Password</label>
              <div className="input-with-icon-wrapper">
                <Lock size={18} className="input-inner-icon" />
                <input 
                  type={showPass ? "text" : "password"} required value={password} 
                  onChange={(e) => handlePasswordChange(e.target.value)} placeholder="••••••••"
                />
                <button type="button" className="eye-toggle-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Rules Tracker Node */}
            <div className="password-rules-box">
              <div className={`rule-item ${passwordRules.length ? "passed" : ""}`}>
                {passwordRules.length ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                <span>Minimum 8 characters</span>
              </div>
              <div className={`rule-item ${passwordRules.number ? "passed" : ""}`}>
                {passwordRules.number ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                <span>Contains at least 1 numeric digit</span>
              </div>
              <div className={`rule-item ${passwordRules.special ? "passed" : ""}`}>
                {passwordRules.special ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                <span>Contains at least 1 special symbol</span>
              </div>
            </div>

            <div className="recovery-field-group">
              <label>Confirm New Password</label>
              <div className="input-with-icon-wrapper">
                <Lock size={18} className="input-inner-icon" />
                <input 
                  type={showConfirmPass ? "text" : "password"} required value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                />
                <button type="button" className="eye-toggle-icon" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="recovery-submit-btn">
              {loading ? "Modifying Credentials..." : "Confirm Password Reset"}
            </button>
          </form>
        )}

        <div className="recovery-footer">
          <Link to="/login" className="back-to-login-link">
            <ArrowLeft size={16} /> <span>Return to login gate</span>
          </Link>
        </div>
      </div>
    </div>
  );
}