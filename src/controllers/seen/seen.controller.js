// src/controllers/seen/seen.controller
const {prisma} = require('../../utils/prisma');
const xss = require('xss');
const {seenMarkSchema} = require('../../validators/seen/seenMark.validator');
const {
  ensureItemExists,
  createSeenMark,
  listSeenMarks,
  getSeenMarkForItem
} = require('../../services/seen/seen.service');

// POST /items/:id/seen
async function postSeenMark(req, res, next) {
  try {
    const itemId = req.params.id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({
      success: false,
      error: {code: 'UNAUTHORIZED', message: 'Login required'}
    });

    const exists = await ensureItemExists(itemId);
    if (!exists) return res.status(404).json({
      success: false,
      error: {code: 'RESOURCE_NOT_FOUND', message: 'Item not found'}
    });

    const alreadySeen = await prisma.seenMark.findUnique({where: {itemId_userId: {itemId, userId}}});
    if (alreadySeen) return res.status(409).json({
      success: false,
      error: {code: 'DUPLICATE', message: 'Already marked as seen'}
    });

    const {body} = seenMarkSchema.parse(req.body);
    const sanitized = xss(body);

    const mark = await createSeenMark({itemId, userId, body: sanitized});
    return res.status(201).json({success: true, data: mark});
  } catch (err) {
    next(err);
  }
}

// GET /items/:id/seen
async function getSeenMarks(req, res, next) {
  try {
    const itemId = req.params.id;
    const exists = await ensureItemExists(itemId);
    if (!exists) return res.status(404).json({
      success: false,
      error: {code: 'RESOURCE_NOT_FOUND', message: 'Item not found'}
    });

    const marks = await listSeenMarks(itemId);
    return res.status(200).json({success: true, data: marks});
  } catch (err) {
    next(err);
  }
}

// GET /items/:itemId/seen/:seenMarkId
async function getSeenMarkById(req, res, next) {
  try {
    const { itemId, seenMarkId } = req.params;

    const mark = await getSeenMarkForItem(seenMarkId);
    if (!mark || mark.item?.id !== itemId) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Seen mark not found for this item' },
      });
    }

    return res.status(200).json({ success: true, data: mark });
  } catch (err) {
    next(err);
  }
}

module.exports = {postSeenMark, getSeenMarks, getSeenMarkById };
