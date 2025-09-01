const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController.js');
const categoriesRouter = require('../routes/categories/categories.router.js');

router.get('/', mainController.get);

router.get('/healthz/db', async (_req, res)=>{
    try{
        await prisma.$queryRaw`SELECT 1`;
        res.json ({ ok: true, db: true});
    } catch (e) {
        console.error('DB ping failed:', e?.message || e);
        res.status(500).json({ ok: false, error: 'DB_UNAVAILABLE' });
    }
})

// -> /api/v1/categories
router.use('/categories', categoriesRouter);

module.exports = router;