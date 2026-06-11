import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
    $or: [{ email: userData.email }, { phone: userData.phone }]
  });

  if (existingUser) {
    const error = new Error('Identity conflict: Email or phone number already registered');
    error.statusCode = 409;
    throw error;
  }

  const { confirmPassword, ...cleanData } = userData;
  const newUser = await UserIdentity.create(cleanData);

  await generateAndSaveOtp(newUser.email, newUser.firstName);

  const userObject = newUser.toObject();
  delete userObject.password;
  return userObject;
};

export const loginUser = async (email, password) => {
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
  return { user: userObject };
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