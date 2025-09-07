// src/routes/uploads/uploads.router.js
const express = require('express');
const { getUploadSignature } = require('../../controllers/uploads/uploads.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

// POST /api/v1/uploads/signature
router.post('/signature', requireAuth, getUploadSignature);

module.exports = router;
