import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bulletproof ES Module resolution pointing straight to your root .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const sendOtpEmail = async (email, firstName, otp) => {
  try {
    // Safety check: ensure variables are completely loaded before opening socket channels
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_KEY) {
      throw new Error("SMTP credentials missing from environment variables");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // TLS requires secure to be false for port 587
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });

    const mailOptions = {
      from: `"${process.env.BREVO_SENDER_NAME || 'CareOS Security'}" <${process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN}>`,
      to: email,
      subject: "CareOS Account Verification",
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;">
          <h2 style="color:#0f172a;margin-bottom:16px;">Welcome to CareOS</h2>
          <p style="color:#334155;font-size:16px;">Hello ${firstName},</p>
          <p style="color:#334155;font-size:16px;">Your security verification code is:</p>
          <div style="background-color:#f1f5f9;padding:12px;text-align:center;border-radius:6px;margin:20px 0;">
            <h1 style="color:#0284c7;letter-spacing:4px;margin:0;font-size:32px;">${otp}</h1>
          </div>
          <p style="color:#64748b;font-size:14px;">This OTP code will expire in <strong>10 minutes</strong>.</p>
          <p style="color:#334155;font-size:16px;margin-top:24px;">Regards,<br/><strong>CareOS Security Team</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Email sent! ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[SMTP Error local catch]:", error.message);
    throw error; // Passes the structural message up to your controllers cleanly
  }
};