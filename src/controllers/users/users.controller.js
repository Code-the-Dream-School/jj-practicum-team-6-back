// User profile controller
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('../../config/cloudinary');

// helpers
function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  zipCode: true,
  avatarUrl: true,
  avatarPublicId: true,
  createdAt: true,
  updatedAt: true,
};

// GET /api/v1/users/self
async function getSelf(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
    });
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/users/self
async function updateSelf(req, res, next) {
  try {
    const { firstName, lastName, phoneNumber, zipCode } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phoneNumber, zipCode },
      select: userSelect,
    });

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/users/self/avatar
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      const e = new Error('No file uploaded');
      e.status = 422;
      e.code = 'UNPROCESSABLE_ENTITY';
      throw e;
    }

    const current = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarPublicId: true },
    });

    if (current?.avatarPublicId) {
      // best-effort delete
      await cloudinary.uploader.destroy(current.avatarPublicId).catch(() => {});
    }

    const result = await uploadBuffer(req.file.buffer, {
      folder: `avatars/users/${req.user.id}`,
      resource_type: 'image',
      overwrite: true,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }],
    });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.secure_url, avatarPublicId: result.public_id },
      select: userSelect,
    });

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/users/self/avatar
async function deleteAvatar(req, res, next) {
  try {
    const current = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarPublicId: true },
    });

    if (current?.avatarPublicId) {
      await cloudinary.uploader.destroy(current.avatarPublicId).catch(() => {});
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null, avatarPublicId: null },
      select: userSelect,
    });

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSelf,
  updateSelf,
  uploadAvatar,
  deleteAvatar,
};
