
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { transaction, query } from '../lib/database.js';
import { generateVerificationToken, hashToken } from '../utils/token.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { sendVerificationEmail, sendConfirmationEmail, sendRegistrationOtpEmail, sendPassEmail } from './email.service.js';

// In-memory store for registration OTPs (with expiry and rate limiting)
const registrationOtpStore = new Map();

// Periodic cleanup of expired registration OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of registrationOtpStore.entries()) {
    if (value.expiresAt < now) {
      registrationOtpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate and dispatch 6-digit OTP for Event Registration
 */
export const requestRegistrationOtp = async ({ email, fullName, eventId = 'beyond-the-screen' }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    const err = new Error('Please provide a valid email address');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Enforce @srmap.edu.in domain
  if (!normalizedEmail.endsWith('@srmap.edu.in')) {
    const err = new Error('Registration is exclusive to SRM University-AP students. Email must end with @srmap.edu.in');
    err.statusCode = 400;
    throw err;
  }

  // Check duplicate registration in database beforehand
  const dupRes = await query(
    `SELECT r.id, r.status, e.title as event_title 
     FROM registrations r
     JOIN events e ON r.event_id = e.id
     WHERE (e.id::text = $1 OR e.slug = $1) AND r.email = $2`,
    [eventId, normalizedEmail]
  );

  if (dupRes.rows.length > 0) {
    const err = new Error('You have already registered for this event with this email address!');
    err.statusCode = 409;
    throw err;
  }

  // Rate-limit check (minimum 45 seconds between OTP requests per email)
  const existing = registrationOtpStore.get(normalizedEmail);
  if (existing && existing.lastRequestedAt && Date.now() - existing.lastRequestedAt < 45000) {
    const waitSec = Math.ceil((45000 - (Date.now() - existing.lastRequestedAt)) / 1000);
    const err = new Error(`Please wait ${waitSec}s before requesting a new OTP`);
    err.statusCode = 429;
    throw err;
  }

  // Generate 6-digit cryptographic OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  registrationOtpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
    lastRequestedAt: Date.now(),
    verified: false,
  });

  const mailResult = await sendRegistrationOtpEmail({
    to: normalizedEmail,
    fullName: fullName ? fullName.trim() : 'Trainer',
    otp,
    eventTitle: 'Beyond the Screen',
  });

  if (mailResult && mailResult.success === false && mailResult.provider === 'none') {
    const err = new Error(mailResult.error || 'Email delivery failed. Could not dispatch OTP verification code.');
    err.statusCode = 500;
    throw err;
  }

  return {
    email: normalizedEmail,
    expiresIn: 600, // seconds
  };
};

/**
 * Verify 6-digit registration OTP
 */
export const verifyRegistrationOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    const err = new Error('Email and OTP code are required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = registrationOtpStore.get(normalizedEmail);

  if (!record) {
    const err = new Error('OTP has expired or was not requested. Please request a new verification code.');
    err.statusCode = 400;
    throw err;
  }

  if (Date.now() > record.expiresAt) {
    registrationOtpStore.delete(normalizedEmail);
    const err = new Error('OTP code has expired. Please request a new code.');
    err.statusCode = 400;
    throw err;
  }

  if (record.attempts >= 5) {
    registrationOtpStore.delete(normalizedEmail);
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

  // Mark verified
  record.verified = true;

  // Generate a temporary signed verification token valid for 30 minutes
  const verificationProofToken = jwt.sign(
    { email: normalizedEmail, type: 'registration_otp_verified' },
    env.JWT_SECRET || 'hackshastra-registration-secret',
    { expiresIn: '30m' }
  );

  return {
    email: normalizedEmail,
    verified: true,
    verificationProofToken,
  };
};

export const registerParticipant = async (eventId, registrationData) => {
  const normalizedEmail = (registrationData.email || '').trim().toLowerCase();

  // Enforce @srmap.edu.in domain
  if (!normalizedEmail.endsWith('@srmap.edu.in')) {
    const err = new Error('Registration is exclusive to SRM University-AP students. Email must end with @srmap.edu.in');
    err.statusCode = 400;
    throw err;
  }

  // Check if email OTP verification was completed (if otp or otpToken is supplied or verified in memory)
  const otpRecord = registrationOtpStore.get(normalizedEmail);
  const isOtpVerified = Boolean(
    registrationData.otpVerified ||
    (otpRecord && otpRecord.verified) ||
    (registrationData.verificationProofToken && (() => {
      try {
        const decoded = jwt.verify(registrationData.verificationProofToken, env.JWT_SECRET || 'hackshastra-registration-secret');
        return decoded.email === normalizedEmail;
      } catch {
        return false;
      }
    })())
  );

  const result = await transaction(async (client) => {
    // 1. Lock and check event existence, status, registration enabled & capacity (supports UUID or slug)
    const eventRes = await client.query(
      `SELECT id, title, slug, registration_enabled, registration_deadline, capacity, status 
       FROM events 
       WHERE id::text = $1 OR slug = $1 FOR UPDATE`,
      [eventId]
    );

    if (eventRes.rows.length === 0) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const event = eventRes.rows[0];
    const resolvedEventId = event.id;

    if (event.status !== 'PUBLISHED') {
      const err = new Error('Registrations are not open for this event');
      err.statusCode = 400;
      throw err;
    }

    if (!event.registration_enabled) {
      const err = new Error('Registration for this event has been disabled');
      err.statusCode = 400;
      throw err;
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      const err = new Error('Registration deadline for this event has passed');
      err.statusCode = 400;
      throw err;
    }

    // 2. Check duplicate registration
    const dupRes = await client.query(
      `SELECT id, status FROM registrations WHERE event_id = $1 AND email = $2`,
      [resolvedEventId, normalizedEmail]
    );

    if (dupRes.rows.length > 0) {
      const err = new Error('You have already registered for this event with this email address');
      err.statusCode = 409;
      throw err;
    }

    // 3. Check current VERIFIED capacity under lock
    const capRes = await client.query(
      `SELECT COUNT(*) AS count FROM registrations WHERE event_id = $1 AND status = 'VERIFIED'`,
      [resolvedEventId]
    );
    const verifiedCount = parseInt(capRes.rows[0].count, 10);

    if (verifiedCount >= event.capacity) {
      const err = new Error('Event has reached maximum capacity');
      err.statusCode = 400;
      throw err;
    }

    // Extract fields with camelCase / snake_case fallbacks
    const fullName = registrationData.fullName || registrationData.name || '';
    const studentId = registrationData.studentId || registrationData.student_id || null;
    const gender = registrationData.gender || null;
    const department = registrationData.department || null;
    const favouritePokemon = registrationData.favouritePokemon || registrationData.favourite_pokemon || null;
    const participationInterest = registrationData.participationInterest || registrationData.participation_interest || null;
    const phone = registrationData.phone || registrationData.contactNumber || null;

    // Status: if OTP was verified, directly confirm registration as VERIFIED!
    const registrationStatus = isOtpVerified ? 'VERIFIED' : 'PENDING_VERIFICATION';
    const verifiedAt = isOtpVerified ? new Date() : null;

    // Generate token if not verified yet
    const { rawToken, tokenHash } = generateVerificationToken();
    const expiryHours = env.VERIFICATION_TOKEN_EXPIRES_HOURS || 24;
    const expiresAt = isOtpVerified ? null : new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // 4. Insert registration record into database
    const insertRes = await client.query(
      `INSERT INTO registrations (
        event_id, full_name, email, phone, college, organization, year,
        student_id, gender, department, favourite_pokemon, participation_interest,
        additional_information, status, verification_token_hash, verification_token_expires_at, verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, event_id, full_name, email, phone, college, organization, year, student_id, gender, department, favourite_pokemon, participation_interest, additional_information, status, verified_at, created_at`,
      [
        resolvedEventId,
        fullName.trim(),
        normalizedEmail,
        phone ? phone.trim() : null,
        registrationData.college ? registrationData.college.trim() : 'SRM University-AP',
        registrationData.organization ? registrationData.organization.trim() : null,
        registrationData.year ? registrationData.year.trim() : null,
        studentId ? String(studentId).trim() : null,
        gender ? String(gender).trim() : null,
        department ? String(department).trim() : null,
        favouritePokemon ? String(favouritePokemon).trim() : null,
        participationInterest ? String(participationInterest).trim() : null,
        registrationData.additionalInformation ? registrationData.additionalInformation.trim() : null,
        registrationStatus,
        isOtpVerified ? null : tokenHash,
        expiresAt,
        verifiedAt,
      ]
    );

    const verificationUrl = `${env.CLIENT_URL || 'http://localhost:3000'}/registrations/verify/${rawToken}`;

    return {
      registration: insertRes.rows[0],
      rawToken,
      verificationUrl,
      eventTitle: event.title,
      isVerifiedDirectly: isOtpVerified,
    };
  });

  // Clean up in-memory OTP store
  registrationOtpStore.delete(normalizedEmail);

  // If verified directly via OTP, immediately dispatch official pass email directly to student's inbox
  if (result.isVerifiedDirectly) {
    const passId = `BTS-${String(result.registration.id).slice(0, 8).toUpperCase()}`;
    sendPassEmail({
      to: result.registration.email,
      fullName: result.registration.full_name,
      eventTitle: result.eventTitle || 'Beyond the Screen',
      passId,
      pokemonName: result.registration.favourite_pokemon || 'Starter Partner',
    })
      .then(() => {
        logger.info(`[SERVER PASS DISPATCH] Automatically dispatched pass email to ${result.registration.email} (${passId})`);
      })
      .catch((err) => {
        logger.error('[SERVER PASS DISPATCH] Failed to dispatch pass email on registration:', err);
      });
  } else {
    // If not verified via OTP, send verification link email
    sendVerificationEmail({
      to: result.registration.email,
      fullName: result.registration.full_name,
      eventTitle: result.eventTitle,
      verificationUrl: result.verificationUrl,
    }).catch((err) => {
      logger.error('[SERVER VERIFY DISPATCH] Failed to send verification email:', err);
    });
  }

  return result;
};

export const verifyRegistrationToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    const err = new Error('Invalid token format');
    err.statusCode = 400;
    throw err;
  }

  const tokenHash = hashToken(rawToken);

  const result = await transaction(async (client) => {
    // 1. Fetch registration by token hash with row lock
    const regRes = await client.query(
      `SELECT r.*, e.title as event_title 
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.verification_token_hash = $1 FOR UPDATE`,
      [tokenHash]
    );

    if (regRes.rows.length === 0) {
      const err = new Error('Invalid or expired verification token');
      err.statusCode = 400;
      throw err;
    }

    const reg = regRes.rows[0];

    if (reg.status === 'VERIFIED') {
      return {
        alreadyVerified: true,
        registration: {
          id: reg.id,
          eventId: reg.event_id,
          eventTitle: reg.event_title,
          fullName: reg.full_name,
          email: reg.email,
          status: reg.status,
          verifiedAt: reg.verified_at,
        },
      };
    }

    if (reg.status !== 'PENDING_VERIFICATION') {
      const err = new Error(`Registration status is ${reg.status} and cannot be verified`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Check token expiration
    if (new Date(reg.verification_token_expires_at) < new Date()) {
      const err = new Error('Verification token has expired');
      err.statusCode = 400;
      throw err;
    }

    // 3. Mark VERIFIED and clean up token fields
    const updateRes = await client.query(
      `UPDATE registrations 
       SET status = 'VERIFIED',
           verified_at = NOW(),
           verification_token_hash = NULL,
           verification_token_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, event_id, full_name, email, status, verified_at`,
      [reg.id]
    );

    // Send confirmed pass email upon link verification
    const passId = `BTS-${String(reg.id).slice(0, 8).toUpperCase()}`;
    sendPassEmail({
      to: reg.email,
      fullName: reg.full_name,
      eventTitle: reg.event_title || 'Beyond the Screen',
      passId,
      pokemonName: reg.favourite_pokemon || 'Starter Partner',
    })
      .then(() => {
        logger.info(`[SERVER PASS DISPATCH] Sent pass email after token verification to ${reg.email}`);
      })
      .catch((err) => {
        logger.error('[SERVER PASS DISPATCH] Failed to send pass email on token verification:', err);
      });

    return {
      alreadyVerified: false,
      registration: {
        ...updateRes.rows[0],
        eventTitle: reg.event_title,
      },
    };
  });

  return result;
};

/**
 * Dispatch Pass Card PNG & PDF directly to user's email (or regenerate server-side)
 */
export const dispatchPassEmail = async ({
  email,
  registrationId,
  fullName,
  eventTitle = 'Beyond the Screen',
  passId,
  pokemonName,
  imageDataUrl,
  pdfDataUrl,
}) => {
  let normalizedEmail = (email || '').trim().toLowerCase();
  let resolvedFullName = fullName ? fullName.trim() : '';
  let resolvedPassId = passId || '';
  let resolvedPokemon = pokemonName || '';
  let resolvedEventTitle = eventTitle || 'Beyond the Screen';

  // If email or other fields are missing, or if registrationId is provided, lookup from DB
  if ((!normalizedEmail || !resolvedFullName || !resolvedPassId || !resolvedPokemon) && (registrationId || normalizedEmail)) {
    try {
      const regRes = await query(
        `SELECT r.*, e.title as event_title 
         FROM registrations r
         LEFT JOIN events e ON r.event_id = e.id
         WHERE ${registrationId ? 'r.id::text = $1' : 'r.email = $1'}
         ORDER BY r.created_at DESC LIMIT 1`,
        [registrationId ? String(registrationId) : normalizedEmail]
      );

      if (regRes.rows.length > 0) {
        const reg = regRes.rows[0];
        normalizedEmail = normalizedEmail || reg.email;
        resolvedFullName = resolvedFullName || reg.full_name;
        resolvedEventTitle = reg.event_title || resolvedEventTitle;
        resolvedPassId = resolvedPassId || `BTS-${String(reg.id).slice(0, 8).toUpperCase()}`;
        resolvedPokemon = resolvedPokemon || reg.favourite_pokemon || 'Starter Partner';
      }
    } catch (dbErr) {
      logger.warn('[dispatchPassEmail] DB lookup fallback failed:', dbErr.message);
    }
  }

  if (!normalizedEmail) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }

  return await sendPassEmail({
    to: normalizedEmail,
    fullName: resolvedFullName || 'Trainer',
    eventTitle: resolvedEventTitle,
    passId: resolvedPassId || (registrationId ? `BTS-${String(registrationId).slice(0, 8).toUpperCase()}` : 'BTS-CONFIRMED'),
    pokemonName: resolvedPokemon || 'Starter Partner',
    imageDataUrl,
    pdfDataUrl,
  });
};

