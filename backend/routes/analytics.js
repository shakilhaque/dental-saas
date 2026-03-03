const express = require('express');
const router = express.Router();
const { protect, authorize, requirePlan } = require('../middleware/auth');
const { getDashboardStats, getRevenueChart, getAppointmentStats } = require('../controllers/analyticsController');

router.use(protect, authorize('clinic_admin', 'super_admin', 'dentist'));
router.get('/dashboard', getDashboardStats);
router.get('/revenue', requirePlan('professional', 'enterprise'), getRevenueChart);
router.get('/appointments', getAppointmentStats);

module.exports = router;
