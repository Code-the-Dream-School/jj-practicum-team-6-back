// User profile routes
const router = require('express').Router();

const {requireAuth} = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { updateProfileBodySchema } = require('../../validators/users/updateProfile.schema');
const usersController = require('../../controllers/users/users.controller');
const avatarUpload = require('../../middleware/avatarUpload');

// GET /api/v1/users/self
router.get('/self', requireAuth, usersController.getSelf);

// PATCH /api/v1/users/self
router.patch('/self', requireAuth, validate({ body: updateProfileBodySchema }), usersController.updateSelf);

// POST /api/v1/users/self/avatar
router.post('/self/avatar', requireAuth, avatarUpload, usersController.uploadAvatar);

// DELETE /api/v1/users/self/avatar
router.delete('/self/avatar', requireAuth, usersController.deleteAvatar);

module.exports = router;
