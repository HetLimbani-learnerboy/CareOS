import { SignupDTO } from './dtos/signup.dto.js';
import { LoginDTO } from './dtos/login.dto.js';
import { VerifyOtpDTO } from './dtos/verifyOtp.dto.js';
import { registerUser, loginUser, verifyOtpCode } from './auth.service.js';

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

    const result = await loginUser(validationResult.data.email, validationResult.data.password);
    return res.status(200).json({ status: 'success', data: result });
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