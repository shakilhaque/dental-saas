const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('./asyncHandler');

// Protect routes - verify JWT
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || !req.user.isActive) {
      return next(new ErrorResponse('User not found or inactive', 401));
    }

    // Attach tenant to request if user has one
    if (req.user.tenant) {
      req.tenant = await Tenant.findById(req.user.tenant);
      if (!req.tenant || !req.tenant.isActive) {
        return next(new ErrorResponse('Clinic account not found or suspended', 403));
      }
      // Check subscription is active
      if (req.tenant.subscription.status === 'cancelled') {
        return next(new ErrorResponse('Clinic subscription has been cancelled', 403));
      }
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Role '${req.user.role}' is not authorized to access this route`, 403));
    }
    next();
  };
};

// Tenant isolation middleware - ensures users can only access their tenant's data
exports.tenantIsolation = asyncHandler(async (req, res, next) => {
  // Super admin can access all tenants
  if (req.user.role === 'super_admin') return next();

  // Validate tenantId in params/body matches user's tenant
  const tenantId = req.params.tenantId || req.body.tenant;

  if (tenantId && tenantId !== req.user.tenant?.toString()) {
    return next(new ErrorResponse('Not authorized to access this tenant\'s data', 403));
  }

  // Always inject the user's tenant into queries
  req.tenantFilter = { tenant: req.user.tenant };
  next();
});

// Subscription plan check
exports.requirePlan = (...plans) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user.role === 'super_admin') return next();
    if (!req.tenant) return next(new ErrorResponse('Tenant not found', 404));

    if (!plans.includes(req.tenant.subscription.plan)) {
      return next(new ErrorResponse(
        `This feature requires a ${plans.join(' or ')} plan. Please upgrade your subscription.`,
        402
      ));
    }

    // Check if subscription is still active / trial not expired
    if (req.tenant.subscription.plan === 'trial') {
      if (new Date() > req.tenant.subscription.trialEndsAt) {
        return next(new ErrorResponse('Your trial has expired. Please subscribe to continue.', 402));
      }
    }

    next();
  });
};
