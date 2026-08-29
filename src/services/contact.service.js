import { query } from '../lib/database.js';
import { sendContactNotification } from './email.service.js';

export const submitContactRequest = async (contactData) => {
  const { name, email, subject, message } = contactData;

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

  const result = await query(sql, [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]);
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
