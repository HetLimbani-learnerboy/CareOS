import { Router } from 'express';
import { signup, login, verifyOtp, forgotPasswordRequest, forgotPasswordVerify, forgotPasswordUpdate,contactSupportInquiry } from './auth.controller.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

router.post('/forgot-password-request', forgotPasswordRequest);
router.post('/forgot-password-verify-otp', forgotPasswordVerify);
router.post('/forgot-password-update', forgotPasswordUpdate);
router.post('/contact-support', contactSupportInquiry);

export default router;