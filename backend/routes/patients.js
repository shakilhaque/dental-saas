const express = require('express');
const router = express.Router();
const { protect, authorize, tenantIsolation } = require('../middleware/auth');
const Patient = require('../models/Patient');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const audit = require('../middleware/audit');

router.use(protect, tenantIsolation);

// Get all patients
router.get('/', asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { tenant: req.user.tenant, isActive: true };

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Patient.countDocuments(filter);
  const patients = await Patient.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, total, data: patients });
}));

// Get single patient
router.get('/:id', asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({ _id: req.params.id, tenant: req.user.tenant });
  if (!patient) return next(new ErrorResponse('Patient not found', 404));
  res.json({ success: true, data: patient });
}));

// Create patient
router.post('/', authorize('clinic_admin', 'receptionist', 'dentist'), audit('create', 'Patient'), asyncHandler(async (req, res, next) => {
  // Check plan limit
  const limits = req.tenant.getPlanLimits();
  const count = await Patient.countDocuments({ tenant: req.user.tenant, isActive: true });
  if (count >= limits.maxPatients) {
    return next(new ErrorResponse(`Patient limit (${limits.maxPatients}) reached. Please upgrade your plan.`, 402));
  }
  req.body.tenant = req.user.tenant;
  const patient = await Patient.create(req.body);
  res.status(201).json({ success: true, data: patient });
}));

// Update patient
router.put('/:id', authorize('clinic_admin', 'receptionist', 'dentist'), audit('update', 'Patient'), asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOneAndUpdate(
    { _id: req.params.id, tenant: req.user.tenant },
    req.body,
    { new: true, runValidators: true }
  );
  if (!patient) return next(new ErrorResponse('Patient not found', 404));
  res.json({ success: true, data: patient });
}));

// Delete (soft delete)
router.delete('/:id', authorize('clinic_admin'), audit('delete', 'Patient'), asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOneAndUpdate(
    { _id: req.params.id, tenant: req.user.tenant },
    { isActive: false },
    { new: true }
  );
  if (!patient) return next(new ErrorResponse('Patient not found', 404));
  res.json({ success: true, message: 'Patient deactivated' });
}));

module.exports = router;
