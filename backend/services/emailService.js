const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const templates = {
  welcome: ({ name, clinicName, subdomain, trialDays }) => ({
    subject: `Welcome to DentalSaaS – ${clinicName} is all set!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1E40AF; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🦷 DentalSaaS</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Welcome, ${name}! 🎉</h2>
          <p><strong>${clinicName}</strong> is now live on DentalSaaS.</p>
          <p>Your clinic subdomain: <strong>${subdomain}.dentalsaas.com</strong></p>
          <p>You have <strong>${trialDays} days free trial</strong> to explore all features.</p>
          <a href="${process.env.CLIENT_URL}/login?subdomain=${subdomain}" 
             style="background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `
  }),
  appointmentConfirmation: ({ patientName, dentistName, date, time, status, clinicName }) => ({
    subject: `Appointment ${status === 'confirmed' ? 'Confirmed' : 'Booked'} – ${clinicName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1E40AF; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">${clinicName}</h2>
        </div>
        <div style="padding: 30px;">
          <h3>Hello ${patientName},</h3>
          <p>Your appointment has been <strong>${status}</strong>.</p>
          <div style="background: #EFF6FF; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>⏰ Time:</strong> ${time}</p>
            <p><strong>👨‍⚕️ Dentist:</strong> ${dentistName}</p>
          </div>
          <p>Please arrive 10 minutes early. If you need to reschedule, contact us at least 24 hours in advance.</p>
        </div>
      </div>
    `
  }),
  appointmentReminder: ({ patientName, dentistName, date, time, clinicName }) => ({
    subject: `Reminder: Appointment Tomorrow – ${clinicName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">⏰ Appointment Reminder</h2>
        </div>
        <div style="padding: 30px;">
          <h3>Hi ${patientName}!</h3>
          <p>This is a friendly reminder about your appointment <strong>tomorrow</strong>.</p>
          <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>⏰ Time:</strong> ${time}</p>
            <p><strong>👨‍⚕️ Dentist:</strong> ${dentistName}</p>
            <p><strong>🏥 Clinic:</strong> ${clinicName}</p>
          </div>
        </div>
      </div>
    `
  }),
  resetPassword: ({ name, resetUrl }) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2>Password Reset</h2>
        <p>Hi ${name}, you requested a password reset.</p>
        <a href="${resetUrl}" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 16px;">This link expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `
  })
};

const sendEmail = async ({ to, subject, template, data, html }) => {
  const templateFn = templates[template];
  const content = templateFn ? templateFn(data) : { subject, html };

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject: content.subject,
    html: content.html
  });
};

module.exports = sendEmail;
