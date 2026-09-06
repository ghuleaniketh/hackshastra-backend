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
 * Send confirmed Trainer Pass with card PNG / PDF attachments directly to the user
 */
export const sendPassEmail = async ({
  to,
  fullName,
  eventTitle = 'Beyond the Screen',
  passId,
  pokemonName = 'Starter Partner',
  imageDataUrl,
  pdfDataUrl,
}) => {
  try {
    const activeTransporter = createTransporter();
    
    const attachments = [];

    // Attach PNG Card if provided
    if (imageDataUrl && imageDataUrl.startsWith('data:image/')) {
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      attachments.push({
        filename: `${(fullName || 'Trainer').replace(/\s+/g, '_')}_Trainer_Card.png`,
        content: Buffer.from(base64Data, 'base64'),
        cid: 'trainerCardImg', // embeddable inline in html
      });
    }

    // Attach PDF Pass if provided
    if (pdfDataUrl && pdfDataUrl.startsWith('data:application/pdf')) {
      const base64Pdf = pdfDataUrl.replace(/^data:application\/pdf;base64,/, '');
      attachments.push({
        filename: `${(fullName || 'Trainer').replace(/\s+/g, '_')}_Beyond_The_Screen_Pass.pdf`,
        content: Buffer.from(base64Pdf, 'base64'),
        contentType: 'application/pdf',
      });
    }

    const mailOptions = {
      from: env.MAIL_FROM,
      to,
      subject: `🎮 Your Official Trainer Pass for ${eventTitle} [PASS #${passId || 'CONFIRMED'}] — HackShastra`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #EF4444; border-radius: 16px; background-color: #0A0F14; color: #FFFFFF;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #EF4444, #DC2626); color: #FFFFFF; font-weight: 900; font-size: 13px; padding: 6px 18px; border-radius: 9999px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
              OFFICIAL ARENA PASS
            </div>
            <h1 style="color: #FBBF24; margin: 16px 0 4px 0; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
              ${eventTitle}
            </h1>
            <p style="color: #94A3B8; font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">
              SRM UNIVERSITY-AP • CV 402 • 16 SEP 2026 (2:30 PM)
            </p>
          </div>

          <div style="background-color: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #38BDF8; margin: 0 0 12px 0; font-size: 16px;">Welcome aboard, Trainer ${fullName || 'Challenger'}!</h3>
            <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
              Your Pokédex registration has been confirmed! Your official partner Pokémon <strong>${pokemonName}</strong> is synchronized with your entry pass.
            </p>
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px dashed #F59E0B; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-weight: bold; color: #FDE68A;">
              PASS ID: <span style="font-family: monospace; letter-spacing: 2px;">${passId || 'BTS-CONFIRMED'}</span>
            </div>
          </div>

          ${
            attachments.some((a) => a.cid === 'trainerCardImg')
              ? `
            <div style="text-align: center; margin: 24px 0;">
              <p style="color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Collectible Partner Card</p>
              <img src="cid:trainerCardImg" alt="Trainer Card" style="max-width: 320px; width: 100%; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 12px 30px rgba(0,0,0,0.8);" />
            </div>
          `
              : ''
          }

          <div style="background-color: #1E293B; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 13px; color: #94A3B8; line-height: 1.5;">
            <strong style="color: #F1F5F9;">📎 Attached to this email:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 20px;">
              ${attachments.map((a) => `<li><strong>${a.filename}</strong></li>`).join('')}
            </ul>
            <p style="margin: 8px 0 0 0; font-size: 12px;">Please present your QR pass (either on your phone or printed) at the entrance of CV 402 on event day.</p>
          </div>

          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 24px 0 16px 0;" />
          <p style="font-size: 11px; color: #64748B; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} HackShastra SRM-AP Chapter • Beyond The Screen Operations
          </p>
        </div>
      `,
      attachments,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Trainer pass email dispatched to ${to}`, { messageId: info.messageId, passId });
    return info;
  } catch (error) {
    logger.error(`Failed to send pass email to ${to}:`, error);
    throw error;
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
 * Send 6-digit verification OTP email to contact sender
 */
export const sendContactOtpEmail = async ({ to, otp }) => {
  try {
    const activeTransporter = createTransporter();
    const mailOptions = {
      from: env.MAIL_FROM,
      to,
      subject: `${otp} is your HackShastra Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px; background-color: #FFFFFF;">
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0DA5F0; margin: 0; font-size: 20px; font-weight: bold;">HACKSHASTRA SRM-AP</h2>
            <span style="color: #64748B; font-size: 12px; text-transform: uppercase;">Security Verification</span>
          </div>
          
          <p style="color: #334155; font-size: 14px; line-height: 1.5;">
            You are sending a contact message to the HackShastra community. Please use the following One-Time Password (OTP) to verify your email address:
          </p>

          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background-color: #F8FAFC; border: 2px dashed #0DA5F0; border-radius: 6px; padding: 14px 28px; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #090D12; font-family: monospace;">
              ${otp}
            </div>
          </div>

          <p style="color: #64748B; font-size: 12px; line-height: 1.4;">
            ⏱ This OTP is valid for <strong>10 minutes</strong>. If you did not request this verification, please safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0 16px 0;" />
          <p style="font-size: 11px; color: #94A3B8; margin: 0;">
            © ${new Date().getFullYear()} HackShastra SRM-AP Chapter • Secure Dispatch System
          </p>
        </div>
      `,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Contact OTP email dispatched to ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send contact OTP to ${to}:`, error);
    throw error;
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

/**
 * Send 6-digit verification OTP email for Event Registration (Pokemon / Beyond the Screen theme)
 */
export const sendRegistrationOtpEmail = async ({ to, fullName, otp, eventTitle = 'Beyond the Screen' }) => {
  try {
    const activeTransporter = createTransporter();
    const mailOptions = {
      from: env.MAIL_FROM,
      to,
      subject: `[${otp}] Your Trainer Verification Code for ${eventTitle} — HackShastra`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 2px solid #EF4444; border-radius: 12px; background-color: #0A0F14; color: #FFFFFF;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #DC2626; color: #FFFFFF; font-weight: 900; font-size: 13px; padding: 4px 14px; border-radius: 20px; letter-spacing: 2px; text-transform: uppercase;">
              POKÉDEX V2.4 SECURITY
            </div>
            <h2 style="color: #F59E0B; margin: 12px 0 4px 0; font-size: 22px; font-weight: bold; text-transform: uppercase;">
              ${eventTitle}
            </h2>
            <p style="color: #94A3B8; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
              SRM University-AP Trainer Pass Verification
            </p>
          </div>
          
          <p style="color: #E2E8F0; font-size: 14px; line-height: 1.6;">
            Trainer ${fullName ? `<strong>${fullName}</strong>` : ''},
          </p>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
            Your Pokédex requested an authentication sync code to lock in your Trainer Card and starter companion for <strong>${eventTitle}</strong>. Enter the 6-digit code below into your Pokédex terminal:
          </p>

          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background-color: #1E293B; border: 2px solid #F59E0B; border-radius: 8px; padding: 14px 28px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #FDE68A; font-family: monospace; box-shadow: 0 0 20px rgba(245,158,11,0.25);">
              ${otp}
            </div>
          </div>

          <p style="color: #94A3B8; font-size: 12px; line-height: 1.4; text-align: center;">
            ⏱ This Trainer OTP is valid for <strong>10 minutes</strong>. Do not share this code with rival Trainers.
          </p>

          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 24px 0 16px 0;" />
          <p style="font-size: 11px; color: #64748B; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} HackShastra SRM-AP Chapter • Arena Operations
          </p>
        </div>
      `,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Registration OTP email dispatched to ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send registration OTP to ${to}:`, error);
    throw error;
  }
};

