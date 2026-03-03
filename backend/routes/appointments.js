const express = require('express');
const router = express.Router();
const { protect, authorize, tenantIsolation } = require('../middleware/auth');
const audit = require('../middleware/audit');
const {
  getAppointments, getAvailableSlots, createAppointment,
  updateAppointmentStatus, rescheduleAppointment
} = require('../controllers/appointmentController');

router.use(protect);
router.use(tenantIsolation);

router.get('/', getAppointments);
router.get('/available-slots', getAvailableSlots);
router.post('/', audit('create', 'Appointment'), createAppointment);
router.put('/:id/status', audit('update', 'Appointment'), updateAppointmentStatus);
router.post('/:id/reschedule', audit('update', 'Appointment'), rescheduleAppointment);

module.exports = router;
