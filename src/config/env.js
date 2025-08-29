require('dotenv').config();

// helpers
function toBool(v, def = false) {
  if (v === undefined) return def;
  const s = String(v).toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return def;
}
function toList(v) {
  return (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const env = {
  node: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8000),

  // CORS
  cors: {
    origins: toList(process.env.CORS_ORIGINS),
    credentials: toBool(process.env.CORS_CREDENTIALS, true),
  },

  // JWT 
  jwt: {
    secret: process.env.JWT_SECRET,
    lifetime: process.env.JWT_LIFETIME || '1h',
  },

  // bcrypt 
  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  },

  // DB
  db: {
    url: process.env.DATABASE_URL,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME,
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // FE
  frontend: {
    baseUrl: process.env.VITE_REACT_URL || 'http://127.0.0.1:8000/',
  },
};

// Check
if (!env.jwt.secret) throw new Error('Missing JWT_SECRET in .env');
if (!env.db.url) throw new Error('Missing DATABASE_URL in .env');

module.exports = env;
