import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    logger.info('Nodemailer SMTP transporter initialized');
  } else {
    logger.warn('SMTP settings not configured. Falling back to JSON stream transporter (console logging).');
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
};

/**
 * Send email verification link to participant
 */
export const sendVerificationEmail = async ({ to, fullName, eventTitle, verificationUrl }) => {
  try {
    const activeTransporter = createTransporter();
    const mailOptions = {
      from: env.MAIL_FROM,
      to,
      subject: `Verify your registration for ${eventTitle} — HackShastra`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4F46E5;">HackShastra Community</h2>
          <p>Hi <strong>${fullName}</strong>,</p>
          <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
          <p>Please click the button below to verify your email address and confirm your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Registration</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6B7280;"><a href="${verificationUrl}">${verificationUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9CA3AF;">If you did not request this registration, please ignore this email.</p>
        </div>
      `,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Verification email dispatched to ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send verification email to ${to}:`, error);
    // Silent fail / logged error to prevent breaking registration flow
    return null;
  }
};

/**
 * Send email verification confirmation after email is verified
 */
export const sendConfirmationEmail = async ({ to, fullName, eventTitle }) => {
  try {
    const activeTransporter = createTransporter();
    const mailOptions = {
      from: env.MAIL_FROM,
      to,
      subject: `Registration Confirmed: ${eventTitle} — HackShastra`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #10B981;">Registration Verified! 🎉</h2>
          <p>Hi <strong>${fullName}</strong>,</p>
          <p>Your email address has been successfully verified, and your registration for <strong>${eventTitle}</strong> is now officially confirmed.</p>
          <p>We look forward to having you with us!</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9CA3AF;">HackShastra Community Team</p>
        </div>
      `,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Confirmation email dispatched to ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send confirmation email to ${to}:`, error);
    return null;
  }
};

/**
 * Send contact notification to community admins
 */
export const sendContactNotification = async ({ name, email, subject, message }) => {
  try {
    const activeTransporter = createTransporter();
    const mailOptions = {
      from: env.MAIL_FROM,
      to: env.ADMIN_EMAIL,
      subject: `New Contact Request: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <h3>New Contact Request Submitted</h3>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #4F46E5;">
            ${message}
          </blockquote>
        </div>
      `,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Admin contact notification sent to ${env.ADMIN_EMAIL}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send contact notification:`, error);
    return null;
  }
};
