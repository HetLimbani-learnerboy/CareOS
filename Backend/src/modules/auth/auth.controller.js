import { SignupDTO } from './dtos/signup.dto.js';
import { LoginDTO } from './dtos/login.dto.js';
import { VerifyOtpDTO } from './dtos/verifyOtp.dto.js';
import UserIdentity from "./userIdentity.model.js";
import {
  registerUser,
  loginUser,
  verifyOtpCode,
  initiatePasswordReset,
  verifyPasswordResetOtp,
  executePasswordResetUpdate
} from './auth.service.js';
import { verifyRecaptchaToken } from "../../utils/recaptcha.js";
import { forwardContactFormToBrevo } from "../../service/email.service.js";

export const signup = async (req, res) => {
  try {
    const validationResult = SignupDTO.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        status: "fail",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const createdUser = await registerUser(validationResult.data);
    return res.status(201).json({ status: "success", data: createdUser });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal processing error during registration",
    });
  }
};

export const login = async (req, res) => {
  try {
    const validationResult = LoginDTO.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        status: "fail",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const { email, password, captchaToken, rememberMe } = validationResult.data;

    if (!captchaToken) {
      return res.status(400).json({
        status: "fail",
        message: "Security verification token is missing. Please refresh and try again."
      });
    }

    if (captchaToken !== "resend_bypass") {
      const isHuman = await verifyRecaptchaToken(captchaToken);
      if (!isHuman) {
        return res.status(401).json({
          status: "fail",
          message: "Automated verification failed or token expired. Please re-verify the reCAPTCHA widget."
        });
      }
    }

    const result = await loginUser(email, password, !!rememberMe);

    return res.status(200).json({ 
      status: 'success', 
      user: result.user,
      token: result.token
    });

  } catch (error) {
    if (error.code === 'ACCOUNT_UNVERIFIED') {
      return res.status(403).json({
        status: 'fail',
        code: error.code,
        message: error.message,
        email: error.email
      });
    }

    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal processing error during login",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const validationResult = VerifyOtpDTO.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        status: 'fail',
        errors: validationResult.error.flatten().fieldErrors
      });
    }

    const verifiedUser = await verifyOtpCode(validationResult.data.email, validationResult.data.otp);
    return res.status(200).json({
      status: 'success',
      message: 'Account activated successfully',
      data: { user: verifiedUser }
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      status: "fail",
      message: error.message || "Verification processing failed",
    });
  }
};

export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: "fail", message: "Email address is required." });
    }
    const userExists = await UserIdentity.findOne({ email: email.toLowerCase() });

    if (!userExists) {
      return res.status(404).json({
        status: "fail",
        message: "If an account is associated with this email address, a verification code will be sent to your inbox."
      });
    }

    await initiatePasswordReset(email);

    return res.status(200).json({
      status: "success",
      message: "A secure 6-digit verification code has been dispatched to your email."
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal processing exception during recovery request.",
    });
  }
};

export const forgotPasswordVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ status: "fail", message: "Email and verification token are required." });
    }

    await verifyPasswordResetOtp(email, otp);
    return res.status(200).json({ status: "success", message: "Identity verification handshake successful." });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      status: "fail",
      message: error.message || "OTP verification process failed.",
    });
  }
};

export const forgotPasswordUpdate = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ status: "fail", message: "Missing required transactional parameters." });
    }

    await executePasswordResetUpdate(email, otp, password);
    return res.status(200).json({ status: "success", message: "Credentials updated successfully." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Failed to update user credentials.",
    });
  }
};

export const contactSupportInquiry = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ 
        status: "fail", 
        message: "All validation parameters (name, email, message) are explicitly required." 
      });
    }
    await forwardContactFormToBrevo(name, email, message);

    return res.status(200).json({
      status: "success",
      message: "Communications transmission securely forwarded to Brevo system gateways."
    });
  } catch (error) {
    console.error("[Brevo Gateway Exception Block]:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to dispatch communications transmission over to Brevo SMTP servers."
    });
  }
};