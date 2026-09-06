import { query } from '../lib/database.js';
import { verifyFirebaseIdToken } from '../config/firebase.js';
import { generateToken } from '../utils/jwt.js';
import env from '../config/env.js';

export const googleLogin = async (idToken) => {
  // 1. Verify Firebase Google OAuth ID Token
  const firebaseUser = await verifyFirebaseIdToken(idToken);
  const normalizedEmail = firebaseUser.email.trim().toLowerCase();

  // 2. Check existing user in database
  const userCheckSql = `SELECT id, name, email, firebase_uid, picture, role, is_active FROM admins WHERE email = $1 OR firebase_uid = $2`;
  const existingUserRes = await query(userCheckSql, [normalizedEmail, firebaseUser.uid]);

  let user = null;

  if (existingUserRes.rows.length > 0) {
    user = existingUserRes.rows[0];

    if (!user.is_active) {
      const err = new Error('Your account has been deactivated. Please contact support.');
      err.statusCode = 403;
      throw err;
    }

    // Update user profile and last login timestamp
    const updateSql = `
      UPDATE admins 
      SET firebase_uid = $1,
          picture = COALESCE($2, picture),
          name = COALESCE($3, name),
          last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, email, firebase_uid, picture, role, is_active, last_login_at
    `;
    const updateRes = await query(updateSql, [firebaseUser.uid, firebaseUser.picture, firebaseUser.name, user.id]);
    user = updateRes.rows[0];
  } else {
    // 3. Create new user with role assignment (ADMIN if listed in INITIAL_ADMIN_EMAILS, else MEMBER)
    const assignedRole = env.INITIAL_ADMIN_EMAILS.includes(normalizedEmail) ? 'ADMIN' : 'MEMBER';

    const insertSql = `
      INSERT INTO admins (name, email, firebase_uid, picture, role, is_active, last_login_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING id, name, email, firebase_uid, picture, role, is_active, last_login_at
    `;
    const insertRes = await query(insertSql, [
      firebaseUser.name,
      normalizedEmail,
      firebaseUser.uid,
      firebaseUser.picture,
      assignedRole,
    ]);
    user = insertRes.rows[0];
  }

  // 4. Generate JWT session token
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      lastLoginAt: user.last_login_at,
    },
    token,
  };
};

export const directAdminLogin = async ({ email, name }) => {
  if (!email || !email.trim()) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Strict Whitelist Check (Only designated admin emails can access)
  const isEnvAdmin = env.INITIAL_ADMIN_EMAILS && env.INITIAL_ADMIN_EMAILS.includes(normalizedEmail);
  
  // 2. Check existing user in database
  const userCheckSql = `SELECT id, name, email, firebase_uid, picture, role, is_active FROM admins WHERE email = $1`;
  const existingUserRes = await query(userCheckSql, [normalizedEmail]);

  let user = null;

  if (existingUserRes.rows.length > 0) {
    user = existingUserRes.rows[0];

    if (!user.is_active) {
      const err = new Error('This admin account has been deactivated.');
      err.statusCode = 403;
      throw err;
    }

    if (user.role !== 'ADMIN' && !isEnvAdmin) {
      const err = new Error('Access denied. You do not have administrator permissions.');
      err.statusCode = 403;
      throw err;
    }
  } else {
    // Only create admin account if explicitly listed in admin whitelist
    if (!isEnvAdmin && !normalizedEmail.endsWith('@srmap.edu.in')) {
      const err = new Error(`Access restricted. Email ${normalizedEmail} is not registered in the administrator database.`);
      err.statusCode = 403;
      throw err;
    }

    const assignedRole = 'ADMIN';
    const insertSql = `
      INSERT INTO admins (name, email, firebase_uid, role, is_active, last_login_at)
      VALUES ($1, $2, $3, $4, true, NOW())
      RETURNING id, name, email, firebase_uid, picture, role, is_active, last_login_at
    `;
    const insertRes = await query(insertSql, [
      name ? name.trim() : 'Admin Leader',
      normalizedEmail,
      'admin_uid_' + Date.now(),
      assignedRole,
    ]);
    user = insertRes.rows[0];
  }

  // Generate real verified JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'ADMIN',
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role || 'ADMIN',
      lastLoginAt: user.last_login_at,
    },
    token,
  };
};

export const getUserProfile = async (userId) => {
  const sql = `SELECT id, name, email, firebase_uid, picture, role, is_active, created_at, last_login_at FROM admins WHERE id = $1`;
  const result = await query(sql, [userId]);
  if (result.rows.length === 0) {
    return null;
  }
  const user = result.rows[0];
  if (!user.is_active) {
    const err = new Error('Account is inactive');
    err.statusCode = 403;
    throw err;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
};
