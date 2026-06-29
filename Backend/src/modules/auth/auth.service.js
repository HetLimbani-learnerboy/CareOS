import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserIdentity from './userIdentity.model.js';
import OtpVerification from './otpVerification.model.js';
import { sendOtpEmail } from "../../service/email.service.js";

const generateAndSaveOtp = async (email, firstName) => {
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(rawOtp, salt);

  await OtpVerification.findOneAndUpdate(
    { email },
    {
      otp_hash: hashedOtp,
      attempts_count: 0,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  await sendOtpEmail(email, firstName, rawOtp);
  return rawOtp;
};

export const registerUser = async (userData) => {
  const existingUser = await UserIdentity.findOne({
    $or: [{ email: userData.email.toLowerCase() }, { phone: userData.phone }]
  });

  if (existingUser) {
    // 1. Verify if the email matches and the account is still unverified
    if (existingUser.email === userData.email.toLowerCase() && !existingUser.is_verified) {
      
      // 2. Check if the password matches the known receptionist walk-in placeholder string
      const isWalkInPlaceholder = existingUser.password 
        ? await bcrypt.compare('WALK_IN_PLACEHOLDER_PASS', existingUser.password)
        : true; // fallback if password field was completely null/empty

      if (isWalkInPlaceholder) {
        const { confirmPassword, password, ...cleanData } = userData;

        // Hash the patient's new custom production password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update placeholder account with real patient details
        existingUser.firstName = cleanData.firstName.trim();
        existingUser.lastName = (cleanData.lastName || '').trim();
        existingUser.phone = cleanData.phone;
        existingUser.countryCode = cleanData.countryCode || existingUser.countryCode;
        existingUser.password = hashedPassword; // Overwrites the hashed placeholder

        await existingUser.save();

        // Generate and dispatch fresh onboarding verification OTP code
        await generateAndSaveOtp(existingUser.email, existingUser.firstName);

        const userObject = existingUser.toObject();
        delete userObject.password;
        return userObject;
      }
    }

    // Otherwise, throw an identity conflict error block
    const error = new Error('Identity conflict: Email or phone number already registered');
    error.statusCode = 409;
    throw error;
  }

  // --- Normal signup flow for brand new profiles ---
  const { confirmPassword, ...cleanData } = userData;
  const newUser = await UserIdentity.create(cleanData);

  await generateAndSaveOtp(newUser.email, newUser.firstName);

  const userObject = newUser.toObject();
  delete userObject.password;
  return userObject;
};


export const loginUser = async (email, password, rememberMe) => {
  const user = await UserIdentity.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    throw error;
  }

  if (!user.is_verified) {
    await generateAndSaveOtp(user.email, user.firstName);
    
    const error = new Error('Account verification required');
    error.statusCode = 403;
    error.code = 'ACCOUNT_UNVERIFIED';
    error.email = user.email;
    throw error;
  }

  const userObject = user.toObject();
  delete userObject.password;

  return { 
    user: userObject,
    token: "TEMP_SESSION_TOKEN"
  };
};

export const verifyOtpCode = async (email, enteredOtp) => {
  const record = await OtpVerification.findOne({ email });
  if (!record || Date.now() > record.expires_at.getTime()) {
    const error = new Error('Verification code has expired or does not exist');
    error.statusCode = 400;
    throw error;
  }

  if (record.attempts_count >= 5) {
    await OtpVerification.deleteOne({ email });
    const error = new Error('Maximum verification attempts exceeded. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  const isValid = await bcrypt.compare(enteredOtp, record.otp_hash);
  if (!isValid) {
    await OtpVerification.updateOne({ email }, { $inc: { attempts_count: 1 } });
    const error = new Error('Invalid verification code entered');
    error.statusCode = 400;
    throw error;
  }

  await OtpVerification.deleteOne({ email });

  const updatedUser = await UserIdentity.findOneAndUpdate(
    { email },
    { is_verified: true },
    { returnDocument: 'after' }
  ).select('-password');

  return updatedUser;
};

export const initiatePasswordReset = async (email) => {
  const user = await UserIdentity.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { success: true };
  }
  await generateAndSaveOtp(user.email, user.firstName);
  return { success: true };
};

export const verifyPasswordResetOtp = async (email, enteredOtp) => {
  const record = await OtpVerification.findOne({ email: email.toLowerCase() });

  if (!record || Date.now() > record.expires_at.getTime()) {
    const error = new Error('Verification code has expired or does not exist');
    error.statusCode = 400;
    throw error;
  }

  if (record.attempts_count >= 5) {
    await OtpVerification.deleteOne({ email: email.toLowerCase() });
    const error = new Error('Maximum verification attempts exceeded. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  const isValid = await bcrypt.compare(enteredOtp, record.otp_hash);
  if (!isValid) {
    await OtpVerification.updateOne({ email: email.toLowerCase() }, { $inc: { attempts_count: 1 } });
    const error = new Error('Invalid verification code entered');
    error.statusCode = 400;
    throw error;
  }

  return { success: true };
};

export const executePasswordResetUpdate = async (email, tokenOtp, newPassword) => {
  const record = await OtpVerification.findOne({ email: email.toLowerCase() });

  if (!record) {
    const error = new Error('Session expired. Please request a fresh security token.');
    error.statusCode = 400;
    throw error;
  }

  const isOtpValid = await bcrypt.compare(tokenOtp, record.otp_hash);
  if (!isOtpValid) {
    const error = new Error('Session validation failure. Unauthorized credential change.');
    error.statusCode = 401;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const securelyHashedPassword = await bcrypt.hash(newPassword, salt);

  const updatedUser = await UserIdentity.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { password: securelyHashedPassword } },
    { runValidators: true }
  );

  if (!updatedUser) {
    const error = new Error('Profile reference context detached.');
    error.statusCode = 444;
    throw error;
  }
  await OtpVerification.deleteOne({ email: email.toLowerCase() });

  return { success: true };
};