const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.use(protect);
// TODO: Add treatments routes
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'treatments endpoint' }));
module.exports = router;
