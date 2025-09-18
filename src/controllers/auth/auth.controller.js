const { registerSchema } = require('../../validators/users/register.schema');
const { loginSchema } = require('../../validators/users/login.schema');
const { forgotPasswordSchema } = require('../../validators/users/forgotPassword.schema');
const { resetPasswordSchema } = require('../../validators/users/resetPassword.schema');
const { register, login, forgotPassword, resetPassword } = require('../../services/auth/auth.service');

// POST /auth/register
async function registerController(req, res, next) {
  try {
    const dto = registerSchema.parse(req.body);
    const result = await register(dto);
    return res.status(result.status).json({ ...result.body, meta: { requestId: req.id } });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: err.issues },
        meta: { requestId: req.id },
      });
    }
    next(err);
  }
}

// POST /auth/login
async function loginController(req, res, next) {
  try {
    const dto = loginSchema.parse(req.body);
    const result = await login(dto);
    return res.status(result.status).json({ ...result.body, meta: { requestId: req.id } });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: err.issues },
        meta: { requestId: req.id },
      });
    }
    next(err);
  }
}

// POST /auth/forgot-password
async function forgotPasswordController(req, res, next) {
  try {
    const dto = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(dto);
    return res.status(result.status).json({ ...result.body, meta: { requestId: req.id } });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: err.issues },
        meta: { requestId: req.id },
      });
    }
    next(err);
  }
}

// POST /auth/reset-password
async function resetPasswordController(req, res, next) {
  try {
    const dto = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(dto);
    return res.status(result.status).json({ ...result.body, meta: { requestId: req.id } });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: err.issues },
        meta: { requestId: req.id },
      });
    }
    next(err);
  }
}

// GET /auth/me (protected)
async function meController(req, res) {
  return res.status(200).json({
    success: true,
    data: { user: req.user },
    meta: { requestId: req.id },
  });
}

module.exports = {
  registerController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  meController,
};
