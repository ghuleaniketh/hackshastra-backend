import { transaction } from '../lib/database.js';
import { generateVerificationToken, hashToken } from '../utils/token.js';
import env from '../config/env.js';
import { sendVerificationEmail, sendConfirmationEmail } from './email.service.js';

export const registerParticipant = async (eventId, registrationData) => {
  const normalizedEmail = registrationData.email.trim().toLowerCase();

  const result = await transaction(async (client) => {
    // 1. Lock and check event existence, status, registration enabled & capacity
    const eventRes = await client.query(
      `SELECT id, title, registration_enabled, registration_deadline, capacity, status 
       FROM events 
       WHERE id = $1 FOR UPDATE`,
      [eventId]
    );

    if (eventRes.rows.length === 0) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const event = eventRes.rows[0];

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
      [eventId, normalizedEmail]
    );

    if (dupRes.rows.length > 0) {
      const err = new Error('You have already registered for this event with this email address');
      err.statusCode = 409;
      throw err;
    }

    // 3. Check current VERIFIED capacity under lock
    const capRes = await client.query(
      `SELECT COUNT(*) AS count FROM registrations WHERE event_id = $1 AND status = 'VERIFIED'`,
      [eventId]
    );
    const verifiedCount = parseInt(capRes.rows[0].count, 10);

    if (verifiedCount >= event.capacity) {
      const err = new Error('Event has reached maximum capacity');
      err.statusCode = 400;
      throw err;
    }

    // 4. Generate cryptographically secure token & expiry
    const { rawToken, tokenHash } = generateVerificationToken();
    const expiryHours = env.VERIFICATION_TOKEN_EXPIRES_HOURS || 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // 5. Insert registration record
    const insertRes = await client.query(
      `INSERT INTO registrations (
        event_id, full_name, email, phone, college, organization, year, additional_information,
        status, verification_token_hash, verification_token_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_VERIFICATION', $9, $10)
      RETURNING id, event_id, full_name, email, phone, college, organization, year, additional_information, status, created_at`,
      [
        eventId,
        registrationData.fullName.trim(),
        normalizedEmail,
        registrationData.phone ? registrationData.phone.trim() : null,
        registrationData.college ? registrationData.college.trim() : null,
        registrationData.organization ? registrationData.organization.trim() : null,
        registrationData.year ? registrationData.year.trim() : null,
        registrationData.additionalInformation ? registrationData.additionalInformation.trim() : null,
        tokenHash,
        expiresAt,
      ]
    );

    const verificationUrl = `${env.CLIENT_URL || 'http://localhost:3000'}/registrations/verify/${rawToken}`;

    return {
      registration: insertRes.rows[0],
      rawToken,
      verificationUrl,
      eventTitle: event.title,
    };
  });

  // Post-transaction email dispatch
  await sendVerificationEmail({
    to: result.registration.email,
    fullName: result.registration.full_name,
    eventTitle: result.eventTitle,
    verificationUrl: result.verificationUrl,
  });

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

    return {
      alreadyVerified: false,
      registration: {
        ...updateRes.rows[0],
        eventTitle: reg.event_title,
      },
    };
  });

  // If newly verified, dispatch confirmation email
  if (!result.alreadyVerified) {
    await sendConfirmationEmail({
      to: result.registration.email,
      fullName: result.registration.full_name,
      eventTitle: result.registration.eventTitle,
    });
  }

  return result;
};
