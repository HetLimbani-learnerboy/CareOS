import axios from 'axios';

export const verifyRecaptchaToken = async (token) => {
  try {
    if (!token) return false;

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("[reCAPTCHA Error]: RECAPTCHA_SECRET_KEY is missing from environment.");
      return false;
    }

    // Google requires application/x-www-form-urlencoded NOT JSON
    // This is the #1 reason reCAPTCHA works locally but fails on Vercel/cloud
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    if (!response.data.success) {
      const errorCodes = response.data['error-codes'] || [];
      console.error("[reCAPTCHA Failure] Error codes:", errorCodes);

      if (errorCodes.includes('invalid-input-secret')) {
        console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY is invalid or missing.");
      }
      if (errorCodes.includes('invalid-input-response')) {
        console.error("[reCAPTCHA] Token provided by frontend is invalid or expired.");
      }
      if (errorCodes.includes('timeout-or-duplicate')) {
        console.error("[reCAPTCHA] Token has already been used or has expired.");
      }
    }

    return response.data.success === true;
  } catch (error) {
    console.error("[reCAPTCHA Network Exception]:", error.message);
    return false;
  }
};