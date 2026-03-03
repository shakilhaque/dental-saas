const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const sendEmail = require('../services/emailService');

// Get appointments for a tenant with filtering
exports.getAppointments = asyncHandler(async (req, res, next) => {
  const { date, dentist, status, patient, page = 1, limit = 20 } = req.query;
  const filter = { tenant: req.user.tenant };

  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }
  if (dentist) filter.dentist = dentist;
  if (status) filter.status = status;
  if (patient) filter.patient = patient;

  // Dentists can only see their own appointments
  if (req.user.role === 'dentist') filter.dentist = req.user._id;

  const total = await Appointment.countDocuments(filter);
  const appointments = await Appointment.find(filter)
    .populate('patient', 'firstName lastName patientId phone')
    .populate('dentist', 'firstName lastName specialization')
    .populate('service', 'name price')
    .sort({ date: 1, startTime: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: appointments
  });
});

// Get available time slots for a dentist on a given date
exports.getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { dentistId, date } = req.query;

  const dentist = await User.findOne({ _id: dentistId, tenant: req.tenant?._id || req.user.tenant, role: 'dentist' });
  if (!dentist) return next(new ErrorResponse('Dentist not found', 404));

  const tenant = req.tenant || await Tenant.findById(req.user.tenant);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[new Date(date).getDay()];
  const workingDay = tenant.workingHours[dayName];

  if (!workingDay.isOpen) {
    return res.status(200).json({ success: true, data: [], message: 'Clinic is closed on this day' });
  }

  // Generate slots
  const duration = tenant.appointmentDuration || 30;
  const slots = [];
  let current = workingDay.open;
  const closeTime = workingDay.close;

  while (current < closeTime) {
    const [h, m] = current.split(':').map(Number);
    const end = new Date(0, 0, 0, h, m + duration);
    const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    if (endStr > closeTime) break;
    slots.push({ startTime: current, endTime: endStr });
    current = endStr;
  }

  // Get booked slots
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const booked = await Appointment.find({
    tenant: req.user?.tenant || tenant._id,
    dentist: dentistId,
    date: { $gte: dateObj, $lte: dateEnd },
    status: { $nin: ['cancelled', 'no_show'] }
  }).select('startTime endTime');

  const bookedTimes = new Set(booked.map(a => a.startTime));
  const availableSlots = slots.map(slot => ({
    ...slot,
    available: !bookedTimes.has(slot.startTime)
  }));

  res.status(200).json({ success: true, data: availableSlots });
});

// Create appointment
exports.createAppointment = asyncHandler(async (req, res, next) => {
  const tenantId = req.user.tenant;
  req.body.tenant = tenantId;
  req.body.bookedBy = req.user._id;

  // Check plan limits
  const limits = req.tenant.getPlanLimits();
  const currentMonth = new Date(); currentMonth.setDate(1); currentMonth.setHours(0, 0, 0, 0);
  const appointmentCount = await Appointment.countDocuments({
    tenant: tenantId,
    createdAt: { $gte: currentMonth }
  });
  if (appointmentCount >= limits.maxAppointments) {
    return next(new ErrorResponse('Monthly appointment limit reached. Please upgrade your plan.', 402));
  }

  // Conflict check
  const { dentist, date, startTime, endTime } = req.body;
  const conflict = await Appointment.findOne({
    tenant: tenantId,
    dentist,
    date: new Date(date),
    status: { $nin: ['cancelled', 'no_show'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  });

  if (conflict) {
    return next(new ErrorResponse('This time slot is already booked. Please choose another.', 409));
  }

  const appointment = await Appointment.create(req.body);

  // Auto-confirm if enabled
  if (req.tenant.settings.autoConfirmBookings) {
    appointment.status = 'confirmed';
    await appointment.save();
  }

  const populated = await appointment.populate([
    { path: 'patient', select: 'firstName lastName email phone' },
    { path: 'dentist', select: 'firstName lastName' }
  ]);

  // Send confirmation email
  if (req.tenant.settings.emailNotifications && populated.patient.email) {
    try {
      await sendEmail({
        to: populated.patient.email,
        subject: 'Appointment Booking Confirmation',
        template: 'appointmentConfirmation',
        data: {
          patientName: populated.patient.firstName,
          dentistName: `Dr. ${populated.dentist.firstName} ${populated.dentist.lastName}`,
          date: new Date(date).toLocaleDateString(),
          time: startTime,
          status: appointment.status,
          clinicName: req.tenant.name
        }
      });
    } catch (err) { console.error('Email failed:', err); }
  }

  res.status(201).json({ success: true, data: populated });
});

// Update appointment status
exports.updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const { status, cancellationReason, treatmentNotes, diagnosis } = req.body;

  const appointment = await Appointment.findOne({ _id: req.params.id, tenant: req.user.tenant });
  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledAt = new Date();
  }
  if (treatmentNotes) appointment.treatmentNotes = treatmentNotes;
  if (diagnosis) appointment.diagnosis = diagnosis;

  await appointment.save();
  res.status(200).json({ success: true, data: appointment });
});

// Reschedule
exports.rescheduleAppointment = asyncHandler(async (req, res, next) => {
  const { date, startTime, endTime } = req.body;
  const old = await Appointment.findOne({ _id: req.params.id, tenant: req.user.tenant });
  if (!old) return next(new ErrorResponse('Appointment not found', 404));

  // Conflict check for new slot
  const conflict = await Appointment.findOne({
    tenant: req.user.tenant,
    dentist: old.dentist,
    date: new Date(date),
    _id: { $ne: old._id },
    status: { $nin: ['cancelled', 'no_show'] },
    $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }]
  });
  if (conflict) return next(new ErrorResponse('New time slot is unavailable', 409));

  const newAppt = await Appointment.create({
    ...old.toObject(),
    _id: undefined,
    appointmentId: undefined,
    date: new Date(date),
    startTime, endTime,
    status: 'confirmed',
    rescheduledFrom: old._id,
    isRescheduled: false
  });

  old.status = 'cancelled';
  old.isRescheduled = true;
  old.cancellationReason = 'Rescheduled';
  await old.save();

  res.status(201).json({ success: true, data: newAppt });
});
