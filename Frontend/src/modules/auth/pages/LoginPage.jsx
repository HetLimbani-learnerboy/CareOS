import React, { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/LoginPage.css"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const recaptchaRef = useRef(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
    if (token) setMessage({ type: "", text: "" });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!siteKey) {
      setMessage({ 
        type: "error", 
        text: "Configuration Error: VITE_RECAPTCHA_SITE_KEY is missing from frontend/.env" 
      });
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
        email,
        password,
        captchaToken, 
      });

      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      console.log("Authentication Response Payload:", response.data);

      const userRole = response.data?.data?.user?.role;

      if (userRole) {
        setTimeout(() => {
          if (userRole === "patient") navigate("/patient-dashboard");
          else if (userRole === "doctor") navigate("/doctor-dashboard");
          else if (userRole === "nurse") navigate("/nurse-dashboard");
          else if (userRole === "hospital_admin") navigate("/hospital_admin-dashboard");
          else if (userRole === "lab_technician") navigate("/lab_technician-dashboard");
          else if (userRole === "pharmacist") navigate("/pharmacist-dashboard");
          else if (userRole === "receptionist") navigate("/receptionist-dashboard");
          else {
            setMessage({ type: "error", text: "Unauthorized role profile layout context." });
          }
        }, 1200);
      } else {
        console.error("Role verification failed. 'role' property missing from response payload context.");
      }

    } catch (error) {
      const errorMsg = error.response?.data?.message || "Internal login network error.";
      setMessage({ type: "error", text: errorMsg });
      
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-card">
        
        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your CareOS portal</p>
        </div>

        {message.text && (
          <div className={`login-alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}

        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="form-fields-container">
            
            <div className="form-field-group">
              <label className="field-label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-element"
                placeholder="you@example.com"
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-element password-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className="password-toggle-btn"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

          </div>

          <div className="forgot-password-row">
            <button type="button" className="forgot-password-link" onClick={()=>navigate('/forgot-password')}>
              Forgot your password?
            </button>
          </div>

          <div className="recaptcha-wrapper">
            {siteKey ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={siteKey}
                onChange={handleCaptchaChange}
              />
            ) : (
              <div className="recaptcha-fallback">
                reCAPTCHA Site Key missing. Check your .env setup.
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="login-submit-btn">
            {loading ? "Verifying Access..." : "Sign In"}
          </button>
        </form>

        <hr className="divider" />

        <div className="back-home-container">
          <button
            type="button"
            onClick={() => window.location.href = "/"}
            className="back-home-btn"
          >
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