const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Sign short-lived access token 
function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.lifetime });
}

// Verify and decode access token
function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { signAccessToken, verifyAccessToken };
