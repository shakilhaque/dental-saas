const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendMessage, getChatSession, getChatLogs } = require('../controllers/chatController');

// Public chat (with tenant context via subdomain header or query)
router.post('/message', sendMessage);

// Authenticated routes
router.use(protect);
router.get('/session/:sessionId', getChatSession);
router.get('/logs', authorize('clinic_admin', 'super_admin'), getChatLogs);

module.exports = router;
