const bcrypt = require('bcryptjs');
const { prisma } = require('../../utils/prisma');
const env = require('../../config/env');
const { signAccessToken } = require('../../utils/token');

// Keep digits, allow leading plus
function normalizePhone(p) {
  return String(p || '').replace(/(?!^\+)[^\d]/g, '');
}

async function register(dto) {
  const {
    email,
    password,
    firstName,
    lastName,
    zipCode,
    phoneNumber, // optional
    avatarUrl,   // optional
  } = dto;

  const emailNorm = String(email).trim().toLowerCase();

  // Uniqueness
  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
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

  const dbUser = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (!dbUser) {
    return {
      status: 401,
      body: { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
    };
  }

  const ok = await bcrypt.compare(password, dbUser.password);
  if (!ok) {
    return {
      status: 401,
      body: { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
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

module.exports = { register, login };
