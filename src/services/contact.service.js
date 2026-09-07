import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { query } from '../lib/database.js';
import { sendContactNotification, sendContactOtpEmail } from './email.service.js';

// In-memory store for OTPs (with expiry and rate limiting)
const otpStore = new Map();

// Periodic cleanup of expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate and email 6-digit OTP for email verification
 */
export const requestContactOtp = async ({ email }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    const err = new Error('Please provide a valid email address');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Rate-limit check (minimum 45 seconds between OTP requests per email)
  const existing = otpStore.get(normalizedEmail);
  if (existing && existing.lastRequestedAt && Date.now() - existing.lastRequestedAt < 45000) {
    const waitSec = Math.ceil((45000 - (Date.now() - existing.lastRequestedAt)) / 1000);
    const err = new Error(`Please wait ${waitSec}s before requesting a new OTP`);
    err.statusCode = 429;
    throw err;
  }

  // Generate 6-digit cryptographic OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
    lastRequestedAt: Date.now(),
  });

  const mailResult = await sendContactOtpEmail({ to: normalizedEmail, otp });
  if (mailResult && mailResult.success === false && mailResult.provider === 'none') {
    const err = new Error(mailResult.error || 'Email service temporarily unavailable. Could not send OTP code.');
    err.statusCode = 500;
    throw err;
  }

  return {
    email: normalizedEmail,
    expiresIn: 600, // seconds
  };
};

/**
 * Verify 6-digit OTP and return a signed verification token
 */
export const verifyContactOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    const err = new Error('Email and OTP code are required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    const err = new Error('OTP has expired or was not requested. Please request a new code.');
    err.statusCode = 400;
    throw err;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    const err = new Error('OTP code has expired. Please request a new code.');
    err.statusCode = 400;
    throw err;
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    const err = new Error('Too many invalid attempts. Please request a new OTP.');
    err.statusCode = 429;
    throw err;
  }

  if (record.otp !== otp.trim()) {
    record.attempts += 1;
    const err = new Error('Invalid OTP code. Please check and try again.');
    err.statusCode = 400;
    throw err;
  }

  // Correct OTP! Clear from store and generate signed verification token valid for 30 minutes
  otpStore.delete(normalizedEmail);

  const verificationToken = jwt.sign(
    { email: normalizedEmail, purpose: 'contact_submission' },
    env.JWT_SECRET,
    { expiresIn: '30m' }
  );

  return {
    verified: true,
    email: normalizedEmail,
    verificationToken,
  };
};

/**
 * Submit contact request (requires valid verificationToken OR valid otp)
 */
export const submitContactRequest = async (contactData) => {
  const { name, email, subject, message, verificationToken } = contactData;

  if (!name || !name.trim()) {
    const err = new Error('Name is required');
    err.statusCode = 400;
    throw err;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    const err = new Error('Please provide a valid email address');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Validate verification token
  if (!verificationToken) {
    const err = new Error('Email verification required before sending. Please verify your OTP.');
    err.statusCode = 403;
    throw err;
  }

  try {
    const decoded = jwt.verify(verificationToken, env.JWT_SECRET);
    if (decoded.email !== normalizedEmail || decoded.purpose !== 'contact_submission') {
      const err = new Error('Verification token does not match the provided email address.');
      err.statusCode = 403;
      throw err;
    }
  } catch (jwtErr) {
    const err = new Error('Session verification expired or invalid. Please verify your email again.');
    err.statusCode = 403;
    throw err;
  }

  if (!subject || !subject.trim()) {
    const err = new Error('Subject is required');
    err.statusCode = 400;
    throw err;
  }

  if (!message || !message.trim()) {
    const err = new Error('Message content is required');
    err.statusCode = 400;
    throw err;
  }

  const sql = `
    INSERT INTO contact_requests (name, email, subject, message, status)
    VALUES ($1, $2, $3, $4, 'NEW')
    RETURNING id, name, email, subject, message, status, created_at
  `;

  const result = await query(sql, [name.trim(), normalizedEmail, subject.trim(), message.trim()]);
  const savedContact = result.rows[0];

  // Dispatch admin notification email asynchronously
  await sendContactNotification({
    name: savedContact.name,
    email: savedContact.email,
    subject: savedContact.subject,
    message: savedContact.message,
  });

  return savedContact;
};

