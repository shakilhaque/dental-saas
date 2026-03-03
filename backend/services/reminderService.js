const Appointment = require('../models/Appointment');
const Tenant = require('../models/Tenant');
const sendEmail = require('./emailService');

exports.reminderJob = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayEnd = new Date(tomorrow);
  dayEnd.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    date: { $gte: tomorrow, $lte: dayEnd },
    status: { $in: ['pending', 'confirmed'] },
    reminderSent: false
  }).populate('patient', 'firstName email phone')
    .populate('dentist', 'firstName lastName')
    .populate({ path: 'tenant', model: 'Tenant' });

  let sent = 0;
  for (const appt of appointments) {
    if (!appt.tenant?.settings?.emailNotifications) continue;
    if (!appt.patient?.email) continue;

    try {
      await sendEmail({
        to: appt.patient.email,
        template: 'appointmentReminder',
        data: {
          patientName: appt.patient.firstName,
          dentistName: `Dr. ${appt.dentist.firstName} ${appt.dentist.lastName}`,
          date: appt.date.toLocaleDateString(),
          time: appt.startTime,
          clinicName: appt.tenant.name
        }
      });

      appt.reminderSent = true;
      appt.reminderSentAt = new Date();
      await appt.save();
      sent++;
    } catch (err) {
      console.error(`Reminder failed for appointment ${appt._id}:`, err);
    }
  }
  console.log(`Sent ${sent} appointment reminders`);
};
