import React, { useState, useRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft } from "lucide-react";
import "../style/LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const DUMMY_CREDENTIALS = [
    { label: "Patient", email: "patient@careos.com", password: "Temp1234!" },
    { label: "Doctor", email: "doctor@careos.com", password: "Temp1234!" },
    { label: "Nurse", email: "nurse@careos.com", password: "Temp1234!" },
    { label: "Receptionist", email: "receptionist@careos.com", password: "Temp1234!" },
    { label: "Laboratory Staff", email: "lab@careos.com", password: "Temp1234!" },
    { label: "Pharmacy Staff", email: "pharmacy@careos.com", password: "Temp1234!" }
  ];

  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (token && user) {
      try {
        const parsed = JSON.parse(user);
        const role = parsed?.role;
        if (role) redirectByRole(role);
      } catch {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const redirectByRole = (role) => {
    const routes = {
      patient: "/patient-dashboard",
      doctor: "/doctor-dashboard",
      nurse: "/nurse-dashboard",
      hospital_admin: "/hospital_admin-dashboard",
      lab_technician: "/lab_technician-dashboard",
      pharmacist: "/pharmacist-dashboard",
      receptionist: "/receptionist-dashboard"
    };
    const path = routes[role];
    if (path) navigate(path);
    else setMessage({ type: "error", text: "Unauthorized role profile." });
  };

  const handleAutofill = (dummyEmail, dummyPassword) => {
    setEmail(dummyEmail);
    setPassword(dummyPassword);
    setMessage({ type: "", text: "" });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!siteKey) {
      setMessage({ type: "error", text: "Configuration Error: VITE_RECAPTCHA_SITE_KEY missing." });
      return;
    }
    if (!captchaToken) {
      setMessage({ type: "error", text: "Please complete the 'I'm not a robot' security check." });
      return;
    }
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email, password, captchaToken, rememberMe
      });

      const userObj = response.data?.user;
      const authToken = response.data?.token;

      // Store in the right place based on rememberMe
      // rememberMe = true  → localStorage  (persists across browser close, 7d JWT)
      // rememberMe = false → sessionStorage (cleared when tab/browser closes, 1d JWT)
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("authToken", authToken);
      storage.setItem("user", JSON.stringify(userObj));

      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem("authToken");
      otherStorage.removeItem("user");

      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      setTimeout(() => redirectByRole(userObj?.role), 1200);

    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.code === "ACCOUNT_UNVERIFIED") {
        const unverifiedEmail = error.response.data.email || email;
        setEmail(unverifiedEmail);
        setMessage({ type: "error", text: "Account not yet activated. A verification code has been sent to your email." });
        setStep(2);
        setResendTimer(30);
        setCanResend(false);
      } else {
        setMessage({ type: "error", text: error.response?.data?.message || "Login failed." });
      }
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      await axios.post(`${API_BASE_URL}/api/v1/auth/verify-otp`, { email, otp });
      setMessage({ type: "success", text: "Account activated! Please sign in." });
      setOtp("");
      setStep(1);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "OTP verification failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      await axios.post(`${API_BASE_URL}/api/v1/auth/resend-otp`, { email });
      setMessage({ type: "success", text: "A fresh verification code has been dispatched." });
      setResendTimer(30);
      setCanResend(false);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to resend code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-card animate-slide-up">
        <div className="login-header">
          <h2 className="login-title">{step === 1 ? "Welcome Back" : "Verify Account"}</h2>
          <p className="login-subtitle">
            {step === 1 ? "Sign in to your CareOS portal" : `Verification code sent to ${email}`}
          </p>
        </div>

        {message.text && (
          <div className={`login-alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="autofill-panel">
              <span className="autofill-title">Development Sandbox Profile Auto-fill:</span>
              <div className="autofill-button-grid">
                {DUMMY_CREDENTIALS.map((role) => (
                  <button key={role.label} type="button" className="autofill-pill-btn" onClick={() => handleAutofill(role.email, role.password)}>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              <div className="form-fields-container">
                <div className="form-field-group">
                  <label className="field-label">Email Address</label>
                  <div className="input-icon-wrapper">
                    <Mail size={16} className="input-embedded-icon" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-element with-icon" placeholder="you@example.com" />
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label">Password</label>
                  <div className="password-input-wrapper">
                    <Lock size={16} className="input-embedded-icon" />
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-element with-icon password-input" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="password-toggle-btn">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="login-options-row">
                <label className="remember-me-checkbox-label">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="remember-me-checkbox-input" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-password-link" onClick={() => navigate('/forgot-password')}>
                  Forgot your password?
                </button>
              </div>

              <div className="recaptcha-wrapper">
                {siteKey ? (
                  <ReCAPTCHA ref={recaptchaRef} sitekey={siteKey} onChange={(token) => { setCaptchaToken(token); if (token) setMessage({ type: "", text: "" }); }} />
                ) : (
                  <div className="recaptcha-fallback">reCAPTCHA Site Key missing.</div>
                )}
              </div>

              <button type="submit" disabled={loading} className="login-submit-btn">
                {loading ? "Verifying Access..." : "Sign In"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <form className="login-form" onSubmit={handleOtpVerifySubmit}>
            <div className="form-fields-container">
              <div className="form-field-group">
                <label className="field-label">6-Digit Verification Code</label>
                <div className="input-icon-wrapper">
                  <ShieldCheck size={16} className="input-embedded-icon" />
                  <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="input-element with-icon tracking-otp-center" placeholder="000000" />
                </div>
              </div>
            </div>

            <div className="resend-countdown-row">
              {canResend ? (
                <button type="button" onClick={handleResendOtp} className="resend-active-link-action">
                  Resend Verification Code
                </button>
              ) : (
                <p className="resend-timer-text">Resend available in <strong>{resendTimer}s</strong></p>
              )}
            </div>

            <button type="submit" disabled={loading || otp.length !== 6} className="login-submit-btn">
              {loading ? "Activating..." : "Confirm Activation"}
            </button>

            <button type="button" onClick={() => { setStep(1); setMessage({ type: "", text: "" }); }} className="portal-back-to-login-btn">
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        )}

        <hr className="divider" />
        <div className="back-home-container">
          <button type="button" onClick={() => window.location.href = "/"} className="back-home-btn">
            <svg className="back-arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Portal Home
          </button>
        </div>
      </div>
    </div>
  );
}