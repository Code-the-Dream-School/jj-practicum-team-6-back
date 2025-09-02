const { verifyAccessToken } = require('../utils/token');
const { prisma } = require('../utils/prisma');

/**
 * Require JWT auth via "Authorization: Bearer <token>"
 * - verifies token
 * - loads user from DB
 * - attaches sanitized user to req.user
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' '); // "Bearer <token>"

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' },
        meta: { requestId: req.id },
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (e) {
      const message = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message },
        meta: { requestId: req.id },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
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

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not found' },
        meta: { requestId: req.id },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
