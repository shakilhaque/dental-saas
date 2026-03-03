const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.use(protect);
// TODO: Add users routes
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'users endpoint' }));
module.exports = router;
