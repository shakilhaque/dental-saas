const express = require('express');
const router = express.Router();
const { protect, authorize, tenantIsolation } = require('../middleware/auth');
const Service = require('../models/Service');
const asyncHandler = require('../middleware/asyncHandler');

router.use(protect, tenantIsolation);

router.get('/', asyncHandler(async (req, res) => {
  const services = await Service.find({ tenant: req.user.tenant, isActive: true });
  res.json({ success: true, data: services });
}));

router.post('/', authorize('clinic_admin'), asyncHandler(async (req, res) => {
  req.body.tenant = req.user.tenant;
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
}));

router.put('/:id', authorize('clinic_admin'), asyncHandler(async (req, res) => {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, tenant: req.user.tenant },
    req.body, { new: true }
  );
  res.json({ success: true, data: service });
}));

module.exports = router;
