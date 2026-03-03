const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Tenant = require('../models/Tenant');
const asyncHandler = require('../middleware/asyncHandler');

// Check subdomain availability
router.get('/check-subdomain/:subdomain', asyncHandler(async (req, res) => {
  const exists = await Tenant.findOne({ subdomain: req.params.subdomain.toLowerCase() });
  res.json({ available: !exists });
}));

// Get tenant by subdomain (public - for login page)
router.get('/by-subdomain/:subdomain', asyncHandler(async (req, res) => {
  const tenant = await Tenant.findOne({ subdomain: req.params.subdomain.toLowerCase() })
    .select('name logo email phone address workingHours settings');
  if (!tenant) return res.status(404).json({ success: false, error: 'Clinic not found' });
  res.json({ success: true, data: tenant });
}));

router.use(protect);

// Get my tenant
router.get('/me', authorize('clinic_admin'), asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.user.tenant);
  res.json({ success: true, data: tenant });
}));

// Update tenant settings
router.put('/me', authorize('clinic_admin'), asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'workingHours', 'appointmentDuration', 'settings', 'logo', 'website', 'timezone'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const tenant = await Tenant.findByIdAndUpdate(req.user.tenant, updates, { new: true, runValidators: true });
  res.json({ success: true, data: tenant });
}));

// Super admin: get all tenants
router.get('/', authorize('super_admin'), asyncHandler(async (req, res) => {
  const tenants = await Tenant.find().populate('owner', 'firstName lastName email');
  res.json({ success: true, data: tenants });
}));

module.exports = router;
