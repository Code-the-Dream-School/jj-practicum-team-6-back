// src/services/auth/auth.service.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../../utils/prisma');
const env = require('../../config/env');
const { signAccessToken } = require('../../utils/token');
const { sendResetEmail } = require('../../utils/mailer');


// Keep digits, allow leading plus
function normalizePhone(p) {
  return String(p || '').replace(/(?!^\+)[^\d]/g, '');
}

// Generate random token and its SHA-256 hash (do not store raw token)
function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

// Build frontend URL strictly from CORS_ORIGINS
function getFrontendUrl() {
  const cors = process.env.CORS_ORIGINS;
  if (!cors) throw new Error('CORS_ORIGINS must be configured');
  const first = cors
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (!first) throw new Error('CORS_ORIGINS is empty');
  return first.replace(/\/+$/, '');
}

// Token TTL in minutes; default 30 if not provided
function getResetTtlMin() {
  const n = Number(process.env.RESET_TOKEN_TTL_MIN);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

async function register(dto) {
  const { email, password, firstName, lastName, zipCode, phoneNumber, avatarUrl } = dto;

  const emailNorm = String(email).trim().toLowerCase();

  // Uniqueness (case-insensitive)
  const existing = await prisma.user.findFirst({
    where: { email: { equals: emailNorm, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) {
    return {
      status: 409,
      body: { success: false, error: { code: 'EMAIL_TAKEN', message: 'Email is already in use' } },
    };
  }

  // Hash password
  const salt = await bcrypt.genSalt(env.security.bcryptSaltRounds);
  const passwordHash = await bcrypt.hash(password, salt);

  // Normalize optional phone
  const normalizedPhone =
    phoneNumber && phoneNumber.length ? normalizePhone(phoneNumber) : undefined;

  // Create user
  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      password: passwordHash,
      firstName,
      lastName,
      zipCode,
      phoneNumber: normalizedPhone,
      avatarUrl,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      zipCode: true,
      phoneNumber: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const accessToken = signAccessToken({ sub: user.id });

  return { status: 201, body: { success: true, data: { user, accessToken } } };
}

/**
 * Login
 * - find user by email
 * - compare password
 * - return public user + token
 */
async function login({ email, password }) {
  const emailNorm = String(email).trim().toLowerCase();

  // Case-insensitive lookup
  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: emailNorm, mode: 'insensitive' } },
  });
  if (!dbUser) {
    return {
      status: 401,
      body: {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
    };
  }

  const ok = await bcrypt.compare(password, dbUser.password);
  if (!ok) {
    return {
      status: 401,
      body: {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
    };
  }

  const user = {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    zipCode: dbUser.zipCode,
    phoneNumber: dbUser.phoneNumber,
    avatarUrl: dbUser.avatarUrl,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };

  const accessToken = signAccessToken({ sub: user.id });

  return { status: 200, body: { success: true, data: { user, accessToken } } };
}

// Always 200. If user exists: create one-time token (store hash) and log the link (dev).
async function forgotPassword({ email }) {
  const emailNorm = String(email).trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: { email: { equals: emailNorm, mode: 'insensitive' } },
    select: { id: true, email: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (user) {
    const { token, tokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + getResetTtlMin() * 60 * 1000);

    // Invalidate any active tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    // Store new token hash
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // Build link to frontend reset page
    const link = `${getFrontendUrl()}/reset-password?token=${token}`;

    // Send email (Nodemailer Ethereal: logs a preview URL)
    try {
      await sendResetEmail(user.email, link);
    } catch (e) {
      console.error('[MAIL] send failed:', e.message);
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      data: { message: 'If the email exists, we have sent reset instructions.' },
    },
  };
}


// Validate token by hash, update password, mark token used, invalidate others
async function resetPassword({ token, password }) {
  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return {
      status: 400,
      body: {
        success: false,
        error: { code: 'INVALID_OR_EXPIRED', message: 'This link is invalid or expired.' },
      },
    };
  }

  const salt = await bcrypt.genSalt(env.security.bcryptSaltRounds);
  const newHash = await bcrypt.hash(String(password), salt);

  await prisma.user.update({
    where: { id: record.userId },
    data: { password: newHash },
  });

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    }),
  ]);

  return {
    status: 200,
    body: { success: true, data: { message: 'Password has been updated. You can now log in.' } },
  };
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
