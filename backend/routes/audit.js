const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.use(protect);
// TODO: Add audit routes
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'audit endpoint' }));
module.exports = router;
