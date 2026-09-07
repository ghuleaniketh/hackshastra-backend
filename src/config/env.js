import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://scnixlbtctvxyebhxmwt.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  VERIFICATION_TOKEN_EXPIRES_HOURS: parseInt(process.env.VERIFICATION_TOKEN_EXPIRES_HOURS || '24', 10),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || 'HackShastra <supporthackshastra@gmail.com>',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'hssc2025@srmap.edu.in',
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
  CLOUDFLARE_ACCOUNT_HASH: process.env.CLOUDFLARE_ACCOUNT_HASH || '',
  JWT_SECRET: process.env.JWT_SECRET || 'hackshastra_dev_jwt_secret_key_2026_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  INITIAL_ADMIN_EMAILS: (process.env.INITIAL_ADMIN_EMAILS || 'hssc2025@srmap.edu.in,supporthackshastra@gmail.com,hackshastrasupport@gmail.com,admin@hackshastra.org,lead@hackshastra.org')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

export default env;
