import dns from 'dns';
import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

// ===== TEMP DISABLED: Nodemailer & Mail Transporter Setup (commented out on 2026-09-08) =====
// let transporter = null;
// 
// const createTransporter = () => {
//   if (transporter) return transporter;
// 
//   if (process.env.NODE_ENV !== 'test' && env.SMTP_USER && env.SMTP_PASS) {
//     const ipv4Lookup = (hostname, options, callback) => {
//       dns.lookup(hostname, { family: 4 }, callback);
//     };
// 
//     if (env.SMTP_HOST.includes('gmail') || env.SMTP_USER.includes('gmail')) {
//       transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         lookup: ipv4Lookup,
//         auth: {
//           user: env.SMTP_USER,
//           pass: env.SMTP_PASS,
//         },
//         connectionTimeout: 5000,
//         greetingTimeout: 5000,
//         socketTimeout: 5000,
//       });
//       logger.info('Nodemailer Gmail SSL transporter (IPv4) initialized');
//     } else if (env.SMTP_HOST) {
//       transporter = nodemailer.createTransport({
//         host: env.SMTP_HOST,
//         port: env.SMTP_PORT,
//         secure: env.SMTP_PORT === 465,
//         lookup: ipv4Lookup,
//         auth: {
//           user: env.SMTP_USER,
//           pass: env.SMTP_PASS,
//         },
//         connectionTimeout: 5000,
//         greetingTimeout: 5000,
//         socketTimeout: 5000,
//       });
//       logger.info('Nodemailer SMTP transporter initialized');
//     }
//   } else {
//     logger.warn('Using JSON stream transporter for development/testing.');
//     transporter = nodemailer.createTransport({
//       jsonTransport: true,
//     });
//   }
// 
//   return transporter;
// };
// ===== END TEMP DISABLED: Nodemailer & Mail Transporter Setup =====

/**
 * Universal mail dispatcher supporting Resend HTTPS API (never blocked on cloud) and SMTP fallback
 */
export const dispatchMail = async ({ to, subject, html, attachments = [] }) => {
  // ===== TEMP DISABLED: Universal mail dispatcher (commented out on 2026-09-08) =====
  // // 1. Preferred Cloud Delivery: Resend HTTPS API (only if valid production key is configured)
  // if (env.RESEND_API_KEY && !env.RESEND_API_KEY.includes('xxxx') && env.RESEND_API_KEY.startsWith('re_')) {
  //   try {
  //     const resendPayload = {
  //       from: env.MAIL_FROM || 'HackShastra <onboarding@resend.dev>',
  //       to: Array.isArray(to) ? to : [to],
  //       subject,
  //       html,
  //     };
  // 
  //     if (attachments && attachments.length > 0) {
  //       resendPayload.attachments = attachments.map((att) => ({
  //         filename: att.filename,
  //         content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
  //       }));
  //     }
  // 
  //     const res = await fetch('https://api.resend.com/emails', {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${env.RESEND_API_KEY}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(resendPayload),
  //     });
  // 
  //     const data = await res.json();
  //     if (!res.ok) {
  //       logger.error('Resend API returned error response:', data);
  //     } else {
  //       logger.info(`Email successfully dispatched via Resend HTTPS API to ${to}`, { id: data.id });
  //       return { success: true, messageId: data.id, provider: 'resend' };
  //     }
  //   } catch (resendErr) {
  //     logger.error('Resend HTTPS dispatch failed:', resendErr);
  //   }
  // }
  // 
  // // 2. Preferred Gmail/Universal Cloud Delivery: Brevo HTTPS API (Works on Railway, supports @gmail.com)
  // if (env.BREVO_API_KEY) {
  //   try {
  //     const brevoPayload = {
  //       sender: {
  //         name: 'HackShastra',
  //         email: env.SMTP_USER || 'supporthackshastra@gmail.com',
  //       },
  //       to: (Array.isArray(to) ? to : [to]).map((email) => ({ email })),
  //       subject,
  //       htmlContent: html,
  //     };
  // 
  //     if (attachments && attachments.length > 0) {
  //       brevoPayload.attachment = attachments.map((att) => ({
  //         name: att.filename,
  //         content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
  //       }));
  //     }
  // 
  //     const res = await fetch('https://api.brevo.com/v3/smtp/email', {
  //       method: 'POST',
  //       headers: {
  //         'api-key': env.BREVO_API_KEY,
  //         'Content-Type': 'application/json',
  //         accept: 'application/json',
  //       },
  //       body: JSON.stringify(brevoPayload),
  //     });
  // 
  //     const data = await res.json();
  //     if (!res.ok) {
  //       logger.error('Brevo API returned error response:', data);
  //     } else {
  //       logger.info(`Email successfully dispatched via Brevo HTTPS API to ${to}`, { messageId: data.messageId });
  //       return { success: true, messageId: data.messageId, provider: 'brevo' };
  //     }
  //   } catch (brevoErr) {
  //     logger.error('Brevo HTTPS dispatch failed:', brevoErr);
  //   }
  // }
  // 
  // // 3. SMTP Transport Fallback
  // try {
  //   const activeTransporter = createTransporter();
  //   const info = await activeTransporter.sendMail({
  //     from: env.MAIL_FROM,
  //     to,
  //     subject,
  //     html,
  //     attachments,
  //   });
  //   logger.info(`Email successfully dispatched via SMTP to ${to}`, { messageId: info.messageId });
  //   return { success: true, messageId: info.messageId, provider: 'smtp' };
  // } catch (smtpErr) {
  //   logger.warn(`SMTP delivery skipped or failed to ${to} (${smtpErr.message}).`);
  //   return { success: false, error: smtpErr.message, provider: 'none' };
  // }
  // ===== END TEMP DISABLED: Universal mail dispatcher =====

  logger.info(`[MAIL DISPATCH DISABLED] Suppressed mail dispatch to ${to} for subject "${subject}"`);
  return { success: true, emailDisabled: true, provider: 'disabled' };
};

/**
 * Send email verification link to participant
 */
export const sendVerificationEmail = async ({ to, fullName, eventTitle, verificationUrl }) => {
  // ===== TEMP DISABLED: Verification link email dispatch (commented out on 2026-09-08) =====
  // const html = `...`;
  // return await dispatchMail({
  //   to,
  //   subject: `Verify your registration for ${eventTitle} — HackShastra`,
  //   html,
  // });
  // ===== END TEMP DISABLED: Verification link email dispatch =====

  logger.info(`[VERIFICATION EMAIL DISABLED] Suppressed verification email to ${to}`);
  return { success: true, emailDisabled: true };
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
}) => {
  // ===== TEMP DISABLED: Trainer pass email dispatch (commented out on 2026-09-08) =====
  // const attachments = [];
  // const cleanPokemon = (pokemonName || '').toLowerCase().trim();
  // const resolvedPassId = passId || 'BTS-CONFIRMED';
  // ...
  // return await dispatchMail({
  //   to,
  //   subject: `Your Official Pass & Collectible Partner Card: ${eventTitle} — HackShastra`,
  //   html,
  //   attachments,
  // });
  // ===== END TEMP DISABLED: Trainer pass email dispatch =====

  logger.info(`[PASS EMAIL DISABLED] Suppressed pass email to ${to} (${passId || 'BTS'})`);
  return { success: true, emailDisabled: true };
};

/**
 * Send email verification confirmation after email is verified
 */
export const sendConfirmationEmail = async ({ to, fullName, eventTitle }) => {
  // ===== TEMP DISABLED: Confirmation email dispatch (commented out on 2026-09-08) =====
  // const html = `...`;
  // return await dispatchMail({
  //   to,
  //   subject: `Registration Confirmed: ${eventTitle} — HackShastra`,
  //   html,
  // });
  // ===== END TEMP DISABLED: Confirmation email dispatch =====

  logger.info(`[CONFIRMATION EMAIL DISABLED] Suppressed confirmation email to ${to}`);
  return { success: true, emailDisabled: true };
};

/**
 * Send 6-digit verification OTP email to contact sender
 */
export const sendContactOtpEmail = async ({ to, otp }) => {
  // ===== TEMP DISABLED: Contact OTP email dispatch (commented out on 2026-09-08) =====
  // logger.info(`[CONTACT OTP DISPATCH] Verification OTP for ${to}: ${otp}`);
  // const html = `...`;
  // return await dispatchMail({
  //   to,
  //   subject: `${otp} is your HackShastra Verification Code`,
  //   html,
  // });
  // ===== END TEMP DISABLED: Contact OTP email dispatch =====

  logger.info(`[CONTACT OTP EMAIL DISABLED] Suppressed contact OTP email to ${to}`);
  return { success: true, emailDisabled: true };
};

/**
 * Send contact notification to community admins
 */
export const sendContactNotification = async ({ name, email, subject, message }) => {
  // ===== TEMP DISABLED: Admin contact notification email dispatch (commented out on 2026-09-08) =====
  // const html = `...`;
  // return await dispatchMail({
  //   to: env.ADMIN_EMAIL,
  //   subject: `New Contact Request: ${subject}`,
  //   html,
  // });
  // ===== END TEMP DISABLED: Admin contact notification email dispatch =====

  logger.info(`[ADMIN CONTACT EMAIL DISABLED] Suppressed admin notification for ${email}`);
  return { success: true, emailDisabled: true };
};

/**
 * Send 6-digit verification OTP email for Event Registration (Pokemon / Beyond the Screen theme)
 */
export const sendRegistrationOtpEmail = async ({ to, fullName, otp, eventTitle = 'Beyond the Screen' }) => {
  // ===== TEMP DISABLED: Registration OTP email dispatch (commented out on 2026-09-08) =====
  // logger.info(`[REGISTRATION OTP DISPATCH] Verification OTP for ${to}: ${otp}`);
  // const html = `...`;
  // return await dispatchMail({
  //   to,
  //   subject: `[${otp}] Your Trainer Verification Code for ${eventTitle} — HackShastra`,
  //   html,
  // });
  // ===== END TEMP DISABLED: Registration OTP email dispatch =====

  logger.info(`[REGISTRATION OTP EMAIL DISABLED] Suppressed registration OTP email to ${to}`);
  return { success: true, emailDisabled: true };
};
