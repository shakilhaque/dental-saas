// routes/audit.routes.js
const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models/index');
const { protect, tenantScope, authorize } = require('../middleware/auth.middleware');

router.use(protect, tenantScope, authorize('admin','superadmin'));

router.get('/', async (req, res, next) => {
  try {
    const { resource, userId, action, page = 1, limit = 50 } = req.query;
    const query = { tenantId: req.tenantId };
    if (resource) query.resource = resource;
    if (userId)   query.userId   = userId;
    if (action)   query.action   = { $regex: action, $options: 'i' };
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(+limit),
      AuditLog.countDocuments(query)
    ]);
    res.json({ success: true, data: { logs, pagination: { total, page: +page, limit: +limit } } });
  } catch (err) { next(err); }
});

module.exports = router;
