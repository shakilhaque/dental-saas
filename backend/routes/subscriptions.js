const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.use(protect);
// TODO: Add subscriptions routes
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'subscriptions endpoint' }));
module.exports = router;
