const express = require('express');
const {
  registerController,
  loginController,
  meController,
  forgotPasswordController,
  resetPasswordController,
} = require('../../controllers/auth/auth.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.get('/me', requireAuth, meController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

module.exports = router;
