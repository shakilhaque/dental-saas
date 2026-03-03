const crypto = require('crypto');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const sendEmail = require('../services/emailService');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
      avatar: user.avatar
    }
  });
};

// @desc  Register a new clinic (tenant)
// @route POST /api/v1/auth/register-clinic
// @access Public
exports.registerClinic = asyncHandler(async (req, res, next) => {
  const { clinicName, subdomain, adminFirstName, adminLastName, email, password, phone } = req.body;

  // Check if email already exists globally
  const existingUser = await User.findOne({ email, tenant: null });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 400));
  }

  // Check subdomain availability
  const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
  if (existingTenant) {
    return next(new ErrorResponse('Subdomain is already taken. Please choose another.', 400));
  }

  // Create admin user first (no tenant yet)
  const adminUser = await User.create({
    firstName: adminFirstName,
    lastName: adminLastName,
    email,
    password,
    phone,
    role: 'clinic_admin',
    tenant: null // will be set after tenant creation
  });

  // Create tenant/clinic
  const tenant = await Tenant.create({
    name: clinicName,
    subdomain: subdomain.toLowerCase(),
    owner: adminUser._id,
    email,
    phone
  });

  // Update admin user with tenant
  adminUser.tenant = tenant._id;
  await adminUser.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await sendEmail({
      to: email,
      subject: `Welcome to DentalSaaS – ${clinicName} is ready!`,
      template: 'welcome',
      data: { name: adminFirstName, clinicName, subdomain, trialDays: 14 }
    });
  } catch (err) {
    console.error('Welcome email failed:', err);
  }

  sendTokenResponse(adminUser, 201, res);
});

// @desc  Register a staff member (by clinic admin)
// @route POST /api/v1/auth/register-staff
// @access Private (clinic_admin)
exports.registerStaff = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, phone, specialization, consultationFee } = req.body;

  const allowedRoles = ['dentist', 'receptionist'];
  if (!allowedRoles.includes(role)) {
    return next(new ErrorResponse(`Invalid role. Allowed: ${allowedRoles.join(', ')}`, 400));
  }

  // Check plan limits for dentists
  if (role === 'dentist') {
    const dentistCount = await User.countDocuments({ tenant: req.user.tenant, role: 'dentist', isActive: true });
    const limits = req.tenant.getPlanLimits();
    if (dentistCount >= limits.maxDentists) {
      return next(new ErrorResponse(`Your plan allows a maximum of ${limits.maxDentists} dentists. Please upgrade.`, 402));
    }
  }

  const existingUser = await User.findOne({ email, tenant: req.user.tenant });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered in this clinic', 400));
  }

  const staff = await User.create({
    firstName, lastName, email, password, phone, role,
    specialization, consultationFee,
    tenant: req.user.tenant
  });

  res.status(201).json({ success: true, data: staff });
});

// @desc  Patient self-registration
// @route POST /api/v1/auth/register-patient/:subdomain
// @access Public
exports.registerPatient = asyncHandler(async (req, res, next) => {
  const { subdomain } = req.params;
  const { firstName, lastName, email, password, phone } = req.body;

  const tenant = await Tenant.findOne({ subdomain });
  if (!tenant) return next(new ErrorResponse('Clinic not found', 404));

  const existing = await User.findOne({ email, tenant: tenant._id });
  if (existing) return next(new ErrorResponse('Email already registered', 400));

  const user = await User.create({
    firstName, lastName, email, password, phone,
    role: 'patient',
    tenant: tenant._id
  });

  sendTokenResponse(user, 201, res);
});

// @desc  Login
// @route POST /api/v1/auth/login
// @access Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, subdomain } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  let tenantFilter = {};
  if (subdomain) {
    const tenant = await Tenant.findOne({ subdomain });
    if (!tenant) return next(new ErrorResponse('Clinic not found', 404));
    tenantFilter = { tenant: tenant._id };
  }

  const user = await User.findOne({ email, ...tenantFilter }).select('+password');
  if (!user) return next(new ErrorResponse('Invalid credentials', 401));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new ErrorResponse('Invalid credentials', 401));

  if (!user.isActive) return next(new ErrorResponse('Account deactivated. Contact admin.', 401));

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc  Get current user
// @route GET /api/v1/auth/me
// @access Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

// @desc  Update profile
// @route PUT /api/v1/auth/profile
// @access Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fields = ['firstName', 'lastName', 'phone', 'address', 'avatar', 'dateOfBirth', 'gender'];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user });
});

// @desc  Change password
// @route PUT /api/v1/auth/change-password
// @access Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc  Forgot password
// @route POST /api/v1/auth/forgot-password
// @access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse('No user found with that email', 404));

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'resetPassword',
      data: { name: user.firstName, resetUrl }
    });
    res.status(200).json({ success: true, message: 'Reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc  Reset password
// @route PUT /api/v1/auth/reset-password/:token
// @access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) return next(new ErrorResponse('Invalid or expired token', 400));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});
