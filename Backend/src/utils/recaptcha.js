import axios from "axios";

/**
 * Validates a reCAPTCHA token against Google's verification servers.
 * @param {string} token - The g-recaptcha-response token from the client.
 * @returns {Promise<boolean>} - True if validation passes, otherwise false.
 */
export const verifyRecaptchaToken = async (token) => {
  try {
    if (!token) return false;

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("[reCAPTCHA Error]: RECAPTCHA_SECRET_KEY is missing from environment variables.");
      return false;
    }

    // Google expects a POST request targeting their verification server endpoint
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null, // No body payload needed as query parameters handle routing
      {
        params: {
          secret: secretKey,
          response: token,
        },
      }
    );

    return response.data.success === true;
  } catch (error) {
    console.error("[reCAPTCHA System Exception]:", error.message);
    return false;
  }
};