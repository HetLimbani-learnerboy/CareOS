import { Router } from 'express';
import { signup, login, verifyOtp } from './auth.controller.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

export default router;