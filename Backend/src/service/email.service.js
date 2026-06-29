import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const createBrevoTransporter = () => {
  if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_KEY) {
    throw new Error("SMTP authentication credentials missing from environment variables.");
  }

  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 465,       
    secure: true,      
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_KEY,
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
  });
};

export const sendOtpEmail = async (email, firstName, otp) => {
  try {
    const transporter = createBrevoTransporter();

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

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("[SMTP OTP Error local catch]:", error.message);
    throw error; 
  }
};

export const forwardContactFormToBrevo = async (senderName, senderEmail, detailedMessage) => {
  try {
    const transporter = createBrevoTransporter();
    
    const targetReceiverEmail = process.env.SUPPORT_RECEIVER_EMAIL;

    const mailOptions = {
      from: `"CareOS Portal Gateway" <${process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN}>`,
      to: targetReceiverEmail,
      replyTo: `"${senderName}" <${senderEmail}>`,
      subject: `🚨 CareOS Enterprise Lead: Inquiry from ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #0f172a;">
          <h2 style="color: #0284c7; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-top: 0;">New Enterprise Request Registered</h2>
          <p style="font-size: 14px; color: #334155;">An inbound operational inquiry has crossed the CareOS Support Hub gateway node.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr style="background: #f8fafc;"><td style="padding: 10px; font-weight: bold; width: 30%;">Full Name:</td><td style="padding: 10px;">${senderName}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold;">Business Email:</td><td style="padding: 10px;"><a href="mailto:${senderEmail}">${senderEmail}</a></td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; font-weight: bold;">Timestamp:</td><td style="padding: 10px;">${new Date().toLocaleString()}</td></tr>
          </table>
          
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7; margin-top: 15px;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Detailed Message Content</h4>
            <p style="margin: 0; line-height: 1.6; color: #334155; white-space: pre-wrap;">${detailedMessage}</p>
          </div>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("[SMTP Contact Forward Error local catch]:", error.message);
    throw error;
  }
};

export const sendRescheduleNotificationEmail = async (email, firstName, doctorName, newDate, newTime) => {
  try {
    const transporter = createBrevoTransporter();

    const mailOptions = {
      from: `"${process.env.BREVO_SENDER_NAME || 'CareOS Notifications'}" <${process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN}>`,
      to: email,
      subject: "CareOS Portal: Your Appointment Has Been Rescheduled",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">CareOS Operational Updates</h2>
          <p style="color: #334155; font-size: 16px;">Hello <strong>${firstName}</strong>,</p>
          <p style="color: #334155; font-size: 16px;">This message confirms that your clinical consultation appointment profile timeline has been adjusted by our administration management team.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Practitioner:</strong> Dr. ${doctorName}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Revised Date:</strong> ${newDate}</p>
            <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Revised Time Interval Slot:</strong> ${newTime}</p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; font-style: italic; margin-top: 24px;">
            If you want to reschedule, you can reschedule at CareOS platform.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #334155; font-size: 15px;">Regards,<br/><strong>CareOS Scheduling Desk</strong></p>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("[SMTP Reschedule Notification Error local catch]:", error.message);
    throw error;
  }
};

export const sendAppointmentStatusEmail = async (email, firstName, doctorName, date, time, status) => {
  try {
    const transporter = createBrevoTransporter();
    
    const isConfirmed = status === 'confirmed';
    const isCancelled = status === 'cancelled';
    
    let subject = "CareOS Portal: Your Appointment Request Status Update";
    let statusText = "Declined / Unavailable";
    let statusBannerColor = "#dc2626";

    if (isConfirmed) {
      subject = "CareOS Portal: Your Appointment has been CONFIRMED";
      statusText = "Approved & Confirmed";
      statusBannerColor = "#16a34a";
    } else if (isCancelled) {
      subject = "CareOS Portal: Your Appointment Has Been Cancelled";
      statusText = "Cancelled Visit";
      statusBannerColor = "#64748b";
    }

    const mailOptions = {
      from: `"${process.env.BREVO_SENDER_NAME || 'CareOS Scheduling Desk'}" <${process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">CareOS Appointment Desk</h2>
          <p style="color: #334155; font-size: 16px;">Hello <strong>${firstName}</strong>,</p>
          <p style="color: #334155; font-size: 16px;">Your medical booking status parameters have been processed:</p>
          
          <div style="background-color: ${statusBannerColor}; color: white; padding: 12px; text-align: center; font-weight: bold; border-radius: 6px; font-size: 18px; margin: 20px 0;">
            Status: ${statusText}
          </div>

          <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Practitioner:</strong> Dr. ${doctorName}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Date Context:</strong> ${date}</p>
            <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Time Interval Slot:</strong> ${time}</p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; font-style: italic; margin-top: 24px;">
            If you want to adjust or schedule another session, you can reschedule at the CareOS platform.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #334155; font-size: 15px;">Regards,<br/><strong>CareOS Operations Hub</strong></p>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("[SMTP Status Update Notification Error local catch]:", error.message);
    throw error;
  }
};